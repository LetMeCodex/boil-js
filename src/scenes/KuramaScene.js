import * as THREE from 'three';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { KuramaAvatarGeometry } from '../kurama/KuramaAvatarGeometry.js';
import { KuramaNineTails } from '../kurama/KuramaNineTails.js';
import { KuramaParticles } from '../kurama/KuramaParticles.js';
import { KuramaAuraShader } from '../kurama/KuramaAuraShader.js';
import { KuramaCameraRig } from '../kurama/KuramaCameraRig.js';
import { KuramaRoughOverlay } from '../kurama/KuramaRoughOverlay.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class KuramaScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.renderLoop = null;

    this.progress = 0;
    this.targetProgress = 0;
    this.chakraIntensity = 0;
    this.isCharging = false;
    this.isPlaying = false;
    this.autoPlayAnim = null;
    this.lastPhase = 0;

    this.mouse = new THREE.Vector3(0, 0, 0);

    this.initDOM();
    this.setupWebGL();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 340px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 600px; position: relative;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Kurama Mode // 3D Chakra Lab</span>
              <span class="toolbar-badge">CHAKRA / FORM / INSTINCT</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-kurama-autoplay" class="tactile-btn amber">
                <span id="kurama-play-icon">▶️</span>
                <span id="kurama-play-text">Transform Cinema</span>
              </button>
              <button id="btn-kurama-charge" class="tactile-btn primary" style="background: var(--accent-terracotta);">
                <span>⚡ Hold to Charge</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="kurama-canvas-wrap" style="min-height: 520px; position: relative; background: #0A0A0C;">
            <!-- 3D WebGL Canvas -->
            <canvas id="kurama-gl-canvas" class="main-stage-canvas"></canvas>

            <!-- 2D Rough.js Overlay Canvas -->
            <canvas id="kurama-rough-canvas" style="position: absolute; inset: 0; pointer-events: none; width: 100%; height: 100%; z-index: 5;"></canvas>

            <!-- Top Phase Badge Overlay -->
            <div class="hud-phase-pills" style="position: absolute; top: 16px; left: 16px; z-index: 10;">
              <button class="hud-pill-btn active" data-phase="0.05">
                <span class="pill-index">01</span><span class="pill-label">DORMANT</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.30">
                <span class="pill-index">02</span><span class="pill-label">AWAKEN</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.50">
                <span class="pill-index">03</span><span class="pill-label">SURGE</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.75">
                <span class="pill-index">04</span><span class="pill-label">9 TAILS</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.95">
                <span class="pill-index">05</span><span class="pill-label">STABLE</span>
              </button>
            </div>

            <!-- Bottom Hint -->
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.75rem; color: #A8A29E; background: rgba(18,19,22,0.85); backdrop-filter: blur(10px); padding: 4px 14px; border-radius: 9999px; pointer-events: none; border: 1px solid rgba(255,255,255,0.1);">
              🖱️ Mouse down on canvas or hold button to charge chakra energy
            </div>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <!-- Chakra Gauge Card -->
          <div class="panel-card" style="background: var(--bg-surface-alt); border: 2px solid var(--accent-amber);">
            <div class="panel-header">
              <span class="panel-title">🔥 Chakra Energy Gauge</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-family: var(--font-mono);">
                <span>RESERVOIR:</span>
                <strong id="hud-kurama-chakra-pct" style="color: var(--accent-amber);">03%</strong>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.15); border-radius: 9999px; overflow: hidden;">
                <div id="hud-kurama-chakra-bar" style="width: 3%; height: 100%; background: linear-gradient(90deg, #DC2626, #EA580C, #F59E0B); transition: width 0.08s ease-out;"></div>
              </div>
            </div>
          </div>

          <!-- Master Timeline Scrubber -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⏱️ Transformation Timeline</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Phase Progress:</span>
                <span id="val-kurama-progress" class="control-val">0%</span>
              </div>
              <input type="range" id="slider-kurama-progress" min="0" max="100" value="0" step="0.5" class="custom-range">
            </div>
            <div id="kurama-phase-desc" style="padding: 10px 14px; background: var(--bg-surface); border-radius: 8px; font-size: 0.78rem; line-height: 1.5; border: 1px solid var(--border-subtle);">
              <strong id="kurama-phase-title" style="color: var(--accent-amber); display: block; margin-bottom: 2px;">PHASE 01 // DORMANT</strong>
              <span id="kurama-phase-body">Almost complete darkness. Character silhouette barely visible with dormant embers.</span>
            </div>
          </div>

          <!-- Spec Metadata -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">📐 Chakra Telemetry</span>
            </div>
            <p style="font-size: 0.75rem; font-family: var(--font-mono); line-height: 1.6; color: var(--text-muted);">
              ENGINE: Three.js GLSL + Rough.js<br>
              PARTICLES: 12,000 GPU Points<br>
              TAILS: 9 Catmull-Rom Volumetric Splines<br>
              CHAKRA FIELD: Procedural Simplex Noise
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupWebGL() {
    this.canvas = document.getElementById('kurama-gl-canvas');
    this.roughCanvas = document.getElementById('kurama-rough-canvas');
    const wrap = document.getElementById('kurama-canvas-wrap');
    const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 520 };

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A0C);
    this.scene.fog = new THREE.FogExp2(0x0A0A0C, 0.035);

    this.camera = new THREE.PerspectiveCamera(42, rect.width / rect.height, 0.1, 100);
    this.camera.position.set(0, 0.2, 8.8);

    // 1. Lighting
    this.ambientLight = new THREE.AmbientLight(0x221105, 0.4);
    this.keyLight = new THREE.PointLight(0xEA580C, 2.0, 15);
    this.keyLight.position.set(0, 1.2, 2.0);
    this.rimLight = new THREE.DirectionalLight(0xDC2626, 1.2);
    this.rimLight.position.set(-4, 3, -4);
    this.scene.add(this.ambientLight, this.keyLight, this.rimLight);

    // 2. Avatar Geometry
    const avatar = KuramaAvatarGeometry.createAvatarMesh();
    this.avatarGroup = avatar.group;
    this.avatarMaterial = avatar.avatarMaterial;
    this.coreMesh = avatar.core;
    this.scene.add(this.avatarGroup);

    // 3. Nine Tails Engine
    this.nineTails = new KuramaNineTails();
    this.scene.add(this.nineTails.group);

    // 4. GPU Particle Field (12,000 Particles)
    this.particles = new KuramaParticles(12000);
    this.scene.add(this.particles.points);

    // 5. Pulsating GLSL Aura Shell
    const aura = KuramaAuraShader.createAuraMesh();
    this.auraMesh = aura.mesh;
    this.auraMaterial = aura.material;
    this.scene.add(this.auraMesh);

    // 6. Camera Rig & Rough Overlay
    this.cameraRig = new KuramaCameraRig(this.camera);
    this.roughOverlay = new KuramaRoughOverlay(this.roughCanvas);
    this.roughOverlay.resize(rect.width, rect.height);

    // Resize Handler
    this.resizeHandler = () => {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(r.width, r.height);
      this.roughOverlay.resize(r.width, r.height);
    };
    window.addEventListener('resize', this.resizeHandler);

    this.setupMouseInteractions(wrap);
  }

  setupMouseInteractions(wrap) {
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.cameraRig.setMouse(ndcX, ndcY);
      this.mouse.set(ndcX * 3.5, ndcY * 2.5 + 1.0, 0);
    });

    wrap.addEventListener('mousedown', () => {
      this.isCharging = true;
      SoundFX.playPop(440);
    });

    window.addEventListener('mouseup', () => {
      if (this.isCharging) {
        this.isCharging = false;
        SoundFX.playHarmonicChord();
        confetti({ particleCount: 30, spread: 60 });
      }
    });

    // Mouse wheel scrubbing
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.isPlaying) this.toggleAutoPlay();
      const delta = e.deltaY * 0.0008;
      this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + delta));
    }, { passive: false });
  }

  updatePhaseUI() {
    const slider = document.getElementById('slider-kurama-progress');
    const val = document.getElementById('val-kurama-progress');
    const title = document.getElementById('kurama-phase-title');
    const body = document.getElementById('kurama-phase-body');
    const chakraPct = document.getElementById('hud-kurama-chakra-pct');
    const chakraBar = document.getElementById('hud-kurama-chakra-bar');

    if (slider) slider.value = (this.progress * 100).toFixed(1);
    if (val) val.textContent = `${Math.round(this.progress * 100)}%`;

    const totalPct = Math.round(Math.min(100, (this.progress * 80 + this.chakraIntensity * 20) + 3));
    if (chakraPct) chakraPct.textContent = `${totalPct}%`;
    if (chakraBar) chakraBar.style.width = `${totalPct}%`;

    let activePhase = 0;
    if (this.progress < 0.20) {
      activePhase = 0;
      if (title) title.textContent = 'PHASE 01 // DORMANT';
      if (body) body.textContent = 'Almost complete darkness. Character silhouette barely visible with dormant embers.';
    } else if (this.progress < 0.45) {
      activePhase = 1;
      if (title) title.textContent = 'PHASE 02 // AWAKEN';
      if (body) body.textContent = 'Orange particles ignite and orbit. Pulsing chakra core accumulates energy.';
    } else if (this.progress < 0.65) {
      activePhase = 2;
      if (title) title.textContent = 'PHASE 03 // CHAKRA SURGE';
      if (body) body.textContent = 'Powerful radial shockwave expands outward. Camera undergoes weighted impact.';
    } else if (this.progress < 0.85) {
      activePhase = 3;
      if (title) title.textContent = 'PHASE 04 // NINE TAIL FORMATION';
      if (body) body.textContent = 'Nine enormous volumetric chakra tails materialize sequentially with procedural noise.';
    } else {
      activePhase = 4;
      if (title) title.textContent = 'PHASE 05 // KURAMA FORM & EQUILIBRIUM';
      if (body) body.textContent = 'Fox chakra avatar reaches full illumination with 9 waving organic tails.';
    }

    const pills = this.container.querySelectorAll('.hud-pill-btn');
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === activePhase);
    });

    if (activePhase !== this.lastPhase) {
      this.lastPhase = activePhase;
      SoundFX.playPop(480 + activePhase * 60);
      if (this.progress >= 0.95) {
        confetti({ particleCount: 40, spread: 70 });
      }
    }
  }

  jumpToProgress(targetP) {
    if (this.isPlaying) this.toggleAutoPlay();
    SoundFX.playPop(580);

    anime({
      targets: this,
      targetProgress: targetP,
      duration: 1200,
      easing: 'easeInOutCubic'
    });
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    SoundFX.playPop(520);

    const icon = document.getElementById('kurama-play-icon');
    const text = document.getElementById('kurama-play-text');

    if (this.isPlaying) {
      if (icon) icon.textContent = '⏸️';
      if (text) text.textContent = 'Pause';

      const animObj = { p: this.targetProgress };
      this.autoPlayAnim = anime({
        targets: animObj,
        p: [0, 1],
        duration: 14000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
        update: () => {
          this.targetProgress = animObj.p;
        }
      });
    } else {
      if (icon) icon.textContent = '▶️';
      if (text) text.textContent = 'Transform Cinema';
      if (this.autoPlayAnim) this.autoPlayAnim.pause();
    }
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const delta = Math.min(0.05, (timestamp - lastTime) * 0.001);
      const time = timestamp * 0.001;
      lastTime = timestamp;

      // Progress smooth interpolation
      this.progress += (this.targetProgress - this.progress) * 0.1;

      // Chakra hold charge dynamics
      if (this.isCharging) {
        this.chakraIntensity = Math.min(1.0, this.chakraIntensity + delta * 1.5);
      } else {
        this.chakraIntensity = Math.max(0.0, this.chakraIntensity - delta * 2.0);
      }

      this.updatePhaseUI();

      // 1. Camera Rig update
      this.cameraRig.update(this.progress, delta);

      // 2. Avatar Material & Core Pulse
      if (this.avatarMaterial) {
        this.avatarMaterial.uniforms.uProgress.value = this.progress;
        this.avatarMaterial.uniforms.uTime.value = time;
        this.avatarMaterial.uniforms.uChakraIntensity.value = this.chakraIntensity;
      }
      if (this.coreMesh) {
        const coreScale = 1.0 + Math.sin(time * 8.0) * 0.2 + this.chakraIntensity * 0.6;
        this.coreMesh.scale.setScalar(coreScale * this.progress);
        this.coreMesh.rotation.y = time * 2.0;
      }

      // 3. Nine Tails Update
      if (this.nineTails) {
        this.nineTails.update(this.progress, time, this.chakraIntensity);
      }

      // 4. GPU Particles Update
      if (this.particles) {
        this.particles.update(this.progress, time, this.chakraIntensity, this.mouse);
      }

      // 5. Aura Mesh Update
      if (this.auraMaterial) {
        this.auraMaterial.uniforms.uProgress.value = this.progress;
        this.auraMaterial.uniforms.uTime.value = time;
        this.auraMaterial.uniforms.uChakraIntensity.value = this.chakraIntensity;
      }

      // 6. Dynamic Lighting
      if (this.keyLight) {
        this.keyLight.intensity = 0.5 + this.progress * 3.0 + this.chakraIntensity * 2.5;
      }

      // 7. WebGL Render
      this.renderer.render(this.scene, this.camera);

      // 8. 2D Rough.js Overlay Render
      if (this.roughOverlay) {
        this.roughOverlay.render(timestamp, this.progress, this.chakraIntensity, this.options.boilFps || 10);
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    // Phase Pill buttons
    this.container.querySelectorAll('.hud-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseFloat(btn.getAttribute('data-phase'));
        this.jumpToProgress(target);
      });
    });

    // Auto Play Cinema button
    document.getElementById('btn-kurama-autoplay')?.addEventListener('click', () => this.toggleAutoPlay());

    // Charge button hold
    const chargeBtn = document.getElementById('btn-kurama-charge');
    chargeBtn?.addEventListener('mousedown', () => { this.isCharging = true; SoundFX.playPop(440); });
    chargeBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.isCharging = true; SoundFX.playPop(440); });
    chargeBtn?.addEventListener('touchend', () => { this.isCharging = false; });

    // Slider scrub
    document.getElementById('slider-kurama-progress')?.addEventListener('input', (e) => {
      if (this.isPlaying) this.toggleAutoPlay();
      this.targetProgress = parseFloat(e.target.value) / 100;
    });
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    if (this.autoPlayAnim) this.autoPlayAnim.pause();
    window.removeEventListener('resize', this.resizeHandler);
    if (this.nineTails) this.nineTails.destroy();
    if (this.particles) this.particles.destroy();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
