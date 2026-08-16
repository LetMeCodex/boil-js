import rough from 'roughjs';
import { BoilEngine } from '../engine/BoilEngine.js';

/**
 * ============================================================================
 * ANNOTATION SYSTEM (Hand-Drawn Editorial Measurement Marks via Rough.js)
 * ============================================================================
 * Draws technical coordinates, depth vectors, and editorial annotations.
 */

export class AnnotationSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);
    this.annotations = [];
    this.initAnnotations();
  }

  initAnnotations() {
    this.annotations = [
      { text: 'DEPTH // Z = -12.0', xRatio: 0.12, yRatio: 0.28, seed: 10 },
      { text: 'PARALLAX FIELD // 0.16x', xRatio: 0.82, yRatio: 0.35, seed: 20 },
      { text: 'TERRACOTTA SUN // Ø 4.8u', xRatio: 0.74, yRatio: 0.18, seed: 30 },
      { text: 'PAPER LAYER // CLOUD_02', xRatio: 0.24, yRatio: 0.58, seed: 40 }
    ];
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

  draw(timestamp, fps = 10, scrollProgress = 0) {
    if (!this.ctx || !this.width || !this.height) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const frameIdx = BoilEngine.getFrameIndex(timestamp, fps, 4);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#A8B8C8' : '#2A3B4D';
    const accent = isDark ? '#F59E0B' : '#D95328';
    const gen = rough.generator();

    const w = this.width;
    const h = this.height;

    // 1. Editorial Measurement Lines & Crosshairs
    const lineY = h * 0.15;
    const arrow = gen.line(w * 0.08, lineY, w * 0.22, lineY, {
      seed: 500 + frameIdx * 10,
      stroke: ink,
      strokeWidth: 1.2,
      roughness: 1.4
    });
    this.rc.draw(arrow);

    // Crosshairs
    const chX = w * 0.88;
    const chY = h * 0.22;
    const ch1 = gen.line(chX - 12, chY, chX + 12, chY, { seed: 600 + frameIdx * 10, stroke: accent, strokeWidth: 1.5 });
    const ch2 = gen.line(chX, chY - 12, chX, chY + 12, { seed: 601 + frameIdx * 10, stroke: accent, strokeWidth: 1.5 });
    const chCircle = gen.circle(chX, chY, 16, { seed: 602 + frameIdx * 10, stroke: accent, strokeWidth: 1 });
    this.rc.draw(ch1);
    this.rc.draw(ch2);
    this.rc.draw(chCircle);

    // 2. Editorial Typography Labels
    this.ctx.font = `600 11px 'Fira Code', monospace`;
    this.ctx.fillStyle = ink;
    this.ctx.textAlign = 'left';

    this.annotations.forEach(ann => {
      const ax = w * ann.xRatio;
      const ay = h * ann.yRatio;

      // Small rough bullet
      const bullet = gen.circle(ax - 8, ay - 4, 4, {
        seed: ann.seed + frameIdx * 10,
        stroke: accent,
        fill: accent,
        fillStyle: 'solid'
      });
      this.rc.draw(bullet);

      this.ctx.fillText(ann.text, ax, ay);
    });
  }
}
