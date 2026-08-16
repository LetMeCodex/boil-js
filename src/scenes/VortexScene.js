import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class VortexScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.particleCount = 220;
    this.particles = [];
    this.mode = 'attract'; // 'attract' | 'repel' | 'fibonacci'
    this.mouse = { x: 0, y: 0, isHover: false };
    this.singularityPulse = 1;

    this.settings = {
      vortexSpeed: 1,
      swirlIntensity: 1.2,
      roughness: 1.8,
      bowing: 1.5
    };

    this.initDOM();
    this.setupCanvas();
    this.initParticles();
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
              <span class="toolbar-title">Quantum Black Hole & Vortex</span>
              <span class="toolbar-badge">Particle Swarm + Vector Field Boil</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-supernova" class="tactile-btn amber">
                ${renderIcon('sparkle')}
                <span>Supernova Blast</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="vortex-canvas-wrap">
            <canvas id="vortex-stage-canvas" class="main-stage-canvas"></canvas>
            <div id="vortex-hint" style="position: absolute; bottom: 16px; left: 16px; font-size: 0.72rem; color: var(--ink-muted); background: var(--paper-card); border: 1px solid var(--line); padding: 4px 12px; border-radius: var(--radius-xs); pointer-events: none;">
              Move cursor over stage to bend spacetime field • Click to blast
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">GRAVITATIONAL MODES</span>
            </div>
            <div class="style-pills-grid" id="vortex-modes-grid" style="grid-template-columns: 1fr;">
              <button class="style-pill-btn active" data-mode="attract">${renderIcon('galaxy')}<span>Gravitational Singularity</span></button>
              <button class="style-pill-btn" data-mode="repel">${renderIcon('zap')}<span>Supernova Repulsion</span></button>
              <button class="style-pill-btn" data-mode="fibonacci">${renderIcon('torus')}<span>Golden Fibonacci Spiral</span></button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">VORTEX PHYSICS</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Orbital Velocity:</span>
                <span id="val-vortex-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-vortex-speed" min="0.2" max="3" step="0.1" value="1" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Swirl Curvature:</span>
                <span id="val-vortex-swirl" class="control-val">1.2</span>
              </div>
              <input type="range" id="slider-vortex-swirl" min="0.2" max="3" step="0.1" value="1.2" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">LINE BOIL</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-vortex-rough" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-vortex-rough" min="0.2" max="4.0" step="0.2" value="1.8" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('vortex-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('vortex-canvas-wrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(dpr, dpr);
      this.width = rect.width;
      this.height = rect.height;
    };

    window.addEventListener('resize', resize);
    resize();

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.isHover = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isHover = false;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.triggerSupernova(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  initParticles() {
    this.particles = [];
    const colors = ['#D97706', '#059669', '#DC2626', '#4F46E5', '#0284C7', '#F59E0B'];

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        radius: 40 + Math.random() * 260,
        angle: Math.random() * Math.PI * 2,
        speed: (0.01 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : 1),
        radialSpeed: -0.2 - Math.random() * 0.4,
        length: 8 + Math.random() * 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        seed: Math.floor(Math.random() * 100000)
      });
    }
  }

  startAnimations() {
    anime({
      targets: this,
      singularityPulse: [1, 1.35, 1],
      duration: 1600,
      easing: 'easeInOutSine',
      loop: true
    });
  }

  triggerSupernova(cx, cy) {
    SoundFX.playPop(720);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { x: cx / window.innerWidth, y: cy / window.innerHeight }
    });

    this.particles.forEach(p => {
      p.radialSpeed = 6 + Math.random() * 12;
    });

    anime({
      targets: this.particles,
      radialSpeed: -0.3,
      duration: 1800,
      easing: 'easeOutQuad'
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas && this.particles) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';
        const gen = rough.generator();

        const defaultCx = (this.width || 800) / 2;
        const defaultCy = (this.height || 500) / 2;

        const cx = this.mouse.isHover ? this.mouse.x : defaultCx;
        const cy = this.mouse.isHover ? this.mouse.y : defaultCy;

        // 1. Draw Singularity Event Horizon
        const horizonR = 28 * this.singularityPulse;
        const horizon = gen.circle(defaultCx, defaultCy, horizonR * 2, {
          seed: 100 + frameIdx * 30,
          roughness: 2.2,
          bowing: 2.0,
          stroke: ink,
          strokeWidth: 3,
          fill: isDark ? '#000000' : '#1C1917',
          fillStyle: 'solid'
        });
        this.rc.draw(horizon);

        // Accretion Glow Ring
        const accretion = gen.circle(defaultCx, defaultCy, horizonR * 3.5, {
          seed: 200 + frameIdx * 30,
          roughness: 2.5,
          stroke: amber,
          strokeWidth: 2,
          fill: amber,
          fillStyle: 'cross-hatch',
          hachureGap: 8
        });
        this.rc.draw(accretion);

        // 2. Update and Draw Boiling Swarm Particles
        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];

          // Update orbit
          p.angle += p.speed * this.settings.vortexSpeed;
          p.radius += p.radialSpeed * this.settings.vortexSpeed;

          // Respawn if swallowed by black hole
          if (p.radius < 25) {
            p.radius = 220 + Math.random() * 80;
            p.radialSpeed = -0.2 - Math.random() * 0.4;
          } else if (p.radius > 350) {
            p.radialSpeed = -0.5;
          }

          let px = cx + Math.cos(p.angle) * p.radius;
          let py = cy + Math.sin(p.angle) * (p.radius * 0.65); // Elliptical perspective

          // Particle tail endpoint along velocity vector
          const tailAngle = p.angle + Math.PI / 2 * this.settings.swirlIntensity;
          const tx = px - Math.cos(tailAngle) * p.length;
          const ty = py - Math.sin(tailAngle) * p.length;

          const pSeed = p.seed + frameIdx * 20;
          const particleLine = gen.line(tx, ty, px, py, {
            seed: pSeed,
            roughness: this.settings.roughness,
            stroke: p.color,
            strokeWidth: 2.2
          });
          this.rc.draw(particleLine);
        }
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-supernova')?.addEventListener('click', () => {
      const cx = (this.width || 800) / 2;
      const cy = (this.height || 500) / 2;
      this.triggerSupernova(cx, cy);
    });

    const modesGrid = document.getElementById('vortex-modes-grid');
    if (modesGrid) {
      modesGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        modesGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mode = btn.getAttribute('data-mode');
        SoundFX.playPop(520);
      });
    }

    document.getElementById('slider-vortex-speed')?.addEventListener('input', (e) => {
      this.settings.vortexSpeed = parseFloat(e.target.value);
      document.getElementById('val-vortex-speed').textContent = `${this.settings.vortexSpeed.toFixed(1)}x`;
    });

    document.getElementById('slider-vortex-swirl')?.addEventListener('input', (e) => {
      this.settings.swirlIntensity = parseFloat(e.target.value);
      document.getElementById('val-vortex-swirl').textContent = this.settings.swirlIntensity.toFixed(1);
    });

    document.getElementById('slider-vortex-rough')?.addEventListener('input', (e) => {
      this.settings.roughness = parseFloat(e.target.value);
      document.getElementById('val-vortex-rough').textContent = this.settings.roughness.toFixed(1);
    });
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
  }
}
