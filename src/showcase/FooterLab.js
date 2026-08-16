import rough from 'roughjs';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class FooterLab {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);
    this.particles = [];
    this.renderLoop = null;
    this.running = false;

    this.initCanvas();
    this.initParticles();
    this.startRenderLoop();
  }

  initCanvas() {
    this.resizeHandler = () => {
      if (!this.canvas || !this.canvas.parentElement) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(Math.floor(rect.width), 320);
      const h = 240;

      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);
      this.width = w;
      this.height = h;
      this.initParticles();
    };

    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
  }

  initParticles() {
    const w = this.width || 800;
    const h = 240;
    this.particles = [];

    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2;
      const targetRadius = 110 + (i % 3) * 16;
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        targetX: w / 2 + Math.cos(angle) * targetRadius,
        targetY: h / 2 + Math.sin(angle) * (targetRadius * 0.4),
        color: ['#D97706', '#F59E0B', '#059669', '#4F46E5', '#DC2626'][i % 5],
        size: 3 + Math.random() * 3,
        seed: Math.floor(Math.random() * 100000)
      });
    }
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      const w = this.width || 800;
      const h = 240;

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, w, h);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const gen = rough.generator();

        const breath = Math.sin(timestamp * 0.003) * 4;

        // Converge particles toward center
        for (let i = 0; i < this.particles.length; i++) {
          const pt = this.particles[i];
          pt.x += (pt.targetX - pt.x) * 0.05;
          pt.y += (pt.targetY + breath - pt.y) * 0.05;

          const dot = gen.circle(pt.x, pt.y, pt.size, {
            seed: pt.seed + frameIdx * 10,
            roughness: 1.4,
            stroke: pt.color,
            fill: pt.color,
            fillStyle: 'solid'
          });
          this.rc.draw(dot);
        }

        // Center typography
        this.ctx.font = `800 36px 'Space Grotesk', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = ink;
        this.ctx.fillText('BOIL.JS', w / 2, h / 2 + breath);
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

  destroy() {
    this.suspend();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }
}
