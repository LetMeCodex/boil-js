import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class BubbleScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.bubbles = [];
    this.popParticles = [];
    this.slimeNodes = [];
    this.isDraggingSlime = false;
    this.dragStart = null;
    this.poppedCount = 0;

    this.initDOM();
    this.setupCanvas();
    this.spawnInitialBubbles();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 300px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 580px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Boiling Bubble Popper & Slime</span>
              <span class="toolbar-badge">Elastic Soft-Body Physics</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-bubble-gun" class="tactile-btn amber">
                ${renderIcon('sparkle')}
                <span>Bubble Spray (x15)</span>
              </button>
              <button id="btn-bubble-clear" class="tactile-btn outline">
                ${renderIcon('reset')}
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="bubble-canvas-wrap" style="min-height: 500px; cursor: crosshair;">
            <canvas id="bubble-stage-canvas" class="main-stage-canvas"></canvas>
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.72rem; color: var(--ink-muted); background: var(--paper-card); border: 1px solid var(--line); padding: 4px 12px; border-radius: var(--radius-xs); pointer-events: none;">
              Slice or click bubbles to POP • Click & drag anywhere to stretch gooey slime webs
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <!-- Pop Scoreboard -->
          <div class="panel-card" style="background: var(--paper-card); border: 1px solid var(--emerald);">
            <div class="panel-header">
              <span class="panel-title">BUBBLE POP COUNTER</span>
            </div>
            <div style="text-align: center; padding: 8px 0;">
              <div style="font-family: 'Fira Code', monospace; font-size: 2.5rem; font-weight: 800; color: var(--emerald);" id="hud-bubble-score">
                0
              </div>
              <div style="font-size: 0.75rem; color: var(--ink-muted);">BUBBLES POPPED</div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">BUBBLE PHYSICS</span>
            </div>
            <div class="style-pills-grid" style="grid-template-columns: 1fr;">
              <button class="tactile-btn primary" id="btn-giant-bubble">${renderIcon('multiball')}<span>Spawn Giant Mega-Bubble</span></button>
              <button class="tactile-btn outline" id="btn-invert-bubbles"><span>Invert Buoyancy (Float Down)</span></button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('bubble-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('bubble-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? Math.floor(rect.width) : 0, wrap ? wrap.clientWidth : 0, 300);
      const h = Math.max(rect ? Math.floor(rect.height) : 0, wrap ? wrap.clientHeight : 0, 420);

      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);

      if (!this.bubbles || this.bubbles.length === 0) {
        this.spawnInitialBubbles();
      }
    };

    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 100);
    this.setupInteractions();
  }

  spawnInitialBubbles() {
    this.bubbles = [];
    const w = this.width || 800;
    const h = this.height || 500;

    for (let i = 0; i < 14; i++) {
      this.spawnBubble(
        w * 0.1 + Math.random() * (w * 0.8),
        h * 0.2 + Math.random() * (h * 0.7),
        24 + Math.random() * 32
      );
    }
  }

  spawnBubble(x, y, r = 30) {
    const colors = ['#D97706', '#059669', '#0284C7', '#4F46E5', '#DC2626', '#F59E0B'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.bubbles.push({
      x,
      y,
      baseX: x,
      r,
      baseR: r,
      color,
      speedY: -0.4 - Math.random() * 0.8,
      wobbleFreq: 0.002 + Math.random() * 0.003,
      wobbleAmp: 15 + Math.random() * 25,
      wobblePhase: Math.random() * Math.PI * 2,
      scaleX: 1,
      scaleY: 1,
      seed: Math.floor(Math.random() * 100000)
    });
  }

  setupInteractions() {
    const checkPopAt = (clientX, clientY) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        const dist = Math.hypot(x - b.x, y - b.y);
        if (dist < b.r * 1.2) {
          this.popBubble(b, i);
          break;
        }
      }
    };

    this.isSlicing = false;

    this.onCanvasPointerDown = (e) => {
      this.isSlicing = true;
      const rect = this.canvas.getBoundingClientRect();
      this.dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.dragEnd = { ...this.dragStart };
      checkPopAt(e.clientX, e.clientY);
    };

    this.onWindowPointerMove = (e) => {
      if (!this.canvas) return;
      if (this.isSlicing) {
        checkPopAt(e.clientX, e.clientY);
        const rect = this.canvas.getBoundingClientRect();
        this.dragEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    };

    this.onWindowPointerUp = () => {
      this.isSlicing = false;
      this.dragStart = null;
      this.dragEnd = null;
    };

    this.canvas.addEventListener('pointerdown', this.onCanvasPointerDown);
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);
    window.addEventListener('blur', this.onWindowPointerUp);
  }

  popBubble(b, index) {
    SoundFX.playPop(480 + Math.random() * 320);
    this.bubbles.splice(index, 1);
    this.poppedCount++;

    const scoreEl = document.getElementById('hud-bubble-score');
    if (scoreEl) scoreEl.textContent = `${this.poppedCount}`;

    // Spawn splash droplets
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.popParticles.push({
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: b.color,
        size: 3 + Math.random() * 4
      });
    }

    if (this.poppedCount % 10 === 0) {
      confetti({ particleCount: 25, spread: 50 });
    }

    // Auto spawn new bubble from bottom
    const w = this.width || 800;
    const h = this.height || 500;
    setTimeout(() => {
      this.spawnBubble(w * 0.1 + Math.random() * (w * 0.8), h + 40, 24 + Math.random() * 30);
    }, 400);
  }

  spawnMegaBubble() {
    SoundFX.playHarmonicChord();
    confetti({ particleCount: 30, spread: 60 });
    const w = this.width || 800;
    const h = this.height || 500;
    this.spawnBubble(w * 0.5, h * 0.6, 95);
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gen = rough.generator();

        // 1. Update & Render Soap Bubbles
        for (let i = 0; i < this.bubbles.length; i++) {
          const b = this.bubbles[i];

          // Buoyant upward float
          b.y += b.speedY;
          b.x = b.baseX + Math.sin(timestamp * b.wobbleFreq + b.wobblePhase) * b.wobbleAmp;

          // Wrap bottom if floated past top
          if (b.y < -b.r * 2) {
            b.y = this.height + b.r;
            b.x = Math.random() * this.width;
            b.baseX = b.x;
          }

          // Elastic Wobble Scale
          const wobbleScaleX = 1 + Math.sin(timestamp * 0.005 + i) * 0.12;
          const wobbleScaleY = 1 + Math.cos(timestamp * 0.005 + i) * 0.12;
          const seed = b.seed + frameIdx * 20;

          // Main Bubble Ring
          const bubbleOuter = gen.ellipse(b.x, b.y, b.r * 2 * wobbleScaleX, b.r * 2 * wobbleScaleY, {
            seed,
            roughness: 1.8,
            bowing: 1.6,
            stroke: b.color,
            strokeWidth: 2.5,
            fill: b.color,
            fillStyle: 'dots',
            fillWeight: 1.2
          });
          this.rc.draw(bubbleOuter);

          // Shimmer Highlight Arc
          const shimmer = gen.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 1.2, b.r * 1.2, -Math.PI * 0.7, -Math.PI * 0.1, false, {
            seed: seed + 5,
            stroke: '#FFFFFF',
            strokeWidth: 3
          });
          this.rc.draw(shimmer);
        }

        // 2. Update & Render Splash Droplet Particles
        for (let i = this.popParticles.length - 1; i >= 0; i--) {
          const p = this.popParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // gravity
          p.alpha -= 0.035;

          if (p.alpha <= 0) {
            this.popParticles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          const droplet = gen.circle(p.x, p.y, p.size, {
            seed: 9999 + i,
            stroke: p.color,
            fill: p.color,
            fillStyle: 'solid'
          });
          this.rc.draw(droplet);
          this.ctx.restore();
        }

        // 3. Render Gooey Slime Web Slicing Trail
        if (this.dragStart && this.dragEnd) {
          const slimeLine = gen.curve([[this.dragStart.x, this.dragStart.y], [(this.dragStart.x + this.dragEnd.x) / 2, (this.dragStart.y + this.dragEnd.y) / 2 + 10], [this.dragEnd.x, this.dragEnd.y]], {
            seed: 8888 + frameIdx * 10,
            roughness: 2.2,
            bowing: 2.0,
            stroke: isDark ? '#10B981' : '#059669',
            strokeWidth: 4
          });
          this.rc.draw(slimeLine);
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
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

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-bubble-gun')?.addEventListener('click', () => {
      SoundFX.playPop(620);
      const w = this.width || 800;
      const h = this.height || 500;
      for (let i = 0; i < 15; i++) {
        this.spawnBubble(w * 0.2 + Math.random() * (w * 0.6), h * 0.4 + Math.random() * (h * 0.5), 18 + Math.random() * 26);
      }
    });

    document.getElementById('btn-bubble-clear')?.addEventListener('click', () => {
      this.spawnInitialBubbles();
      SoundFX.playScratch();
    });

    document.getElementById('btn-giant-bubble')?.addEventListener('click', () => this.spawnMegaBubble());

    document.getElementById('btn-invert-bubbles')?.addEventListener('click', () => {
      SoundFX.playPop(520);
      this.bubbles.forEach(b => {
        b.speedY = -b.speedY;
      });
    });
  }

  destroy() {
    this.suspend();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.canvas && this.onCanvasPointerDown) {
      this.canvas.removeEventListener('pointerdown', this.onCanvasPointerDown);
    }
    if (this.onWindowPointerMove) {
      window.removeEventListener('pointermove', this.onWindowPointerMove);
      window.removeEventListener('pointerup', this.onWindowPointerUp);
      window.removeEventListener('pointercancel', this.onWindowPointerUp);
      window.removeEventListener('blur', this.onWindowPointerUp);
    }
  }
}
