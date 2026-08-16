/**
 * ============================================================================
 * HAND-DRAWN PENCIL SPARKLE CURSOR TRAIL
 * ============================================================================
 */

export class CursorTrail {
  constructor() {
    this.particles = [];
    this.enabled = true;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.canvas.style.position = 'fixed';
    this.canvas.style.inset = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindMouse();
    this.startLoop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindMouse() {
    let lastX = 0;
    let lastY = 0;

    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 8) {
        lastX = e.clientX;
        lastY = e.clientY;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const color = isDark ? '#F59E0B' : '#D97706';

        this.particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 + 0.5,
          size: 2.5 + Math.random() * 2.5,
          alpha: 0.8,
          color
        });

        if (this.particles.length > 35) {
          this.particles.shift();
        }
      }
    });
  }

  startLoop() {
    const loop = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
