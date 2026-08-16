import rough from 'roughjs';
import anime from 'animejs';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { getTheme, initTheme, subscribeTheme, toggleTheme } from '../utils/theme.js';

/**
 * ============================================================================
 * BOIL.JS — CUSTOM HANDMADE 3D CELESTIAL DAY/NIGHT SWITCH
 * ============================================================================
 * Built purely with Rough.js hand-drawn canvas rendering & Anime.js spring motion.
 * 
 * Features:
 * 1. Hand-drawn Rough.js tactile paper pill chassis with line-boiling
 * 2. Volumetric hand-drawn rough clouds that drift & dissolve via Anime.js
 * 3. Sketchy twinkling rough starfield with cross-hatch flares
 * 4. 3D tactile Sun / Moon orb with boiling sun rays, lunar craters & paper shadow
 * 5. Anime.js elastic spring transition + squash & stretch
 * 6. SoundFX acoustic pop & global ThemeController integration
 */

export class ThemeToggle {
  constructor(buttonEl) {
    this.button = buttonEl || document.getElementById('theme-toggle-btn');
    if (!this.button) return;

    this.initDOM();
    this.initCanvas();
    this.initState();
    this.bindEvents();

    // Initial state sync
    const initialTheme = initTheme();
    this.renderState(initialTheme, false);

    // Subscribe to global theme store
    this.unsubscribe = subscribeTheme((theme) => {
      this.renderState(theme, true);
    });

    this.startRenderLoop();
  }

  initDOM() {
    this.button.innerHTML = `
      <canvas id="rough-theme-switch-canvas" class="rough-switch-canvas" width="168" height="84"></canvas>
    `;
    this.canvas = this.button.querySelector('#rough-theme-switch-canvas');
  }

  initCanvas() {
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);
    this.dpr = window.devicePixelRatio || 2;

