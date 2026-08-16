import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class MorphScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;
    this.morphTimeline = null;

    this.currentShapeIdx = 0;
    this.targetShapeIdx = 1;
    this.morphT = 0; // 0 to 1 between current and target
    this.isAutoMorphing = true;

    this.settings = {
      speed: 1,
      roughness: 1.8,
      bowing: 1.5,
      fillStyle: 'hachure',
      color: '#D97706'
    };

    this.pointCount = 48; // Normalized vertices for smooth morphing
    this.initDOM();
    this.setupCanvas();
    this.buildMorphShapes();
    this.startAutoMorph();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Metamorphic Path Morphing Portal</span>
              <span class="toolbar-badge">Continuous Vector Morph + Line Boil</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-morph-toggle" class="tactile-btn amber">
                <span id="morph-play-icon">⏸️</span>
                <span id="morph-play-text">Pause Morph</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="morph-canvas-wrap">
            <canvas id="morph-stage-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🔮 Morph Targets</span>
            </div>
            <div class="style-pills-grid" id="morph-targets-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-idx="0">❤️ Heart</button>
              <button class="style-pill-btn" data-idx="1">💀 Skull</button>
              <button class="style-pill-btn" data-idx="2">💡 Lightbulb</button>
              <button class="style-pill-btn" data-idx="3">🚀 Rocket</button>
              <button class="style-pill-btn" data-idx="4">💎 Diamond</button>
              <button class="style-pill-btn" data-idx="5">🕊️ Origami Bird</button>
              <button class="style-pill-btn" data-idx="6">☕ Coffee Mug</button>
              <button class="style-pill-btn" data-idx="7">♾️ Infinity</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⏱️ Morph Dynamics</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Transition Speed:</span>
                <span id="val-morph-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-morph-speed" min="0.3" max="2.5" step="0.1" value="1" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Interpolation Progress:</span>
                <span id="val-morph-progress" class="control-val">0%</span>
              </div>
              <input type="range" id="slider-morph-progress" min="0" max="100" value="0" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎨 Hatching Pattern</span>
            </div>
            <div class="style-pills-grid" id="morph-fill-grid">
              <button class="style-pill-btn active" data-fill="hachure">Hachure</button>
              <button class="style-pill-btn" data-fill="cross-hatch">Cross-Hatch</button>
              <button class="style-pill-btn" data-fill="dots">Dots</button>
              <button class="style-pill-btn" data-fill="zigzag">Zigzag</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('morph-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('morph-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? rect.width : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? rect.height : 0, wrap ? wrap.clientHeight : 0, 500);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.buildMorphShapes();
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
  }

  buildMorphShapes() {
    const w = this.width || 800;
    const h = this.height || 500;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.28;
    const N = this.pointCount;

    // Helper to sample parametric curves uniformly into N points
    const makePts = (fn) => {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        const [x, y] = fn(t);
        pts.push([cx + x * scale, cy + y * scale]);
      }
      return pts;
    };

    this.shapePresets = [
      // 0. Heart
      makePts(t => {
        const x = 16 * Math.pow(Math.sin(t), 3) / 16;
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) / 16;
        return [x * 0.9, y * 0.9 - 0.1];
      }),

      // 1. Skull
      makePts(t => {
        const r = 0.8 + 0.2 * Math.cos(t) - 0.1 * Math.cos(3*t);
        const x = Math.sin(t) * r * (t > Math.PI * 0.5 && t < Math.PI * 1.5 ? 0.75 : 1);
        const y = -Math.cos(t) * r;
        return [x, y];
      }),

      // 2. Lightbulb
      makePts(t => {
        let r = 0.85;
        let yOffset = 0;
        if (t > Math.PI * 0.6 && t < Math.PI * 1.4) {
          r = 0.45;
          yOffset = 0.4;
        }
        return [Math.sin(t) * r, -Math.cos(t) * r + yOffset];
      }),

      // 3. Rocket
      makePts(t => {
        const x = Math.sin(t) * (0.4 + 0.3 * Math.cos(t * 2));
        const y = -Math.cos(t) * 1.1;
        return [x, y];
      }),

      // 4. Diamond Gem
      makePts(t => {
        const cos = Math.cos(t);
        const sin = Math.sin(t);
        const x = Math.sign(cos) * Math.pow(Math.abs(cos), 0.5) * 0.9;
        const y = Math.sign(sin) * Math.pow(Math.abs(sin), 0.5) * 0.9;
        return [x, y];
      }),

      // 5. Origami Bird
      makePts(t => {
        const x = Math.cos(t) * (0.8 + 0.4 * Math.sin(t * 3));
        const y = Math.sin(t) * 0.5 - Math.cos(t * 2) * 0.3;
        return [x, y];
      }),

      // 6. Coffee Mug
      makePts(t => {
        const x = Math.sign(Math.cos(t)) * 0.7 + (t > Math.PI * 1.2 && t < Math.PI * 1.8 ? 0.3 : 0);
        const y = Math.sin(t) * 0.7;
        return [x, y];
      }),

      // 7. Infinity Loop
      makePts(t => {
        const x = (Math.cos(t) / (1 + Math.pow(Math.sin(t), 2))) * 1.3;
        const y = (Math.sin(t) * Math.cos(t) / (1 + Math.pow(Math.sin(t), 2))) * 1.3;
        return [x, y];
      })
    ];
  }

  startAutoMorph() {
    if (this.morphTimeline) this.morphTimeline.pause();

    this.morphTimeline = anime({
      targets: this,
      morphT: [0, 1],
      duration: 2000 / this.settings.speed,
      easing: 'easeInOutCubic',
      complete: () => {
        SoundFX.playPop(550);
        confetti({
          particleCount: 15,
          spread: 40,
          origin: { x: 0.5, y: 0.5 }
        });

        this.currentShapeIdx = this.targetShapeIdx;
        this.targetShapeIdx = (this.targetShapeIdx + 1) % this.shapePresets.length;
        this.morphT = 0;

        this.updateActivePill(this.currentShapeIdx);

        if (this.isAutoMorphing) {
          setTimeout(() => this.startAutoMorph(), 400);
        }
      }
    });
  }

  morphToTarget(idx) {
    if (this.morphTimeline) this.morphTimeline.pause();
    this.targetShapeIdx = idx;
    this.morphT = 0;
    SoundFX.playPop(600);

    this.morphTimeline = anime({
      targets: this,
      morphT: [0, 1],
      duration: 1200 / this.settings.speed,
      easing: 'easeInOutCubic',
      complete: () => {
        this.currentShapeIdx = idx;
        this.targetShapeIdx = (idx + 1) % this.shapePresets.length;
        this.morphT = 0;
        this.updateActivePill(this.currentShapeIdx);
      }
    });
  }

  updateActivePill(idx) {
    const grid = document.getElementById('morph-targets-grid');
    if (!grid) return;
    grid.querySelectorAll('.style-pill-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.getAttribute('data-idx')) === idx);
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas && this.shapePresets) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';

        // Draw background concentric aura circles
        this.drawAura(timestamp, frameIdx, isDark);

        // Interpolate vertices between current and target shape
        const fromPts = this.shapePresets[this.currentShapeIdx];
        const toPts = this.shapePresets[this.targetShapeIdx];

        const morphedPts = [];
        for (let i = 0; i < this.pointCount; i++) {
          const p1 = fromPts[i];
          const p2 = toPts[i];
          const x = p1[0] + (p2[0] - p1[0]) * this.morphT;
          const y = p1[1] + (p2[1] - p1[1]) * this.morphT;
          morphedPts.push([x, y]);
        }

        // Render Morphing Boiling Polygon
        const gen = rough.generator();
        const seed = 9000 + frameIdx * 37;

        const morphedShape = gen.polygon(morphedPts, {
          seed,
          roughness: this.settings.roughness,
          bowing: this.settings.bowing,
          stroke: ink,
          strokeWidth: 3,
          fill: amber,
          fillStyle: this.settings.fillStyle,
          hachureAngle: 45 + this.morphT * 90,
          fillWeight: 2
        });

        this.rc.draw(morphedShape);
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  drawAura(timestamp, frameIdx, isDark) {
    const cx = (this.width || 800) / 2;
    const cy = (this.height || 500) / 2;
    const gen = rough.generator();

    const ringCount = 3;
    for (let r = 1; r <= ringCount; r++) {
      const radius = 120 + r * 50 + Math.sin(timestamp * 0.002 + r) * 10;
      const ring = gen.circle(cx, cy, radius * 2, {
        seed: 10000 + r * 100 + frameIdx * 20,
        roughness: 1.5,
        bowing: 1.2,
        stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        strokeWidth: 1.5,
        fill: 'transparent'
      });
      this.rc.draw(ring);
    }
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    // Play / Pause Toggle
    document.getElementById('btn-morph-toggle')?.addEventListener('click', () => {
      this.isAutoMorphing = !this.isAutoMorphing;
      const icon = document.getElementById('morph-play-icon');
      const text = document.getElementById('morph-play-text');
      if (this.isAutoMorphing) {
        if (icon) icon.textContent = '⏸️';
        if (text) text.textContent = 'Pause Morph';
        this.startAutoMorph();
      } else {
        if (this.morphTimeline) this.morphTimeline.pause();
        if (icon) icon.textContent = '▶️';
        if (text) text.textContent = 'Resume Morph';
      }
      SoundFX.playPop(520);
    });

    // Targets Grid
    const targetGrid = document.getElementById('morph-targets-grid');
    if (targetGrid) {
      targetGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        targetGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.morphToTarget(idx);
      });
    }

    // Fill Grid
    const fillGrid = document.getElementById('morph-fill-grid');
    if (fillGrid) {
      fillGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        fillGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.settings.fillStyle = btn.getAttribute('data-fill');
        SoundFX.playPop(490);
      });
    }

    // Sliders
    document.getElementById('slider-morph-speed')?.addEventListener('input', (e) => {
      this.settings.speed = parseFloat(e.target.value);
      document.getElementById('val-morph-speed').textContent = `${this.settings.speed.toFixed(1)}x`;
    });

    document.getElementById('slider-morph-progress')?.addEventListener('input', (e) => {
      if (this.morphTimeline) this.morphTimeline.pause();
      this.isAutoMorphing = false;
      this.morphT = parseInt(e.target.value) / 100;
      document.getElementById('val-morph-progress').textContent = `${Math.round(this.morphT * 100)}%`;
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
    if (this.morphTimeline) this.morphTimeline.pause();
  }
}
