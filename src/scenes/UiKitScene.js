import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class UiKitScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.state = {
      toggleActive: true,
      sliderValue: 65,
      checked1: true,
      checked2: false,
      radioSelected: 'pro',
      progressVal: 72,
      modalOpen: false
    };

    this.initDOM();
    this.setupCanvases();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 300px;">
        <!-- UI Showcase Canvas Board -->
        <div class="canvas-viewport-card" style="min-height: 600px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Hand-Drawn Boiling UI Component System</span>
              <span class="toolbar-badge">SVG / Canvas Micro-Interactions</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-reseed-ui" class="tactile-btn outline">
                <span>🎲 Reseed UI</span>
              </button>
              <button id="btn-open-modal" class="tactile-btn amber">
                <span>💬 Open Hand-Drawn Modal</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="ui-canvas-wrap">
            <canvas id="ui-stage-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- UI Inspector & State Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🕹️ Interactive UI Controls</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">
              Click directly on the hand-drawn elements on the canvas to interact with tactile Anime.js physics:
            </p>
            <div class="control-group">
              <div class="control-label-row">
                <span>Progress Fill:</span>
                <span id="val-ui-progress" class="control-val">72%</span>
              </div>
              <input type="range" id="slider-ui-progress" min="0" max="100" value="72" class="custom-range">
            </div>
            <div class="control-group">
              <button id="btn-trigger-celebrate" class="tactile-btn primary" style="width: 100%;">
                <span>🎉 Trigger Rough Confetti</span>
              </button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">💡 Design Architecture</span>
            </div>
            <p style="font-size: 0.78rem; line-height: 1.6; color: var(--text-secondary);">
              Every UI widget (Button, Slider, Switch, Radio) maintains a <strong>4-frame seed buffer</strong> that rotates at 10 FPS. Hover and active clicks trigger instant spring physics at 60 FPS without redrawing rough geometries from scratch.
            </p>
          </div>
        </div>
      </div>

      <!-- Hand-Drawn Modal Overlay (DOM + Rough Overlay) -->
      <div id="hand-drawn-modal" class="custom-modal-overlay" style="display: none;">
        <div class="modal-card bezel-card" style="max-width: 440px; margin: 100px auto;">
          <div class="bezel-inner" style="display: flex; flex-direction: column; gap: 16px; text-align: center;">
            <canvas id="modal-sketch-canvas" width="400" height="240" style="width: 100%; height: 160px; border-radius: 12px;"></canvas>
            <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem;">Handmade Modal Dialog</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">
              This dialog renders animated boiling hachure textures and interactive tactile buttons powered by Rough.js + Anime.js.
            </p>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <button id="btn-modal-cancel" class="tactile-btn outline">Cancel</button>
              <button id="btn-modal-confirm" class="tactile-btn amber">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvases() {
    this.canvas = document.getElementById('ui-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('uikit-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? rect.width : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? rect.height : 0, wrap ? wrap.clientHeight : 0, 600);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.buildUiBuffers();
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
    this.setupInteraction();
  }

  buildUiBuffers() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';
    const cardBg = isDark ? '#1F242D' : '#FAF8F3';
    const amber = isDark ? '#F59E0B' : '#D97706';
    const sage = isDark ? '#10B981' : '#059669';

    this.w = this.width || 800;
    this.h = this.height || 600;

    // Interactive button bounds
    this.btn1Bounds = { x: 40, y: 60, w: 180, h: 48, scale: 1, text: 'Confirm Order ↗' };
    this.btn2Bounds = { x: 240, y: 60, w: 140, h: 48, scale: 1, text: 'Dismiss' };
    this.btn3Bounds = { x: 400, y: 60, w: 140, h: 48, scale: 1, text: 'Ochre Pill' };

    // Toggle switch
    this.toggleBounds = { x: 40, y: 160, w: 72, h: 36, knobX: this.state.toggleActive ? 40 + 46 : 40 + 16 };

    // Slider bounds
    this.sliderBounds = { x: 40, y: 260, w: 320, h: 10 };

    // Checkbox bounds
    this.check1Bounds = { x: 40, y: 340, size: 24 };
    this.check2Bounds = { x: 40, y: 380, size: 24 };

    // Radio pills
    this.radio1Bounds = { x: 40, y: 440, w: 140, h: 38, id: 'starter', label: 'Starter' };
    this.radio2Bounds = { x: 190, y: 440, w: 140, h: 38, id: 'pro', label: 'Pro Plan' };

    // Progress bar bounds
    this.progressBounds = { x: 40, y: 520, w: 360, h: 22 };

    // Pre-buffer frames
    const gen = rough.generator();
    this.uiBuffers = {};

    // 4 seed frames
    this.uiBuffers.frames = [0, 1, 2, 3].map(i => {
      const s = 1000 + i * 137;
      return {
        // Button 1
        btn1: gen.rectangle(this.btn1Bounds.x, this.btn1Bounds.y, this.btn1Bounds.w, this.btn1Bounds.h, {
          seed: s, roughness: 1.8, bowing: 1.5, stroke: ink, strokeWidth: 2, fill: amber, fillStyle: 'hachure'
        }),
        // Button 2
        btn2: gen.rectangle(this.btn2Bounds.x, this.btn2Bounds.y, this.btn2Bounds.w, this.btn2Bounds.h, {
          seed: s, roughness: 1.5, bowing: 1.2, stroke: ink, strokeWidth: 2
        }),
        // Button 3 Pill
        btn3: gen.ellipse(this.btn3Bounds.x + 70, this.btn3Bounds.y + 24, 140, 48, {
          seed: s, roughness: 1.8, bowing: 1.5, stroke: ink, strokeWidth: 2, fill: sage, fillStyle: 'dots'
        }),
        // Toggle track
        toggleTrack: gen.rectangle(this.toggleBounds.x, this.toggleBounds.y, this.toggleBounds.w, this.toggleBounds.h, {
          seed: s, roughness: 1.6, bowing: 1.2, stroke: ink, strokeWidth: 2,
          fill: this.state.toggleActive ? sage : cardBg, fillStyle: 'solid'
        }),
        // Slider track
        sliderTrack: gen.rectangle(this.sliderBounds.x, this.sliderBounds.y, this.sliderBounds.w, this.sliderBounds.h, {
          seed: s, roughness: 1.4, bowing: 1.2, stroke: ink, strokeWidth: 2, fill: cardBg, fillStyle: 'solid'
        }),
        // Checkboxes
        check1: gen.rectangle(this.check1Bounds.x, this.check1Bounds.y, this.check1Bounds.size, this.check1Bounds.size, {
          seed: s, roughness: 1.5, bowing: 1.2, stroke: ink, strokeWidth: 2
        }),
        check2: gen.rectangle(this.check2Bounds.x, this.check2Bounds.y, this.check2Bounds.size, this.check2Bounds.size, {
          seed: s, roughness: 1.5, bowing: 1.2, stroke: ink, strokeWidth: 2
        }),
        // Checkmarks
        tick1: gen.linearPath([[this.check1Bounds.x + 4, this.check1Bounds.y + 12], [this.check1Bounds.x + 10, this.check1Bounds.y + 18], [this.check1Bounds.x + 20, this.check1Bounds.y + 6]], {
          seed: s, roughness: 2, stroke: sage, strokeWidth: 3
        }),
        tick2: gen.linearPath([[this.check2Bounds.x + 4, this.check2Bounds.y + 12], [this.check2Bounds.x + 10, this.check2Bounds.y + 18], [this.check2Bounds.x + 20, this.check2Bounds.y + 6]], {
          seed: s, roughness: 2, stroke: sage, strokeWidth: 3
        }),
        // Progress track
        progressTrack: gen.rectangle(this.progressBounds.x, this.progressBounds.y, this.progressBounds.w, this.progressBounds.h, {
          seed: s, roughness: 1.6, bowing: 1.2, stroke: ink, strokeWidth: 2, fill: cardBg, fillStyle: 'solid'
        })
      };
    });
  }

  setupInteraction() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Click Button 1
      if (x >= this.btn1Bounds.x && x <= this.btn1Bounds.x + this.btn1Bounds.w &&
          y >= this.btn1Bounds.y && y <= this.btn1Bounds.y + this.btn1Bounds.h) {
        SoundFX.playPop(580);
        confetti({ particleCount: 30, spread: 50, origin: { x: (rect.left + x) / window.innerWidth, y: (rect.top + y) / window.innerHeight } });
        anime({
          targets: this.btn1Bounds,
          scale: [1, 0.92, 1.08, 1],
          duration: 350,
          easing: 'easeOutElastic(1, .5)'
        });
      }

      // Click Button 2
      if (x >= this.btn2Bounds.x && x <= this.btn2Bounds.x + this.btn2Bounds.w &&
          y >= this.btn2Bounds.y && y <= this.btn2Bounds.y + this.btn2Bounds.h) {
        SoundFX.playPop(420);
        anime({
          targets: this.btn2Bounds,
          scale: [1, 0.92, 1.05, 1],
          duration: 300,
          easing: 'easeOutElastic(1, .5)'
        });
      }

      // Click Toggle
      if (x >= this.toggleBounds.x && x <= this.toggleBounds.x + this.toggleBounds.w &&
          y >= this.toggleBounds.y && y <= this.toggleBounds.y + this.toggleBounds.h) {
        SoundFX.playPop(520);
        this.state.toggleActive = !this.state.toggleActive;
        const targetX = this.state.toggleActive ? this.toggleBounds.x + 46 : this.toggleBounds.x + 16;
        anime({
          targets: this.toggleBounds,
          knobX: targetX,
          duration: 350,
          easing: 'easeOutElastic(1, .5)'
        });
        this.buildUiBuffers();
      }

      // Click Checkbox 1
      if (x >= this.check1Bounds.x - 5 && x <= this.check1Bounds.x + 200 &&
          y >= this.check1Bounds.y - 5 && y <= this.check1Bounds.y + 30) {
        SoundFX.playPop(490);
        this.state.checked1 = !this.state.checked1;
      }

      // Click Checkbox 2
      if (x >= this.check2Bounds.x - 5 && x <= this.check2Bounds.x + 200 &&
          y >= this.check2Bounds.y - 5 && y <= this.check2Bounds.y + 30) {
        SoundFX.playPop(490);
        this.state.checked2 = !this.state.checked2;
      }

      // Click Radio 1
      if (x >= this.radio1Bounds.x && x <= this.radio1Bounds.x + this.radio1Bounds.w &&
          y >= this.radio1Bounds.y && y <= this.radio1Bounds.y + this.radio1Bounds.h) {
        SoundFX.playPop(540);
        this.state.radioSelected = 'starter';
      }

      // Click Radio 2
      if (x >= this.radio2Bounds.x && x <= this.radio2Bounds.x + this.radio2Bounds.w &&
          y >= this.radio2Bounds.y && y <= this.radio2Bounds.y + this.radio2Bounds.h) {
        SoundFX.playPop(540);
        this.state.radioSelected = 'pro';
      }
    });

    // Slider Dragging
    let isDraggingSlider = false;
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= this.sliderBounds.x - 10 && x <= this.sliderBounds.x + this.sliderBounds.w + 10 &&
          y >= this.sliderBounds.y - 15 && y <= this.sliderBounds.y + 25) {
        isDraggingSlider = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDraggingSlider) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const val = Math.max(0, Math.min(100, Math.round(((x - this.sliderBounds.x) / this.sliderBounds.w) * 100)));
      this.state.sliderValue = val;
    });

    window.addEventListener('mouseup', () => {
      if (isDraggingSlider) {
        isDraggingSlider = false;
        SoundFX.playPop(600);
      }
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas && this.uiBuffers && this.uiBuffers.frames) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const f = this.uiBuffers.frames[frameIdx];
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';

        // 1. Draw Buttons
        this.ctx.save();
        this.rc.draw(f.btn1);
        this.ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.btn1Bounds.text, this.btn1Bounds.x + this.btn1Bounds.w / 2, this.btn1Bounds.y + this.btn1Bounds.h / 2);

        this.rc.draw(f.btn2);
        this.ctx.fillStyle = ink;
        this.ctx.fillText(this.btn2Bounds.text, this.btn2Bounds.x + this.btn2Bounds.w / 2, this.btn2Bounds.y + this.btn2Bounds.h / 2);

        this.rc.draw(f.btn3);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(this.btn3Bounds.text, this.btn3Bounds.x + 70, this.btn3Bounds.y + 24);
        this.ctx.restore();

        // 2. Draw Toggle Switch
        this.ctx.save();
        this.rc.draw(f.toggleTrack);
        // Knob
        const gen = rough.generator();
        const knob = gen.circle(this.toggleBounds.knobX, this.toggleBounds.y + 18, 22, {
          seed: 2000 + frameIdx * 100, roughness: 1.5, bowing: 1.2, stroke: ink, strokeWidth: 2, fill: '#FFFFFF', fillStyle: 'solid'
        });
        this.rc.draw(knob);
        this.ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillStyle = ink;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Tactile Switch: ${this.state.toggleActive ? 'ON' : 'OFF'}`, this.toggleBounds.x + 85, this.toggleBounds.y + 18);
        this.ctx.restore();

        // 3. Draw Slider
        this.ctx.save();
        this.rc.draw(f.sliderTrack);
        // Slider Fill
        const fillW = (this.sliderBounds.w * this.state.sliderValue) / 100;
        if (fillW > 2) {
          const sliderFill = gen.rectangle(this.sliderBounds.x, this.sliderBounds.y, fillW, this.sliderBounds.h, {
            seed: 3000 + frameIdx * 50, roughness: 1.5, stroke: 'transparent', fill: amber, fillStyle: 'solid'
          });
          this.rc.draw(sliderFill);
        }
        // Slider Knob
        const thumbX = this.sliderBounds.x + fillW;
        const thumb = gen.circle(thumbX, this.sliderBounds.y + 5, 20, {
          seed: 4000 + frameIdx * 50, roughness: 1.5, stroke: ink, strokeWidth: 2, fill: '#FFFFFF', fillStyle: 'solid'
        });
        this.rc.draw(thumb);

        // Value Badge cloud
        this.ctx.font = '700 13px "Fira Code", monospace';
        this.ctx.fillStyle = ink;
        this.ctx.fillText(`Intensity: ${this.state.sliderValue}%`, this.sliderBounds.x + this.sliderBounds.w + 20, this.sliderBounds.y + 7);
        this.ctx.restore();

        // 4. Draw Checkboxes
        this.ctx.save();
        this.rc.draw(f.check1);
        if (this.state.checked1) this.rc.draw(f.tick1);
        this.ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillStyle = ink;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Enable 60 FPS Subpixel Motion Interpolation', this.check1Bounds.x + 34, this.check1Bounds.y + 12);

        this.rc.draw(f.check2);
        if (this.state.checked2) this.rc.draw(f.tick2);
        this.ctx.fillText('Enable Audio Haptic Feedback', this.check2Bounds.x + 34, this.check2Bounds.y + 12);
        this.ctx.restore();

        // 5. Draw Radio Pills
        this.ctx.save();
        const r1Sel = this.state.radioSelected === 'starter';
        const radio1 = gen.rectangle(this.radio1Bounds.x, this.radio1Bounds.y, this.radio1Bounds.w, this.radio1Bounds.h, {
          seed: 5000 + frameIdx * 20, roughness: 1.5, stroke: ink, strokeWidth: 2,
          fill: r1Sel ? amber : undefined, fillStyle: r1Sel ? 'hachure' : undefined
        });
        this.rc.draw(radio1);
        this.ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        this.ctx.fillStyle = r1Sel && !isDark ? '#1C1917' : ink;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.radio1Bounds.label, this.radio1Bounds.x + this.radio1Bounds.w / 2, this.radio1Bounds.y + this.radio1Bounds.h / 2);

        const r2Sel = this.state.radioSelected === 'pro';
        const radio2 = gen.rectangle(this.radio2Bounds.x, this.radio2Bounds.y, this.radio2Bounds.w, this.radio2Bounds.h, {
          seed: 6000 + frameIdx * 20, roughness: 1.5, stroke: ink, strokeWidth: 2,
          fill: r2Sel ? amber : undefined, fillStyle: r2Sel ? 'hachure' : undefined
        });
        this.rc.draw(radio2);
        this.ctx.fillStyle = r2Sel && !isDark ? '#1C1917' : ink;
        this.ctx.fillText(this.radio2Bounds.label, this.radio2Bounds.x + this.radio2Bounds.w / 2, this.radio2Bounds.y + this.radio2Bounds.h / 2);
        this.ctx.restore();

        // 6. Draw Progress Bar
        this.ctx.save();
        this.rc.draw(f.progressTrack);
        const pW = (this.progressBounds.w * this.state.progressVal) / 100;
        if (pW > 2) {
          const pFill = gen.rectangle(this.progressBounds.x + 2, this.progressBounds.y + 2, pW - 4, this.progressBounds.h - 4, {
            seed: 7000 + frameIdx * 10, roughness: 1.6, stroke: 'transparent', fill: '#059669', fillStyle: 'hachure', hachureAngle: 45
          });
          this.rc.draw(pFill);
        }
        this.ctx.font = '600 12px "Fira Code", monospace';
        this.ctx.fillStyle = ink;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Loading Assets... ${this.state.progressVal}%`, this.progressBounds.x + this.progressBounds.w + 15, this.progressBounds.y + 12);
        this.ctx.restore();
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  renderModalSketch() {
    const mCanvas = document.getElementById('modal-sketch-canvas');
    if (!mCanvas) return;
    const ctx = mCanvas.getContext('2d');
    const rc = rough.canvas(mCanvas);
    ctx.clearRect(0, 0, mCanvas.width, mCanvas.height);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';

    // Draw sketched icon banner
    rc.rectangle(20, 20, 360, 120, {
      roughness: 2,
      stroke: ink,
      strokeWidth: 2,
      fill: '#D97706',
      fillStyle: 'cross-hatch'
    });

    rc.circle(200, 80, 44, {
      roughness: 1.8,
      stroke: '#FFFFFF',
      strokeWidth: 3,
      fill: '#FFFFFF',
      fillStyle: 'solid'
    });

    rc.linearPath([[190, 80], [197, 88], [212, 72]], {
      roughness: 1.5,
      stroke: '#D97706',
      strokeWidth: 4
    });
  }

  openModal() {
    this.state.modalOpen = true;
    SoundFX.playPop(550);
    const modalEl = document.getElementById('hand-drawn-modal');
    if (modalEl) {
      modalEl.style.display = 'block';
      this.renderModalSketch();
      anime({
        targets: modalEl.querySelector('.modal-card'),
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 350,
        easing: 'easeOutElastic(1, .6)'
      });
    }
  }

  closeModal() {
    this.state.modalOpen = false;
    SoundFX.playPop(400);
    const modalEl = document.getElementById('hand-drawn-modal');
    if (modalEl) {
      modalEl.style.display = 'none';
    }
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-reseed-ui')?.addEventListener('click', () => {
      this.buildUiBuffers();
      SoundFX.playScratch();
    });

    document.getElementById('btn-open-modal')?.addEventListener('click', () => this.openModal());
    document.getElementById('btn-modal-cancel')?.addEventListener('click', () => this.closeModal());
    document.getElementById('btn-modal-confirm')?.addEventListener('click', () => {
      this.closeModal();
      confetti({ particleCount: 50, spread: 70 });
    });

    document.getElementById('slider-ui-progress')?.addEventListener('input', (e) => {
      this.state.progressVal = parseInt(e.target.value);
      document.getElementById('val-ui-progress').textContent = `${this.state.progressVal}%`;
    });

    document.getElementById('btn-trigger-celebrate')?.addEventListener('click', () => {
      SoundFX.playPop(650);
      confetti({ particleCount: 70, spread: 80 });
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
  }
}
