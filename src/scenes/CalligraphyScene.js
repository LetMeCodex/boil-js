import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class CalligraphyScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;
    this.animation = null;

    this.state = {
      text: 'Handcrafted Motion',
      progress: 1, // 0 to 1
      speed: 1,
      roughness: 1.8,
      bowing: 1.5,
      strokeWidth: 3.5,
      color: '#D97706'
    };

    // Pre-defined SVG path data for calligraphic flourishes
    this.presets = {
      'Handcrafted Motion': [
        // H
        'M 60 120 C 60 80, 50 40, 50 30 M 50 75 C 70 75, 80 75, 100 75 M 100 30 C 100 60, 100 90, 100 120',
        // a
        'M 125 90 C 115 80, 115 110, 125 115 C 135 115, 138 100, 138 85 M 138 85 L 138 120',
        // n
        'M 155 85 L 155 120 M 155 95 C 165 80, 175 80, 180 95 L 180 120',
        // d
        'M 205 90 C 195 80, 195 110, 205 115 C 215 115, 218 100, 218 85 M 218 40 L 218 120',
        // c
        'M 245 90 C 235 85, 230 115, 245 118',
        // r
        'M 260 85 L 260 120 M 260 95 C 265 85, 275 85, 280 90',
        // a
        'M 300 90 C 290 80, 290 110, 300 115 C 310 115, 313 100, 313 85 M 313 85 L 313 120',
        // f
        'M 335 30 C 330 30, 325 35, 325 50 L 325 120 M 318 65 L 335 65',
        // t
        'M 350 45 L 350 120 M 342 65 L 358 65',
        // Flourish underline
        'M 40 145 C 160 165, 320 135, 480 150 C 520 155, 550 140, 560 130 C 570 120, 560 110, 545 115 C 530 120, 540 135, 565 140'
      ],
      'Boiling Magic': [
        // B
        'M 60 30 L 60 120 M 60 30 C 90 30, 95 65, 60 70 M 60 70 C 95 75, 100 120, 60 120',
        // o
        'M 120 85 C 105 85, 105 115, 120 115 C 135 115, 135 85, 120 85',
        // i
        'M 150 85 L 150 120 M 150 68 L 150 72',
        // l
        'M 170 30 L 170 120',
        // i
        'M 190 85 L 190 120 M 190 68 L 190 72',
        // n
        'M 210 85 L 210 120 M 210 95 C 220 80, 230 80, 235 95 L 235 120',
        // g
        'M 260 90 C 250 80, 250 110, 260 115 C 270 115, 273 100, 273 85 M 273 85 L 273 135 C 273 150, 255 150, 245 140',
        // Flourish Ribbon
        'M 50 160 C 180 140, 320 180, 460 150 C 500 140, 540 160, 560 150'
      ]
    };

    this.activePresetKey = 'Handcrafted Motion';
    this.initDOM();
    this.setupCanvas();
    this.buildPaths();
    this.playWriteOn();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Dynamic Calligraphy & Path Write-On</span>
              <span class="toolbar-badge">Anime.js Stroke Interpolation</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-replay-write" class="tactile-btn amber">
                <span>🔄 Replay Write-On</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="callig-canvas-wrap">
            <canvas id="callig-stage-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">✒️ Phrases & Scripts</span>
            </div>
            <div class="style-pills-grid" style="grid-template-columns: 1fr;">
              <button class="style-pill-btn active" data-preset="Handcrafted Motion">"Handcrafted Motion"</button>
              <button class="style-pill-btn" data-preset="Boiling Magic">"Boiling Magic"</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⏱️ Scrub & Timeline</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Write-On Progress:</span>
                <span id="val-callig-progress" class="control-val">100%</span>
              </div>
              <input type="range" id="slider-callig-progress" min="0" max="100" value="100" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Drawing Speed:</span>
                <span id="val-callig-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-callig-speed" min="0.3" max="2.5" step="0.1" value="1" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎨 Ink & Stroke</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Stroke Width:</span>
                <span id="val-callig-width" class="control-val">3.5px</span>
              </div>
              <input type="range" id="slider-callig-width" min="1.5" max="7" step="0.5" value="3.5" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-callig-rough" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-callig-rough" min="0.5" max="4.0" step="0.2" value="1.8" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('callig-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('callig-canvas-wrap');
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
      this.buildPaths();
    };

    window.addEventListener('resize', resize);
    resize();
  }

  buildPaths() {
    const rawPaths = this.presets[this.activePresetKey] || this.presets['Handcrafted Motion'];
    const gen = rough.generator();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F59E0B' : '#D97706';

    const w = this.width || 800;
    const h = this.height || 500;
    const offsetX = (w - 600) / 2;
    const offsetY = (h - 200) / 2;

    // Convert SVG path strings into sampled points for progressive drawing
    this.pathSegments = rawPaths.map(d => {
      // Create offscreen SVG path to sample length
      const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svgPath.setAttribute('d', d);
      const totalLen = svgPath.getTotalLength();

      const numSamples = Math.max(12, Math.floor(totalLen / 6));
      const points = [];
      for (let i = 0; i <= numSamples; i++) {
        const pt = svgPath.getPointAtLength((i / numSamples) * totalLen);
        points.push([pt.x + offsetX, pt.y + offsetY]);
      }
      return { totalLen, points, d };
    });

    this.totalStrokes = this.pathSegments.length;
  }

  playWriteOn() {
    if (this.animation) this.animation.pause();

    this.state.progress = 0;
    const duration = (2600 / this.state.speed);

    this.animation = anime({
      targets: this.state,
      progress: 1,
      duration: duration,
      easing: 'easeInOutQuad',
      update: () => {
        const slider = document.getElementById('slider-callig-progress');
        const val = document.getElementById('val-callig-progress');
        if (slider) slider.value = Math.round(this.state.progress * 100);
        if (val) val.textContent = `${Math.round(this.state.progress * 100)}%`;
      },
      complete: () => {
        SoundFX.playPop(600);
        confetti({ particleCount: 35, spread: 60 });
      }
    });

    SoundFX.playScratch();
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas && this.pathSegments) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F59E0B' : '#D97706';

        // Draw vintage lined paper guidelines
        this.drawPaperGuidelines();

        // Progressive reveal of strokes
        const activeStrokesCount = this.state.progress * this.totalStrokes;
        const fullStrokes = Math.floor(activeStrokesCount);
        const partialFraction = activeStrokesCount - fullStrokes;

        const gen = rough.generator();

        for (let i = 0; i < this.totalStrokes; i++) {
          const seg = this.pathSegments[i];
          let pts = [];

          if (i < fullStrokes) {
            pts = seg.points;
          } else if (i === fullStrokes && partialFraction > 0.05) {
            const count = Math.max(2, Math.floor(seg.points.length * partialFraction));
            pts = seg.points.slice(0, count);
          }

          if (pts.length >= 2) {
            const seed = 8000 + i * 200 + frameIdx * 37;
            const roughDrawable = gen.curve(pts, {
              seed,
              roughness: this.state.roughness,
              bowing: this.state.bowing,
              stroke: ink,
              strokeWidth: this.state.strokeWidth
            });
            this.rc.draw(roughDrawable);
          }
        }
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  drawPaperGuidelines() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.ctx.save();
    this.ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    this.ctx.lineWidth = 1;

    const w = this.width || 800;
    const h = this.height || 500;
    const offsetY = (h - 200) / 2;

    // Baseline and headline
    this.ctx.beginPath();
    this.ctx.moveTo(40, offsetY + 30);
    this.ctx.lineTo(w - 40, offsetY + 30);
    this.ctx.moveTo(40, offsetY + 120);
    this.ctx.lineTo(w - 40, offsetY + 120);
    this.ctx.stroke();

    // Midline dashed
    this.ctx.setLineDash([6, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(40, offsetY + 75);
    this.ctx.lineTo(w - 40, offsetY + 75);
    this.ctx.stroke();

    this.ctx.restore();
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-replay-write')?.addEventListener('click', () => this.playWriteOn());

    // Presets
    document.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-preset]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePresetKey = btn.getAttribute('data-preset');
        this.buildPaths();
        this.playWriteOn();
      });
    });

    // Scrub slider
    document.getElementById('slider-callig-progress')?.addEventListener('input', (e) => {
      if (this.animation) this.animation.pause();
      this.state.progress = parseInt(e.target.value) / 100;
      document.getElementById('val-callig-progress').textContent = `${Math.round(this.state.progress * 100)}%`;
    });

    // Speed slider
    document.getElementById('slider-callig-speed')?.addEventListener('input', (e) => {
      this.state.speed = parseFloat(e.target.value);
      document.getElementById('val-callig-speed').textContent = `${this.state.speed.toFixed(1)}x`;
    });

    // Stroke width slider
    document.getElementById('slider-callig-width')?.addEventListener('input', (e) => {
      this.state.strokeWidth = parseFloat(e.target.value);
      document.getElementById('val-callig-width').textContent = `${this.state.strokeWidth.toFixed(1)}px`;
    });

    // Roughness slider
    document.getElementById('slider-callig-rough')?.addEventListener('input', (e) => {
      this.state.roughness = parseFloat(e.target.value);
      document.getElementById('val-callig-rough').textContent = this.state.roughness.toFixed(1);
    });
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    if (this.animation) this.animation.pause();
  }
}
