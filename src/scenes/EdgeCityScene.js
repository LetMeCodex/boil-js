import * as THREE from 'three';
import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class EdgeCityScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.waveSpeed = 1.0;
    this.waveAmp = 1.6;
    this.gridSize = 32;
    this.wireframeMode = false;
    this.colorTheme = 'clay'; // 'clay' | 'cyber' | 'sunset'
    this.ripples = [];
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

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
              <span class="toolbar-title">🏙️ Edge City 3D Topological Landscape</span>
              <span class="toolbar-badge">Voxel Wave & Kinetic Orbs</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-city-ripple" class="tactile-btn amber">
                <span>🌊 Shockwave Ripple</span>
              </button>
              <button id="btn-city-wireframe" class="tactile-btn outline">
                <span>📐 Wireframe Mode</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="edgecity-canvas-wrap" style="min-height: 520px; cursor: grab;">
            <canvas id="edgecity-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- Floating 3D HUD Annotations -->
            <div style="position: absolute; top: 16px; left: 16px; font-family: var(--font-mono); font-size: 0.72rem; color: var(--accent-amber); background: var(--bg-glass); backdrop-filter: blur(10px); padding: 6px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              EDGE CITY // TOKYO SECTOR 07 • LAT 35.6762° N, LONG 139.6503° E
            </div>

            <!-- Interaction Hint -->
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-glass); backdrop-filter: blur(10px); padding: 4px 14px; border-radius: 9999px; pointer-events: none; border: 1px solid var(--border-subtle);">
              🖱️ Drag mouse to tilt isometric camera • Click anywhere to spawn elevation shockwave ripples
            </div>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card" style="background: var(--bg-surface-alt); border: 2px solid var(--accent-amber);">
            <div class="panel-header">
              <span class="panel-title">🌊 Topological Wave Matrix</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Wave Amplitude:</span>
                <span id="val-city-amp" class="control-val">1.6x</span>
              </div>
              <input type="range" id="slider-city-amp" min="0.4" max="3.0" step="0.1" value="1.6" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Wave Speed:</span>
                <span id="val-city-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-city-speed" min="0.2" max="2.5" step="0.1" value="1.0" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎨 Architectural Palette</span>
            </div>
            <div class="style-pills-grid" id="city-palette-grid" style="grid-template-columns: 1fr 1fr 1fr;">
              <button class="style-pill-btn active" data-palette="clay">🏛️ Clay/Paper</button>
              <button class="style-pill-btn" data-palette="sunset">🌅 Sunset</button>
              <button class="style-pill-btn" data-palette="cyber">🌌 Obsidian</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">📐 Geometry Telemetry</span>
            </div>
            <p style="font-size: 0.75rem; font-family: 'Fira Code', monospace; line-height: 1.6; color: var(--text-muted);">
              GRID: 32×32 (1,024 Instanced Voxel Towers)<br>
              ELEVATION: Simplex Multi-Octave Harmonics<br>
              ORBITS: 12 Kinetic Spline Couriers
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupWebGL() {
    this.canvas = document.getElementById('edgecity-stage-canvas');
    const wrap = document.getElementById('edgecity-canvas-wrap');
    const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 520 };

    this.scene = new THREE.Scene();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.scene.background = new THREE.Color(isDark ? 0x0A0A0C : 0xF7F4EC);
    this.scene.fog = new THREE.FogExp2(isDark ? 0x0A0A0C : 0xF7F4EC, 0.025);

    this.camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 100);
    this.camera.position.set(16, 22, 24);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(rect.width, rect.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.85);
    this.dirLight = new THREE.DirectionalLight(0xF59E0B, 2.0);
    this.dirLight.position.set(20, 35, 20);
    this.rimLight = new THREE.DirectionalLight(0x0284C7, 1.0);
    this.rimLight.position.set(-20, -10, -20);
    this.scene.add(this.ambientLight, this.dirLight, this.rimLight);

    // Build Instanced City
    this.buildCity();
    this.buildOrbs();

    // Resize
    this.resizeHandler = () => {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(r.width, r.height);
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  buildCity() {
    const spacing = 1.15;
    const total = this.gridSize * this.gridSize;
    const blockGeo = new THREE.BoxGeometry(0.88, 4.0, 0.88);
    blockGeo.translate(0, 2.0, 0);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.blockMat = new THREE.MeshLambertMaterial({
      color: isDark ? 0x1E2430 : 0xEFEBE0,
      wireframe: this.wireframeMode
    });

    this.instancedCity = new THREE.InstancedMesh(blockGeo, this.blockMat, total);
    this.instancedCity.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.dummy = new THREE.Object3D();
    this.blockPositions = [];
    const offset = (this.gridSize * spacing) / 2;

    let idx = 0;
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const posX = x * spacing - offset;
        const posZ = z * spacing - offset;
        this.blockPositions.push({ x: posX, z: posZ, baseScale: 0.35 + Math.random() * 0.65 });

        this.dummy.position.set(posX, 0, posZ);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedCity.setMatrixAt(idx++, this.dummy.matrix);
      }
    }

    this.instancedCity.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedCity);
  }

  buildOrbs() {
    this.orbs = [];
    const orbGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });

    for (let i = 0; i < 12; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 5 + (i % 4) * 3.5;
      this.scene.add(mesh);
      this.orbs.push({
        mesh,
        angle,
        radius,
        speed: 0.01 + (i % 3) * 0.006,
        heightOffset: 2.8 + (i % 3) * 0.8
      });
    }
  }

  addRipple(wx, wz) {
    SoundFX.playPop(520);
    this.ripples.push({
      x: wx,
      z: wz,
      radius: 0.1,
      maxRadius: 20.0,
      strength: 2.5,
      alpha: 1.0
    });
  }

  setPalette(palette) {
    this.colorTheme = palette;
    SoundFX.playPop(550);

    if (palette === 'clay') {
      this.scene.background.set(0xF7F4EC);
      this.scene.fog.color.set(0xF7F4EC);
      this.blockMat.color.set(0xEFEBE0);
      this.dirLight.color.set(0xF59E0B);
    } else if (palette === 'sunset') {
      this.scene.background.set(0x2A1B18);
      this.scene.fog.color.set(0x2A1B18);
      this.blockMat.color.set(0xD97706);
      this.dirLight.color.set(0xDC2626);
    } else if (palette === 'cyber') {
      this.scene.background.set(0x0A0A0C);
      this.scene.fog.color.set(0x0A0A0C);
      this.blockMat.color.set(0x1E2430);
      this.dirLight.color.set(0x38BDF8);
    }
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const time = timestamp * 0.001 * this.waveSpeed;

      // Mouse Parallax Lerp
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

      this.camera.position.set(16 + this.mouse.x * 6, 22 + this.mouse.y * 4, 24 + this.mouse.x * 4);
      this.camera.lookAt(0, 0, 0);

      // Update City Blocks
      let idx = 0;
      for (let i = 0; i < this.blockPositions.length; i++) {
        const bp = this.blockPositions[i];
        let elevation = (
          Math.sin(bp.x * 0.18 + time * 1.2) * Math.cos(bp.z * 0.18 + time * 1.0) * 1.6 +
          Math.sin((bp.x + bp.z) * 0.1 + time * 0.8) * 0.9 +
          Math.cos(Math.hypot(bp.x, bp.z) * 0.25 - time * 1.5) * 0.7
        ) * this.waveAmp;

        for (let r = 0; r < this.ripples.length; r++) {
          const rip = this.ripples[r];
          const dist = Math.hypot(bp.x - rip.x, bp.z - rip.z);
          if (Math.abs(dist - rip.radius) < 4.0) {
            elevation += Math.sin((dist - rip.radius) * 1.5) * rip.strength * rip.alpha;
          }
        }

        const scaleY = Math.max(0.15, (elevation + 3.0) * bp.baseScale);
        this.dummy.position.set(bp.x, 0, bp.z);
        this.dummy.scale.set(1, scaleY, 1);
        this.dummy.updateMatrix();
        this.instancedCity.setMatrixAt(idx++, this.dummy.matrix);
      }
      this.instancedCity.instanceMatrix.needsUpdate = true;

      // Update Ripples
      for (let r = this.ripples.length - 1; r >= 0; r--) {
        const rip = this.ripples[r];
        rip.radius += 0.35;
        rip.alpha -= 0.015;
        if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
          this.ripples.splice(r, 1);
        }
      }

      // Update Orbs
      for (let o = 0; o < this.orbs.length; o++) {
        const orb = this.orbs[o];
        orb.angle += orb.speed;
        const ox = Math.cos(orb.angle) * orb.radius;
        const oz = Math.sin(orb.angle) * orb.radius;
        const th = Math.sin(ox * 0.18 + time) * Math.cos(oz * 0.18 + time) * 2.0;
        orb.mesh.position.set(ox, th + orb.heightOffset, oz);
      }

      this.renderer.render(this.scene, this.camera);
      this.renderLoop = requestAnimationFrame(loop);
    };

    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  setTurbulence(val) {
    this.waveAmp = val * 1.6;
  }

  bindEvents() {
    const wrap = document.getElementById('edgecity-canvas-wrap');
    if (wrap) {
      wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        this.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        this.mouse.targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      });

      wrap.addEventListener('click', (e) => {
        const rect = wrap.getBoundingClientRect();
        const wx = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
        const wz = ((e.clientY - rect.top) / rect.height - 0.5) * 22;
        this.addRipple(wx, wz);
      });
    }

    document.getElementById('btn-city-ripple')?.addEventListener('click', () => {
      this.addRipple(0, 0);
      confetti({ particleCount: 25, spread: 50 });
    });

    document.getElementById('btn-city-wireframe')?.addEventListener('click', () => {
      this.wireframeMode = !this.wireframeMode;
      this.blockMat.wireframe = this.wireframeMode;
      SoundFX.playPop(500);
      const btn = document.getElementById('btn-city-wireframe');
      if (btn) btn.innerHTML = `<span>${this.wireframeMode ? '🧱 Solid Mode' : '📐 Wireframe Mode'}</span>`;
    });

    // Sliders
    const ampSlider = document.getElementById('slider-city-amp');
    const ampVal = document.getElementById('val-city-amp');
    ampSlider?.addEventListener('input', (e) => {
      this.waveAmp = parseFloat(e.target.value);
      if (ampVal) ampVal.textContent = `${this.waveAmp.toFixed(1)}x`;
    });

    const speedSlider = document.getElementById('slider-city-speed');
    const speedVal = document.getElementById('val-city-speed');
    speedSlider?.addEventListener('input', (e) => {
      this.waveSpeed = parseFloat(e.target.value);
      if (speedVal) speedVal.textContent = `${this.waveSpeed.toFixed(1)}x`;
    });

    // Palette grid
    const paletteGrid = document.getElementById('city-palette-grid');
    if (paletteGrid) {
      paletteGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        paletteGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setPalette(btn.getAttribute('data-palette'));
      });
    }
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    window.removeEventListener('resize', this.resizeHandler);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
