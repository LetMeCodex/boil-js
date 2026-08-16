import rough from 'roughjs';

/**
 * ============================================================================
 * KINETIC COLLAGE SCENE — Procedural Paper-Collage Landscape on Canvas 2D
 * ============================================================================
 * Features:
 * - Real-time Day ➔ Night world transformation with interruptible 1.6s damped transition
 * - Sun sunset & Moonrise with craters, atmospheric halo, and dynamic parallax
 * - Twinkling celestial starfield with golden-ratio distribution and hand-drawn ink crosses
 * - Warm dusk linear wash peaking at mid-transition
 * - Pre-rendered dual offscreen sprites for day and night palettes
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

/** Night counterpart of every pigment in the collage. Same geometry, new light. */
export const NIGHT = {
  sky: "#0d1220",
  skyMid: "#131d2c",
  skyLow: "#172536",
  paper: "#101419",
  ivory: "#2a3342",
  cream: "#232c3a",
  moon: "#e8dec9",
  accent: "#d88932",
  navy: "#172536",
  navyMid: "#111c2a",
  navyNear: "#0d1621",
  ink: "#e8e0d2"
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
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v, a, b) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t); // smoothstep
};

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return `rgb(${r},${g},${bl})`;
}

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

    // Day / Night transition state
    this.night = 0; // target: 0 day, 1 night
    this.nightD = 0; // damped value that everything renders from

    this.sky = null;
    this.skyNight = null;
    this.sun = null;
    this.moon = null;
    this.far = null;
    this.mid = null;
    this.front = null;
    this.farNight = null;
    this.midNight = null;
    this.frontNight = null;

    this.stars = [];
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

  /** Toggle the world between day (0) and night (1). Interruptible. */
  setNight(v) {
    this.night = v ? 1 : 0;
  }

  /** 0 = day, 1 = night — smoothed value, useful for syncing UI. */
  get nightProgress() {
    return this.nightD;
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
    this.stars = [];
  }

  /* Build Layers & Offscreen Sprites ------------------------------------ */
  build() {
    const W = this.W;
    const H = this.H;
    const mobile = this.quality === "mobile";

    // 1. Sky Wash — Day & Night
    const buildSky = (top, mid, low, isNight) => {
      const { s, ctx } = makeSprite(W * 1.2, H * 1.2);
      const g = ctx.createLinearGradient(0, 0, 0, s.h);
      g.addColorStop(0, top);
      g.addColorStop(0.62, mid);
      g.addColorStop(1, low);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s.w, s.h);
      const rnd = mulberry32(isNight ? 17 : 7);
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";
        ctx.fillRect(rnd() * s.w, rnd() * s.h, 1.5, 1.5);
      }
      return s;
    };

    this.sky = buildSky(PALETTE.sky, "#dfdfd8", PALETTE.skyLow, false);
    this.skyNight = buildSky(NIGHT.sky, NIGHT.skyMid, NIGHT.skyLow, true);

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

    // 3. Moon — Hand-cut ivory disc with craters and soft halo
    {
      const R = Math.min(W, H) * (mobile ? 0.15 : 0.12);
      const { s, ctx } = makeSprite(R * 4, R * 4);
      const rnd = mulberry32(64);
      const cx = s.w / 2;
      const cy = s.h / 2;

      // Soft radiant atmospheric halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.95);
      halo.addColorStop(0, "rgba(232,222,201,0.22)");
      halo.addColorStop(1, "rgba(232,222,201,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, s.w, s.h);

      // Torn circular lunar edge
      ctx.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        const r = R * (1 + Math.sin(a * 2.7) * 0.01 + (rnd() - 0.5) * 0.013);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      paperFill(ctx, s.w, s.h, NIGHT.moon, mulberry32(31), 260);

      // Craters, clipped inside
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 7; i++) {
        const a = rnd() * Math.PI * 2;
        const d = rnd() * R * 0.72;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.06 + rnd() * 0.11), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(23,37,54,0.13)";
        ctx.fill();
      }
      ctx.restore();

      rough.canvas(s.canvas).circle(cx, cy, R * 2.06, {
        stroke: "rgba(23,37,54,0.55)",
        strokeWidth: 1,
        roughness: 2.1,
        seed: 27
      });
      this.moon = s;
    }

    // 4. Stars — Deliberately placed with golden-ratio spread & hand-drawn crosses
    {
      const count = mobile ? 26 : this.quality === "tablet" ? 40 : 54;
      const rnd = mulberry32(515);
      this.stars = [];
      for (let i = 0; i < count; i++) {
        const band = i / count;
        this.stars.push({
          x: (((i * 0.6180339887) % 1) * 1.06 - 0.03) * W,
          y: (0.02 + band * 0.52 + (rnd() - 0.5) * 0.09) * H,
          r: 0.8 + rnd() * 1.9,
          a: 0.3 + rnd() * 0.6,
          delay: rnd() * 0.45,
          phase: rnd() * Math.PI * 2,
          cross: rnd() > 0.78,
          depth: 0.02 + rnd() * 0.05
        });
      }
    }

    // 5. Mountain Ranges — Identical seeds so geometry perfectly aligns
    const FAR_PEAKS = [0.18, 0.72, 0.22, 0.52, 0.95, 0.18, 0.82, 0.6, 0.24];
    const MID_PEAKS = [0.32, 0.86, 0.2, 0.66, 0.62, 0.16, 0.9, 0.78, 0.22];
    const NEAR_PEAKS = [0.1, 0.9, 0.26, 0.48, 0.72, 0.2, 0.86, 0.95, 0.28];

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

    this.far = range(41, 0.5, PALETTE.navy, FAR_PEAKS, 1.4, true);
    this.mid = range(77, 0.42, PALETTE.navyMid, MID_PEAKS, 1.8, false);
    this.front = range(103, 0.34, PALETTE.navyNear, NEAR_PEAKS, 2.4, false);

    this.farNight = range(41, 0.5, NIGHT.navy, FAR_PEAKS, 1.4, true);
    this.midNight = range(77, 0.42, NIGHT.navyMid, MID_PEAKS, 1.8, false);
    this.frontNight = range(103, 0.34, NIGHT.navyNear, NEAR_PEAKS, 2.4, false);

    // 6. Clouds — Day and Night sprites painted from identical disc layouts
    const cloudCount = mobile ? 4 : this.quality === "tablet" ? 6 : 8;
    this.clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const rnd = mulberry32(200 + i * 31);
      const cw = W * (0.22 + rnd() * 0.26);
      const ch = cw * (0.3 + rnd() * 0.16);
      const lobes = 6 + Math.floor(rnd() * 4);
      const tone = i % 3 === 0 ? PALETTE.cream : i % 3 === 1 ? PALETTE.ivory : PALETTE.paper;
      const nightTone = i % 3 === 0 ? NIGHT.cream : i % 3 === 1 ? NIGHT.ivory : NIGHT.paper;

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

      const paintCloudSprite = (fillTone, strokeColor) => {
        const { s, ctx } = makeSprite(cw, ch * 1.6);
        const paintDiscs = (fill, dx = 0, dy = 0) => {
          ctx.fillStyle = fill;
          for (const d of discs) {
            ctx.beginPath();
            ctx.arc(d.x + dx, d.y + dy, d.r, 0, Math.PI * 2);
            ctx.fill();
          }
        };
        paintDiscs("rgba(30,36,48,0.10)", 3, 4);
        paintDiscs(fillTone);

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
          { stroke: strokeColor, roughness: 2.6, strokeWidth: 1, seed: 9 + i }
        );
        return s;
      };

      const s = paintCloudSprite(tone, "rgba(43,37,33,0.30)");
      const sNight = paintCloudSprite(nightTone, "rgba(232,224,210,0.22)");

      this.clouds.push({
        sprite: s,
        night: sNight,
        x: rnd() * W * 1.4 - W * 0.2,
        y: H * (0.04 + rnd() * 0.26),
        speed: 0.008 + (i % 3) * 0.0065,
        depth: 0.06 + (i % 3) * 0.035,
        scale: 0.7 + rnd() * 0.32,
        phase: rnd() * Math.PI * 2
      });
    }

    // 7. Hand-Drawn Editorial Annotations
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

    // 8. Paper Fragments
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

    // 9. Grain Tile
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

    // Day <-> Night takes ~1.6s and is fully interruptible
    this.nightD = this.reduced
      ? this.night
      : lerp(this.nightD, this.night, Math.min(1, dt * 1.5));
    if (Math.abs(this.nightD - this.night) < 0.0015) this.nightD = this.night;

    if (!this.reduced) this.t += dt;

    // Clouds drift with sine modulation, plus cursor wind (slow down slightly at night)
    const wind = this.mouseD.x * 22;
    for (const c of this.clouds) {
      const s = this.reduced
        ? 0
        : c.speed * this.W * (1 + Math.sin(this.t * 0.13 + c.phase) * 0.35) * (1 - this.nightD * 0.35);
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
    const n = this.nightD;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Base paper darkens smoothly
    ctx.fillStyle = mixHex(PALETTE.paper, NIGHT.paper, n);
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

    // 1. Sky Cross-Fade
    layer(this.sky, 0.02, -W * 0.1, -H * 0.1);
    if (n > 0.001) {
      layer(this.skyNight, 0.02, -W * 0.1, -H * 0.1, 1, n);
    }

    // PHASE 2 — Dusk Wash: The sky warms before it darkens (peaks mid-transition)
    const dusk = Math.sin(Math.PI * clamp01(n)) ** 1.1;
    if (dusk > 0.01) {
      const g = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.86);
      g.addColorStop(0, `rgba(184,92,43,${0.06 * dusk})`);
      g.addColorStop(0.55, `rgba(209,90,43,${0.3 * dusk})`);
      g.addColorStop(1, `rgba(76,44,64,${0.26 * dusk})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // PHASE 5 — Stars: Staggered emergence, gentle twinkle, slight parallax, hand-drawn ink crosses
    if (n > 0.02) {
      for (const st of this.stars) {
        const t = smooth(n, 0.35 + st.delay * 0.4, 0.82 + st.delay * 0.18);
        if (t <= 0.001) continue;
        const tw = this.reduced ? 1 : 0.72 + Math.sin(this.t * 1.7 + st.phase) * 0.28;
        const x = st.x - mx * st.depth * W * 0.6;
        const y = st.y - my * st.depth * H * 0.5 + s * st.depth * H * 1.6;
        ctx.globalAlpha = st.a * t * tw;
        ctx.fillStyle = NIGHT.moon;
        if (st.cross) {
          ctx.strokeStyle = NIGHT.moon;
          ctx.lineWidth = 1;
          const r = st.r * 2.2 * (0.5 + t * 0.5);
          ctx.beginPath();
          ctx.moveTo(x - r, y);
          ctx.lineTo(x + r, y);
          ctx.moveTo(x, y - r);
          ctx.lineTo(x, y + r);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, st.r * (0.5 + t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    // PHASE 4 — Moon rises from behind the landscape as night settles
    if (this.moon && n > 0.02) {
      const rise = smooth(n, 0.3, 1);
      const my0 = lerp(H * 1.12, H * 0.4, rise);
      const mxp = W * (this.quality === "mobile" ? 0.52 : 0.56) - this.moon.w / 2 - mx * 0.1 * W * 0.09;
      ctx.globalAlpha = rise;
      ctx.drawImage(
        this.moon.canvas,
        mxp,
        my0 - this.moon.h / 2 - my * 0.08 * H * 0.07 + s * H * 0.4 + Math.sin(this.t * 0.09) * 6
      );
      ctx.globalAlpha = 1;
    }

    // PHASE 1/3 — Sun sinks past the horizon and fades out late
    if (this.sun) {
      const set = smooth(n, 0, 0.78);
      const sunY = H * 0.3 + Math.sin(this.t * 0.08) * 10 + s * H * 0.5 + set * H * 0.78;
      const sx = W * (this.quality === "mobile" ? 0.5 : 0.66) - this.sun.w / 2 - mx * 0.08 * W * 0.09;
      ctx.globalAlpha = 0.96 * (1 - smooth(n, 0.5, 0.9));
      if (ctx.globalAlpha > 0.01) {
        ctx.drawImage(this.sun.canvas, sx, sunY - this.sun.h / 2 - my * 0.08 * H * 0.07);
      }
      ctx.globalAlpha = 1;
    }

    // Mountain ranges cross-fade to their night pigment
    layer(this.far, 0.05, -W * 0.12, H - this.far.h + H * 0.06);
    if (n > 0.001) layer(this.farNight, 0.05, -W * 0.12, H - this.far.h + H * 0.06, 1, n);

    this.drawClouds(0, 3);

    layer(this.mid, 0.1, -W * 0.12, H - this.mid.h + H * 0.1);
    if (n > 0.001) layer(this.midNight, 0.1, -W * 0.12, H - this.mid.h + H * 0.1, 1, n);

    this.drawClouds(3, this.clouds.length);

    layer(this.front, 0.16, -W * 0.12, H - this.front.h + H * 0.16);
    if (n > 0.001) layer(this.frontNight, 0.16, -W * 0.12, H - this.front.h + H * 0.16, 1, n);

    // Paper fragments lifting off the collage
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

    // Annotations recede and switch to screen blending at night
    for (const a of this.annotations) {
      ctx.globalAlpha = 0.9 * (1 - Math.min(1, s * 1.6)) * (1 - n * 0.45);
      if (n > 0.05) ctx.globalCompositeOperation = n > 0.5 ? "screen" : "source-over";
      ctx.drawImage(
        a.sprite.canvas,
        a.x - mx * a.depth * W * 0.03,
        a.y - my * a.depth * H * 0.03 + Math.sin(this.t * 0.3 + a.depth * 9) * 2
      );
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;

    // Grain pass
    if (this.grain) {
      const pat = ctx.createPattern(this.grain.canvas, "repeat");
      if (pat) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // Vignette deepens after dark
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H * 0.5, Math.max(W, H) * 0.78);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, `rgba(${lerp(43, 8, n) | 0},${lerp(37, 12, n) | 0},${lerp(33, 20, n) | 0},${lerp(0.13, 0.4, n)})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  drawClouds(from, to) {
    const ctx = this.ctx;
    const n = this.nightD;
    for (let i = from; i < to && i < this.clouds.length; i++) {
      const c = this.clouds[i];
      const bob = this.reduced ? 0 : Math.sin(this.t * 0.32 + c.phase) * 5 * (1 - n * 0.4);
      const x = c.x - this.mouseD.x * c.depth * this.W * 0.09;
      const y =
        c.y + bob - this.mouseD.y * c.depth * this.H * 0.07 + this.scrollD * c.depth * this.H * 2.4;
      ctx.globalAlpha = 0.94;
      ctx.drawImage(c.sprite.canvas, x, y, c.sprite.w * c.scale, c.sprite.h * c.scale);
      if (n > 0.001) {
        ctx.globalAlpha = 0.94 * n;
        ctx.drawImage(c.night.canvas, x, y, c.night.w * c.scale, c.night.h * c.scale);
      }
      ctx.globalAlpha = 1;
    }
  }
}
