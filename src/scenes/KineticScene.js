import rough from 'roughjs';
import anime from 'animejs';
import { BoilShape, BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class KineticScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.shapes = [];
    this.animations = [];
    this.isRunning = true;
    this.renderLoop = null;

    this.settings = {
      gearSpeed: 1,
      bounceElasticity: 1,
      roughness: 1.8,
      bowing: 1.5,
      fillStyle: 'hachure'
    };

    this.initDOM();
    this.setupCanvas();
    this.createObjects();
    this.startAnimations();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Kinetic Physics & Mechanical Lab</span>
              <span class="toolbar-badge">Canvas 2D + Anime.js</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-reseed-kinetic" class="tactile-btn outline" title="Generate new rough seeds">
                ${renderIcon('dice')}
                <span>Reseed</span>
              </button>
              <button id="btn-playpause-kinetic" class="tactile-btn amber">
                <span id="playpause-icon">${renderIcon('pause')}</span>
                <span id="playpause-text">Pause</span>
              </button>
            </div>
          </div>
          <div class="canvas-wrapper" id="kinetic-canvas-wrap">
            <canvas id="kinetic-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">PHYSICS & MOTION</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Gear Speed:</span>
                <span id="val-gear-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-gear-speed" min="0.2" max="3" step="0.1" value="1" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Bounce Elasticity:</span>
                <span id="val-bounce" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-bounce" min="0.4" max="2" step="0.1" value="1" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">ROUGH.JS GEOMETRY</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-roughness" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-roughness" min="0.2" max="4.0" step="0.2" value="1.8" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Bowing:</span>
                <span id="val-bowing" class="control-val">1.5</span>
              </div>
              <input type="range" id="slider-bowing" min="0" max="6.0" step="0.5" value="1.5" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Fill Pattern:</span>
              </div>
              <div class="style-pills-grid" id="fill-style-grid">
                <button class="style-pill-btn active" data-fill="hachure">Hachure</button>
                <button class="style-pill-btn" data-fill="cross-hatch">Cross-Hatch</button>
                <button class="style-pill-btn" data-fill="dots">Dots</button>
                <button class="style-pill-btn" data-fill="zigzag">Zigzag</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('kinetic-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('kinetic-canvas-wrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(rect.width || 0, 300);
      const h = Math.max(rect.height || 0, 380);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.width = w;
      this.height = h;
      this.rc = rough.canvas(this.canvas);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  createObjects() {
    this.shapes = [];
    const w = this.width || 800;
    const h = this.height || 500;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const inkColor = isDark ? '#F3F4F6' : '#1C1917';
    const amberColor = isDark ? '#F59E0B' : '#D97706';
    const sageColor = isDark ? '#10B981' : '#059669';
    const indigoColor = isDark ? '#818CF8' : '#4F46E5';
    const skyColor = isDark ? '#38BDF8' : '#0284C7';
    const terracotta = isDark ? '#EF4444' : '#DC2626';

    const baseOpts = {
      roughness: this.settings.roughness,
      bowing: this.settings.bowing,
      stroke: inkColor,
      strokeWidth: 2,
      fillStyle: this.settings.fillStyle,
      fillWeight: 1.5,
      hachureAngle: 60,
      hachureGap: 5,
      frameCount: 4,
      boilFps: this.options.boilFps || 10
    };

    // 1. Interlocking Gears Group (Left)
    const gearCenter1 = { x: w * 0.22, y: h * 0.38 };
    const gearRadius1 = 58;
    this.gear1 = new BoilShape('circle', [0, 0, gearRadius1 * 2], {
      ...baseOpts,
      fill: amberColor,
      stroke: inkColor,
      hachureAngle: 45
    }, this.engine);
    this.gear1.x = gearCenter1.x;
    this.gear1.y = gearCenter1.y;

    // Gear 1 spokes & center
    this.gear1Center = new BoilShape('circle', [0, 0, 24], {
      ...baseOpts,
      fill: isDark ? '#1F242D' : '#FFFFFF',
      fillStyle: 'solid'
    }, this.engine);
    this.gear1Center.x = gearCenter1.x;
    this.gear1Center.y = gearCenter1.y;

    // Small interlocking Gear 2
    const gearCenter2 = { x: gearCenter1.x + 85, y: gearCenter1.y - 45 };
    const gearRadius2 = 36;
    this.gear2 = new BoilShape('circle', [0, 0, gearRadius2 * 2], {
      ...baseOpts,
      fill: sageColor,
      stroke: inkColor,
      hachureAngle: -45
    }, this.engine);
    this.gear2.x = gearCenter2.x;
    this.gear2.y = gearCenter2.y;

    this.gear2Center = new BoilShape('circle', [0, 0, 16], {
      ...baseOpts,
      fill: isDark ? '#1F242D' : '#FFFFFF',
      fillStyle: 'solid'
    }, this.engine);
    this.gear2Center.x = gearCenter2.x;
    this.gear2Center.y = gearCenter2.y;

    // Gear base / axle mount
    this.gearMount = new BoilShape('rectangle', [gearCenter1.x - 40, gearCenter1.y + 70, 160, 18], {
      ...baseOpts,
      fill: isDark ? '#2E3440' : '#E5E0D4'
    }, this.engine);

    // 2. Bouncing Ball & Floor (Center)
    const floorY = h * 0.78;
    this.floor = new BoilShape('line', [w * 0.42, floorY, w * 0.68, floorY], {
      ...baseOpts,
      strokeWidth: 3.5,
      stroke: inkColor
    }, this.engine);

    // Ball shadow
    this.ballShadow = new BoilShape('ellipse', [0, 0, 48, 14], {
      ...baseOpts,
      fill: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      fillStyle: 'solid',
      stroke: 'transparent'
    }, this.engine);
    this.ballShadow.x = w * 0.55;
    this.ballShadow.y = floorY + 6;

    // Bouncing Ball
    this.ball = new BoilShape('circle', [0, 0, 46], {
      ...baseOpts,
      fill: terracotta,
      hachureAngle: 120,
      fillWeight: 2
    }, this.engine);
    this.ball.x = w * 0.55;
    this.ball.y = floorY - 140;

    // 3. Orbiting Planetary System (Right)
    const sunPos = { x: w * 0.82, y: h * 0.42 };
    // Sun
    this.sun = new BoilShape('circle', [0, 0, 52], {
      ...baseOpts,
      fill: amberColor,
      fillStyle: 'cross-hatch'
    }, this.engine);
    this.sun.x = sunPos.x;
    this.sun.y = sunPos.y;

    // Sun Rays
    this.sunRays = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r1 = 34;
      const r2 = 46;
      const ray = new BoilShape('line', [
        Math.cos(angle) * r1, Math.sin(angle) * r1,
        Math.cos(angle) * r2, Math.sin(angle) * r2
      ], { ...baseOpts, strokeWidth: 2 }, this.engine);
      ray.x = sunPos.x;
      ray.y = sunPos.y;
      this.sunRays.push(ray);
    }

    // Orbit rings
    this.orbitRing1 = new BoilShape('ellipse', [sunPos.x, sunPos.y, 140, 70], {
      ...baseOpts,
      stroke: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
      strokeWidth: 1.2,
      fill: 'transparent'
    }, this.engine);

    this.orbitRing2 = new BoilShape('ellipse', [sunPos.x, sunPos.y, 220, 110], {
      ...baseOpts,
      stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
      strokeWidth: 1.2,
      fill: 'transparent'
    }, this.engine);

    // Planet 1 (Sky Blue)
    this.planet1 = new BoilShape('circle', [0, 0, 18], {
      ...baseOpts,
      fill: skyColor,
      fillStyle: 'hachure'
    }, this.engine);

    // Planet 2 (Indigo with Ring)
    this.planet2 = new BoilShape('circle', [0, 0, 26], {
      ...baseOpts,
      fill: indigoColor,
      fillStyle: 'dots'
    }, this.engine);

    this.planet2Ring = new BoilShape('ellipse', [0, 0, 42, 14], {
      ...baseOpts,
      stroke: inkColor,
      strokeWidth: 1.5
    }, this.engine);

    // 4. Swinging Pendulum (Top Center)
    const pendAnchor = { x: w * 0.42, y: h * 0.12 };
    this.pendulumAnchor = new BoilShape('circle', [pendAnchor.x, pendAnchor.y, 10], {
      ...baseOpts,
      fill: inkColor,
      fillStyle: 'solid'
    }, this.engine);

    this.pendulumRod = new BoilShape('line', [0, 0, 0, 100], {
      ...baseOpts,
      strokeWidth: 2.5
    }, this.engine);
    this.pendulumRod.x = pendAnchor.x;
    this.pendulumRod.y = pendAnchor.y;

    this.pendulumBob = new BoilShape('circle', [0, 100, 28], {
      ...baseOpts,
      fill: sageColor,
      fillStyle: 'hachure'
    }, this.engine);
    this.pendulumBob.x = pendAnchor.x;
    this.pendulumBob.y = pendAnchor.y;

    // Collect all shapes
    this.shapes = [
      this.gearMount,
      this.gear1,
      this.gear1Center,
      this.gear2,
      this.gear2Center,
      this.floor,
      this.ballShadow,
      this.ball,
      this.orbitRing2,
      this.orbitRing1,
      ...this.sunRays,
      this.sun,
      this.planet1,
      this.planet2,
      this.planet2Ring,
      this.pendulumAnchor,
      this.pendulumRod,
      this.pendulumBob
    ];
  }

  startAnimations() {
    this.animations.forEach(a => a.pause());
    this.animations = [];

    // 1. Gears Continuous Rotation
    const gearRot1 = anime({
      targets: [this.gear1, this.gear1Center],
      rotation: 360,
      duration: 6000 / this.settings.gearSpeed,
      easing: 'linear',
      loop: true
    });

    const gearRot2 = anime({
      targets: [this.gear2, this.gear2Center],
      rotation: -360 * (58 / 36), // Proper gear ratio
      duration: 6000 / this.settings.gearSpeed,
      easing: 'linear',
      loop: true
    });

    // 2. Bouncing Ball Squash & Stretch
    const floorY = (this.height || 500) * 0.78;
    const bounceDuration = 1000 / this.settings.bounceElasticity;

    const ballBounce = anime.timeline({ loop: true })
      .add({
        targets: this.ball,
        y: floorY - 24,
        scaleY: [1, 0.65],
        scaleX: [1, 1.4],
        duration: bounceDuration * 0.48,
        easing: 'easeInQuad',
        changeBegin: () => SoundFX.playPop(340)
      })
      .add({
        targets: this.ball,
        scaleY: [0.65, 1.25, 1],
        scaleX: [1.4, 0.85, 1],
        duration: bounceDuration * 0.22,
        easing: 'easeOutQuad'
      })
      .add({
        targets: this.ball,
        y: floorY - 140,
        scaleY: 1,
        scaleX: 1,
        duration: bounceDuration * 0.3,
        easing: 'easeOutQuad'
      });

    // Ball shadow scaling
    const shadowAnim = anime({
      targets: this.ballShadow,
      scaleX: [0.5, 1.4],
      scaleY: [0.5, 1.2],
      opacity: [0.3, 0.9],
      duration: bounceDuration * 0.48,
      direction: 'alternate',
      easing: 'easeInQuad',
      loop: true
    });

    // 3. Sun subtle pulse
    const sunPulse = anime({
      targets: this.sun,
      scaleX: [1, 1.08],
      scaleY: [1, 1.08],
      duration: 1800,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true
    });

    // 4. Planet 1 Orbit (Parametric Animation)
    const sunPos = { x: (this.width || 800) * 0.82, y: (this.height || 500) * 0.42 };
    const orbit1Obj = { angle: 0 };
    const orbitAnim1 = anime({
      targets: orbit1Obj,
      angle: Math.PI * 2,
      duration: 5000,
      easing: 'linear',
      loop: true,
      update: () => {
        this.planet1.x = sunPos.x + Math.cos(orbit1Obj.angle) * 70;
        this.planet1.y = sunPos.y + Math.sin(orbit1Obj.angle) * 35;
      }
    });

    // Planet 2 Orbit
    const orbit2Obj = { angle: Math.PI * 0.6 };
    const orbitAnim2 = anime({
      targets: orbit2Obj,
      angle: Math.PI * 2.6,
      duration: 9000,
      easing: 'linear',
      loop: true,
      update: () => {
        this.planet2.x = sunPos.x + Math.cos(orbit2Obj.angle) * 110;
        this.planet2.y = sunPos.y + Math.sin(orbit2Obj.angle) * 55;
        this.planet2Ring.x = this.planet2.x;
        this.planet2Ring.y = this.planet2.y;
      }
    });

    // 5. Pendulum Swing
    const pendAnim = anime({
      targets: [this.pendulumRod, this.pendulumBob],
      rotation: [-38, 38],
      duration: 1400,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true
    });

    this.animations = [
      gearRot1, gearRot2, ballBounce, shadowAnim,
      sunPulse, orbitAnim1, orbitAnim2, pendAnim
    ];
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background sketch grid / subtle guidelines
        this.drawGuidelines();

        // Render all boiling shapes
        for (const shape of this.shapes) {
          shape.render(this.ctx, this.rc, timestamp);
        }
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  drawGuidelines() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.ctx.save();
    this.ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 8]);

    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
    this.shapes.forEach(s => s.updateOptions({ boilFps: fps }));
  }

  reseedAll() {
    this.shapes.forEach(s => {
      s.updateOptions({ seed: Math.floor(Math.random() * 100000) });
    });
    SoundFX.playScratch();
  }

  togglePlayPause() {
    this.isRunning = !this.isRunning;
    const btnIcon = document.getElementById('playpause-icon');
    const btnText = document.getElementById('playpause-text');

    if (this.isRunning) {
      this.animations.forEach(a => a.play());
      if (btnIcon) btnIcon.innerHTML = renderIcon('pause');
      if (btnText) btnText.textContent = 'Pause';
    } else {
      this.animations.forEach(a => a.pause());
      if (btnIcon) btnIcon.innerHTML = renderIcon('play');
      if (btnText) btnText.textContent = 'Play';
    }
    SoundFX.playPop(500);
  }

  bindEvents() {
    // Reseed button
    const reseedBtn = document.getElementById('btn-reseed-kinetic');
    if (reseedBtn) reseedBtn.addEventListener('click', () => this.reseedAll());

    // Play / Pause button
    const playPauseBtn = document.getElementById('btn-playpause-kinetic');
    if (playPauseBtn) playPauseBtn.addEventListener('click', () => this.togglePlayPause());

    // Sliders
    const gearSlider = document.getElementById('slider-gear-speed');
    if (gearSlider) {
      gearSlider.addEventListener('input', (e) => {
        this.settings.gearSpeed = parseFloat(e.target.value);
        document.getElementById('val-gear-speed').textContent = `${this.settings.gearSpeed.toFixed(1)}x`;
        this.startAnimations();
      });
    }

    const bounceSlider = document.getElementById('slider-bounce');
    if (bounceSlider) {
      bounceSlider.addEventListener('input', (e) => {
        this.settings.bounceElasticity = parseFloat(e.target.value);
        document.getElementById('val-bounce').textContent = `${this.settings.bounceElasticity.toFixed(1)}x`;
        this.startAnimations();
      });
    }

    const roughSlider = document.getElementById('slider-roughness');
    if (roughSlider) {
      roughSlider.addEventListener('input', (e) => {
        this.settings.roughness = parseFloat(e.target.value);
        document.getElementById('val-roughness').textContent = this.settings.roughness.toFixed(1);
        this.shapes.forEach(s => s.updateOptions({ roughness: this.settings.roughness }));
      });
    }

    const bowingSlider = document.getElementById('slider-bowing');
    if (bowingSlider) {
      bowingSlider.addEventListener('input', (e) => {
        this.settings.bowing = parseFloat(e.target.value);
        document.getElementById('val-bowing').textContent = this.settings.bowing.toFixed(1);
        this.shapes.forEach(s => s.updateOptions({ bowing: this.settings.bowing }));
      });
    }

    // Fill Style Pills
    const fillGrid = document.getElementById('fill-style-grid');
    if (fillGrid) {
      fillGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        fillGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const fill = btn.getAttribute('data-fill');
        this.settings.fillStyle = fill;
        this.shapes.forEach(s => s.updateOptions({ fillStyle: fill }));
        SoundFX.playPop(600);
      });
    }
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    this.animations.forEach(a => a.pause());
  }
}
