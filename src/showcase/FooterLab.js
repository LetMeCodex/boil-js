import rough from 'roughjs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { getTheme } from '../utils/theme.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * ============================================================================
 * BOIL.JS — LIVING FINALE & FOOTER AMBIENT CANVAS WITH GSAP REVEAL
 * ============================================================================
 * Features:
 * 1. Full-stage ambient interactive particle constellation mesh with cursor repulsion
 * 2. Harmonic boiling ink aurora wave ribbons
 * 3. Central boiling particle halo emblem
 * 4. GSAP ScrollTrigger curtain parallax reveal
 */

export class FooterLab {
  constructor(canvasElement) {
    this.bgCanvas = canvasElement || document.getElementById('footer-living-canvas');
    this.emblemCanvas = document.getElementById('footer-emblem-canvas');
    this.footerSection = document.getElementById('section-footer');

    this.particles = [];
    this.emblemParticles = [];
    this.mouse = { x: -9999, y: -9999, active: false };
    this.renderLoop = null;
    this.running = false;

    if (this.bgCanvas) {
      this.bgCtx = this.bgCanvas.getContext('2d');
      this.bgRc = rough.canvas(this.bgCanvas);
    }
    if (this.emblemCanvas) {
      this.emblemCtx = this.emblemCanvas.getContext('2d');
      this.emblemRc = rough.canvas(this.emblemCanvas);
    }

    this.initCanvasSize();
    this.initParticles();
    this.initEmblemParticles();
    this.initMouseTracking();
    this.initScrollReveal();
    this.startRenderLoop();
  }

