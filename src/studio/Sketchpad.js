import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilShape, BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class Sketchpad {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.shapes = [];
    this.history = [];
    this.redoStack = [];
    this.renderLoop = null;

    this.activeTool = 'freehand'; // 'freehand' | 'rectangle' | 'circle' | 'line' | 'star'
    this.activeColor = '#1C1917';
    this.activeFill = 'hachure';
    this.activeMotion = 'none'; // 'none' | 'float' | 'pulse' | 'wobble' | 'bounce' | 'spin'

    this.settings = {
      roughness: 1.8,
      bowing: 1.5,
      strokeWidth: 2.5,
      boilFps: options.boilFps || 10
    };

    this.isDrawing = false;
    this.currentPoints = [];
    this.startPoint = null;

    this.initDOM();
    this.setupCanvas();
    this.addDefaultSketches();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="tool-palette" id="sketchpad-tools">
              <button class="tool-btn active" data-tool="freehand" title="Freehand Pen (Draw anything!)">✏️</button>
              <button class="tool-btn" data-tool="rectangle" title="Rough Rectangle">⬛</button>
              <button class="tool-btn" data-tool="circle" title="Rough Circle">⚪</button>
              <button class="tool-btn" data-tool="line" title="Rough Line">📏</button>
              <button class="tool-btn" data-tool="star" title="Rough 5-Point Star">⭐</button>
            </div>

            <!-- Color Swatches -->
            <div class="color-swatches" id="sketchpad-colors">
              <button class="swatch-btn active" data-color="#1C1917" style="background: #1C1917;" title="Ink Black"></button>
              <button class="swatch-btn" data-color="#D97706" style="background: #D97706;" title="Amber Ochre"></button>
              <button class="swatch-btn" data-color="#059669" style="background: #059669;" title="Sage Green"></button>
              <button class="swatch-btn" data-color="#DC2626" style="background: #DC2626;" title="Terracotta Red"></button>
              <button class="swatch-btn" data-color="#4F46E5" style="background: #4F46E5;" title="Indigo Blue"></button>
              <button class="swatch-btn" data-color="#0284C7" style="background: #0284C7;" title="Sky Blue"></button>
            </div>

            <div class="toolbar-actions">
              <button id="btn-sketch-undo" class="tactile-btn outline" title="Undo stroke">
                <span>↩️ Undo</span>
              </button>
              <button id="btn-sketch-clear" class="tactile-btn outline" title="Clear canvas">
                <span>🗑️ Clear</span>
              </button>
              <button id="btn-sketch-export" class="tactile-btn primary" title="Export as high-res PNG">
                <span>📸 Snapshot</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="sketch-canvas-wrap">
            <canvas id="sketch-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">✨ Anime.js Motion Presets</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">Apply kinetic motion directly to your hand-drawn boiling shapes:</p>
            <div class="style-pills-grid" id="motion-presets-grid">
              <button class="style-pill-btn active" data-motion="none">Static Boil</button>
              <button class="style-pill-btn" data-motion="float">Float & Sway</button>
              <button class="style-pill-btn" data-motion="pulse">Heartbeat</button>
              <button class="style-pill-btn" data-motion="wobble">Jiggle</button>
              <button class="style-pill-btn" data-motion="bounce">Elastic Bounce</button>
              <button class="style-pill-btn" data-motion="spin">Slow Orbit</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎨 Pattern Fill</span>
            </div>
            <div class="style-pills-grid" id="sketch-fill-grid">
              <button class="style-pill-btn active" data-fill="hachure">Hachure</button>
              <button class="style-pill-btn" data-fill="cross-hatch">Cross-Hatch</button>
              <button class="style-pill-btn" data-fill="dots">Dots</button>
              <button class="style-pill-btn" data-fill="zigzag">Zigzag</button>
              <button class="style-pill-btn" data-fill="solid">Solid Wash</button>
              <button class="style-pill-btn" data-fill="none">Outline Only</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">📐 Geometry Tuning</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-sketch-roughness" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-sketch-roughness" min="0.2" max="4.5" step="0.1" value="1.8" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Bowing (Wobble):</span>
                <span id="val-sketch-bowing" class="control-val">1.5</span>
              </div>
              <input type="range" id="slider-sketch-bowing" min="0" max="6.0" step="0.5" value="1.5" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Stroke Weight:</span>
                <span id="val-sketch-stroke" class="control-val">2.5px</span>
              </div>
              <input type="range" id="slider-sketch-stroke" min="1" max="8" step="0.5" value="2.5" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('sketch-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('sketch-canvas-wrap');
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
    this.setupDrawingEvents();
  }

  addDefaultSketches() {
    const w = this.width || 800;
    const h = this.height || 500;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';

    // Add a welcome smiling coffee mug & star banner
    const mugX = w * 0.35;
    const mugY = h * 0.45;

    const mugBody = new BoilShape('rectangle', [mugX - 40, mugY - 40, 80, 80], {
      roughness: 1.8,
      bowing: 1.5,
      stroke: ink,
      strokeWidth: 2.5,
      fill: '#D97706',
      fillStyle: 'hachure',
      hachureAngle: 60,
      frameCount: 4,
      boilFps: this.settings.boilFps
    }, this.engine);

    const mugHandle = new BoilShape('arc', [mugX + 40, mugY, 40, 50, -Math.PI / 2, Math.PI / 2, false], {
      roughness: 1.8,
      bowing: 1.5,
      stroke: ink,
      strokeWidth: 3,
      frameCount: 4,
      boilFps: this.settings.boilFps
    }, this.engine);

    const steam1 = new BoilShape('curve', [[
      [mugX - 15, mugY - 50],
      [mugX - 25, mugY - 70],
      [mugX - 15, mugY - 90]
    ]], {
      roughness: 2,
      bowing: 2,
      stroke: isDark ? '#9CA3AF' : '#6B6357',
      strokeWidth: 2,
      frameCount: 4,
      boilFps: this.settings.boilFps
    }, this.engine);

    const steam2 = new BoilShape('curve', [[
      [mugX + 15, mugY - 50],
      [mugX + 25, mugY - 70],
      [mugX + 15, mugY - 90]
    ]], {
      roughness: 2,
      bowing: 2,
      stroke: isDark ? '#9CA3AF' : '#6B6357',
      strokeWidth: 2,
      frameCount: 4,
      boilFps: this.settings.boilFps
    }, this.engine);

    // Star beside it
    const star = this.createStarShape(w * 0.65, h * 0.45, 55, 25, {
      roughness: 2.0,
      bowing: 1.5,
      stroke: ink,
      strokeWidth: 2.5,
      fill: '#059669',
      fillStyle: 'cross-hatch',
      frameCount: 4,
      boilFps: this.settings.boilFps
    });

    this.shapes.push(mugBody, mugHandle, steam1, steam2, star);
  }

  createStarShape(cx, cy, outerR, innerR, roughOpts) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    return new BoilShape('polygon', [points], roughOpts, this.engine);
  }

  setupDrawingEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      const pos = getPos(e);
      this.startPoint = pos;
      this.currentPoints = [[pos.x, pos.y]];
      SoundFX.playScratch();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;
      const pos = getPos(e);

      if (this.activeTool === 'freehand') {
        const last = this.currentPoints[this.currentPoints.length - 1];
        const dist = Math.hypot(pos.x - last[0], pos.y - last[1]);
        if (dist > 4) {
          this.currentPoints.push([pos.x, pos.y]);
        }
      } else {
        this.currentPoints = [[this.startPoint.x, this.startPoint.y], [pos.x, pos.y]];
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      const pos = getPos(e);
      this.commitShape(pos);
      this.currentPoints = [];
      this.startPoint = null;
    });
  }

  commitShape(endPos) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const strokeColor = this.activeColor === '#1C1917' && isDark ? '#F3F4F6' : this.activeColor;

    const roughOpts = {
      roughness: this.settings.roughness,
      bowing: this.settings.bowing,
      stroke: strokeColor,
      strokeWidth: this.settings.strokeWidth,
      fill: this.activeFill !== 'none' ? this.activeColor : undefined,
      fillStyle: this.activeFill !== 'none' ? this.activeFill : 'hachure',
      hachureAngle: 60,
      fillWeight: 1.8,
      frameCount: 4,
      boilFps: this.settings.boilFps
    };

    let shape = null;

    if (this.activeTool === 'freehand') {
      if (this.currentPoints.length < 2) return;
      shape = new BoilShape('curve', [this.currentPoints], roughOpts, this.engine);
    } else if (this.activeTool === 'rectangle') {
      const minX = Math.min(this.startPoint.x, endPos.x);
      const minY = Math.min(this.startPoint.y, endPos.y);
      const w = Math.abs(endPos.x - this.startPoint.x);
      const h = Math.abs(endPos.y - this.startPoint.y);
      if (w < 5 || h < 5) return;
      shape = new BoilShape('rectangle', [minX, minY, w, h], roughOpts, this.engine);
    } else if (this.activeTool === 'circle') {
      const dx = endPos.x - this.startPoint.x;
      const dy = endPos.y - this.startPoint.y;
      const r = Math.hypot(dx, dy) * 2;
      if (r < 8) return;
      shape = new BoilShape('circle', [this.startPoint.x, this.startPoint.y, r], roughOpts, this.engine);
    } else if (this.activeTool === 'line') {
      shape = new BoilShape('line', [this.startPoint.x, this.startPoint.y, endPos.x, endPos.y], roughOpts, this.engine);
    } else if (this.activeTool === 'star') {
      const dx = endPos.x - this.startPoint.x;
      const dy = endPos.y - this.startPoint.y;
      const outerR = Math.hypot(dx, dy);
      if (outerR < 8) return;
      shape = this.createStarShape(this.startPoint.x, this.startPoint.y, outerR, outerR * 0.45, roughOpts);
    }

    if (shape) {
      this.shapes.push(shape);
      this.history.push(shape);
      this.applyMotionToShape(shape);
      SoundFX.playPop(520);
    }
  }

  applyMotionToShape(shape) {
    if (this.activeMotion === 'float') {
      const originY = shape.y;
      anime({
        targets: shape,
        y: originY - 14,
        rotation: [-3, 3],
        duration: 2200 + Math.random() * 800,
        direction: 'alternate',
        easing: 'easeInOutSine',
        loop: true
      });
    } else if (this.activeMotion === 'pulse') {
      anime({
        targets: shape,
        scaleX: [1, 1.15],
        scaleY: [1, 1.15],
        duration: 900,
        direction: 'alternate',
        easing: 'easeInOutSine',
        loop: true
      });
    } else if (this.activeMotion === 'wobble') {
      anime({
        targets: shape,
        rotation: [-6, 6],
        scaleX: [1, 1.08, 0.94, 1],
        scaleY: [1, 0.94, 1.08, 1],
        duration: 1400,
        direction: 'alternate',
        easing: 'easeInOutSine',
        loop: true
      });
    } else if (this.activeMotion === 'bounce') {
      const initialY = shape.y;
      anime.timeline({ loop: true })
        .add({
          targets: shape,
          y: initialY - 30,
          duration: 400,
          easing: 'easeOutQuad'
        })
        .add({
          targets: shape,
          y: initialY,
          scaleY: [1, 0.7, 1],
          duration: 400,
          easing: 'easeInQuad'
        });
    } else if (this.activeMotion === 'spin') {
      anime({
        targets: shape,
        rotation: 360,
        duration: 8000,
        easing: 'linear',
        loop: true
      });
    }
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw grid lines
        this.drawGrid();

        // Render boiling shapes
        for (const shape of this.shapes) {
          shape.render(this.ctx, this.rc, timestamp);
        }

        // Draw live preview if currently drawing
        if (this.isDrawing && this.currentPoints.length > 1) {
          this.drawLivePreview();
        }
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  drawGrid() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.ctx.save();
    this.ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const spacing = 28;
    for (let x = spacing; x < this.width; x += spacing) {
      for (let y = spacing; y < this.height; y += spacing) {
        this.ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
    this.ctx.restore();
  }

  drawLivePreview() {
    this.ctx.save();
    this.ctx.strokeStyle = this.activeColor;
    this.ctx.lineWidth = this.settings.strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.setLineDash([4, 4]);

    if (this.activeTool === 'freehand') {
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentPoints[0][0], this.currentPoints[0][1]);
      for (let i = 1; i < this.currentPoints.length; i++) {
        this.ctx.lineTo(this.currentPoints[i][0], this.currentPoints[i][1]);
      }
      this.ctx.stroke();
    } else if (this.activeTool === 'rectangle' && this.startPoint) {
      const p2 = this.currentPoints[1];
      this.ctx.strokeRect(
        Math.min(this.startPoint.x, p2[0]),
        Math.min(this.startPoint.y, p2[1]),
        Math.abs(p2[0] - this.startPoint.x),
        Math.abs(p2[1] - this.startPoint.y)
      );
    } else if (this.activeTool === 'circle' && this.startPoint) {
      const p2 = this.currentPoints[1];
      const r = Math.hypot(p2[0] - this.startPoint.x, p2[1] - this.startPoint.y);
      this.ctx.beginPath();
      this.ctx.arc(this.startPoint.x, this.startPoint.y, r, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (this.activeTool === 'line' && this.startPoint) {
      const p2 = this.currentPoints[1];
      this.ctx.beginPath();
      this.ctx.moveTo(this.startPoint.x, this.startPoint.y);
      this.ctx.lineTo(p2[0], p2[1]);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  setBoilFps(fps) {
    this.settings.boilFps = fps;
    this.shapes.forEach(s => s.updateOptions({ boilFps: fps }));
  }

  undo() {
    if (this.shapes.length > 0) {
      const removed = this.shapes.pop();
      this.redoStack.push(removed);
      SoundFX.playPop(380);
    }
  }

  clear() {
    this.shapes = [];
    SoundFX.playPop(300);
  }

  exportSnapshot() {
    SoundFX.playPop(650);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });

    const link = document.createElement('a');
    link.download = `rough-boil-sketch-${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  bindEvents() {
    // Tool buttons
    const toolGroup = document.getElementById('sketchpad-tools');
    if (toolGroup) {
      toolGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.tool-btn');
        if (!btn) return;
        toolGroup.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTool = btn.getAttribute('data-tool');
        SoundFX.playPop(450);
      });
    }

    // Color Swatches
    const colorGroup = document.getElementById('sketchpad-colors');
    if (colorGroup) {
      colorGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch-btn');
        if (!btn) return;
        colorGroup.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeColor = btn.getAttribute('data-color');
        SoundFX.playPop(520);
      });
    }

    // Motion Presets
    const motionGroup = document.getElementById('motion-presets-grid');
    if (motionGroup) {
      motionGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        motionGroup.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeMotion = btn.getAttribute('data-motion');
        this.shapes.forEach(s => this.applyMotionToShape(s));
        SoundFX.playPop(580);
      });
    }

    // Fill Style Grid
    const fillGroup = document.getElementById('sketch-fill-grid');
    if (fillGroup) {
      fillGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        fillGroup.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFill = btn.getAttribute('data-fill');
        SoundFX.playPop(500);
      });
    }

    // Sliders
    document.getElementById('slider-sketch-roughness')?.addEventListener('input', (e) => {
      this.settings.roughness = parseFloat(e.target.value);
      document.getElementById('val-sketch-roughness').textContent = this.settings.roughness.toFixed(1);
      this.shapes.forEach(s => s.updateOptions({ roughness: this.settings.roughness }));
    });

    document.getElementById('slider-sketch-bowing')?.addEventListener('input', (e) => {
      this.settings.bowing = parseFloat(e.target.value);
      document.getElementById('val-sketch-bowing').textContent = this.settings.bowing.toFixed(1);
      this.shapes.forEach(s => s.updateOptions({ bowing: this.settings.bowing }));
    });

    document.getElementById('slider-sketch-stroke')?.addEventListener('input', (e) => {
      this.settings.strokeWidth = parseFloat(e.target.value);
      document.getElementById('val-sketch-stroke').textContent = `${this.settings.strokeWidth.toFixed(1)}px`;
      this.shapes.forEach(s => s.updateOptions({ strokeWidth: this.settings.strokeWidth }));
    });

    // Action buttons
    document.getElementById('btn-sketch-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-sketch-clear')?.addEventListener('click', () => this.clear());
    document.getElementById('btn-sketch-export')?.addEventListener('click', () => this.exportSnapshot());
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
  }
}
