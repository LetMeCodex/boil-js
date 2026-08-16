import rough from 'roughjs';

/**
 * ============================================================================
 * KINETIC COLLAGE SCENE — Procedural Paper-Collage Landscape on Canvas 2D
 * ============================================================================
 * Layers (sky / far mountains / clouds / sun / foreground / annotations / grain)
 * are pre-rendered into offscreen sprites once, then composited every frame
 * with damped mouse parallax, scroll camera travel, and a grain pass.
 */

export const PALETTE = {
  sky: "#cfdae2",
  skyLow: "#e7e0d2",
  paper: "#f6f1e7",
  ivory: "#f3ece0",
  cream: "#e6dcc9",
  sun: "#d15a2b",
  sunDeep: "rgba(184, 72, 34, 0.38)",
  navy: "#233247",
  navyMid: "#1b2637",
  navyNear: "#141c29",
  ink: "#2b2521",
  graphite: "#6d6760"
};

/* Deterministic PRNG -------------------------------------------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

/* Sprite Factory ------------------------------------------------------ */
function makeSprite(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(w));
  canvas.height = Math.max(1, Math.floor(h));
  const ctx = canvas.getContext("2d");
  return { s: { canvas, w: canvas.width, h: canvas.height }, ctx };
}

/** Hand-cut paper edge: jittered ridge line with fibrous micro-noise */
function ridgePath(ctx, w, h, peaks, rnd, jitter) {
  ctx.beginPath();
  ctx.moveTo(-4, h + 4);
  const steps = 140;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    let y = 0;
    for (let p = 0; p < peaks.length; p += 3) {
      const cx = peaks[p] * w;
      const amp = peaks[p + 1] * h;
      const width = peaks[p + 2] * w;
      const d = Math.abs(x - cx) / width;
      y += amp * Math.max(0, 1 - d * d * (0.6 + d * 0.5));
    }
    const fiber = (rnd() - 0.5) * jitter + Math.sin(x * 0.09) * jitter * 0.5;
    ctx.lineTo(x, h - y + fiber);
  }
  ctx.lineTo(w + 4, h + 4);
  ctx.closePath();
}

function paperFill(ctx, w, h, base, rnd, flecks = 240) {
  ctx.fillStyle = base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Tonal variation
  const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, "rgba(255,255,255,0.09)");
  g.addColorStop(1, "rgba(0,0,0,0.10)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Printing imperfections
  for (let i = 0; i < flecks; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    ctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd());
  }
  ctx.restore();
}

export class KineticCollageScene {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.quality = opts.quality || "desktop";

    this.dpr = 1;
    this.W = 0;
    this.H = 0;
    this.raf = 0;
    this.last = 0;
    this.t = 0;

    this.mouse = { x: 0, y: 0 };
    this.mouseD = { x: 0, y: 0 };
    this.scroll = 0;
    this.scrollD = 0;
    this.experiment = -1;
    this.experimentD = -1;
    this.reduced = false;
    this.visible = true;

