import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class CodeExporter {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.activeSnippet = 'canvas'; // 'canvas' | 'svg' | 'class'

    this.snippets = {
      canvas: `// ==========================================================
// 1. High-Performance Canvas Line Boil with Rough.js & Anime.js
// ==========================================================
import rough from 'roughjs';
import anime from 'animejs';

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const rc = rough.canvas(canvas);
const gen = rough.generator();

// Pre-buffer 4 distinct rough geometry frames (seed-cycling)
const frameCount = 4;
const boilFps = 10; // 10 FPS authentic hand-drawn cadence
const baseSeed = 1001;

const roughFrames = Array.from({ length: frameCount }, (_, i) => {
  return gen.rectangle(0, 0, 120, 120, {
    seed: baseSeed + i * 137,
    roughness: 1.8,
    bowing: 1.5,
    stroke: '#1C1917',
    strokeWidth: 2.5,
    fill: '#D97706',
    fillStyle: 'hachure'
  });
});

// Kinetic State (Smooth 60 FPS transform object driven by Anime.js)
const shapeState = {
  x: 200,
  y: 150,
  scale: 1,
  rotation: 0
};

// Anime.js Elastic Bounce & Rotation Loop
anime({
  targets: shapeState,
  rotation: 360,
  scale: [1, 1.25, 1],
  duration: 3000,
  easing: 'easeInOutSine',
  loop: true
});

// 60 FPS Render Loop (Zero CPU re-tessellation)
function render(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(shapeState.x, shapeState.y);
  ctx.rotate((shapeState.rotation * Math.PI) / 180);
  ctx.scale(shapeState.scale, shapeState.scale);
  ctx.translate(-60, -60); // Center origin

  // Select active boiling frame at 10 FPS cadence
  const frameIndex = Math.floor((timestamp * boilFps) / 1000) % frameCount;
  rc.draw(roughFrames[frameIndex]);

  ctx.restore();
  requestAnimationFrame(render);
}
requestAnimationFrame(render);`,

      svg: `// ==========================================================
// 2. SVG Line Boil with Progressive Anime.js Stroke Drawing
// ==========================================================
import rough from 'roughjs';
import anime from 'animejs';

const svgRoot = document.getElementById('mySvg');
const rcSvg = rough.svg(svgRoot);

// Generate 4 rough SVG paths
const svgFrames = [1, 2, 3, 4].map(i => {
  const node = rcSvg.path('M 50 150 C 150 50, 300 250, 450 150', {
    seed: 500 + i * 100,
    roughness: 2.0,
    stroke: '#DC2626',
    strokeWidth: 3.5
  });
  node.style.display = 'none';
  svgRoot.appendChild(node);
  return node;
});

// Stroke Dash Animation via Anime.js
anime({
  targets: '#mySvg path',
  strokeDashoffset: [anime.setDashoffset, 0],
  duration: 2000,
  easing: 'easeInOutQuad',
  direction: 'alternate',
  loop: true
});

// Cycle visibility of pre-buffered SVG layers
let currentIdx = 0;
setInterval(() => {
  svgFrames[currentIdx].style.display = 'none';
  currentIdx = (currentIdx + 1) % svgFrames.length;
  svgFrames[currentIdx].style.display = 'block';
}, 1000 / 10); // 10 FPS boil rate`,

      class: `// ==========================================================
// 3. Drop-in Reusable BoilShape Class for Any Project
// ==========================================================
import rough from 'roughjs';
import anime from 'animejs';

export class BoilShape {
  constructor(type, args, roughOptions = {}) {
    this.type = type;
    this.args = args;
    this.roughOptions = roughOptions;
    this.frameCount = roughOptions.frameCount || 4;
    this.boilFps = roughOptions.boilFps || 10;

    this.x = 0;
    this.y = 0;
    this.scale = 1;
    this.rotation = 0;

    this.generator = rough.generator();
    this.rebuild();
  }

  rebuild() {
    const baseSeed = this.roughOptions.seed || Math.floor(Math.random() * 100000);
    this.frames = Array.from({ length: this.frameCount }, (_, i) => {
      return this.generator[this.type](...this.args, {
        ...this.roughOptions,
        seed: baseSeed + i * 137
      });
    });
  }

  render(ctx, rc, timestamp) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scale, this.scale);

    const frameIdx = Math.floor((timestamp * this.boilFps) / 1000) % this.frames.length;
    rc.draw(this.frames[frameIdx]);
    ctx.restore();
  }
}`
    };

    this.initDOM();
    this.setupCanvas();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="code-lab-grid">
        <!-- Code Display & Copy -->
        <div class="code-editor-card">
          <div class="code-header">
            <div class="code-tabs" id="code-snippet-tabs">
              <button class="code-tab-btn active" data-snippet="canvas">Canvas + Anime.js</button>
              <button class="code-tab-btn" data-snippet="svg">SVG Line Boil</button>
              <button class="code-tab-btn" data-snippet="class">BoilShape Class</button>
            </div>
            <button id="btn-copy-code" class="tactile-btn amber" style="padding: 4px 12px; font-size: 0.75rem;">
              <span>📋 Copy Code</span>
            </button>
          </div>
          <div class="code-block" id="code-snippet-display">
            <code>${this.escapeHtml(this.snippets.canvas)}</code>
          </div>
        </div>

        <!-- Live Code Execution Preview -->
        <div class="code-preview-card">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1rem;">Live Sandbox Preview</h3>
            <span class="stat-badge pulse-badge">Active 60 FPS / 10 FPS Boil</span>
          </div>
          <div class="canvas-wrapper" id="code-preview-wrap" style="min-height: 380px; border-radius: 12px; border: 1px solid var(--border-subtle);">
            <canvas id="code-preview-canvas" class="main-stage-canvas"></canvas>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--text-secondary);">
            <span>Interactive Rough.js + Anime.js pipeline</span>
            <button id="btn-trigger-pulse" class="tactile-btn outline" style="padding: 4px 10px; font-size: 0.75rem;">
              <span>⚡ Trigger Anime Pulse</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('code-preview-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('code-preview-wrap');
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
      this.buildLiveDemo();
    };

    window.addEventListener('resize', resize);
    resize();
  }

  buildLiveDemo() {
    const gen = rough.generator();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';
    const amber = isDark ? '#F59E0B' : '#D97706';

    const cx = (this.width || 400) / 2;
    const cy = (this.height || 380) / 2;

    this.demoState = {
      x: cx,
      y: cy,
      scale: 1,
      rotation: 0
    };

    this.demoFrames = [0, 1, 2, 3].map(i => {
      return gen.rectangle(-60, -60, 120, 120, {
        seed: 1000 + i * 137,
        roughness: 2.0,
        bowing: 1.8,
        stroke: ink,
        strokeWidth: 2.5,
        fill: amber,
        fillStyle: 'hachure',
        hachureAngle: 45
      });
    });

    this.demoAnim = anime({
      targets: this.demoState,
      rotation: 360,
      scale: [1, 1.2, 1],
      duration: 3500,
      easing: 'easeInOutSine',
      loop: true
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas && this.demoFrames) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);

        this.ctx.save();
        this.ctx.translate(this.demoState.x, this.demoState.y);
        this.ctx.rotate((this.demoState.rotation * Math.PI) / 180);
        this.ctx.scale(this.demoState.scale, this.demoState.scale);

        this.rc.draw(this.demoFrames[frameIdx]);
        this.ctx.restore();
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  copyCode() {
    const text = this.snippets[this.activeSnippet];
    navigator.clipboard.writeText(text).then(() => {
      SoundFX.playPop(650);
      confetti({ particleCount: 30, spread: 50 });
      const copyBtn = document.getElementById('btn-copy-code');
      if (copyBtn) {
        copyBtn.innerHTML = '<span>✅ Copied!</span>';
        setTimeout(() => {
          copyBtn.innerHTML = '<span>📋 Copy Code</span>';
        }, 2000);
      }
    });
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  bindEvents() {
    document.getElementById('btn-copy-code')?.addEventListener('click', () => this.copyCode());

    document.getElementById('code-snippet-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-tab-btn');
      if (!btn) return;
      document.querySelectorAll('.code-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeSnippet = btn.getAttribute('data-snippet');
      const display = document.getElementById('code-snippet-display');
      if (display) {
        display.innerHTML = `<code>${this.escapeHtml(this.snippets[this.activeSnippet])}</code>`;
      }
      SoundFX.playPop(480);
    });

    document.getElementById('btn-trigger-pulse')?.addEventListener('click', () => {
      SoundFX.playPop(620);
      anime({
        targets: this.demoState,
        scale: [1, 1.45, 1],
        duration: 500,
        easing: 'easeOutElastic(1, .4)'
      });
    });
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    if (this.demoAnim) this.demoAnim.pause();
  }
}