  initCanvasSize() {
    this.resizeHandler = () => {
      if (this.footerSection && this.bgCanvas) {
        const rect = this.footerSection.getBoundingClientRect();
        const w = Math.max(Math.floor(rect.width), window.innerWidth, 320);
        const h = Math.max(Math.floor(rect.height), Math.floor(window.innerHeight * 0.85), 520);

        this.bgCanvas.width = w;
        this.bgCanvas.height = h;
        this.bgCanvas.style.width = `${w}px`;
        this.bgCanvas.style.height = `${h}px`;
        this.bgCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.bgRc = rough.canvas(this.bgCanvas);
        this.width = w;
        this.height = h;
        this.initParticles();
      }

      if (this.emblemCanvas) {
        this.emblemCanvas.width = 220;
        this.emblemCanvas.height = 90;
        this.emblemCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.emblemRc = rough.canvas(this.emblemCanvas);
      }
    };

    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 150);
  }

  initParticles() {
    const w = this.width || window.innerWidth || 1200;
    const h = this.height || 600;
    this.particles = [];
    const count = Math.min(130, Math.floor((w * h) / 7500));

    const dayPalette = ['#D97706', '#F59E0B', '#059669', '#EF4444', '#3B82F6', '#8B5CF6'];
    const nightPalette = ['#FBBF24', '#F59E0B', '#38BDF8', '#818CF8', '#34D399', '#EC4899'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.75,
        vy: (Math.random() - 0.5) * 0.75,
        baseX: Math.random() * w,
        baseY: Math.random() * h,
        size: 3 + Math.random() * 4,
        colorIdx: i % 6,
        seed: Math.floor(Math.random() * 99999),
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }

  initEmblemParticles() {
    this.emblemParticles = [];
    const count = 64;
    const cx = 110;
    const cy = 45;
    const rx = 80;
    const ry = 30;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.emblemParticles.push({
        baseAngle: angle,
        angle: angle,
        orbitSpeed: 0.008 + (Math.random() * 0.006),
        radiusOffset: (Math.random() - 0.5) * 10,
        cx,
        cy,
        rx,
        ry,
        size: 3 + Math.random() * 3,
        colorIdx: i % 6,
        seed: Math.floor(Math.random() * 99999)
      });
    }
  }

  initMouseTracking() {
    if (!this.footerSection) return;

    this.footerSection.addEventListener('mousemove', (e) => {
      const rect = this.footerSection.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.active = true;
    });

    this.footerSection.addEventListener('mouseleave', () => {
      this.mouse.active = false;
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });
  }

  initScrollReveal() {
    if (!this.footerSection) return;

    // 1. Footer Parallax Curtain Entry
    gsap.fromTo(this.bgCanvas, {
      yPercent: -15,
      scale: 0.96
    }, {
      yPercent: 0,
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: this.footerSection,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true
      }
    });

    // 2. Staggered Content Reveal Animation
    const content = document.getElementById('footer-content-wrapper');
    if (content) {
      const items = [
        content.querySelector('.footer-registration-mark'),
        content.querySelector('.footer-brand-emblem-wrap'),
        content.querySelector('.footer-headline'),
        content.querySelector('.footer-statement'),
        content.querySelector('.footer-nav-row'),
        content.querySelector('.footer-bottom-bar')
      ].filter(Boolean);

      gsap.fromTo(items, {
        opacity: 0,
        y: 40,
        scale: 0.95
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: this.footerSection,
          start: 'top 75%',
          toggleActions: 'play none none reverse'
        }
      });
    }
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      const w = this.width || window.innerWidth || 1200;
      const h = this.height || 600;
      const frameIdx = BoilEngine.getFrameIndex(timestamp, 10, 4);
      const isDark = getTheme() === 'night';

      const dayPalette = ['#D97706', '#F59E0B', '#059669', '#EF4444', '#3B82F6', '#8B5CF6'];
      const nightPalette = ['#FBBF24', '#F59E0B', '#38BDF8', '#818CF8', '#34D399', '#EC4899'];
      const palette = isDark ? nightPalette : dayPalette;
      const ink = isDark ? '#F3F4F6' : '#1C1917';
      const lineAlpha = isDark ? '0.12' : '0.08';

      // ======================================================================
      // 1. RENDER BACKGROUND LIVING CANVAS
      // ======================================================================
      if (this.bgCtx && this.bgCanvas) {
        this.bgCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.bgCtx.clearRect(0, 0, w, h);

        const gen = rough.generator();

        // 1A. Multi-layer Undulating Boiling Harmonic Waves at the Base
        for (let wave = 0; wave < 3; wave++) {
          const waveBaseY = h - 60 - wave * 45;
          const waveSeed = 8000 + wave * 100 + frameIdx * 12;
          const phase = timestamp * 0.0012 + wave * 1.5;
          const amp = 14 + wave * 6;

          const points = [];
          const segments = 16;
          for (let s = 0; s <= segments; s++) {
            const px = (s / segments) * w;
            const py = waveBaseY + Math.sin(phase + (s * 0.6)) * amp + Math.cos(phase * 0.7 + s) * 8;
            points.push([px, py]);
          }

          this.bgCtx.save();
          this.bgCtx.globalAlpha = isDark ? 0.25 : 0.35;
          const waveColor = palette[wave % palette.length];
          const waveCurve = gen.curve(points, {
            seed: waveSeed,
            roughness: 1.6,
            stroke: waveColor,
            strokeWidth: 2
          });
          this.bgRc.draw(waveCurve);
          this.bgCtx.restore();
        }

        // 1B. Update & Render Kinetic Particles & Constellation Lattice Lines
        for (let i = 0; i < this.particles.length; i++) {
          const pt = this.particles[i];

          // Particle Motion with noise drift
          pt.x += pt.vx;
          pt.y += pt.vy;

          // Wrap edges smoothly
          if (pt.x < 0) pt.x = w;
          if (pt.x > w) pt.x = 0;
          if (pt.y < 0) pt.y = h;
          if (pt.y > h) pt.y = 0;

          // Interactive Cursor Repulsion / Attraction
          if (this.mouse.active) {
            const dx = pt.x - this.mouse.x;
            const dy = pt.y - this.mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 180 && dist > 1) {
              const force = (180 - dist) / 180;
              pt.x += (dx / dist) * force * 4;
              pt.y += (dy / dist) * force * 4;
            }
          }

          // Draw nearby Constellation Connection Lines
          for (let j = i + 1; j < this.particles.length; j++) {
            const pt2 = this.particles[j];
            const dist = Math.hypot(pt.x - pt2.x, pt.y - pt2.y);
            if (dist < 95) {
              const alpha = (1 - dist / 95) * (isDark ? 0.28 : 0.2);
              this.bgCtx.save();
              this.bgCtx.strokeStyle = isDark ? `rgba(251, 191, 36, ${alpha})` : `rgba(28, 25, 23, ${alpha})`;
              this.bgCtx.lineWidth = 1;
              this.bgCtx.beginPath();
              this.bgCtx.moveTo(pt.x, pt.y);
              this.bgCtx.lineTo(pt2.x, pt2.y);
              this.bgCtx.stroke();
              this.bgCtx.restore();
            }
          }

          // Draw Particle Node
          const ptColor = palette[pt.colorIdx];
          const pulse = Math.sin(timestamp * 0.003 + pt.pulseOffset) * 1.5;
          const node = gen.circle(pt.x, pt.y, Math.max(2, pt.size + pulse), {
            seed: pt.seed + frameIdx * 8,
            roughness: 1.4,
            stroke: ptColor,
            fill: ptColor,
            fillStyle: 'solid'
          });
          this.bgRc.draw(node);
        }
      }

      // ======================================================================
      // 2. RENDER CENTER EMBLEM CANVAS (HALO & TYPOGRAPHY)
      // ======================================================================
      if (this.emblemCtx && this.emblemCanvas) {
        this.emblemCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.emblemCtx.clearRect(0, 0, 220, 90);

        const gen = rough.generator();
        const breath = Math.sin(timestamp * 0.0035) * 3;

        // Render Orbiting Confetti Wreath
        for (let i = 0; i < this.emblemParticles.length; i++) {
          const ep = this.emblemParticles[i];
          ep.angle += ep.orbitSpeed;

          const ex = ep.cx + Math.cos(ep.angle) * (ep.rx + ep.radiusOffset);
          const ey = ep.cy + Math.sin(ep.angle) * (ep.ry + ep.radiusOffset + breath);

          const epColor = palette[ep.colorIdx];
          const spark = gen.circle(ex, ey, ep.size, {
            seed: ep.seed + frameIdx * 10,
            roughness: 1.5,
            stroke: 'transparent',
            fill: epColor,
            fillStyle: 'solid'
          });
          this.emblemRc.draw(spark);
        }

        // Center Hand-Drawn "BOIL.JS" Core
        this.emblemCtx.font = "900 32px 'Space Grotesk', sans-serif";
        this.emblemCtx.textAlign = 'center';
        this.emblemCtx.textBaseline = 'middle';
        this.emblemCtx.fillStyle = ink;
        this.emblemCtx.fillText('BOIL.JS', 110, 45 + breath * 0.5);
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
