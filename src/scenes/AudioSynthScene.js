import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class AudioSynthScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.isPlayingArp = false;
    this.arpStep = 0;
    this.arpTimer = null;

    this.notes = [
      { key: 'A', note: 'C4', freq: 261.63, active: false, scale: 1 },
      { key: 'S', note: 'D4', freq: 293.66, active: false, scale: 1 },
      { key: 'D', note: 'E4', freq: 329.63, active: false, scale: 1 },
      { key: 'F', note: 'F4', freq: 349.23, active: false, scale: 1 },
      { key: 'G', note: 'G4', freq: 392.00, active: false, scale: 1 },
      { key: 'H', note: 'A4', freq: 440.00, active: false, scale: 1 },
      { key: 'J', note: 'B4', freq: 493.88, active: false, scale: 1 },
      { key: 'K', note: 'C5', freq: 523.25, active: false, scale: 1 }
    ];

    this.fftBars = new Array(16).fill(0);
    this.initAudioSynth();
    this.initDOM();
    this.setupCanvas();
    this.startRenderLoop();
  }

  initAudioSynth() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 0.2;

        this.analyser.connect(this.masterGain);
        this.masterGain.connect(this.audioCtx.destination);
      }
    } catch (e) {
      console.warn('Web Audio initialization error', e);
    }
  }

  playTone(freq, duration = 0.35) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, this.audioCtx.currentTime);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

    osc.connect(filter);
    filter.connect(this.analyser);
    this.analyser.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Audio-Reactive Synth & Beat Visualizer</span>
              <span class="toolbar-badge">Web Audio API + FFT Boil Spectrum</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-toggle-arp" class="tactile-btn amber">
                <span id="arp-btn-text">🎵 Play Lo-Fi Arpeggio</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="synth-canvas-wrap">
            <canvas id="synth-stage-canvas" class="main-stage-canvas"></canvas>
            <div id="synth-hint" style="position: absolute; bottom: 16px; left: 16px; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-glass); backdrop-filter: blur(8px); padding: 4px 10px; border-radius: 9999px; pointer-events: none;">
              🎹 Click hand-drawn piano keys or press A, S, D, F, G, H, J, K on your keyboard
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎹 Synth Keyboard</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">Playable keys mapped to audio oscillators:</p>
            <div style="display: flex; gap: 4px; justify-content: center; margin-top: 6px;">
              ${this.notes.map((n, i) => `
                <button class="tactile-btn outline synth-key-btn" data-idx="${i}" style="padding: 10px 8px; font-size: 0.75rem; min-width: 32px; text-align: center;">
                  <div>${n.note}</div>
                  <kbd style="font-size: 0.65rem;">${n.key}</kbd>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎛️ Audio Reactivity</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Boiling Roughness Sensitivity:</span>
                <span id="val-audio-sens" class="control-val">1.8x</span>
              </div>
              <input type="range" id="slider-audio-sens" min="0.5" max="3" step="0.1" value="1.8" class="custom-range">
            </div>
            <div class="control-group">
              <button id="btn-synth-chord" class="tactile-btn primary" style="width: 100%;">
                <span>✨ Play Warm Chord</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('synth-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('synth-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? Math.floor(rect.width) : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? Math.floor(rect.height) : 0, wrap ? wrap.clientHeight : 0, 500);

      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
    this.setupKeyInteraction();
  }

  setupKeyInteraction() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const keyboardY = (this.height || 500) - 130;
      const keyW = 56;
      const totalW = this.notes.length * (keyW + 8);
      const startX = ((this.width || 800) - totalW) / 2;

      if (y >= keyboardY && y <= keyboardY + 100) {
        const idx = Math.floor((x - startX) / (keyW + 8));
        if (idx >= 0 && idx < this.notes.length) {
          this.triggerNote(idx);
        }
      }
    });

    this.keyHandler = (e) => {
      if (e.repeat || e.target.tagName === 'INPUT') return;
      const letter = e.key.toUpperCase();
      const idx = this.notes.findIndex(n => n.key === letter);
      if (idx !== -1) {
        this.triggerNote(idx);
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  triggerNote(idx) {
    const noteObj = this.notes[idx];
    if (!noteObj) return;

    this.playTone(noteObj.freq);
    noteObj.active = true;

    anime({
      targets: noteObj,
      scale: [1, 0.9, 1.1, 1],
      duration: 300,
      easing: 'easeOutElastic(1, .5)',
      complete: () => {
        noteObj.active = false;
      }
    });

    // Pulse mini particle
    confetti({
      particleCount: 10,
      spread: 30,
      origin: { x: (idx + 1) / (this.notes.length + 2), y: 0.8 }
    });
  }

  toggleArpeggio() {
    this.isPlayingArp = !this.isPlayingArp;
    const btnText = document.getElementById('arp-btn-text');

    if (this.isPlayingArp) {
      if (btnText) btnText.textContent = '⏸️ Stop Arpeggio';
      const pattern = [0, 2, 4, 7, 4, 2, 1, 3, 5, 7, 5, 3];
      this.arpStep = 0;
      this.arpTimer = setInterval(() => {
        const noteIdx = pattern[this.arpStep % pattern.length];
        this.triggerNote(noteIdx);
        this.arpStep++;
      }, 160);
    } else {
      if (btnText) btnText.textContent = '🎵 Play Lo-Fi Arpeggio';
      if (this.arpTimer) clearInterval(this.arpTimer);
    }
  }

  playChord() {
    [0, 2, 4, 7].forEach((idx, i) => {
      setTimeout(() => this.triggerNote(idx), i * 60);
    });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';
        const sage = isDark ? '#10B981' : '#059669';
        const gen = rough.generator();

        const w = this.width || 800;
        const h = this.height || 500;
        const cx = w / 2;
        const cy = h * 0.38;

        // 1. Sample Web Audio FFT
        let audioEnergy = 0;
        if (this.analyser && this.dataArray) {
          this.analyser.getByteFrequencyData(this.dataArray);
          for (let i = 0; i < 16; i++) {
            const raw = this.dataArray[i] / 255;
            this.fftBars[i] = this.fftBars[i] * 0.8 + raw * 0.2;
            audioEnergy += this.fftBars[i];
          }
          audioEnergy /= 16;
        }

        // 2. Draw Center Boiling Oscilloscope Rings
        const ringBaseR = 55 + audioEnergy * 80;
        for (let r = 0; r < 3; r++) {
          const oscR = ringBaseR + r * 28 + Math.sin(timestamp * 0.005 + r) * 6;
          const oscRing = gen.circle(cx, cy, oscR * 2, {
            seed: 500 + r * 100 + frameIdx * 30,
            roughness: 1.5 + audioEnergy * 3.0,
            bowing: 1.5 + audioEnergy * 2.0,
            stroke: r === 0 ? amber : (r === 1 ? sage : '#4F46E5'),
            strokeWidth: 2.5,
            fill: r === 0 && audioEnergy > 0.1 ? amber : undefined,
            fillStyle: 'dots'
          });
          this.rc.draw(oscRing);
        }

        // 3. Draw Audio Spectrum Equalizer Bars
        const eqBarW = 16;
        const eqGap = 12;
        const totalEqW = 16 * (eqBarW + eqGap);
        const eqStartX = (w - totalEqW) / 2;
        const eqBaseY = h * 0.55;

        for (let i = 0; i < 16; i++) {
          const barH = 10 + this.fftBars[i] * 120;
          const bx = eqStartX + i * (eqBarW + eqGap);
          const by = eqBaseY - barH;

          const barRect = gen.rectangle(bx, by, eqBarW, barH, {
            seed: 1000 + i * 50 + frameIdx * 20,
            roughness: 1.8 + this.fftBars[i] * 2.0,
            stroke: ink,
            strokeWidth: 2,
            fill: i % 2 === 0 ? amber : sage,
            fillStyle: 'hachure',
            hachureAngle: 60
          });
          this.rc.draw(barRect);
        }

        // 4. Draw Hand-Drawn Piano Keyboard (Bottom)
        const keyW = 56;
        const keyH = 90;
        const totalKeyW = this.notes.length * (keyW + 8);
        const keyboardX = (w - totalKeyW) / 2;
        const keyboardY = h - 110;

        for (let i = 0; i < this.notes.length; i++) {
          const n = this.notes[i];
          const kx = keyboardX + i * (keyW + 8);
          const ky = keyboardY;

          this.ctx.save();
          this.ctx.translate(kx + keyW / 2, ky + keyH / 2);
          this.ctx.scale(n.scale, n.scale);

          const keySketch = gen.rectangle(-keyW / 2, -keyH / 2, keyW, keyH, {
            seed: 2000 + i * 80 + frameIdx * 15,
            roughness: 1.6,
            bowing: 1.2,
            stroke: ink,
            strokeWidth: 2.5,
            fill: n.active ? amber : (isDark ? '#1F242D' : '#FAF8F3'),
            fillStyle: n.active ? 'hachure' : 'solid'
          });
          this.rc.draw(keySketch);

          // Note label
          this.ctx.font = '700 13px "Space Grotesk", sans-serif';
          this.ctx.fillStyle = n.active && !isDark ? '#1C1917' : ink;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(n.note, 0, 10);

          this.ctx.font = '600 10px "Fira Code", monospace';
          this.ctx.fillStyle = isDark ? '#9CA3AF' : '#6B6357';
          this.ctx.fillText(`[${n.key}]`, 0, 28);

          this.ctx.restore();
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
    document.getElementById('btn-toggle-arp')?.addEventListener('click', () => this.toggleArpeggio());
    document.getElementById('btn-synth-chord')?.addEventListener('click', () => this.playChord());

    // Synth Key buttons in panel
    document.querySelectorAll('.synth-key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.triggerNote(idx);
      });
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
    if (this.arpTimer) clearInterval(this.arpTimer);
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    if (this.audioCtx) this.audioCtx.close();
  }
}
