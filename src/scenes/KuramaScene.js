import * as THREE from 'three';
import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * NARUTO KURAMA CHAKRA MODE (KCM / NINE-TAILS 3D + HAND-DRAWN BOIL)
 * ============================================================================
 * Blazing 9-Tails Chakra Cloak, Magatama Seals, 3D Rasenshuriken / Bijuudama,
 * 9 procedural kinetic waving tails, and Three.js Kurama Avatar Aura.
 */

// Accurate Hand-Drawn Vector Glyph Paths for Kurama Chakra Shroud & Seals
const KURAMA_PATH_DATA = {
  // Uzumaki Spiral Stomach Seal
  uzumakiSwirl: "M400,420 c-5,-15 -25,-20 -35,-10 c-15,15 -10,40 10,50 c30,15 65,-10 65,-45 c0,-45 -45,-75 -85,-70 c-50,6 -85,55 -75,100 c12,55 70,95 120,85 c60,-12 105,-75 90,-135 c-15,-65 -85,-115 -145,-100",
  // Six Paths Magatama Necklace (Array of 6 Magatamas across collar)
  magatamas: [
    { cx: 345, cy: 300, r: 8, angle: -0.4 },
    { cx: 368, cy: 312, r: 8, angle: -0.2 },
    { cx: 395, cy: 318, r: 9, angle: 0.0 },
    { cx: 422, cy: 312, r: 8, angle: 0.2 },
    { cx: 445, cy: 300, r: 8, angle: 0.4 }
  ],
  // Facial Whisker Marks (3 on left, 3 on right)
  whiskersLeft: [
    { p1: [362, 235], p2: [340, 230] },
    { p1: [360, 242], p2: [336, 242] },
    { p1: [362, 250], p2: [342, 254] }
  ],
  whiskersRight: [
    { p1: [426, 235], p2: [448, 230] },
    { p1: [428, 242], p2: [452, 242] },
    { p1: [426, 250], p2: [446, 254] }
  ]
};

