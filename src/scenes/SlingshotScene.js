import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

/**
 * ============================================================================
 * CHAPTER 05: SKETCH SLINGSHOT SIEGE (CASTLE DEMOLITION)
 * ============================================================================
 * Hand-drawn procedural physics slingshot game. Aim, pull back elastic bands,
 * and launch kinetic ink projectiles into destructible tumbling fortress towers.
 */

export class SlingshotScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.score = 0;
    this.shotsLeft = 5;
    this.demolitionPct = 0;
    this.selectedAmmo = 'bomb'; // 'boulder', 'bomb', 'cluster', 'meteor'

    this.slingshot = {
      x: 140,
      y: 360,
      pouchX: 140,
      pouchY: 360,
      isDragging: false,
      pullMax: 90
    };

    this.projectiles = [];
    this.blocks = [];
    this.particles = [];
    this.explosions = [];

    this.initDOM();
    this.setupCanvas();
    this.buildCastle();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 320px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 600px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Sketch Slingshot Siege</span>
              <span class="toolbar-badge">Hand-Drawn Castle Physics</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-slingshot-shockwave" class="tactile-btn amber">
                ${renderIcon('sparkle')}
                <span>Ink Shockwave</span>
              </button>
              <button id="btn-slingshot-reset" class="tactile-btn outline">
                ${renderIcon('reset')}
                <span>Reset Castle</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="slingshot-canvas-wrap" style="min-height: 520px; user-select: none; position: relative;">
            <canvas id="slingshot-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- On-Screen Ammo Selector -->
            <div style="position: absolute; bottom: 16px; left: 24px; display: flex; gap: 10px;">
              <button id="btn-ammo-boulder" class="tactile-btn primary active">
                ${renderIcon('crystal')}
                <span>Boulder</span>
              </button>
              <button id="btn-ammo-bomb" class="tactile-btn outline">
                ${renderIcon('bomb')}
                <span>Ink Bomb</span>
              </button>
              <button id="btn-ammo-cluster" class="tactile-btn outline">
                ${renderIcon('cluster')}
                <span>Cluster</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Controls & Scoreboard Panel -->
        <div class="controls-panel">
          <!-- Scoreboard Card -->
          <div class="panel-card" style="background: var(--paper-card); border: 1px solid var(--orange);">
            <div class="panel-header">
              <span class="panel-title">DEMOLITION SCOREBOARD</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; text-align: center; padding: 6px 0;">
              <div style="font-family: 'Fira Code', monospace; font-size: 2.2rem; font-weight: 800; color: var(--orange); line-height: 1;" id="hud-slingshot-score">
                000,000
              </div>
              <div style="display: flex; justify-content: space-around; font-size: 0.78rem; font-family: 'Space Grotesk', sans-serif;">
                <span>DESTRUCTION: <strong id="hud-slingshot-pct" style="color: var(--orange);">0%</strong></span>
                <span>SHOTS LEFT: <strong id="hud-slingshot-shots" style="color: var(--emerald);">5</strong></span>
              </div>
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">SIEGE INSTRUCTIONS</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem; color: var(--ink-soft);">
              <div><kbd>Click & Drag</kbd> slingshot pouch backwards to aim.</div>
              <div><kbd>Release</kbd> to launch projectile!</div>
              <div><kbd>Space</kbd> or <kbd>Click</kbd> during flight to detonate / split ammo.</div>
            </div>
          </div>

          <!-- Gravity & Power Tuning -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">CATAPULT POWER</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Launch Velocity:</span>
                <span id="val-slingshot-power" class="control-val">1.2x</span>
              </div>
              <input type="range" id="slider-slingshot-power" min="0.8" max="2.0" step="0.1" value="1.2" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('slingshot-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('slingshot-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? Math.floor(rect.width) : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? Math.floor(rect.height) : 0, wrap ? wrap.clientHeight : 0, 520);

      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);

      this.slingshot.x = w * 0.16;
      this.slingshot.y = h - 140;
      this.slingshot.pouchX = this.slingshot.x;
      this.slingshot.pouchY = this.slingshot.y;
    };

    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 100);
    this.setupSlingshotInteraction();
  }

  setupSlingshotInteraction() {
    const getPos = (e) => {
      if (!this.canvas) return { x: 0, y: 0 };
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    this.onPointerStart = (e) => {
      const pos = getPos(e);
      const dist = Math.hypot(pos.x - this.slingshot.x, pos.y - this.slingshot.y);
      if (dist < 60) {
        this.slingshot.isDragging = true;
        this.slingshot.pouchX = pos.x;
        this.slingshot.pouchY = pos.y;
      } else {
        // If clicked while projectiles are flying, detonate/split
        this.triggerSpecialInFlight();
      }
    };

    this.onPointerMove = (e) => {
      if (!this.slingshot.isDragging) return;
      const pos = getPos(e);
      const dx = pos.x - this.slingshot.x;
      const dy = pos.y - this.slingshot.y;
      const dist = Math.hypot(dx, dy);

      if (dist > this.slingshot.pullMax) {
        const angle = Math.atan2(dy, dx);
        this.slingshot.pouchX = this.slingshot.x + Math.cos(angle) * this.slingshot.pullMax;
        this.slingshot.pouchY = this.slingshot.y + Math.sin(angle) * this.slingshot.pullMax;
      } else {
        this.slingshot.pouchX = pos.x;
        this.slingshot.pouchY = pos.y;
      }
    };

    this.onPointerEnd = () => {
      if (!this.slingshot.isDragging) return;
      this.slingshot.isDragging = false;

      const dx = this.slingshot.x - this.slingshot.pouchX;
      const dy = this.slingshot.y - this.slingshot.pouchY;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 15) {
        this.launchProjectile(dx, dy);
      }

      this.slingshot.pouchX = this.slingshot.x;
      this.slingshot.pouchY = this.slingshot.y;
    };

    this.canvas.addEventListener('mousedown', this.onPointerStart);
    window.addEventListener('mousemove', this.onPointerMove);
    window.addEventListener('mouseup', this.onPointerEnd);

    this.canvas.addEventListener('touchstart', this.onPointerStart, { passive: true });
    window.addEventListener('touchmove', this.onPointerMove, { passive: true });
    window.addEventListener('touchend', this.onPointerEnd);
    window.addEventListener('touchcancel', this.onPointerEnd);
    window.addEventListener('blur', this.onPointerEnd);
  }

  bindEvents() {
    document.getElementById('btn-slingshot-shockwave')?.addEventListener('click', () => {
      this.triggerShockwave();
    });

    document.getElementById('btn-slingshot-reset')?.addEventListener('click', () => {
      this.resetGame();
    });

    // Ammo Selector
    const setAmmo = (type) => {
      this.selectedAmmo = type;
      ['boulder', 'bomb', 'cluster'].forEach(t => {
        const btn = document.getElementById(`btn-ammo-${t}`);
        if (btn) {
          btn.classList.toggle('primary', t === type);
          btn.classList.toggle('outline', t !== type);
        }
      });
      SoundFX.triggerBoilPop();
    };

    document.getElementById('btn-ammo-boulder')?.addEventListener('click', () => setAmmo('boulder'));
    document.getElementById('btn-ammo-bomb')?.addEventListener('click', () => setAmmo('bomb'));
    document.getElementById('btn-ammo-cluster')?.addEventListener('click', () => setAmmo('cluster'));

    // Power slider
    document.getElementById('slider-slingshot-power')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('val-slingshot-power').textContent = `${val.toFixed(1)}x`;
      this.powerMult = val;
    });
    this.powerMult = 1.2;
  }

  buildCastle() {
    this.blocks = [];
    const w = this.width || 800;
    const h = this.height || 520;
    const groundY = h - 60;
    const castleBaseX = w * 0.65;

    const blockTypes = [
      { w: 28, h: 54, type: 'pillar', color: '#78716C', hp: 3, score: 50 }, // Stone
      { w: 72, h: 18, type: 'beam', color: '#D97706', hp: 2, score: 30 },   // Wood
      { w: 32, h: 32, type: 'crate', color: '#B45309', hp: 1, score: 20 },  // Crate
      { w: 24, h: 24, type: 'target', color: '#EF4444', hp: 1, score: 100 } // Red Target
    ];

    // Build Multi-Tier Castle Tower
    // Tier 1: Pillars & Beams
    const p1 = { x: castleBaseX - 45, y: groundY - 27, ...blockTypes[0], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const p2 = { x: castleBaseX + 45, y: groundY - 27, ...blockTypes[0], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const b1 = { x: castleBaseX, y: groundY - 60, ...blockTypes[1], angle: 0, vx: 0, vy: 0, vRot: 0 };

    // Tier 2:
    const p3 = { x: castleBaseX - 35, y: groundY - 95, ...blockTypes[0], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const p4 = { x: castleBaseX + 35, y: groundY - 95, ...blockTypes[0], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const b2 = { x: castleBaseX, y: groundY - 130, ...blockTypes[1], angle: 0, vx: 0, vy: 0, vRot: 0 };

    // Tier 3: Roof & Red Target Flag
    const c1 = { x: castleBaseX - 25, y: groundY - 150, ...blockTypes[2], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const c2 = { x: castleBaseX + 25, y: groundY - 150, ...blockTypes[2], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const target = { x: castleBaseX, y: groundY - 170, ...blockTypes[3], angle: 0, vx: 0, vy: 0, vRot: 0 };

    // Side Outpost Tower
    const p5 = { x: castleBaseX + 110, y: groundY - 27, ...blockTypes[0], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const b3 = { x: castleBaseX + 110, y: groundY - 60, ...blockTypes[1], angle: 0, vx: 0, vy: 0, vRot: 0 };
    const target2 = { x: castleBaseX + 110, y: groundY - 80, ...blockTypes[3], angle: 0, vx: 0, vy: 0, vRot: 0 };

    this.blocks = [p1, p2, b1, p3, p4, b2, c1, c2, target, p5, b3, target2];
    this.initialBlockCount = this.blocks.length;
  }

  launchProjectile(pullDx, pullDy) {
    if (this.shotsLeft <= 0) return;
    this.shotsLeft--;
    this.updateHUD();

    const speed = (this.powerMult || 1.2) * 0.22;
    const vx = pullDx * speed;
    const vy = pullDy * speed;

    this.projectiles.push({
      x: this.slingshot.x,
      y: this.slingshot.y,
      vx,
      vy,
      r: this.selectedAmmo === 'boulder' ? 14 : 10,
      mass: this.selectedAmmo === 'boulder' ? 3.0 : 1.2,
      type: this.selectedAmmo,
      color: this.selectedAmmo === 'boulder' ? '#44403C' : (this.selectedAmmo === 'bomb' ? '#EF4444' : '#8B5CF6'),
      life: 300,
      hasSplit: false,
      seed: Math.floor(Math.random() * 9999)
    });

    SoundFX.triggerBoilSwoosh();
  }

  triggerSpecialInFlight() {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (p.type === 'bomb' && !p.exploded) {
        this.explodeBomb(p);
      } else if (p.type === 'cluster' && !p.hasSplit) {
        p.hasSplit = true;
        this.projectiles.push(
          { ...p, vy: p.vy - 4, vx: p.vx * 1.1, r: 7 },
          { ...p, vy: p.vy + 3, vx: p.vx * 0.9, r: 7 }
        );
        SoundFX.triggerBoilPop();
      }
    }
  }

  explodeBomb(proj) {
    proj.life = 0;
    this.explosions.push({
      x: proj.x,
      y: proj.y,
      r: 10,
      maxR: 90,
      alpha: 1.0
    });

    // Shockwave physics on surrounding blocks
    for (const b of this.blocks) {
      const dx = b.x - proj.x;
      const dy = b.y - proj.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 110) {
        const force = (1 - dist / 110) * 12;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force - 3;
        b.vRot += (Math.random() - 0.5) * 0.3;
        b.hp -= 2;
      }
    }

    this.spawnExplosionParticles(proj.x, proj.y, '#EF4444');
    SoundFX.triggerBumperHit('C4');
  }

  triggerShockwave() {
    const w = this.width || 800;
    const h = this.height || 520;
    this.explodeBomb({ x: w * 0.65, y: h - 100 });
  }

  resetGame() {
    this.score = 0;
    this.shotsLeft = 5;
    this.demolitionPct = 0;
    this.projectiles = [];
    this.particles = [];
    this.explosions = [];
    this.buildCastle();
    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = document.getElementById('hud-slingshot-score');
    if (scoreEl) scoreEl.textContent = this.score.toString().padStart(6, '0');

    const pctEl = document.getElementById('hud-slingshot-pct');
    if (pctEl) pctEl.textContent = `${Math.min(100, Math.floor(this.demolitionPct))}%`;

    const shotsEl = document.getElementById('hud-slingshot-shots');
    if (shotsEl) shotsEl.textContent = this.shotsLeft;
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      const w = this.width || 800;
      const h = this.height || 520;
      const groundY = h - 60;
      const gravity = 0.38;

      // 1. Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.life--;

        // Ground bounce
        if (p.y + p.r >= groundY) {
          p.y = groundY - p.r;
          p.vy = -p.vy * 0.45;
          p.vx *= 0.85;

          if (p.type === 'bomb') {
            this.explodeBomb(p);
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        // Block Collisions
        for (let j = this.blocks.length - 1; j >= 0; j--) {
          const b = this.blocks[j];
          if (
            p.x + p.r >= b.x - b.w / 2 &&
            p.x - p.r <= b.x + b.w / 2 &&
            p.y + p.r >= b.y - b.h / 2 &&
            p.y - p.r <= b.y + b.h / 2
          ) {
            // Impact impulse
            b.vx += p.vx * 0.6 * p.mass;
            b.vy += p.vy * 0.5;
            b.vRot += (Math.random() - 0.5) * 0.15;
            b.hp--;

            if (p.type === 'bomb') {
              this.explodeBomb(p);
              this.projectiles.splice(i, 1);
              break;
            } else {
              p.vx *= 0.5;
              p.vy *= -0.5;
            }
            SoundFX.triggerBumperHit('E4');
            break;
          }
        }

        if (p.life <= 0 || p.x > w + 50) {
          this.projectiles.splice(i, 1);
        }
      }

      // 2. Update Blocks (Physics & Falling)
      let destroyedCount = 0;
      for (let i = this.blocks.length - 1; i >= 0; i--) {
        const b = this.blocks[i];
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vRot;

        if (b.y < groundY - b.h / 2) {
          b.vy += gravity * 0.8;
        }

        // Ground collision
        if (b.y + b.h / 2 >= groundY) {
          b.y = groundY - b.h / 2;
          b.vy = 0;
          b.vx *= 0.85;
          b.vRot *= 0.8;
        }

        if (b.hp <= 0 || Math.abs(b.vx) > 8 || Math.abs(b.vy) > 8) {
          this.score += b.score;
          this.spawnExplosionParticles(b.x, b.y, b.color);
          this.blocks.splice(i, 1);
          continue;
        }

        // If block is knocked far away from base
        if (Math.abs(b.x - w * 0.65) > 130) {
          destroyedCount++;
        }
      }

      this.demolitionPct = ((this.initialBlockCount - this.blocks.length + destroyedCount) / this.initialBlockCount) * 100;
      this.updateHUD();

      // 3. Update Explosions & Particles
      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const ex = this.explosions[i];
        ex.r += 6;
        ex.alpha -= 0.05;
        if (ex.alpha <= 0) this.explosions.splice(i, 1);
      }

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        if (pt.alpha <= 0) this.particles.splice(i, 1);
      }

      // 4. Render Scene
      if (this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, w, h);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const bgField = isDark ? '#141820' : '#FAF8F3';

        // Background
        this.ctx.fillStyle = bgField;
        this.ctx.fillRect(0, 0, w, h);

        try {
          if (!this.rc) this.rc = rough.canvas(this.canvas);

          // Ground Grass / Dirt
          this.rc.rectangle(0, groundY, w, h - groundY, {
            seed: 2000 + frameIdx * 5,
            roughness: 1.4,
            stroke: ink,
            strokeWidth: 2.5,
            fill: isDark ? '#1F2937' : '#E5E7EB',
            fillStyle: 'solid'
          });

          // Draw Destructible Castle Blocks
          for (let i = 0; i < this.blocks.length; i++) {
            const b = this.blocks[i];
            this.ctx.save();
            this.ctx.translate(b.x, b.y);
            this.ctx.rotate(b.angle);

            this.rc.rectangle(-b.w / 2, -b.h / 2, b.w, b.h, {
              seed: 4000 + i * 100 + frameIdx * 10,
              roughness: 1.5,
              stroke: ink,
              strokeWidth: 2,
              fill: b.color,
              fillStyle: 'solid'
            });
            this.ctx.restore();
          }

          // Draw Trajectory Prediction Arc (When Dragging)
          if (this.slingshot.isDragging) {
            const pullDx = this.slingshot.x - this.slingshot.pouchX;
            const pullDy = this.slingshot.y - this.slingshot.pouchY;
            const spd = (this.powerMult || 1.2) * 0.22;
            let simX = this.slingshot.x;
            let simY = this.slingshot.y;
            let simVx = pullDx * spd;
            let simVy = pullDy * spd;

            for (let step = 0; step < 18; step++) {
              simX += simVx;
              simY += simVy;
              simVy += gravity;
              if (simY > groundY) break;

              this.rc.circle(simX, simY, 4, {
                seed: 9000 + step,
                stroke: 'transparent',
                fill: '#EF4444',
                fillStyle: 'solid'
              });
            }
          }

          // Draw Slingshot Fork
          const sx = this.slingshot.x;
          const sy = this.slingshot.y;

          // Slingshot base post
          this.rc.line(sx, sy + 60, sx, groundY, {
            seed: 6000,
            roughness: 1.6,
            stroke: ink,
            strokeWidth: 6
          });

          // Slingshot Left & Right Prongs
          this.rc.line(sx, sy + 60, sx - 22, sy, { seed: 6001, roughness: 1.5, stroke: ink, strokeWidth: 5 });
          this.rc.line(sx, sy + 60, sx + 22, sy, { seed: 6002, roughness: 1.5, stroke: ink, strokeWidth: 5 });

          // Rubber Elastic Bands
          const px = this.slingshot.pouchX;
          const py = this.slingshot.pouchY;
          this.rc.line(sx - 20, sy, px, py, { seed: 7000 + frameIdx * 5, roughness: 1.2, stroke: '#DC2626', strokeWidth: 3 });
          this.rc.line(sx + 20, sy, px, py, { seed: 7001 + frameIdx * 5, roughness: 1.2, stroke: '#DC2626', strokeWidth: 3 });

          // Projectile in Pouch
          this.rc.circle(px, py, 18, {
            seed: 8000 + frameIdx * 10,
            roughness: 1.3,
            stroke: ink,
            strokeWidth: 2,
            fill: this.selectedAmmo === 'boulder' ? '#44403C' : (this.selectedAmmo === 'bomb' ? '#EF4444' : '#8B5CF6'),
            fillStyle: 'solid'
          });

          // Draw Flying Projectiles
          for (let i = 0; i < this.projectiles.length; i++) {
            const p = this.projectiles[i];
            this.rc.circle(p.x, p.y, p.r * 2, {
              seed: p.seed + frameIdx * 10,
              roughness: 1.4,
              stroke: ink,
              strokeWidth: 2,
              fill: p.color,
              fillStyle: 'solid'
            });
          }

          // Draw Explosions
          for (let i = 0; i < this.explosions.length; i++) {
            const ex = this.explosions[i];
            this.ctx.save();
            this.ctx.globalAlpha = ex.alpha;
            this.rc.circle(ex.x, ex.y, ex.r * 2, {
              seed: 5555 + i,
              roughness: 2.2,
              stroke: '#EF4444',
              strokeWidth: 3,
              fill: '#F59E0B',
              fillStyle: 'solid'
            });
            this.ctx.restore();
          }

          // Draw Particles
          for (let i = 0; i < this.particles.length; i++) {
            const pt = this.particles[i];
            this.ctx.save();
            this.ctx.globalAlpha = pt.alpha;
            this.rc.circle(pt.x, pt.y, pt.size, {
              seed: 999 + i,
              stroke: pt.color,
              fill: pt.color,
              fillStyle: 'solid'
            });
            this.ctx.restore();
          }
        } catch (err) {
          // Native 2D Fallback
          this.ctx.fillStyle = '#78716C';
          for (const b of this.blocks) {
            this.ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
          }
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  spawnExplosionParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 6,
        color,
        alpha: 1.0
      });
    }
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
    if (this.canvas && this.onPointerStart) {
      this.canvas.removeEventListener('mousedown', this.onPointerStart);
      this.canvas.removeEventListener('touchstart', this.onPointerStart);
    }
    if (this.onPointerMove) {
      window.removeEventListener('mousemove', this.onPointerMove);
      window.removeEventListener('mouseup', this.onPointerEnd);
      window.removeEventListener('touchmove', this.onPointerMove);
      window.removeEventListener('touchend', this.onPointerEnd);
      window.removeEventListener('touchcancel', this.onPointerEnd);
      window.removeEventListener('blur', this.onPointerEnd);
    }
  }
}
