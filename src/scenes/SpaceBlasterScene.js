import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class SpaceBlasterScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.score = 0;
    this.lives = 3;
    this.ship = {
      x: 400,
      y: 250,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      rotationSpeed: 0,
      thrusting: false,
      shield: 100,
      powerup: 'single'
    };

    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.keys = {};

    this.initDOM();
    this.setupCanvas();
    this.spawnAsteroids(5);
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 300px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 580px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Sketch Asteroids Space Blaster</span>
              <span class="toolbar-badge">Arcade Vector Physics</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-space-bomb" class="tactile-btn amber">
                <span>💣 Ink Shockwave</span>
              </button>
              <button id="btn-space-restart" class="tactile-btn outline">
                <span>🔄 Restart</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="space-canvas-wrap" style="min-height: 500px; user-select: none;">
            <canvas id="space-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- Touch / Click Controls -->
            <div style="position: absolute; bottom: 16px; left: 24px; right: 24px; display: flex; justify-content: space-between; pointer-events: none;">
              <div style="display: flex; gap: 8px;">
                <button id="btn-ship-left" class="tactile-btn primary" style="pointer-events: auto; padding: 10px 18px; border-radius: 9999px;">◀ ROTATE (A)</button>
                <button id="btn-ship-right" class="tactile-btn primary" style="pointer-events: auto; padding: 10px 18px; border-radius: 9999px;">ROTATE ▶ (D)</button>
              </div>
              <div style="display: flex; gap: 8px;">
                <button id="btn-ship-thrust" class="tactile-btn amber" style="pointer-events: auto; padding: 10px 20px; border-radius: 9999px;">🚀 THRUST (W)</button>
                <button id="btn-ship-fire" class="tactile-btn primary" style="pointer-events: auto; padding: 10px 22px; border-radius: 9999px; background: var(--accent-terracotta);">🔥 FIRE (SPACE)</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls & Scoreboard Panel -->
        <div class="controls-panel">
          <!-- Arcade Scoreboard -->
          <div class="panel-card" style="background: var(--bg-surface-alt); border: 2px solid var(--accent-amber);">
            <div class="panel-header">
              <span class="panel-title">🚀 Asteroids Scoreboard</span>
            </div>
            <div style="text-align: center; padding: 6px 0;">
              <div style="font-family: 'Fira Code', monospace; font-size: 2.2rem; font-weight: 800; color: var(--accent-amber);" id="hud-space-score">
                000,000
              </div>
              <div style="display: flex; justify-content: space-around; font-size: 0.8rem; margin-top: 4px;">
                <span>LIVES: <strong id="hud-space-lives" style="color: var(--accent-terracotta);">❤️❤️❤️</strong></span>
                <span>SHIELD: <strong id="hud-space-shield" style="color: var(--accent-sage);">100%</strong></span>
              </div>
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🕹️ Flight Controls</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-secondary);">
              <div><kbd>W</kbd> or <kbd>↑</kbd> : Rocket Thrusters</div>
              <div><kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> : Rotate Ship</div>
              <div><kbd>Space</kbd> : Fire Ink Laser Bullets</div>
              <div><kbd>B</kbd> : Trigger Ink Bomb Shockwave</div>
            </div>
          </div>

          <!-- Weapon Power-Up -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⚡ Weapon Upgrades</span>
            </div>
            <div class="style-pills-grid" id="space-weapon-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-weapon="single">Single Laser</button>
              <button class="style-pill-btn" data-weapon="triple">Triple Spread</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('space-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('space-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? rect.width : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? rect.height : 0, wrap ? wrap.clientHeight : 0, 500);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.width = w;
      this.height = h;
      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.rc = rough.canvas(this.canvas);

      if (!this.ship.x || !this.ship.y || this.ship.x === 400) {
        this.ship.x = w / 2;
        this.ship.y = h / 2;
      }
      if (this.asteroids.length === 0) {
        this.spawnAsteroids(5);
      }
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
  }

  spawnAsteroids(count = 5) {
    const w = this.width || 800;
    const h = this.height || 500;
    this.asteroids = [];

    for (let i = 0; i < count; i++) {
      let x = Math.random() * w;
      let y = Math.random() * h;

      if (Math.hypot(x - this.ship.x, y - this.ship.y) < 140) {
        x = (x + w / 2) % w;
      }

      this.createAsteroid(x, y, 42, 3);
    }
  }

  createAsteroid(x, y, r, tier = 3) {
    const numPoints = 8;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const dist = r * (0.75 + Math.random() * 0.5);
      points.push([Math.cos(angle) * dist, Math.sin(angle) * dist]);
    }

    const colors = ['#D97706', '#6B7280', '#059669', '#DC2626'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.asteroids.push({
      x,
      y,
      r,
      tier,
      points,
      color,
      vx: (Math.random() - 0.5) * (1.5 + (4 - tier) * 0.8),
      vy: (Math.random() - 0.5) * (1.5 + (4 - tier) * 0.8),
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.03,
      seed: Math.floor(Math.random() * 100000)
    });
  }

  fireBullet() {
    SoundFX.playPop(750);
    const speed = 11;

    if (this.ship.powerup === 'triple') {
      [-0.2, 0, 0.2].forEach(angleOffset => {
        const a = this.ship.angle + angleOffset;
        this.bullets.push({
          x: this.ship.x + Math.cos(this.ship.angle) * 22,
          y: this.ship.y + Math.sin(this.ship.angle) * 22,
          vx: Math.cos(a) * speed + this.ship.vx * 0.4,
          vy: Math.sin(a) * speed + this.ship.vy * 0.4,
          life: 55,
          seed: Math.floor(Math.random() * 100000)
        });
      });
    } else {
      this.bullets.push({
        x: this.ship.x + Math.cos(this.ship.angle) * 22,
        y: this.ship.y + Math.sin(this.ship.angle) * 22,
        vx: Math.cos(this.ship.angle) * speed + this.ship.vx * 0.4,
        vy: Math.sin(this.ship.angle) * speed + this.ship.vy * 0.4,
        life: 55,
        seed: Math.floor(Math.random() * 100000)
      });
    }
  }

  triggerShockwave() {
    SoundFX.playHarmonicChord();
    confetti({ particleCount: 35, spread: 80 });

    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      this.destroyAsteroid(i);
    }
  }

  destroyAsteroid(idx) {
    const a = this.asteroids[idx];
    SoundFX.playPop(380);
    this.asteroids.splice(idx, 1);
    this.score += a.tier * 100;
    this.updateScoreboard();

    // Spawn fragments
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      this.particles.push({
        x: a.x,
        y: a.y,
        vx: Math.cos(angle) * (2 + Math.random() * 4),
        vy: Math.sin(angle) * (2 + Math.random() * 4),
        alpha: 1,
        color: a.color,
        size: 3 + Math.random() * 3
      });
    }

    if (a.tier > 1) {
      this.createAsteroid(a.x - 10, a.y - 10, a.r * 0.6, a.tier - 1);
      this.createAsteroid(a.x + 10, a.y + 10, a.r * 0.6, a.tier - 1);
    }

    if (this.asteroids.length === 0) {
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => this.spawnAsteroids(6), 800);
    }
  }

  updateScoreboard() {
    const scoreEl = document.getElementById('hud-space-score');
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString().padStart(7, '0');
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      const w = this.width || 800;
      const h = this.height || 500;

      // 1. Ship Physics & Controls
      if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
        this.ship.angle -= 0.07;
      }
      if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
        this.ship.angle += 0.07;
      }
      if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
        this.ship.thrusting = true;
        this.ship.vx += Math.cos(this.ship.angle) * 0.22;
        this.ship.vy += Math.sin(this.ship.angle) * 0.22;

        // Thruster smoke particles
        this.particles.push({
          x: this.ship.x - Math.cos(this.ship.angle) * 16,
          y: this.ship.y - Math.sin(this.ship.angle) * 16,
          vx: -Math.cos(this.ship.angle) * 3 + (Math.random() - 0.5) * 2,
          vy: -Math.sin(this.ship.angle) * 3 + (Math.random() - 0.5) * 2,
          alpha: 0.8,
          color: '#F59E0B',
          size: 4 + Math.random() * 4
        });
      } else {
        this.ship.thrusting = false;
      }

      this.ship.vx *= 0.985; // friction
      this.ship.vy *= 0.985;
      this.ship.x = (this.ship.x + this.ship.vx + w) % w;
      this.ship.y = (this.ship.y + this.ship.vy + h) % h;

      // 2. Bullets Update
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.x = (b.x + b.vx + w) % w;
        b.y = (b.y + b.vy + h) % h;
        b.life--;

        if (b.life <= 0) {
          this.bullets.splice(i, 1);
          continue;
        }

        // Bullet vs Asteroid collision
        for (let j = this.asteroids.length - 1; j >= 0; j--) {
          const a = this.asteroids[j];
          if (Math.hypot(b.x - a.x, b.y - a.y) < a.r * 1.1) {
            this.bullets.splice(i, 1);
            this.destroyAsteroid(j);
            break;
          }
        }
      }

      // 3. Asteroids Update
      for (let i = 0; i < this.asteroids.length; i++) {
        const a = this.asteroids[i];
        a.x = (a.x + a.vx + w) % w;
        a.y = (a.y + a.vy + h) % h;
        a.angle += a.vRot;
      }

      // 4. Render Hand-Drawn Space
      if (this.ctx && this.canvas) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const bgSpace = isDark ? '#101318' : '#FAF8F3';

        // Background
        this.ctx.fillStyle = bgSpace;
        this.ctx.fillRect(0, 0, w, h);

        try {
          if (!this.rc) this.rc = rough.canvas(this.canvas);

          // 0. Space Starfield
          for (let s = 0; s < 25; s++) {
            const sx = ((s * 137.5 + 40) % w);
            const sy = ((s * 293.7 + 30) % h);
            this.rc.circle(sx, sy, 3, {
              seed: 500 + s + frameIdx * 5,
              stroke: 'transparent',
              fill: isDark ? '#9CA3AF' : '#8C827A',
              fillStyle: 'solid'
            });
          }

          // Draw Asteroids
          for (let i = 0; i < this.asteroids.length; i++) {
            const a = this.asteroids[i];
            this.ctx.save();
            this.ctx.translate(a.x, a.y);
            this.ctx.rotate(a.angle);

            this.rc.polygon(a.points, {
              seed: a.seed + frameIdx * 20,
              roughness: 2.0,
              bowing: 1.8,
              stroke: ink,
              strokeWidth: 2.5,
              fill: a.color,
              fillStyle: 'cross-hatch'
            });
            this.ctx.restore();
          }

          // Draw Bullets
          for (let i = 0; i < this.bullets.length; i++) {
            const b = this.bullets[i];
            this.rc.circle(b.x, b.y, 8, {
              seed: b.seed + frameIdx * 10,
              stroke: '#DC2626',
              strokeWidth: 2,
              fill: '#F59E0B',
              fillStyle: 'solid'
            });
          }

          // Draw Particles
          for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) {
              this.particles.splice(i, 1);
              continue;
            }
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.rc.circle(p.x, p.y, p.size, {
              seed: 999 + i,
              stroke: p.color,
              fill: p.color,
              fillStyle: 'solid'
            });
            this.ctx.restore();
          }

          // Draw Player Ship (Triangular Spacecraft)
          this.ctx.save();
          this.ctx.translate(this.ship.x, this.ship.y);
          this.ctx.rotate(this.ship.angle);

          // Rocket Thruster Plume
          if (this.ship.thrusting) {
            this.rc.polygon([[-12, -6], [-28, 0], [-12, 6]], {
              seed: 2000 + frameIdx * 20,
              roughness: 2.2,
              stroke: '#DC2626',
              strokeWidth: 2,
              fill: '#F59E0B',
              fillStyle: 'solid'
            });
          }

          this.rc.polygon([[20, 0], [-14, -12], [-8, 0], [-14, 12]], {
            seed: 1000 + frameIdx * 10,
            roughness: 1.5,
            bowing: 1.2,
            stroke: ink,
            strokeWidth: 2.5,
            fill: isDark ? '#3B82F6' : '#0284C7',
            fillStyle: 'solid'
          });

          // Cockpit
          this.rc.circle(2, 0, 8, {
            seed: 1005,
            stroke: '#FFFFFF',
            fill: '#FFFFFF',
            fillStyle: 'solid'
          });

          this.ctx.restore();
        } catch (err) {
          // Native Canvas 2D Fallback
          for (const a of this.asteroids) {
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            this.ctx.fillStyle = a.color;
            this.ctx.fill();
            this.ctx.stroke();
          }

          this.ctx.save();
          this.ctx.translate(this.ship.x, this.ship.y);
          this.ctx.rotate(this.ship.angle);
          this.ctx.beginPath();
          this.ctx.moveTo(20, 0);
          this.ctx.lineTo(-14, -12);
          this.ctx.lineTo(-8, 0);
          this.ctx.lineTo(-14, 12);
          this.ctx.closePath();
          this.ctx.fillStyle = '#0284C7';
          this.ctx.fill();
          this.ctx.stroke();
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  suspend() {
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  resume() {
    if (!this.renderLoop) {
      this.startRenderLoop();
    }
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    // Direct Mouse Aiming & Firing on Canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;

      // Aim ship directly at cursor click
      this.ship.angle = Math.atan2(targetY - this.ship.y, targetX - this.ship.x);
      // Give small forward thrust
      this.ship.vx += Math.cos(this.ship.angle) * 1.5;
      this.ship.vy += Math.sin(this.ship.angle) * 1.5;
      this.fireBullet();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      // Smoothly steer ship angle towards mouse cursor
      const targetAngle = Math.atan2(targetY - this.ship.y, targetX - this.ship.x);
      this.ship.angle += (targetAngle - this.ship.angle) * 0.15;
    });

    this.keyDownHandler = (e) => {
      this.keys[e.key] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.fireBullet();
      }
      if (e.key === 'b' || e.key === 'B') {
        this.triggerShockwave();
      }
    };

    this.keyUpHandler = (e) => {
      this.keys[e.key] = false;
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // On-screen Buttons
    document.getElementById('btn-ship-left')?.addEventListener('pointerdown', () => { this.keys['ArrowLeft'] = true; });
    document.getElementById('btn-ship-left')?.addEventListener('pointerup', () => { this.keys['ArrowLeft'] = false; });
    document.getElementById('btn-ship-right')?.addEventListener('pointerdown', () => { this.keys['ArrowRight'] = true; });
    document.getElementById('btn-ship-right')?.addEventListener('pointerup', () => { this.keys['ArrowRight'] = false; });
    document.getElementById('btn-ship-thrust')?.addEventListener('pointerdown', () => { this.keys['ArrowUp'] = true; });
    document.getElementById('btn-ship-thrust')?.addEventListener('pointerup', () => { this.keys['ArrowUp'] = false; });
    document.getElementById('btn-ship-fire')?.addEventListener('click', () => this.fireBullet());
    document.getElementById('btn-space-bomb')?.addEventListener('click', () => this.triggerShockwave());
    document.getElementById('btn-space-restart')?.addEventListener('click', () => {
      this.score = 0;
      this.updateScoreboard();
      this.asteroids = [];
      this.spawnAsteroids(5);
    });

    const weaponGrid = document.getElementById('space-weapon-grid');
    if (weaponGrid) {
      weaponGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        weaponGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.ship.powerup = btn.getAttribute('data-weapon');
        SoundFX.playPop(550);
      });
    }
  }

  destroy() {
    this.suspend();
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
  }
}
