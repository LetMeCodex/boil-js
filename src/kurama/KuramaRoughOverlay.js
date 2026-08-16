import rough from 'roughjs';
import { BoilEngine } from '../engine/BoilEngine.js';

/**
 * ============================================================================
 * KURAMA ROUGH.JS 2D ANNOTATION OVERLAY
 * ============================================================================
 * Hand-drawn chakra circles, targeting marks, tail guides, and technical vectors.
 */

export class KuramaRoughOverlay {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);
  }

  resize(width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;
  }

  render(timestamp, progress, chakraIntensity, boilFps = 10) {
    const w = this.width || 800;
    const h = this.height || 500;

    this.ctx.clearRect(0, 0, w, h);

    const frameIdx = BoilEngine.getFrameIndex(timestamp, boilFps, 4);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';
    const orange = '#EA580C';
    const crimson = '#DC2626';
    const gen = rough.generator();

    const cx = w / 2;
    const cy = h / 2 - 20;

    // 1. Concentric Chakra Circles (Expands on awaken & surge)
    if (progress > 0.15) {
      const radius = 60 + progress * 80 + chakraIntensity * 40;
      const chakraRing1 = gen.circle(cx, cy, radius * 2, {
        seed: 1000 + frameIdx * 20,
        roughness: 2.2,
        bowing: 1.8,
        stroke: orange,
        strokeWidth: 2,
        fill: 'transparent'
      });
      this.rc.draw(chakraRing1);

      if (progress > 0.4) {
        const chakraRing2 = gen.circle(cx, cy, (radius + 35) * 2, {
          seed: 1050 + frameIdx * 20,
          roughness: 1.8,
          stroke: crimson,
          strokeWidth: 1.5
        });
        this.rc.draw(chakraRing2);
      }
    }

    // 2. Vector Targeting Angles & Arrows
    if (progress > 0.35 && progress < 0.9) {
      const arrowLen = 50 + progress * 30;
      const arrowX = cx + 140;
      const arrowY = cy - 60;

      const vectorLine = gen.line(arrowX, arrowY, arrowX + arrowLen, arrowY - 40, {
        seed: 2000 + frameIdx * 10,
        roughness: 1.8,
        stroke: orange,
        strokeWidth: 2
      });
      this.rc.draw(vectorLine);

      this.ctx.font = "600 11px 'Fira Code', monospace";
      this.ctx.fillStyle = orange;
      this.ctx.fillText('CHAKRA VECTOR ↗', arrowX + 10, arrowY - 48);
      this.ctx.fillText(`MAGNITUDE: ${Math.round(progress * 100)}%`, arrowX + 10, arrowY - 34);
    }

    // 3. Tail Construction Annotations (During Phase 04 / Nine Tails)
    if (progress > 0.55) {
      const activeTails = Math.min(9, Math.floor(((progress - 0.55) / 0.35) * 9) + 1);

      // Bottom left technical callout
      const boxX = 24;
      const boxY = h - 90;
      const guideBox = gen.rectangle(boxX, boxY, 200, 65, {
        seed: 3000 + frameIdx * 10,
        roughness: 1.4,
        stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
        strokeWidth: 1.5,
        fill: isDark ? 'rgba(18,19,22,0.85)' : 'rgba(255,255,255,0.85)',
        fillStyle: 'solid'
      });
      this.rc.draw(guideBox);

      this.ctx.font = "700 10px 'Fira Code', monospace";
      this.ctx.fillStyle = crimson;
      this.ctx.fillText(`// TAIL_SYNC: 0${activeTails} / 09 ACTIVE`, boxX + 12, boxY + 22);

      this.ctx.font = "500 10px 'Fira Code', monospace";
      this.ctx.fillStyle = isDark ? '#A8A29E' : '#57534E';
      this.ctx.fillText(`CURVE: CATMULL_ROM_3D`, boxX + 12, boxY + 38);
      this.ctx.fillText(`INSTINCT_STABILITY: 98.6%`, boxX + 12, boxY + 52);
    }

    // 4. Charge Pulse Waves
    if (chakraIntensity > 0.05) {
      const pulseR = 40 + chakraIntensity * 120;
      const pulseCircle = gen.circle(cx, cy, pulseR * 2, {
        seed: 4000 + frameIdx * 30,
        roughness: 2.5,
        bowing: 2.2,
        stroke: '#F59E0B',
        strokeWidth: 3
      });
      this.rc.draw(pulseCircle);
    }
  }
}
