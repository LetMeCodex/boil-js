import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * CHAPTER 02: SKETCH BRICK BREAKER (NEO-ARKANOID)
 * ============================================================================
 * Hand-drawn procedural arcade brick breaker featuring kinetic boiling art,
 * powerup capsules, multiball physics, laser paddle blasters, and combo chains.
 */

export class ArkanoidScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.score = 0;
    this.highScore = 0;
    this.combo = 0;
    this.lives = 3;
    this.level = 1;

    this.paddle = {
      x: 400,
      y: 470,
      w: 110,
      h: 16,
      vx: 0,
      targetX: 400,
      isLaser: false,
      laserTimer: 0
    };

    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.keys = { left: false, right: false, space: false };

    this.initDOM();
    this.setupCanvas();
    this.buildLevel();
    this.spawnBall();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 320px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 600px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Sketch Brick Breaker</span>
              <span class="toolbar-badge">Hand-Drawn Neo-Arkanoid</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-arkanoid-multiball" class="tactile-btn amber">
                <span>💥 Multiball (3x)</span>
              </button>
              <button id="btn-arkanoid-laser" class="tactile-btn sage">
                <span>⚡ Laser Paddle</span>
              </button>
              <button id="btn-arkanoid-reset" class="tactile-btn outline">
                <span>🔄 New Game</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="arkanoid-canvas-wrap" style="min-height: 520px; user-select: none; position: relative;">
            <canvas id="arkanoid-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- On-Screen Paddle Controls -->
            <div style="position: absolute; bottom: 16px; left: 24px; right: 24px; display: flex; justify-content: space-between; pointer-events: none;">
              <button id="btn-pad-left" class="tactile-btn primary" style="pointer-events: auto; padding: 12px 24px; font-size: 1rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>◀ MOVE LEFT (A)</span>
              </button>
              <button id="btn-launch-ball" class="tactile-btn amber" style="pointer-events: auto; padding: 12px 20px; font-size: 0.9rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>🚀 LAUNCH / FIRE (SPACE)</span>
              </button>
              <button id="btn-pad-right" class="tactile-btn primary" style="pointer-events: auto; padding: 12px 24px; font-size: 1rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>MOVE RIGHT (D) ▶</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Controls & Scoreboard Panel -->
        <div class="controls-panel">
          <!-- Arcade Scoreboard Card -->
          <div class="panel-card" style="background: var(--bg-surface-alt); border: 2px solid var(--accent-amber);">
            <div class="panel-header">
              <span class="panel-title">🏆 Arcade Scoreboard</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; text-align: center; padding: 6px 0;">
              <div style="font-family: 'Fira Code', monospace; font-size: 2.2rem; font-weight: 800; color: var(--accent-amber); line-height: 1;" id="hud-arkanoid-score">
                000,000
              </div>
              <div style="display: flex; justify-content: space-around; font-size: 0.78rem; font-family: 'Space Grotesk', sans-serif;">
                <span>COMBO: <strong id="hud-arkanoid-combo" style="color: var(--accent-terracotta);">0x</strong></span>
                <span>LIVES: <strong id="hud-arkanoid-lives" style="color: var(--accent-sage);">❤️❤️❤️</strong></span>
                <span>LEVEL: <strong id="hud-arkanoid-level">1</strong></span>
              </div>
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎮 Arcade Controls</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-secondary);">
              <div><kbd>Mouse</kbd> or <kbd>Touch</kbd> : Direct Paddle Aim</div>
              <div><kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> : Move Paddle</div>
              <div><kbd>Space</kbd> : Launch Ball / Shoot Lasers</div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⚡ Ball Speed Tuning</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Speed Multiplier:</span>
                <span id="val-arkanoid-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-arkanoid-speed" min="0.7" max="1.8" step="0.1" value="1.0" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('arkanoid-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('arkanoid-canvas-wrap');
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

      this.paddle.y = h - 50;
      if (this.paddle.targetX === 400) this.paddle.targetX = w / 2;
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
    this.setupMouseTracking();
  }

  setupMouseTracking() {
    const handleMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const mouseX = clientX - rect.left;
      this.paddle.targetX = Math.max(this.paddle.w / 2 + 10, Math.min(this.width - this.paddle.w / 2 - 10, mouseX));
    };

    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('touchmove', handleMove, { passive: true });

    this.canvas.addEventListener('click', () => {
      this.launchStuckBalls();
      if (this.paddle.isLaser) this.fireLasers();
    });
  }

  bindEvents() {
    document.getElementById('btn-arkanoid-multiball')?.addEventListener('click', () => {
      this.triggerMultiball();
    });

    document.getElementById('btn-arkanoid-laser')?.addEventListener('click', () => {
      this.activateLaser();
    });

    document.getElementById('btn-arkanoid-reset')?.addEventListener('click', () => {
      this.resetGame();
    });

    document.getElementById('btn-launch-ball')?.addEventListener('click', () => {
      this.launchStuckBalls();
      if (this.paddle.isLaser) this.fireLasers();
    });

    // Paddle buttons
    const btnLeft = document.getElementById('btn-pad-left');
    const btnRight = document.getElementById('btn-pad-right');

    const startLeft = () => { this.keys.left = true; };
    const stopLeft = () => { this.keys.left = false; };
    const startRight = () => { this.keys.right = true; };
    const stopRight = () => { this.keys.right = false; };

    btnLeft?.addEventListener('mousedown', startLeft);
    btnLeft?.addEventListener('mouseup', stopLeft);
    btnLeft?.addEventListener('touchstart', startLeft);
    btnLeft?.addEventListener('touchend', stopLeft);

    btnRight?.addEventListener('mousedown', startRight);
    btnRight?.addEventListener('mouseup', stopRight);
    btnRight?.addEventListener('touchstart', startRight);
    btnRight?.addEventListener('touchend', stopRight);

    // Keyboard
    this.keyDownHandler = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.launchStuckBalls();
        if (this.paddle.isLaser) this.fireLasers();
      }
    };

    this.keyUpHandler = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // Speed Slider
    document.getElementById('slider-arkanoid-speed')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('val-arkanoid-speed').textContent = `${val.toFixed(1)}x`;
      this.speedMult = val;
    });
    this.speedMult = 1.0;
  }

  buildLevel() {
    this.bricks = [];
    const w = this.width || 800;
    const cols = 8;
    const rows = 5;
    const marginX = w * 0.08;
    const brickW = (w - marginX * 2 - (cols - 1) * 10) / cols;
    const brickH = 24;
    const startY = 60;

    const rowColors = [
      { color: '#EF4444', score: 50, hp: 1 }, // Ruby
      { color: '#F59E0B', score: 40, hp: 1 }, // Amber
      { color: '#10B981', score: 30, hp: 1 }, // Emerald
      { color: '#3B82F6', score: 20, hp: 1 }, // Sapphire
      { color: '#8B5CF6', score: 10, hp: 1 }  // Amethyst
    ];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = marginX + c * (brickW + 10);
        const y = startY + r * (brickH + 10);
        const isGold = Math.random() < 0.2;

        this.bricks.push({
          x,
          y,
          w: brickW,
          h: brickH,
          color: isGold ? '#F59E0B' : rowColors[r].color,
          score: rowColors[r].score * (isGold ? 2 : 1),
          hp: isGold ? 2 : 1,
          maxHp: isGold ? 2 : 1,
          isGold,
          seed: 1000 + r * 100 + c * 10
        });
      }
    }
  }

  spawnBall(isStuck = true) {
    const p = this.paddle;
    const speed = 6 * this.speedMult;
    const angle = -Math.PI / 2 + (Math.random() * 0.4 - 0.2);

    this.balls.push({
      x: p.x,
      y: p.y - 16,
      vx: isStuck ? 0 : Math.cos(angle) * speed,
      vy: isStuck ? 0 : Math.sin(angle) * speed,
      r: 8,
      stuck: isStuck,
      seed: Math.floor(Math.random() * 9999),
      fireball: false
    });
  }

  launchStuckBalls() {
    for (const b of this.balls) {
      if (b.stuck) {
        b.stuck = false;
        const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3);
        const speed = 6 * this.speedMult;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        SoundFX.triggerBoilPop();
      }
    }
  }

  triggerMultiball() {
    if (this.balls.length === 0) this.spawnBall(false);
    const origin = this.balls[0] || { x: this.paddle.x, y: this.paddle.y - 20 };

    for (let i = 0; i < 2; i++) {
      const angle = -Math.PI / 2 + (i === 0 ? -0.5 : 0.5);
      const speed = 6.5 * this.speedMult;
      this.balls.push({
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 8,
        stuck: false,
        seed: Math.floor(Math.random() * 9999),
        fireball: false
      });
    }
    SoundFX.triggerBoilSwoosh();
  }

  activateLaser() {
    this.paddle.isLaser = true;
    this.paddle.laserTimer = 350; // frames
    SoundFX.triggerBumperHit('E5');
  }

  fireLasers() {
    const p = this.paddle;
    this.lasers.push(
      { x: p.x - p.w * 0.38, y: p.y - 8, vy: -12 },
      { x: p.x + p.w * 0.38, y: p.y - 8, vy: -12 }
    );
    SoundFX.triggerBoilPop();
  }

  resetGame() {
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.level = 1;
    this.balls = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.paddle.w = 110;
    this.paddle.isLaser = false;
    this.buildLevel();
    this.spawnBall(true);
    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = document.getElementById('hud-arkanoid-score');
    if (scoreEl) scoreEl.textContent = this.score.toString().padStart(6, '0');

    const comboEl = document.getElementById('hud-arkanoid-combo');
    if (comboEl) comboEl.textContent = `${this.combo}x`;

    const livesEl = document.getElementById('hud-arkanoid-lives');
    if (livesEl) {
      livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
    }

    const levelEl = document.getElementById('hud-arkanoid-level');
    if (levelEl) levelEl.textContent = this.level;
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      const w = this.width || 800;
      const h = this.height || 520;

      // 1. Update Paddle
      if (this.keys.left) this.paddle.targetX -= 8;
      if (this.keys.right) this.paddle.targetX += 8;
      this.paddle.targetX = Math.max(this.paddle.w / 2 + 10, Math.min(w - this.paddle.w / 2 - 10, this.paddle.targetX));
      this.paddle.x += (this.paddle.targetX - this.paddle.x) * 0.25;

      if (this.paddle.isLaser) {
        this.paddle.laserTimer--;
        if (this.paddle.laserTimer <= 0) this.paddle.isLaser = false;
      }

      // 2. Update Lasers
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        l.y += l.vy;
        if (l.y < 0) {
          this.lasers.splice(i, 1);
          continue;
        }

        // Check laser brick hit
        for (let j = this.bricks.length - 1; j >= 0; j--) {
          const br = this.bricks[j];
          if (l.x >= br.x && l.x <= br.x + br.w && l.y >= br.y && l.y <= br.y + br.h) {
            this.lasers.splice(i, 1);
            br.hp--;
            if (br.hp <= 0) {
              this.score += br.score;
              this.spawnBrickParticles(br.x + br.w / 2, br.y + br.h / 2, br.color);
              this.bricks.splice(j, 1);
              SoundFX.triggerBumperHit('C5');
            }
            break;
          }
        }
      }

      // 3. Update Balls
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i];

        if (b.stuck) {
          b.x = this.paddle.x;
          b.y = this.paddle.y - 16;
          continue;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Wall collisions
        if (b.x - b.r < 10) {
          b.x = 10 + b.r;
          b.vx = Math.abs(b.vx);
          SoundFX.triggerBoilPop();
        } else if (b.x + b.r > w - 10) {
          b.x = w - 10 - b.r;
          b.vx = -Math.abs(b.vx);
          SoundFX.triggerBoilPop();
        }

        if (b.y - b.r < 10) {
          b.y = 10 + b.r;
          b.vy = Math.abs(b.vy);
          SoundFX.triggerBoilPop();
        }

        // Bottom drain
        if (b.y - b.r > h) {
          this.balls.splice(i, 1);
          if (this.balls.length === 0) {
            this.lives--;
            this.combo = 0;
            this.updateHUD();
            if (this.lives > 0) {
              setTimeout(() => this.spawnBall(true), 500);
            } else {
              setTimeout(() => {
                alert(`Game Over! Final Score: ${this.score}`);
                this.resetGame();
              }, 300);
            }
          }
          continue;
        }

        // Paddle Collision
        const p = this.paddle;
        if (
          b.y + b.r >= p.y - p.h / 2 &&
          b.y - b.r <= p.y + p.h / 2 &&
          b.x >= p.x - p.w / 2 - 4 &&
          b.x <= p.x + p.w / 2 + 4 &&
          b.vy > 0
        ) {
          b.y = p.y - p.h / 2 - b.r;
          const hitOffset = (b.x - p.x) / (p.w / 2); // -1 to 1
          const maxAngle = Math.PI * 0.38; // 68 degrees
          const angle = hitOffset * maxAngle - Math.PI / 2;
          const currentSpeed = Math.hypot(b.vx, b.vy);
          const newSpeed = Math.min(currentSpeed * 1.02, 11 * this.speedMult);

          b.vx = Math.cos(angle) * newSpeed;
          b.vy = Math.sin(angle) * newSpeed;
          this.combo = 0;
          this.updateHUD();
          SoundFX.triggerBumperHit('G4');
        }

        // Brick Collisions
        for (let j = this.bricks.length - 1; j >= 0; j--) {
          const br = this.bricks[j];
          if (
            b.x + b.r >= br.x &&
            b.x - b.r <= br.x + br.w &&
            b.y + b.r >= br.y &&
            b.y - b.r <= br.y + br.h
          ) {
            // Collision response
            if (!b.fireball) {
              const overlapLeft = (b.x + b.r) - br.x;
              const overlapRight = (br.x + br.w) - (b.x - b.r);
              const overlapTop = (b.y + b.r) - br.y;
              const overlapBottom = (br.y + br.h) - (b.y - b.r);
              const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

              if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                b.vx = -b.vx;
              } else {
                b.vy = -b.vy;
              }
            }

            br.hp--;
            this.combo++;
            this.score += br.score * Math.min(this.combo, 5);
            this.updateHUD();
            SoundFX.triggerBumperHit('C5');

            if (br.hp <= 0) {
              this.spawnBrickParticles(br.x + br.w / 2, br.y + br.h / 2, br.color);
              if (br.isGold || Math.random() < 0.25) {
                this.spawnPowerup(br.x + br.w / 2, br.y + br.h / 2);
              }
              this.bricks.splice(j, 1);

              // Check level clear
              if (this.bricks.length === 0) {
                this.level++;
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                this.buildLevel();
                this.balls = [];
                this.spawnBall(true);
                this.updateHUD();
              }
            }
            break;
          }
        }
      }

      // 4. Update Powerups
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pw = this.powerups[i];
        pw.y += 2.5;

        // Catch powerup
        const p = this.paddle;
        if (
          pw.y >= p.y - p.h / 2 &&
          pw.y <= p.y + p.h / 2 &&
          pw.x >= p.x - p.w / 2 &&
          pw.x <= p.x + p.w / 2
        ) {
          this.applyPowerup(pw.type);
          this.powerups.splice(i, 1);
          SoundFX.triggerBoilSwoosh();
          continue;
        }

        if (pw.y > h) {
          this.powerups.splice(i, 1);
        }
      }

      // 5. Render Scene
      if (this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, w, h);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const arenaBg = isDark ? '#161920' : '#F9F7F1';

        // Playfield Background
        this.ctx.fillStyle = arenaBg;
        this.ctx.fillRect(8, 8, w - 16, h - 16);

        try {
          if (!this.rc) this.rc = rough.canvas(this.canvas);

          // Arena Border
          this.rc.rectangle(8, 8, w - 16, h - 16, {
            seed: 1000 + frameIdx * 10,
            roughness: 1.4,
            stroke: ink,
            strokeWidth: 3
          });

          // Draw Bricks
          for (let i = 0; i < this.bricks.length; i++) {
            const br = this.bricks[i];
            this.rc.rectangle(br.x, br.y, br.w, br.h, {
              seed: br.seed + frameIdx * 15,
              roughness: 1.5,
              stroke: ink,
              strokeWidth: 2,
              fill: br.color,
              fillStyle: br.hp > 1 ? 'cross-hatch' : 'solid'
            });
          }

          // Draw Powerup Capsules
          for (let i = 0; i < this.powerups.length; i++) {
            const pw = this.powerups[i];
            this.rc.circle(pw.x, pw.y, 22, {
              seed: 5000 + i * 50 + frameIdx * 10,
              roughness: 1.4,
              stroke: '#FFFFFF',
              strokeWidth: 2,
              fill: pw.color,
              fillStyle: 'solid'
            });
          }

          // Draw Lasers
          for (let i = 0; i < this.lasers.length; i++) {
            const l = this.lasers[i];
            this.rc.line(l.x, l.y, l.x, l.y + 12, {
              seed: 8000 + i,
              stroke: '#EF4444',
              strokeWidth: 4
            });
          }

          // Draw Particles
          for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.alpha -= 0.04;
            if (pt.alpha <= 0) {
              this.particles.splice(i, 1);
              continue;
            }
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

          // Draw Paddle
          const p = this.paddle;
          this.rc.rectangle(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h, {
            seed: 3000 + frameIdx * 15,
            roughness: 1.4,
            stroke: ink,
            strokeWidth: 2.5,
            fill: p.isLaser ? '#EF4444' : (isDark ? '#F59E0B' : '#D97706'),
            fillStyle: 'solid'
          });

          // Draw Balls
          for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            this.rc.circle(b.x, b.y, b.r * 2, {
              seed: b.seed + frameIdx * 20,
              roughness: 1.3,
              stroke: ink,
              strokeWidth: 2,
              fill: isDark ? '#60A5FA' : '#2563EB',
              fillStyle: 'solid'
            });

            // Ball core glint
            this.rc.circle(b.x - 2, b.y - 2, 4, {
              seed: b.seed + 5,
              stroke: 'transparent',
              fill: '#FFFFFF',
              fillStyle: 'solid'
            });
          }
        } catch (err) {
          // Native 2D Fallback
          this.ctx.fillStyle = '#D97706';
          this.ctx.fillRect(this.paddle.x - this.paddle.w / 2, this.paddle.y - this.paddle.h / 2, this.paddle.w, this.paddle.h);
          for (const b of this.balls) {
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fillStyle = '#2563EB';
            this.ctx.fill();
          }
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  spawnBrickParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 5,
        color,
        alpha: 1.0
      });
    }
  }

  spawnPowerup(x, y) {
    const types = [
      { type: 'multiball', color: '#10B981' },
      { type: 'wide', color: '#3B82F6' },
      { type: 'laser', color: '#EF4444' }
    ];
    const chosen = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x,
      y,
      type: chosen.type,
      color: chosen.color
    });
  }

  applyPowerup(type) {
    if (type === 'multiball') {
      this.triggerMultiball();
    } else if (type === 'wide') {
      this.paddle.w = 160;
      setTimeout(() => { this.paddle.w = 110; }, 8000);
    } else if (type === 'laser') {
      this.activateLaser();
    }
  }

  suspend() {
    // Keep running
  }

  resume() {
    if (!this.renderLoop) {
      this.startRenderLoop();
    }
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
  }
}
