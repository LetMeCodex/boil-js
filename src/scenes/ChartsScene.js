import rough from 'roughjs';
import anime from 'animejs';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class ChartsScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.data = [
      { label: 'Mon', value: 45, currentVal: 45, color: '#D97706', pattern: 'hachure' },
      { label: 'Tue', value: 78, currentVal: 78, color: '#059669', pattern: 'cross-hatch' },
      { label: 'Wed', value: 32, currentVal: 32, color: '#4F46E5', pattern: 'dots' },
      { label: 'Thu', value: 92, currentVal: 92, color: '#DC2626', pattern: 'zigzag' },
      { label: 'Fri', value: 64, currentVal: 64, color: '#0284C7', pattern: 'hachure' }
    ];

    this.donutData = [
      { label: 'Organic Search', percent: 0.40, currentR: 0, color: '#D97706', pattern: 'hachure' },
      { label: 'Direct Referral', percent: 0.35, currentR: 0, color: '#059669', pattern: 'dots' },
      { label: 'Social Motion', percent: 0.25, currentR: 0, color: '#4F46E5', pattern: 'cross-hatch' }
    ];

    this.initDOM();
    this.setupCanvas();
    this.animateDataEntry();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Organic Hand-Drawn Data Visualization</span>
              <span class="toolbar-badge">Boiling Hachure & Donut Arcs</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-randomize-data" class="tactile-btn amber">
                ${renderIcon('dice')}
                <span>Randomize Dataset</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="charts-canvas-wrap">
            <canvas id="charts-stage-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">METRIC BREAKDOWN</span>
            </div>
            <div id="chart-metrics-list" style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
              ${this.data.map(d => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius-xs);">
                  <span style="display: flex; align-items: center; gap: 6px;">
                    <span style="width: 10px; height: 10px; border-radius: 2px; background: ${d.color};"></span>
                    <strong>${d.label}</strong>
                  </span>
                  <span style="font-family: 'Fira Code', monospace;">${d.value} units</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">TRAFFIC DISTRIBUTION</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem; color: var(--ink-soft);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #D97706;"></span>Organic Search</span>
                <span>40%</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #059669;"></span>Direct Referral</span>
                <span>35%</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #4F46E5;"></span>Social Motion</span>
                <span>25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('charts-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('charts-canvas-wrap');
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
  }

  animateDataEntry() {
    this.data.forEach((d, i) => {
      anime({
        targets: d,
        currentVal: [0, d.value],
        duration: 900 + i * 150,
        easing: 'easeOutElastic(1, .6)'
      });
    });
  }

  randomizeData() {
    SoundFX.playPop(520);
    this.data.forEach((d, i) => {
      const newVal = Math.floor(20 + Math.random() * 80);
      d.value = newVal;
      anime({
        targets: d,
        currentVal: newVal,
        duration: 800 + i * 100,
        easing: 'easeOutElastic(1, .6)'
      });
    });

    const metricsList = document.getElementById('chart-metrics-list');
    if (metricsList) {
      metricsList.innerHTML = this.data.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: var(--bg-surface-alt); border-radius: 6px;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: ${d.color};"></span>
            <strong>${d.label}</strong>
          </span>
          <span style="font-family: 'Fira Code', monospace;">${d.value} units</span>
        </div>
      `).join('');
    }
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';

        const w = this.width || 800;
        const h = this.height || 500;
        const gen = rough.generator();

        // 1. Draw Bar Chart (Left Side)
        const barAreaX = 60;
        const barAreaY = 60;
        const barAreaW = w * 0.52;
        const barAreaH = h - 140;
        const groundY = barAreaY + barAreaH;

        // Axes
        const yAxis = gen.line(barAreaX, barAreaY, barAreaX, groundY, {
          seed: 100 + frameIdx * 10, roughness: 1.5, stroke: ink, strokeWidth: 2
        });
        const xAxis = gen.line(barAreaX, groundY, barAreaX + barAreaW, groundY, {
          seed: 101 + frameIdx * 10, roughness: 1.5, stroke: ink, strokeWidth: 2
        });
        this.rc.draw(yAxis);
        this.rc.draw(xAxis);

        // Bars
        const barW = 38;
        const gap = (barAreaW - barW * this.data.length) / (this.data.length + 1);

        this.data.forEach((d, i) => {
          const bx = barAreaX + gap + i * (barW + gap);
          const barHeight = (d.currentVal / 100) * (barAreaH - 30);
          const by = groundY - barHeight;

          const barRect = gen.rectangle(bx, by, barW, barHeight, {
            seed: 200 + i * 50 + frameIdx * 15,
            roughness: 1.8,
            bowing: 1.5,
            stroke: ink,
            strokeWidth: 2,
            fill: d.color,
            fillStyle: d.pattern,
            hachureAngle: 60,
            fillWeight: 1.8
          });
          this.rc.draw(barRect);

          // Bar Label
          this.ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
          this.ctx.fillStyle = ink;
          this.ctx.textAlign = 'center';
          this.ctx.fillText(d.label, bx + barW / 2, groundY + 22);

          // Value Pill
          this.ctx.font = '700 11px "Fira Code", monospace';
          this.ctx.fillText(`${Math.round(d.currentVal)}`, bx + barW / 2, by - 8);
        });

        // 2. Draw Donut Chart (Right Side)
        const donutCx = w * 0.78;
        const donutCy = h * 0.45;
        const outerR = 90;
        const innerR = 45;

        // Sketched Donut Rings
        const donutOuter = gen.circle(donutCx, donutCy, outerR * 2, {
          seed: 500 + frameIdx * 20, roughness: 1.6, bowing: 1.5, stroke: ink, strokeWidth: 2,
          fill: '#D97706', fillStyle: 'hachure', hachureAngle: 45
        });
        this.rc.draw(donutOuter);

        const donutInner = gen.circle(donutCx, donutCy, innerR * 2, {
          seed: 600 + frameIdx * 20, roughness: 1.4, bowing: 1.2, stroke: ink, strokeWidth: 2,
          fill: isDark ? '#181B21' : '#FFFFFF', fillStyle: 'solid'
        });
        this.rc.draw(donutInner);

        this.ctx.font = '700 14px "Space Grotesk", sans-serif';
        this.ctx.fillStyle = ink;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('100%', donutCx, donutCy);
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-randomize-data')?.addEventListener('click', () => this.randomizeData());
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
  }
}
