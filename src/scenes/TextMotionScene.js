import * as THREE from 'three';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BezierTrajectoryEngine } from '../engine/BezierTrajectoryEngine.js';
import { createTextMotionMaterial } from '../engine/TextMotionShaders.js';
import { CameraRig } from '../engine/CameraRig.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class TextMotionScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.particleCount = 14000;
    this.progress = 0;
    this.targetProgress = 0;
    this.turbulence = 1.0;
    this.reducedMotion = false;
    this.isPlaying = false;
    this.svgMode = false;
    this.running = true;

    this.mouse = new THREE.Vector2(0, 0);
    this.mouseTarget = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.mouseActive = 0;

    this.initDOM();
    this.setupWebGL();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 340px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 580px; position: relative;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Experimental 3D Text Motion</span>
              <span class="toolbar-badge">CREATE ➔ MATTER</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-text-autoplay" class="tactile-btn amber">
                <span id="text-play-icon">${renderIcon('play')}</span>
                <span id="text-play-text">Auto-Play</span>
              </button>
              <button id="btn-text-svg" class="tactile-btn outline">
                <span>2D SVG Mode</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="textmotion-canvas-wrap" style="min-height: 500px; cursor: grab;">
            <canvas id="textmotion-gl-canvas" class="main-stage-canvas"></canvas>

            <!-- Floating Phase Pill Badges on Stage -->
            <div class="hud-phase-pills" style="position: absolute; top: 16px; left: 16px; z-index: 10;">
              <button class="hud-pill-btn active" data-phase="0.05">
                <span class="pill-index">01</span>
                <span class="pill-label">CREATE</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.32">
                <span class="pill-index">02</span>
                <span class="pill-label">FRACTURE</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.55">
                <span class="pill-index">03</span>
                <span class="pill-label">VORTEX</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.75">
                <span class="pill-index">04</span>
                <span class="pill-label">CONVERGE</span>
              </button>
              <button class="hud-pill-btn" data-phase="0.95">
                <span class="pill-index">05</span>
                <span class="pill-label">MATTER</span>
              </button>
            </div>

            <!-- Stage Bottom HUD Hint -->
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.72rem; color: var(--ink-muted); background: var(--paper-card); border: 1px solid var(--line); padding: 4px 12px; border-radius: var(--radius-xs); pointer-events: none;">
              Scroll mouse wheel or drag timeline to scrub transformation (Reversible)
            </div>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">MASTER TIMELINE SCRUB</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Transformation Progress:</span>
                <span id="val-text-progress" class="control-val">0%</span>
              </div>
              <input type="range" id="slider-text-progress" min="0" max="100" value="0" step="0.5" class="custom-range">
            </div>
            <div id="text-phase-desc-card" style="padding: 10px 14px; background: var(--paper); border-radius: var(--radius-xs); font-size: 0.75rem; line-height: 1.5; color: var(--ink-soft); border: 1px solid var(--line);">
              <strong id="phase-title-text" style="color: var(--orange); display: block; margin-bottom: 2px;">PHASE 01: SOLID TYPOGRAPHY</strong>
              <span id="phase-body-text">Dense 3D BufferGeometry in architectural typography with harmonic breathing.</span>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">PARTICLE CLOUD CONFIG</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Particle Density:</span>
              </div>
              <div class="style-pills-grid" id="text-density-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <button class="style-pill-btn" data-density="8000">8K</button>
                <button class="style-pill-btn active" data-density="14000">14K</button>
                <button class="style-pill-btn" data-density="20000">20K</button>
              </div>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Curl Turbulence:</span>
                <span id="val-text-turbulence" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-text-turbulence" min="0.2" max="2.5" step="0.1" value="1.0" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">MATHEMATICAL SPEC</span>
            </div>
            <p style="font-size: 0.72rem; font-family: 'Fira Code', monospace; line-height: 1.6; color: var(--ink-muted);">
              B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃<br>
              P₀ ∈ [CREATE] ➔ P₃ ∈ [MATTER]
            </p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupWebGL() {
    this.canvas = document.getElementById('textmotion-gl-canvas');
    const wrap = document.getElementById('textmotion-canvas-wrap');
    const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 500 };

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

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
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(isDark ? 0x0A0A0C : 0xF7F4EC);
    this.scene.fog = new THREE.FogExp2(isDark ? 0x0A0A0C : 0xF7F4EC, 0.035);

    this.camera = new THREE.PerspectiveCamera(42, rect.width / rect.height, 0.1, 100);
    this.camera.position.set(0, 0, 8.5);

    this.cameraRig = new CameraRig(this.camera);

    // Build Particles
    this.rebuildParticles();

    // Resize Handler
    this.resizeHandler = () => {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      const w = Math.max(r.width || 0, wrap.clientWidth || 0, 780);
      const h = Math.max(r.height || 0, wrap.clientHeight || 0, 500);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.material) {
        this.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2.0);
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    setTimeout(this.resizeHandler, 100);

    this.setupInteractions(wrap);
  }

  rebuildParticles() {
    if (this.points) {
      this.scene.remove(this.points);
      if (this.geometry) this.geometry.dispose();
      if (this.material) this.material.dispose();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.geometry = BezierTrajectoryEngine.generateParticleGeometry(this.particleCount);
    this.material = createTextMotionMaterial(isDark);
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  setupInteractions(wrap) {
    // Mouse Raycasting
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.cameraRig.setMouse(ndcX, ndcY);

      this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
      const intersection = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.mousePlane, intersection);
      if (intersection) {
        this.mouse.copy(intersection);
        this.mouseActive = 1.0;
      }
    });

    wrap.addEventListener('mouseleave', () => {
      this.mouseActive = 0.0;
      this.cameraRig.setMouse(0, 0);
    });

    // Mouse Wheel Inertial Scrubbing
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.isPlaying) this.toggleAutoPlay();

      const delta = e.deltaY * 0.0008;
      this.targetProgress = Math.max(0, Math.min(1, this.targetProgress + delta));
      this.scrollVelocity = delta * 40;
    }, { passive: false });
  }

  updatePhaseUI() {
    const slider = document.getElementById('slider-text-progress');
    const val = document.getElementById('val-text-progress');
    const title = document.getElementById('phase-title-text');
    const body = document.getElementById('phase-body-text');

    if (slider) {
      const pct = (this.progress * 100).toFixed(1);
      slider.value = pct;
      slider.style.setProperty('--slider-fill-pct', `${pct}%`);
    }
    if (val) val.textContent = `${Math.round(this.progress * 100)}%`;

    let activePhase = 0;
    if (this.progress < 0.20) {
      activePhase = 0;
      if (title) title.textContent = 'PHASE 01: SOLID TYPOGRAPHY (CREATE)';
      if (body) body.textContent = 'Dense 3D BufferGeometry in architectural typography with harmonic breathing.';
    } else if (this.progress < 0.45) {
      activePhase = 1;
      if (title) title.textContent = 'PHASE 02: ORGANIC FRACTURE';
      if (body) body.textContent = 'Staggered 3D Cubic Bézier disassemblies bursting outward in spatial trajectories.';
    } else if (this.progress < 0.65) {
      activePhase = 2;
      if (title) title.textContent = 'PHASE 03: PARTICLE VORTEX';
      if (body) body.textContent = '14,000+ particles navigating 3D curl-noise fields and camera interior flight.';
    } else if (this.progress < 0.85) {
      activePhase = 3;
      if (title) title.textContent = 'PHASE 04: TARGET CONVERGENCE';
      if (body) body.textContent = 'Deterministic mathematical vector convergence into new typographic attractors.';
    } else {
      activePhase = 4;
      if (title) title.textContent = 'PHASE 05: SOLID RECONSTRUCTION (MATTER)';
      if (body) body.textContent = 'Particles coalesce into fine geometric mesh and solid 3D typography.';
    }

    // Update active pill button
    const pills = this.container.querySelectorAll('.hud-pill-btn');
    pills.forEach((p, idx) => {
      p.classList.toggle('active', idx === activePhase);
    });

    // Checkpoint audio tick & confetti
    if (activePhase !== this.lastPhase) {
      this.lastPhase = activePhase;
      SoundFX.playPop(440 + activePhase * 50);

      if (this.progress >= 0.95) {
        confetti({ particleCount: 30, spread: 50 });
      }
    }
  }

  jumpToProgress(targetP) {
    if (this.isPlaying) this.toggleAutoPlay();
    SoundFX.playPop(580);

    anime({
      targets: this,
      targetProgress: targetP,
      duration: 1000,
      easing: 'easeInOutCubic'
    });
  }

  toggleAutoPlay() {
    this.isPlaying = !this.isPlaying;
    SoundFX.playPop(520);

    const icon = document.getElementById('text-play-icon');
    const text = document.getElementById('text-play-text');

    if (this.isPlaying) {
      if (icon) icon.innerHTML = renderIcon('pause');
      if (text) text.textContent = 'Pause';

      const animObj = { p: this.targetProgress };
      this.autoPlayAnim = anime({
        targets: animObj,
        p: [0, 1],
        duration: 10000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
        update: () => {
          this.targetProgress = animObj.p;
        }
      });
    } else {
      if (icon) icon.innerHTML = renderIcon('play');
      if (text) text.textContent = 'Auto-Play';
      if (this.autoPlayAnim) this.autoPlayAnim.pause();
    }
  }

  toggleSvgMode() {
    this.svgMode = !this.svgMode;
    SoundFX.playPop(500);
    const btn = document.getElementById('btn-text-svg');
    if (btn) {
      btn.classList.toggle('active', this.svgMode);
      btn.innerHTML = `<span>${this.svgMode ? '2D SVG Active' : '2D SVG Mode'}</span>`;
    }
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;
    let lastTime = performance.now();

    const loop = (timestamp) => {
      if (!this.running) return;

      const delta = Math.min(0.05, (timestamp - lastTime) * 0.001);
      lastTime = timestamp;

      // Smooth progress interpolation
      this.progress += (this.targetProgress - this.progress) * 0.12;
      this.scrollVelocity *= 0.92; // Dampen velocity

      this.updatePhaseUI();

      // Camera Rig update
      if (this.cameraRig) {
        this.cameraRig.update(this.progress, delta);
      }

      // Shader Uniforms update
      if (this.material) {
        this.material.uniforms.uTime.value = timestamp * 0.001;
        this.material.uniforms.uProgress.value = this.progress;
        this.material.uniforms.uScrollVelocity.value = this.scrollVelocity;
        this.material.uniforms.uSvgMode.value = this.svgMode ? 1.0 : 0.0;
        this.material.uniforms.uTurbulence.value = this.turbulence;
        this.material.uniforms.uReducedMotion.value = this.reducedMotion ? 1.0 : 0.0;
        this.material.uniforms.uMouse.value.copy(this.mouse);
        this.material.uniforms.uMouseActive.value = this.mouseActive;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps() {}

  bindEvents() {
    // Phase Pill buttons
    this.container.querySelectorAll('.hud-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = parseFloat(btn.getAttribute('data-phase'));
        this.jumpToProgress(target);
      });
    });

    // Auto Play button
    document.getElementById('btn-text-autoplay')?.addEventListener('click', () => this.toggleAutoPlay());

    // SVG Mode button
    document.getElementById('btn-text-svg')?.addEventListener('click', () => this.toggleSvgMode());

    // Scrub Slider
    document.getElementById('slider-text-progress')?.addEventListener('input', (e) => {
      if (this.isPlaying) this.toggleAutoPlay();
      this.targetProgress = parseFloat(e.target.value) / 100;
    });

    // Turbulence Slider
    document.getElementById('slider-text-turbulence')?.addEventListener('input', (e) => {
      this.turbulence = parseFloat(e.target.value);
      document.getElementById('val-text-turbulence').textContent = `${this.turbulence.toFixed(1)}x`;
    });

    // Density grid
    const densityGrid = document.getElementById('text-density-grid');
    if (densityGrid) {
      densityGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        densityGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.particleCount = parseInt(btn.getAttribute('data-density'));
        this.rebuildParticles();
        SoundFX.playPop(520);
      });
    }
  }

  suspend() {
    this.running = false;
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  resume() {
    if (this.running) return;
    this.startRenderLoop();
  }

  destroy() {
    this.suspend();
    if (this.autoPlayAnim) this.autoPlayAnim.pause();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