    // Logical dimensions: 84x42
    this.w = 84;
    this.h = 42;

    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.ctx.scale(this.dpr, this.dpr);
  }

  initState() {
    const isNight = getTheme() === 'night';
    this.state = {
      progress: isNight ? 1 : 0,
      orbX: isNight ? 62 : 22,
      orbY: 21,
      orbSquishX: 1,
      orbSquishY: 1,
      orbRotation: isNight ? Math.PI : 0,
      sunRaysScale: isNight ? 0 : 1,
      craterScale: isNight ? 1 : 0,
      cloudsY: isNight ? 30 : 0,
      cloudsOpacity: isNight ? 0 : 1,
      starsY: isNight ? 0 : -22,
      starsOpacity: isNight ? 1 : 0
    };
  }

  renderState(theme, animated = true) {
    const night = theme === 'night';
    this.button.setAttribute('aria-checked', String(night));
    this.button.setAttribute('aria-label', night ? 'Switch to Daybreak [T]' : 'Switch to Nightfall [T]');
    this.button.title = night ? 'Daybreak [T]' : 'Nightfall [T]';

    if (!animated) {
      this.state.progress = night ? 1 : 0;
      this.state.orbX = night ? 62 : 22;
      this.state.sunRaysScale = night ? 0 : 1;
      this.state.craterScale = night ? 1 : 0;
      this.state.cloudsY = night ? 30 : 0;
      this.state.cloudsOpacity = night ? 0 : 1;
      this.state.starsY = night ? 0 : -22;
      this.state.starsOpacity = night ? 1 : 0;
      return;
    }

    // Anime.js Elastic Spring Transition
    anime.remove(this.state);

    anime({
      targets: this.state,
      progress: night ? 1 : 0,
      orbX: night ? 62 : 22,
      sunRaysScale: night ? 0 : 1,
      craterScale: night ? 1 : 0,
      cloudsY: night ? 30 : 0,
      cloudsOpacity: night ? 0 : 1,
      starsY: night ? 0 : -22,
      starsOpacity: night ? 1 : 0,
      duration: 650,
      easing: 'spring(1, 80, 12, 0)'
    });

    // Tactile Squash & Stretch Physics
    anime({
      targets: this.state,
      orbSquishX: [1, 1.25, 0.92, 1],
      orbSquishY: [1, 0.8, 1.1, 1],
      duration: 550,
      easing: 'easeOutElastic(1, 0.5)'
    });
  }

  startRenderLoop() {
    let running = true;

    const render = (timestamp) => {
      if (!this.ctx || !this.canvas) return;

      const ctx = this.ctx;
      const rc = this.rc;
      const w = this.w;
      const h = this.h;
      const frameIdx = BoilEngine.getFrameIndex(timestamp, 10, 4);

      ctx.clearRect(0, 0, w, h);

      const p = this.state.progress; // 0 (day) to 1 (night)

      // ======================================================================
      // 1. TACTILE PAPER CHASSIS PILL
      // ======================================================================
      ctx.save();
      // Clip inside smooth rounded pill
      ctx.beginPath();
      ctx.roundRect(2, 2, w - 4, h - 4, 19);
      ctx.clip();

      // Sky background fill
      const daySky = '#4A90E2';
      const nightSky = '#13192B';
      const skyGrad = ctx.createLinearGradient(0, 0, w, h);
      if (p < 0.5) {
        skyGrad.addColorStop(0, '#3A7BD5');
        skyGrad.addColorStop(1, '#68A8F4');
      } else {
        skyGrad.addColorStop(0, '#101420');
        skyGrad.addColorStop(1, '#1A2035');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Procedural paper hatching inside chassis
      rc.rectangle(2, 2, w - 4, h - 4, {
        seed: 1000 + frameIdx * 10,
        roughness: 1.4,
        stroke: 'transparent',
        fill: p > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
        fillStyle: p > 0.5 ? 'dots' : 'zigzag',
        hachureGap: 6
      });

      // 3D Inner Bevel Shadow
      const innerShadow = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 45);
      innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
      innerShadow.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = innerShadow;
      ctx.fillRect(0, 0, w, h);

      // ======================================================================
      // 2. HAND-DRAWN ROUGH.JS CLOUDS (DAY)
      // ======================================================================
      if (this.state.cloudsOpacity > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.state.cloudsOpacity;
        const cy = this.state.cloudsY;

        // Cloud cluster 1 (Main Puffy Cloud)
        rc.ellipse(60, 26 + cy, 26, 12, {
          seed: 2000 + frameIdx * 8,
          roughness: 1.3,
          stroke: '#CBD5E1',
          strokeWidth: 1.2,
          fill: '#FFFFFF',
          fillStyle: 'solid'
        });
        rc.circle(54, 21 + cy, 14, {
          seed: 2100 + frameIdx * 8,
          roughness: 1.2,
          stroke: '#CBD5E1',
          strokeWidth: 1.2,
          fill: '#FFFFFF',
          fillStyle: 'solid'
        });
        rc.circle(66, 23 + cy, 11, {
          seed: 2200 + frameIdx * 8,
          roughness: 1.2,
          stroke: '#CBD5E1',
          strokeWidth: 1.2,
          fill: '#FFFFFF',
          fillStyle: 'solid'
        });

        // Cloud cluster 2 (Background Subtle Cloud)
        rc.ellipse(42, 16 + cy, 18, 8, {
          seed: 2300 + frameIdx * 8,
          roughness: 1.2,
          stroke: 'transparent',
          fill: 'rgba(255,255,255,0.65)',
          fillStyle: 'solid'
        });
        ctx.restore();
      }

      // ======================================================================
      // 3. HAND-DRAWN ROUGH.JS STARFIELD (NIGHT)
      // ======================================================================
      if (this.state.starsOpacity > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.state.starsOpacity;
        const sy = this.state.starsY;

        const stars = [
          { x: 18, y: 12 + sy, size: 3.5, seed: 3000 },
          { x: 30, y: 22 + sy, size: 2.5, seed: 3100 },
          { x: 14, y: 28 + sy, size: 3.0, seed: 3200 },
          { x: 36, y: 11 + sy, size: 2.0, seed: 3300 }
        ];

        stars.forEach((st, idx) => {
          const twinkle = Math.sin(timestamp * 0.004 + idx * 1.5) * 0.6 + 0.9;
          const sz = st.size * twinkle;

          // Cross sparkle rays
          rc.line(st.x - sz * 1.5, st.y, st.x + sz * 1.5, st.y, {
            seed: st.seed + frameIdx * 5,
            roughness: 1.2,
            stroke: '#FBBF24',
            strokeWidth: 1.2
          });
          rc.line(st.x, st.y - sz * 1.5, st.x, st.y + sz * 1.5, {
            seed: st.seed + 50 + frameIdx * 5,
            roughness: 1.2,
            stroke: '#FBBF24',
            strokeWidth: 1.2
          });

          // Star core dot
          rc.circle(st.x, st.y, sz, {
            seed: st.seed + 100 + frameIdx * 5,
            roughness: 1.1,
            stroke: 'transparent',
            fill: '#FFFFFF',
            fillStyle: 'solid'
          });
        });
        ctx.restore();
      }

      // ======================================================================
      // 4. 3D TACTILE HAND-DRAWN SUN / MOON ORB
      // ======================================================================
      const ox = this.state.orbX;
      const oy = this.state.orbY;
      const r = 12.5;

      // 4A. 3D Tactile Paper Drop Shadow Under Orb
      rc.ellipse(ox + 1.5, oy + 2.5, (r * 2) * this.state.orbSquishX, (r * 2) * this.state.orbSquishY, {
        seed: 4000 + frameIdx * 5,
        roughness: 1.4,
        stroke: 'transparent',
        fill: 'rgba(0,0,0,0.3)',
        fillStyle: 'solid'
      });

      // 4B. Boiling Sun Rays (Day Mode)
      if (this.state.sunRaysScale > 0.05) {
        ctx.save();
        ctx.globalAlpha = this.state.sunRaysScale;
        const rayRot = timestamp * 0.001;
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
          const angle = rayRot + (i * Math.PI * 2) / numRays;
          const innerR = r + 2;
          const outerR = r + 5.5 * this.state.sunRaysScale;
          const x1 = ox + Math.cos(angle) * innerR;
          const y1 = oy + Math.sin(angle) * innerR;
          const x2 = ox + Math.cos(angle) * outerR;
          const y2 = oy + Math.sin(angle) * outerR;

          rc.line(x1, y1, x2, y2, {
            seed: 5000 + i * 20 + frameIdx * 8,
            roughness: 1.5,
            stroke: '#F59E0B',
            strokeWidth: 1.6
          });
        }
        ctx.restore();
      }

      // 4C. Orb Main Body (Color blend between Golden Sun and Silver Moon)
      const orbColor = p < 0.5 ? '#F59E0B' : '#E2E8F0';
      const orbStroke = p < 0.5 ? '#D97706' : '#64748B';

      // 3D Sphere Highlight Contour
      rc.circle(ox, oy, (r * 2) * this.state.orbSquishX, {
        seed: 6000 + frameIdx * 10,
        roughness: 1.3,
        stroke: orbStroke,
        strokeWidth: 1.8,
        fill: orbColor,
        fillStyle: 'solid'
      });

      // Subtle Sun Arc Highlight (Day)
      if (p < 0.7) {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        rc.arc(ox - 3, oy - 3, 13, 13, -Math.PI * 0.8, Math.PI * 0.2, false, {
          seed: 6500 + frameIdx * 8,
          roughness: 1.2,
          stroke: '#FEF08A',
          strokeWidth: 2
        });
        ctx.restore();
      }

      // 4D. Lunar Craters (Night Mode)
      if (this.state.craterScale > 0.05) {
        ctx.save();
        ctx.globalAlpha = this.state.craterScale;
        const cs = this.state.craterScale;

        // Crater 1 (Top Left)
        rc.circle(ox - 3.5, oy - 3.5, 6 * cs, {
          seed: 7000 + frameIdx * 8,
          roughness: 1.4,
          stroke: '#475569',
          strokeWidth: 1.2,
          fill: '#94A3B8',
          fillStyle: 'cross-hatch',
          hachureGap: 2.5
        });

        // Crater 2 (Bottom Right)
        rc.circle(ox + 4, oy + 3, 4.5 * cs, {
          seed: 7100 + frameIdx * 8,
          roughness: 1.4,
          stroke: '#475569',
          strokeWidth: 1.2,
          fill: '#94A3B8',
          fillStyle: 'cross-hatch',
          hachureGap: 2.5
        });

        // Crater 3 (Bottom Left)
        rc.circle(ox - 3, oy + 4.5, 3.5 * cs, {
          seed: 7200 + frameIdx * 8,
          roughness: 1.4,
          stroke: '#475569',
          strokeWidth: 1.2,
          fill: '#94A3B8',
          fillStyle: 'cross-hatch',
          hachureGap: 2.5
        });
        ctx.restore();
      }

      ctx.restore(); // restore clipping

      // ======================================================================
      // 5. SKETCHY ROUGH.JS PILL OUTER BORDER
      // ======================================================================
      const borderStroke = p > 0.5 ? '#475569' : '#1E293B';
      rc.path(`M 21 2 L ${w - 21} 2 A 19 19 0 0 1 ${w - 21} ${h - 2} L 21 ${h - 2} A 19 19 0 0 1 21 2 Z`, {
        seed: 8000 + frameIdx * 10,
        roughness: 1.5,
        stroke: borderStroke,
        strokeWidth: 2,
        fill: 'transparent'
      });

      this.animFrame = requestAnimationFrame(render);
    };

    this.animFrame = requestAnimationFrame(render);
  }

  bindEvents() {
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      const current = getTheme();
      const next = current === 'night' ? 'day' : 'night';
      toggleTheme();
      try {
        SoundFX.playPop(next === 'night' ? 620 : 480);
      } catch (err) {
        // audio fallback
      }
    });

    // Hover scale spring
    this.button.addEventListener('mouseenter', () => {
      anime({
        targets: this.button,
        scale: 1.06,
        translateY: -2,
        duration: 350,
        easing: 'easeOutElastic(1, 0.6)'
      });
    });

    this.button.addEventListener('mouseleave', () => {
      anime({
        targets: this.button,
        scale: 1,
        translateY: 0,
        duration: 350,
        easing: 'easeOutElastic(1, 0.6)'
      });
    });
  }

  destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