    this.clouds = [];
    this.fragments = [];
    this.annotations = [];
  }

  /* Public API --------------------------------------------------------- */
  init() {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    this.last = performance.now();
    this.startLoop();
  }

  startLoop() {
    if (this.raf) return;
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(48, now - this.last) / 1000;
      this.last = now;
      if (!this.visible) return;
      this.update(dt);
      this.render();
    };
    this.raf = requestAnimationFrame(loop);
  }

  suspend() {
    this.visible = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  resume() {
    this.visible = true;
    this.last = performance.now();
    this.startLoop();
  }

  setMouse(x, y) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  setScroll(p) {
    this.scroll = Math.min(1, Math.max(0, p));
  }

  setExperiment(index) {
    this.experiment = index;
  }

  setReducedMotion(v) {
    this.reduced = v;
  }

  setVisible(v) {
    this.visible = v;
    if (!v) this.suspend();
    else this.resume();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    this.W = this.canvas.clientWidth || window.innerWidth;
    this.H = this.canvas.clientHeight || window.innerHeight;
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.build();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.clouds = [];
    this.fragments = [];
    this.annotations = [];
  }

  /* Build Layers & Offscreen Sprites ------------------------------------ */
  build() {
    const W = this.W;
    const H = this.H;
    const mobile = this.quality === "mobile";

    // 1. Sky Wash
    {
      const { s, ctx } = makeSprite(W * 1.2, H * 1.2);
      const g = ctx.createLinearGradient(0, 0, 0, s.h);
      g.addColorStop(0, PALETTE.sky);
      g.addColorStop(0.62, "#dfdfd8");
      g.addColorStop(1, PALETTE.skyLow);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s.w, s.h);
      const rnd = mulberry32(7);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
        ctx.fillRect(rnd() * s.w, rnd() * s.h, 1.5, 1.5);
      }
      this.sky = s;
    }

    // 2. Sun — Irregular Printed Disc
    {
      const R = Math.min(W, H) * (mobile ? 0.24 : 0.19);
      const { s, ctx } = makeSprite(R * 2.6, R * 2.6);
      const rnd = mulberry32(21);
      const cx = s.w / 2;
      const cy = s.h / 2;
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        const r = R * (1 + Math.sin(a * 3.1) * 0.012 + Math.sin(a * 7.7) * 0.008 + (rnd() - 0.5) * 0.014);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      paperFill(ctx, s.w, s.h, PALETTE.sun, mulberry32(3), 320);
      const rc = rough.canvas(s.canvas);
      rc.circle(cx, cy, R * 2.08, {
        stroke: PALETTE.ink,
        strokeWidth: 1,
        roughness: 2.1,
        seed: 12
      });
      this.sun = s;
    }

    // 3. Mountain Ranges
    const range = (seed, hFactor, color, peaks, jitter, annotate) => {
      const { s, ctx } = makeSprite(W * 1.25, H * hFactor);
      const rnd = mulberry32(seed);
      ridgePath(ctx, s.w, s.h, peaks, rnd, jitter);
      paperFill(ctx, s.w, s.h, color, mulberry32(seed + 5), 420);
      if (annotate) {
        const rc = rough.canvas(s.canvas);
        rc.line(s.w * 0.12, s.h * 0.55, s.w * 0.3, s.h * 0.42, {
          stroke: "rgba(246,241,231,0.45)",
          roughness: 2.4,
          strokeWidth: 1,
          seed: seed
        });
      }
      return s;
    };
    this.far = range(41, 0.5, PALETTE.navy, [0.18, 0.72, 0.22, 0.52, 0.95, 0.18, 0.82, 0.6, 0.24], 1.4, true);
    this.mid = range(77, 0.42, PALETTE.navyMid, [0.32, 0.86, 0.2, 0.66, 0.62, 0.16, 0.9, 0.78, 0.22], 1.8, false);
    this.front = range(103, 0.34, PALETTE.navyNear, [0.1, 0.9, 0.26, 0.48, 0.72, 0.2, 0.86, 0.95, 0.28], 2.4, false);

    // 4. Clouds
    const cloudCount = mobile ? 4 : this.quality === "tablet" ? 6 : 8;
    this.clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const rnd = mulberry32(200 + i * 31);
      const cw = W * (0.22 + rnd() * 0.26);
      const ch = cw * (0.3 + rnd() * 0.16);
      const { s, ctx } = makeSprite(cw, ch * 1.6);
      const lobes = 6 + Math.floor(rnd() * 4);
      const tone = i % 3 === 0 ? PALETTE.cream : i % 3 === 1 ? PALETTE.ivory : PALETTE.paper;

      const discs = [];
      for (let l = 0; l < lobes; l++) {
        const t = l / (lobes - 1);
        const bell = Math.sin(Math.PI * t) ** 0.7;
        discs.push({
          x: cw * (0.12 + t * 0.76),
          y: ch * (1.02 - bell * 0.16),
          r: ch * (0.22 + bell * (0.38 + rnd() * 0.2))
        });
      }
      for (let l = 0; l < lobes - 1; l++) {
        discs.push({
          x: cw * (0.18 + ((l + 0.5) / (lobes - 1)) * 0.7),
          y: ch * 1.06,
          r: ch * (0.24 + rnd() * 0.14)
        });
      }
      const paintDiscs = (fill, dx = 0, dy = 0) => {
        ctx.fillStyle = fill;
        for (const d of discs) {
          ctx.beginPath();
          ctx.arc(d.x + dx, d.y + dy, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      paintDiscs("rgba(30,36,48,0.10)", 3, 4); // Paper drop shadow
      paintDiscs(tone);

      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      const gr = ctx.createLinearGradient(0, 0, s.w * 0.4, s.h);
      gr.addColorStop(0, "rgba(255,255,255,0.10)");
      gr.addColorStop(1, "rgba(0,0,0,0.09)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, s.w, s.h);
      const fr = mulberry32(300 + i);
      for (let f = 0; f < 200; f++) {
        ctx.fillStyle = fr() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
        ctx.fillRect(fr() * s.w, fr() * s.h, 1 + fr() * 2, 1 + fr());
      }
      ctx.restore();

      const rc = rough.canvas(s.canvas);
      rc.curve(
        [
          [cw * 0.12, ch * 1.16],
          [cw * 0.4, ch * 1.24],
          [cw * 0.72, ch * 1.12],
          [cw * 0.9, ch * 1.2]
        ],
        { stroke: "rgba(43,37,33,0.30)", roughness: 2.6, strokeWidth: 1, seed: 9 + i }
      );

      this.clouds.push({
        sprite: s,
        x: rnd() * W * 1.4 - W * 0.2,
        y: H * (0.04 + rnd() * 0.26),
        speed: 0.008 + (i % 3) * 0.0065,
        depth: 0.06 + (i % 3) * 0.035,
        scale: 0.7 + rnd() * 0.32,
        phase: rnd() * Math.PI * 2
      });
    }

    // 5. Hand-Drawn Editorial Annotations
    this.annotations = [];
    const notes = [
      ["DEPTH / 04", 0.08, 0.3, 0.05],
      ["PARALLAX", 0.74, 0.2, 0.09],
      ["PAPER LAYER  Z = -3.2", 0.56, 0.72, 0.13],
      ["MOTION VECTOR", 0.2, 0.66, 0.11]
    ];
    for (const [text, nx, ny, depth] of notes) {
      const { s, ctx } = makeSprite(260, 76);
      const rc = rough.canvas(s.canvas);
      ctx.font = "500 10px 'Fira Code', monospace";
      ctx.fillStyle = "rgba(43,37,33,0.62)";
      ctx.fillText(text, 26, 30);
      const tw = ctx.measureText(text).width + 20;
      rc.line(26, 38, 26 + tw, 38, { stroke: "rgba(209,90,43,0.7)", roughness: 2.2, strokeWidth: 1, seed: 5 });
      rc.circle(12, 26, 12, { stroke: "rgba(43,37,33,0.45)", roughness: 2.4, strokeWidth: 1, seed: 8 });
      rc.line(30, 52, 74, 66, { stroke: "rgba(43,37,33,0.35)", roughness: 2.6, strokeWidth: 1, seed: 3 });
      this.annotations.push({ sprite: s, x: nx * W, y: ny * H, depth });
    }

    // 6. Paper Fragments
    const fragCount = mobile ? 26 : this.quality === "tablet" ? 44 : 70;
    this.fragments = [];
    const fr = mulberry32(909);
    for (let i = 0; i < fragCount; i++) {
      this.fragments.push({
        x: fr() * W,
        y: fr() * H,
        w: 4 + fr() * 12,
        r: fr() * Math.PI,
        vx: (fr() - 0.5) * 10,
        vy: -6 - fr() * 16,
        spin: (fr() - 0.5) * 0.6,
        a: 0,
        tone: [PALETTE.ivory, PALETTE.sun, PALETTE.cream, PALETTE.navy][i % 4]
      });
    }

    // 7. Grain Tile
    {
      const size = this.quality === "mobile" ? 96 : 160;
      const { s, ctx } = makeSprite(size, size);
      const img = ctx.createImageData(size, size);
      const rnd = mulberry32(1234);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 120 + rnd() * 135;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 26;
      }
      ctx.putImageData(img, 0, 0);
      this.grain = s;
    }
  }

  /* Update -------------------------------------------------------------- */
  update(dt) {
    const k = this.reduced ? 1 : 1 - Math.pow(0.001, dt);
    this.mouseD.x = lerp(this.mouseD.x, this.reduced ? 0 : this.mouse.x, k * 0.9);
    this.mouseD.y = lerp(this.mouseD.y, this.reduced ? 0 : this.mouse.y, k * 0.9);
    this.scrollD = lerp(this.scrollD, this.scroll, k);
    this.experimentD = lerp(this.experimentD, this.experiment, k * 0.5);
    if (!this.reduced) this.t += dt;

    // Clouds drift with sine modulation, plus cursor "wind"
    const wind = this.mouseD.x * 22;
    for (const c of this.clouds) {
      const s = this.reduced ? 0 : c.speed * this.W * (1 + Math.sin(this.t * 0.13 + c.phase) * 0.35);
      c.x += (s + wind * c.depth) * dt;
      if (c.x > this.W * 1.25) c.x = -c.sprite.w;
      if (c.x < -c.sprite.w * 1.4) c.x = this.W * 1.2;
    }

    // Fragments: lift only when an experiment asks for it
    const lift = this.fragmentEnergy();
    for (const f of this.fragments) {
      f.a = lerp(f.a, lift, dt * 1.4);
      if (f.a > 0.01 && !this.reduced) {
        f.x += (f.vx + Math.sin(this.t * 0.7 + f.r) * 8) * dt * f.a;
        f.y += f.vy * dt * f.a;
        f.r += f.spin * dt;
        if (f.y < -20) {
          f.y = this.H + 20;
          f.x = Math.random() * this.W;
        }
      }
    }
  }

  /** How much the world is coming apart, per active experiment */
  fragmentEnergy() {
    const e = this.experiment;
    if (e < 0) return 0;
    return [0.35, 0.45, 0.2, 0.25, 0.15, 1, 0.3, 0.1, 0.55][e] || 0.2;
  }

  /* Render -------------------------------------------------------------- */
  render() {
    const ctx = this.ctx;
    const { W, H } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = PALETTE.paper;
    ctx.fillRect(0, 0, W, H);

    const breathe = this.reduced ? 0 : Math.sin(this.t * 0.25) * 4;
    const s = this.scrollD;
    const zoom = 1 + s * 0.14 + Math.max(0, this.experimentD) * 0.006;
    const mx = this.mouseD.x;
    const my = this.mouseD.y;

    const layer = (sprite, depth, baseX, baseY, scale = 1, alpha = 1) => {
      if (!sprite) return;
      ctx.globalAlpha = alpha;
      const sc = scale * (1 + depth * (zoom - 1) * 4);
      const x = baseX - mx * depth * W * 0.09 - (sprite.w * sc - sprite.w) / 2;
      const y = baseY - my * depth * H * 0.07 + breathe * depth * 6 + s * depth * H * 1.1;
      ctx.drawImage(sprite.canvas, x, y, sprite.w * sc, sprite.h * sc);
      ctx.globalAlpha = 1;
    };

    // 1. Sky
    layer(this.sky, 0.02, -W * 0.1, -H * 0.1);

    // 2. Sun — behind clouds, subtle vertical travel
    if (this.sun) {
      const sunY = H * 0.3 + Math.sin(this.t * 0.08) * 10 + s * H * 0.5;
      const sx = W * (this.quality === "mobile" ? 0.5 : 0.66) - this.sun.w / 2 - mx * 0.08 * W * 0.09;
      ctx.globalAlpha = 0.96;
      ctx.drawImage(this.sun.canvas, sx, sunY - this.sun.h / 2 - my * 0.08 * H * 0.07);
      ctx.globalAlpha = 1;
    }

    // 3. Far mountains
    layer(this.far, 0.05, -W * 0.12, H - this.far.h + H * 0.06);

    // 4. Cloud layer 01 (behind mid range)
    this.drawClouds(0, 3);

    // 5. Mid mountains
    layer(this.mid, 0.1, -W * 0.12, H - this.mid.h + H * 0.1);

    // 6. Cloud layer 02 (in front)
    this.drawClouds(3, this.clouds.length);

    // 7. Foreground mountain
    layer(this.front, 0.16, -W * 0.12, H - this.front.h + H * 0.16);

    // 8. Paper fragments lifting off the collage
    ctx.save();
    for (const f of this.fragments) {
      if (f.a < 0.02) continue;
      ctx.globalAlpha = Math.min(0.75, f.a);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.r);
      ctx.fillStyle = f.tone;
      ctx.fillRect(-f.w / 2, -f.w / 3, f.w, f.w * 0.66);
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // 9. Editorial annotations
    for (const a of this.annotations) {
      ctx.globalAlpha = 0.9 * (1 - Math.min(1, s * 1.6));
      ctx.drawImage(
        a.sprite.canvas,
        a.x - mx * a.depth * W * 0.03,
        a.y - my * a.depth * H * 0.03 + Math.sin(this.t * 0.3 + a.depth * 9) * 2
      );
    }
    ctx.globalAlpha = 1;

    // 10. Grain pass
    if (this.grain) {
      const pat = ctx.createPattern(this.grain.canvas, "repeat");
      if (pat) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // 11. Paper vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H * 0.5, Math.max(W, H) * 0.78);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(43,37,33,0.13)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  drawClouds(from, to) {
    const ctx = this.ctx;
    for (let i = from; i < to && i < this.clouds.length; i++) {
      const c = this.clouds[i];
      const bob = this.reduced ? 0 : Math.sin(this.t * 0.32 + c.phase) * 5;
      const x = c.x - this.mouseD.x * c.depth * this.W * 0.09;
      const y =
        c.y + bob - this.mouseD.y * c.depth * this.H * 0.07 + this.scrollD * c.depth * this.H * 2.4;
      ctx.globalAlpha = 0.94;
      ctx.drawImage(c.sprite.canvas, x, y, c.sprite.w * c.scale, c.sprite.h * c.scale);
      ctx.globalAlpha = 1;
    }
  }
}
