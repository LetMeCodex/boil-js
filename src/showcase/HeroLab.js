import rough from 'roughjs';
import anime from 'animejs';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class HeroLab {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    this.mouse = { x: 0, y: 0, active: false };
    this.scrollProgress = 0;
    this.particles = [];
    this.renderLoop = null;
    this.running = false;

    this.initCanvas();
    this.initParticles();
    this.bindEvents();
    this.startRenderLoop();
  }

  initCanvas() {
    this.resizeHandler = () => {
      if (!this.canvas || !this.canvas.parentElement) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const w = Math.max(Math.floor(rect.width), 320);
      const h = Math.max(Math.floor(rect.height), 420);

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
    const h = this.height || 420;
    this.particles = [];

    // Dense grid of boiling particles for typography
    for (let i = 0; i < 220; i++) {
      const angle = (i / 220) * Math.PI * 2;
      const radius = 120 + (i % 5) * 14;
      this.particles.push({
        baseX: w / 2 + Math.cos(angle) * radius,
        baseY: h / 2 + Math.sin(angle) * (radius * 0.5),
        x: w / 2,
        y: h / 2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 3 + Math.random() * 3.5,
        color: ['#D97706', '#F59E0B', '#059669', '#4F46E5', '#1C1917'][i % 5],
        seed: Math.floor(Math.random() * 100000)
      });
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  bindEvents() {
    this.onPointerMove = (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    };

    this.onPointerLeave = () => {
      this.mouse.active = false;
    };

    this.canvas.addEventListener('mousemove', this.onPointerMove);
    this.canvas.addEventListener('mouseleave', this.onPointerLeave);
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      const w = this.width || 800;
      const h = this.height || 420;

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, w, h);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const gen = rough.generator();

        const p = this.scrollProgress;
        const breath = Math.sin(timestamp * 0.003) * 6;

        // 1. Draw Large Hand-Drawn "BOIL.JS" Geometric Typography
        if (p < 0.6) {
          const fadeAlpha = Math.max(0, 1 - p * 2.0);
          this.ctx.save();
          this.ctx.globalAlpha = fadeAlpha;

          const cx = w / 2;
          const cy = h / 2 + breath;

          // Mouse fluid magnetic pull on title
          let offsetX = 0, offsetY = 0;
          if (this.mouse.active) {
            offsetX = (this.mouse.x - cx) * 0.04;
            offsetY = (this.mouse.y - cy) * 0.04;
          }

          // Hand-Drawn Outer Orbit Ring
          const orbitRing = gen.ellipse(cx + offsetX, cy + offsetY, 340 + breath * 2, 180 + breath, {
            seed: 1000 + frameIdx * 20,
            roughness: 2.2,
            bowing: 2.0,
            stroke: isDark ? '#F59E0B' : '#D97706',
            strokeWidth: 2.5
          });
          this.rc.draw(orbitRing);

          // Center Text Typography using Canvas 2D with rough hatching overlay
          this.ctx.font = `800 ${Math.min(72, w * 0.12)}px 'Space Grotesk', sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = ink;
          this.ctx.fillText('BOIL.JS', cx + offsetX, cy + offsetY - 10);

          // Subtitle
          this.ctx.font = `600 13px 'Fira Code', monospace`;
          this.ctx.fillStyle = isDark ? '#F59E0B' : '#D97706';
          this.ctx.fillText('// KINETIC EXPERIMENTAL LAB', cx + offsetX, cy + offsetY + 38);

          this.ctx.restore();
        }

        // 2. Dynamic Orbit Particles (Fracture on scroll)
        for (let i = 0; i < this.particles.length; i++) {
          const pt = this.particles[i];

          // Interpolate based on scroll and mouse
          if (p > 0.05) {
            const expand = 1.0 + p * 3.0;
            pt.x += (pt.baseX * expand - pt.x) * 0.1 + pt.vx;
            pt.y += (pt.baseY * expand - pt.y) * 0.1 + pt.vy;
          } else {
            pt.x += (pt.baseX - pt.x) * 0.1;
            pt.y += (pt.baseY - pt.y) * 0.1;
          }

          if (this.mouse.active) {
            const dx = pt.x - this.mouse.x;
            const dy = pt.y - this.mouse.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 120) {
              pt.x += (dx / dist) * 8;
              pt.y += (dy / dist) * 8;
            }
          }

          const dot = gen.circle(pt.x, pt.y, pt.size, {
            seed: pt.seed + frameIdx * 10,
            roughness: 1.4,
            stroke: pt.color,
            fill: pt.color,
            fillStyle: 'solid'
          });
          this.rc.draw(dot);
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

  destroy() {
    this.suspend();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.canvas && this.onPointerMove) {
      this.canvas.removeEventListener('mousemove', this.onPointerMove);
      this.canvas.removeEventListener('mouseleave', this.onPointerLeave);
    }
  }
}