export class KuramaScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    // Jutsu & Chakra State
    this.jutsuMode = 'rasengan'; // 'rasengan' | 'rasenshuriken' | 'bijuudama' | 'avatar'
    this.chakraIntensity = 1.0;
    this.tailWaveSpeed = 1.0;
    this.flameParticles = [];
    this.lightningSparks = [];
    this.shockwaves = [];
    this.mouse = { x: 400, y: 300 };

    this.initDOM();
    this.setupCanvas();
    this.setupThreeAvatar();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 340px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 620px; position: relative;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">🦊 Naruto Kurama Chakra Mode (KCM)</span>
              <span class="toolbar-badge">Nine-Tails 3D & Line Boil</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-kurama-roar" class="tactile-btn amber">
                <span>🔊 Bijuu Roar</span>
              </button>
              <button id="btn-kurama-blast" class="tactile-btn primary" style="background: var(--accent-terracotta);">
                <span>💥 Tailed Beast Bomb</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="kurama-canvas-wrap" style="min-height: 540px; cursor: crosshair; background: radial-gradient(circle at center, rgba(245, 158, 11, 0.08) 0%, transparent 70%);">
            <canvas id="kurama-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- 3D Three.js Overlay Canvas for Kurama Avatar -->
            <div id="kurama-three-container" style="position: absolute; inset: 0; pointer-events: none; opacity: 0.85;"></div>

            <!-- Jutsu Mode Badges on Stage -->
            <div class="hud-phase-pills" style="position: absolute; top: 16px; left: 16px; z-index: 10;">
              <button class="hud-pill-btn active" data-jutsu="rasengan">
                <span class="pill-index">01</span>
                <span class="pill-label">RASENGAN</span>
              </button>
              <button class="hud-pill-btn" data-jutsu="rasenshuriken">
                <span class="pill-index">02</span>
                <span class="pill-label">RASENSHURIKEN</span>
              </button>
              <button class="hud-pill-btn" data-jutsu="bijuudama">
                <span class="pill-index">03</span>
                <span class="pill-label">BIJUUDAMA</span>
              </button>
              <button class="hud-pill-btn" data-jutsu="avatar">
                <span class="pill-index">04</span>
                <span class="pill-label">3D AVATAR</span>
              </button>
            </div>

            <!-- Interaction Hint -->
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-glass); backdrop-filter: blur(10px); padding: 4px 14px; border-radius: 9999px; pointer-events: none; border: 1px solid var(--border-subtle);">
              🖱️ Move cursor to direct Rasengan vortex • Click buttons to trigger Bijuu bomb detonation
            </div>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card" style="background: var(--bg-surface-alt); border: 2px solid var(--accent-gold);">
            <div class="panel-header">
              <span class="panel-title">🔥 Kyuubi Chakra Matrix</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Chakra Output Intensity:</span>
                <span id="val-kurama-chakra" class="control-val">100%</span>
              </div>
              <input type="range" id="slider-kurama-chakra" min="0.5" max="2.5" step="0.1" value="1.0" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>9-Tails Wave Frequency:</span>
                <span id="val-kurama-tails" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-kurama-tails" min="0.4" max="2.5" step="0.1" value="1.0" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🌀 Jutsu Selection</span>
            </div>
            <div class="style-pills-grid" id="jutsu-select-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-jutsu="rasengan">🌀 Rasengan</button>
              <button class="style-pill-btn" data-jutsu="rasenshuriken">✨ Rasenshuriken</button>
              <button class="style-pill-btn" data-jutsu="bijuudama">💣 Bijuudama</button>
              <button class="style-pill-btn" data-jutsu="avatar">🦊 Kurama Avatar</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">📜 Sealing Formula Spec</span>
            </div>
            <p style="font-size: 0.75rem; font-family: 'Fira Code', monospace; line-height: 1.6; color: var(--text-muted);">
              SEAL: Eight Trigrams (Hakke no Fūin Shiki)<br>
              CLOAK: Yang-Kurama Golden Flame Shroud<br>
              MAGATAMA: Rikudō Sennin 6-Paths Collar
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('kurama-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('kurama-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? rect.width : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? rect.height : 0, wrap ? wrap.clientHeight : 0, 540);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (this.threeRenderer && this.threeCamera) {
        this.threeCamera.aspect = w / h;
        this.threeCamera.updateProjectionMatrix();
        this.threeRenderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);

    // Pointer Tracking
    const handlePointer = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    };
    this.canvas.addEventListener('pointerdown', handlePointer);
    this.canvas.addEventListener('pointermove', handlePointer);
  }

  setupThreeAvatar() {
    const container = document.getElementById('kurama-three-container');
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    this.threeScene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.threeCamera.position.set(0, 0, 7.5);

    this.threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.threeRenderer.domElement);

    // Build 3D Kurama Avatar Geometry (Wireframe Fox Skull / Ribcage & Energy Orbs)
    const avatarGroup = new THREE.Group();

    // Golden Fox Snout & Crown
    const snoutGeo = new THREE.ConeGeometry(1.2, 2.5, 6);
    const goldMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const snoutMesh = new THREE.Mesh(snoutGeo, goldMat);
    snoutMesh.rotation.x = Math.PI * 0.45;
    snoutMesh.position.set(0, -0.2, 0);
    avatarGroup.add(snoutMesh);

    // 2 Fox Ears
    const earGeo = new THREE.ConeGeometry(0.5, 1.8, 4);
    const leftEar = new THREE.Mesh(earGeo, goldMat);
    leftEar.position.set(-1.1, 1.4, -0.3);
    leftEar.rotation.z = -0.35;
    const rightEar = new THREE.Mesh(earGeo, goldMat);
    rightEar.position.set(1.1, 1.4, -0.3);
    rightEar.rotation.z = 0.35;
    avatarGroup.add(leftEar, rightEar);

    // Orbiting 3D Chakra Rings
    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xD97706, wireframe: true, opacity: 0.5, transparent: true });
    this.threeRing1 = new THREE.Mesh(ringGeo, ringMat);
    this.threeRing2 = new THREE.Mesh(ringGeo, ringMat);
    this.threeRing2.rotation.x = Math.PI * 0.5;
    avatarGroup.add(this.threeRing1, this.threeRing2);

    this.threeScene.add(avatarGroup);
    this.avatarGroup = avatarGroup;
  }

  triggerBijuuBlast() {
    SoundFX.playHarmonicChord();
    confetti({
      particleCount: 50,
      spread: 90,
      colors: ['#F59E0B', '#D97706', '#DC2626', '#111317']
    });

    // Massive expanding shockwave
    this.shockwaves.push({
      x: this.mouse.x || this.width / 2,
      y: this.mouse.y || this.height / 2,
      r: 10,
      maxR: 350,
      alpha: 1.0,
      color: '#F59E0B'
    });

    // Spawn 40 fiery sparks
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.flameParticles.push({
        x: this.mouse.x || this.width / 2,
        y: this.mouse.y || this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        size: 4 + Math.random() * 6,
        color: ['#F59E0B', '#DC2626', '#1C1917', '#FFFFFF'][i % 4]
      });
    }
  }

  triggerRoar() {
    SoundFX.playPop(320);
    // Radial shockwave rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.shockwaves.push({
          x: this.width / 2,
          y: this.height * 0.45,
          r: 20,
          maxR: 280,
          alpha: 0.9,
          color: '#D97706'
        });
      }, i * 150);
    }
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const dt = Math.min(32, timestamp - lastTime);
      lastTime = timestamp;

      const w = this.width || 800;
      const h = this.height || 540;
      const cx = w * 0.5;
      const cy = h * 0.48;

      // 1. Update Three.js 3D Kurama Avatar Overlay
      if (this.avatarGroup && this.threeRenderer && this.threeScene && this.threeCamera) {
        this.avatarGroup.visible = this.jutsuMode === 'avatar' || this.jutsuMode === 'bijuudama';
        if (this.avatarGroup.visible) {
          this.avatarGroup.rotation.y = (this.mouse.x - w / 2) * 0.002;
          this.avatarGroup.rotation.x = (this.mouse.y - h / 2) * 0.002;
          this.threeRing1.rotation.z += 0.02;
          this.threeRing2.rotation.y += 0.025;
        }
        this.threeRenderer.render(this.threeScene, this.threeCamera);
      }

      // 2. Hand-Drawn Canvas Rendering (Rough.js + Anime.js)
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, w, h);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#121316';
        const gen = rough.generator();

        const flameGold = isDark ? '#FBBF24' : '#F59E0B';
        const flameAmber = isDark ? '#F59E0B' : '#D97706';
        const flameRed = '#DC2626';

        // -------------------------------------------------------------
        // A. 9 DYNAMIC ARTICULATED WAVING KURAMA TAILS
        // -------------------------------------------------------------
        const tailCount = 9;
        for (let t = 0; t < tailCount; t++) {
          const tailAngle = -Math.PI * 0.5 + ((t - 4) / 4) * (Math.PI * 0.45);
          const wavePhase = timestamp * 0.003 * this.tailWaveSpeed + t * 0.65;
          const tailLength = 160 + Math.sin(t * 1.5) * 30;

          // Compute wavy spline points for tail
          const p0 = [cx + (t - 4) * 8, cy + 80];
          const p1 = [
            cx + Math.sin(tailAngle) * (tailLength * 0.4) + Math.cos(wavePhase) * 28,
            cy + 80 - Math.cos(tailAngle) * (tailLength * 0.4) + Math.sin(wavePhase) * 20
          ];
          const p2 = [
            cx + Math.sin(tailAngle) * (tailLength * 0.75) + Math.sin(wavePhase * 1.2) * 45,
            cy + 80 - Math.cos(tailAngle) * (tailLength * 0.75) - Math.cos(wavePhase) * 35
          ];
          const p3 = [
            cx + Math.sin(tailAngle) * tailLength + Math.cos(wavePhase * 1.5) * 35,
            cy + 80 - Math.cos(tailAngle) * tailLength + Math.sin(wavePhase * 1.5) * 25
          ];

          // Draw Flamed Tail Curve
          const tailCurve = gen.curve([p0, p1, p2, p3], {
            seed: 2000 + t * 100 + frameIdx * 25,
            roughness: 2.2,
            bowing: 2.0,
            stroke: flameAmber,
            strokeWidth: Math.max(3, 10 - Math.abs(t - 4)),
            fill: flameGold
          });
          this.rc.draw(tailCurve);

          // Flame Tip Particle Emitters
          if (Math.random() < 0.3) {
            this.flameParticles.push({
              x: p3[0] + (Math.random() - 0.5) * 15,
              y: p3[1] + (Math.random() - 0.5) * 15,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1.5 - Math.random() * 2,
              alpha: 0.9,
              size: 3 + Math.random() * 4,
              color: flameGold
            });
          }
        }

        // -------------------------------------------------------------
        // B. NARUTO KCM CHAKRA CLOAK SILHOUETTE
        // -------------------------------------------------------------
        const breath = Math.sin(timestamp * 0.003) * 4;

        // Torso / Chakra Shroud
        const cloakTorso = gen.polygon([
          [cx - 45, cy - 20 + breath],
          [cx + 45, cy - 20 + breath],
          [cx + 55, cy + 90 + breath],
          [cx - 55, cy + 90 + breath]
        ], {
          seed: 3000 + frameIdx * 20,
          roughness: 2.0,
          bowing: 1.8,
          stroke: ink,
          strokeWidth: 2.5,
          fill: flameGold,
          fillStyle: 'hachure',
          hachureAngle: 60
        });
        this.rc.draw(cloakTorso);

        // Head / Chakra Hair Peaks
        const headSpikes = gen.polygon([
          [cx - 30, cy - 40 + breath],
          [cx - 45, cy - 95 + breath],
          [cx - 20, cy - 75 + breath],
          [cx, cy - 110 + breath],
          [cx + 20, cy - 75 + breath],
          [cx + 45, cy - 95 + breath],
          [cx + 30, cy - 40 + breath]
        ], {
          seed: 3500 + frameIdx * 20,
          roughness: 2.2,
          bowing: 2.0,
          stroke: ink,
          strokeWidth: 2.5,
          fill: flameGold,
          fillStyle: 'solid'
        });
        this.rc.draw(headSpikes);

        // Face Oval
        const face = gen.circle(cx, cy - 50 + breath, 52, {
          seed: 3600 + frameIdx * 10,
          roughness: 1.6,
          stroke: ink,
          strokeWidth: 2,
          fill: '#FEF3C7',
          fillStyle: 'solid'
        });
        this.rc.draw(face);

        // Uzumaki Spiral Swirl Stomach Seal
        const swirl = gen.path(`M${cx},${cy + 40 + breath} c-5,-15 -25,-20 -35,-10 c-15,15 -10,35 10,40 c25,6 45,-15 35,-35 c-10,-20 -35,-20 -40,-5`, {
          seed: 3700 + frameIdx * 10,
          roughness: 1.8,
          stroke: '#111317',
          strokeWidth: 3
        });
        this.rc.draw(swirl);

        // Six Paths Magatama Collar Necklace
        [-28, -14, 0, 14, 28].forEach((offset, idx) => {
          const mag = gen.circle(cx + offset, cy - 15 + breath + Math.abs(offset) * 0.2, 8, {
            seed: 3800 + idx * 20 + frameIdx * 10,
            roughness: 1.4,
            stroke: '#111317',
            fill: '#111317',
            fillStyle: 'solid'
          });
          this.rc.draw(mag);
        });

        // Facial Whiskers
        [-1, 0, 1].forEach(row => {
          const wLeft = gen.line(cx - 12, cy - 52 + row * 6 + breath, cx - 24, cy - 54 + row * 7 + breath, {
            seed: 3900 + row * 10, stroke: '#111317', strokeWidth: 2.5
          });
          const wRight = gen.line(cx + 12, cy - 52 + row * 6 + breath, cx + 24, cy - 54 + row * 7 + breath, {
            seed: 3950 + row * 10, stroke: '#111317', strokeWidth: 2.5
          });
          this.rc.draw(wLeft);
          this.rc.draw(wRight);
        });

        // Headband Leaf Plate
        const plate = gen.rectangle(cx - 22, cy - 72 + breath, 44, 12, {
          seed: 4000, roughness: 1.4, stroke: ink, strokeWidth: 2, fill: '#94A3B8', fillStyle: 'solid'
        });
        this.rc.draw(plate);

        // Glowing Eyes
        const eyeL = gen.circle(cx - 10, cy - 54 + breath, 6, {
          seed: 4100, stroke: '#DC2626', fill: '#F59E0B', fillStyle: 'solid'
        });
        const eyeR = gen.circle(cx + 10, cy - 54 + breath, 6, {
          seed: 4101, stroke: '#DC2626', fill: '#F59E0B', fillStyle: 'solid'
        });
        this.rc.draw(eyeL);
        this.rc.draw(eyeR);

        // -------------------------------------------------------------
        // C. INTERACTIVE JUTSU EFFECTS (Rasengan / Rasenshuriken / Bijuudama)
        // -------------------------------------------------------------
        const jx = this.mouse.x || cx + 110;
        const jy = this.mouse.y || cy - 20;

        if (this.jutsuMode === 'rasengan') {
          // Swirling Cyan/Orange Chakra Sphere
          const rBase = 32;
          const rSphere = gen.circle(jx, jy, rBase * 2, {
            seed: 5000 + frameIdx * 20,
            roughness: 2.5,
            bowing: 2.0,
            stroke: '#0284C7',
            strokeWidth: 3,
            fill: '#38BDF8',
            fillStyle: 'cross-hatch'
          });
          this.rc.draw(rSphere);

          // Orbiting rings
          for (let r = 0; r < 3; r++) {
            const rot = timestamp * 0.01 + r * (Math.PI / 3);
            const rRing = gen.ellipse(jx, jy, rBase * 2.4, rBase * 1.1, {
              seed: 5100 + r * 50 + frameIdx * 10,
              roughness: 1.8,
              stroke: '#F59E0B',
              strokeWidth: 2
            });
            this.rc.draw(rRing);
          }
        } else if (this.jutsuMode === 'rasenshuriken') {
          // Massive 4-Blade Spinning Shuriken
          const rotAngle = timestamp * 0.015;
          const rBase = 26;

          // Core Sphere
          const rCore = gen.circle(jx, jy, rBase * 2, {
            seed: 6000 + frameIdx * 20,
            roughness: 2.2,
            stroke: '#0284C7',
            strokeWidth: 3,
            fill: '#FFFFFF',
            fillStyle: 'solid'
          });
          this.rc.draw(rCore);

          // 4 Rotating Wind Blades
          for (let b = 0; b < 4; b++) {
            const a = rotAngle + b * (Math.PI * 0.5);
            const bx = jx + Math.cos(a) * 75;
            const by = jy + Math.sin(a) * 75;
            const blade = gen.polygon([
              [jx, jy],
              [jx + Math.cos(a - 0.3) * 45, jy + Math.sin(a - 0.3) * 45],
              [bx, by],
              [jx + Math.cos(a + 0.3) * 45, jy + Math.sin(a + 0.3) * 45]
            ], {
              seed: 6100 + b * 50 + frameIdx * 15,
              roughness: 2.4,
              bowing: 2.0,
              stroke: '#38BDF8',
              strokeWidth: 2.5,
              fill: '#E0F2FE',
              fillStyle: 'solid'
            });
            this.rc.draw(blade);
          }
        } else if (this.jutsuMode === 'bijuudama') {
          // Ultra Dense Black & Magenta Tailed Beast Bomb
          const bSphere = gen.circle(jx, jy, 48, {
            seed: 7000 + frameIdx * 20,
            roughness: 2.5,
            stroke: '#DC2626',
            strokeWidth: 3.5,
            fill: '#111317',
            fillStyle: 'solid'
          });
          this.rc.draw(bSphere);

          // Inward swirling red/black sparks
          for (let s = 0; s < 6; s++) {
            const sparkAngle = timestamp * 0.008 + s * 1.05;
            const sDist = 55 + Math.sin(timestamp * 0.01 + s) * 20;
            const sparkLine = gen.line(jx + Math.cos(sparkAngle) * sDist, jy + Math.sin(sparkAngle) * sDist, jx, jy, {
              seed: 7100 + s * 20 + frameIdx * 10,
              roughness: 2.0,
              stroke: s % 2 === 0 ? '#DC2626' : '#F59E0B',
              strokeWidth: 2
            });
            this.rc.draw(sparkLine);
          }
        }

        // -------------------------------------------------------------
        // D. FLAME PARTICLES & SHOCKWAVES UPDATE
        // -------------------------------------------------------------
        for (let i = this.flameParticles.length - 1; i >= 0; i--) {
          const p = this.flameParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;

          if (p.alpha <= 0) {
            this.flameParticles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          const pDot = gen.circle(p.x, p.y, p.size, {
            seed: 8000 + i,
            stroke: p.color,
            fill: p.color,
            fillStyle: 'solid'
          });
          this.rc.draw(pDot);
          this.ctx.restore();
        }

        // Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
          const s = this.shockwaves[i];
          s.r += (s.maxR - s.r) * 0.15 + 4;
          s.alpha -= 0.035;

          if (s.alpha <= 0 || s.r >= s.maxR) {
            this.shockwaves.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.globalAlpha = s.alpha;
          const ring = gen.circle(s.x, s.y, s.r * 2, {
            seed: 9000 + i,
            roughness: 2.2,
            bowing: 2.0,
            stroke: s.color,
            strokeWidth: 4
          });
          this.rc.draw(ring);
          this.ctx.restore();
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  setTurbulence(val) {
    this.chakraIntensity = val;
  }

  bindEvents() {
    // Jutsu selection pills & grid
    const handleJutsuChange = (jutsu) => {
      this.jutsuMode = jutsu;
      SoundFX.playPop(580);
      this.container.querySelectorAll('.hud-pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-jutsu') === jutsu);
      });
      const grid = document.getElementById('jutsu-select-grid');
      if (grid) {
        grid.querySelectorAll('.style-pill-btn').forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-jutsu') === jutsu);
        });
      }
    };

    this.container.querySelectorAll('.hud-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => handleJutsuChange(btn.getAttribute('data-jutsu')));
    });

    const jutsuGrid = document.getElementById('jutsu-select-grid');
    if (jutsuGrid) {
      jutsuGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        handleJutsuChange(btn.getAttribute('data-jutsu'));
      });
    }

    // Action buttons
    document.getElementById('btn-kurama-blast')?.addEventListener('click', () => this.triggerBijuuBlast());
    document.getElementById('btn-kurama-roar')?.addEventListener('click', () => this.triggerRoar());

    // Sliders
    const chakraSlider = document.getElementById('slider-kurama-chakra');
    const chakraVal = document.getElementById('val-kurama-chakra');
    chakraSlider?.addEventListener('input', (e) => {
      this.chakraIntensity = parseFloat(e.target.value);
      if (chakraVal) chakraVal.textContent = `${Math.round(this.chakraIntensity * 100)}%`;
    });

    const tailsSlider = document.getElementById('slider-kurama-tails');
    const tailsVal = document.getElementById('val-kurama-tails');
    tailsSlider?.addEventListener('input', (e) => {
      this.tailWaveSpeed = parseFloat(e.target.value);
      if (tailsVal) tailsVal.textContent = `${this.tailWaveSpeed.toFixed(1)}x`;
    });
  }

  suspend() {
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  resume() {
    if (!this.renderLoop) {
      this.startRenderLoop();
    }
  }

  destroy() {
    this.suspend();
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      this.threeRenderer.forceContextLoss();
    }
  }
}
