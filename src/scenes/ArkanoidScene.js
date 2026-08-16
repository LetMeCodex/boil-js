import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

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
    this.gameOver = false;
    this.gameWon = false;

    this.paddle = {
      x: 400,
      y: 470,
      w: 120,
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
    this.speedMult = 1.0;

    this.initDOM();
    this.setupCanvas();
    this.buildLevel();
    this.spawnBall(true);
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
                ${renderIcon('multiball')}
                <span>Multiball (3x)</span>
              </button>
              <button id="btn-arkanoid-laser" class="tactile-btn outline">
                ${renderIcon('zap')}
                <span>Laser Paddle</span>
              </button>
              <button id="btn-arkanoid-reset" class="tactile-btn outline">
                ${renderIcon('reset')}
                <span>New Game</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="arkanoid-canvas-wrap" style="min-height: 520px; user-select: none; position: relative; cursor: pointer;">
            <canvas id="arkanoid-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- On-Screen Paddle Controls -->
            <div style="position: absolute; bottom: 16px; left: 24px; right: 24px; display: flex; justify-content: space-between; pointer-events: none;">
              <button id="btn-pad-left" class="tactile-btn primary" style="pointer-events: auto;">
                <span>LEFT (A)</span>
              </button>
              <button id="btn-launch-ball" class="tactile-btn amber" style="pointer-events: auto;">
                ${renderIcon('rocket')}
                <span>LAUNCH / FIRE (SPACE)</span>
              </button>
              <button id="btn-pad-right" class="tactile-btn primary" style="pointer-events: auto;">
                <span>RIGHT (D)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Controls & Scoreboard Panel -->
        <div class="controls-panel">
          <!-- Arcade Scoreboard Card -->
          <div class="panel-card" style="background: var(--paper-card); border: 1px solid var(--orange);">
            <div class="panel-header">
              <span class="panel-title">ARCADE SCOREBOARD</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; text-align: center; padding: 6px 0;">
              <div style="font-family: 'Fira Code', monospace; font-size: 2.2rem; font-weight: 800; color: var(--orange); line-height: 1;" id="hud-arkanoid-score">
                000,000
              </div>
              <div style="display: flex; justify-content: space-around; font-size: 0.78rem; font-family: 'Space Grotesk', sans-serif;">
                <span>COMBO: <strong id="hud-arkanoid-combo" style="color: var(--vermillion);">0x</strong></span>
                <span>LIVES: <strong id="hud-arkanoid-lives" style="color: #10B981;">3</strong></span>
                <span>LEVEL: <strong id="hud-arkanoid-level">1</strong></span>
              </div>
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">ARCADE CONTROLS</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.78rem; color: var(--ink-soft);">
              <div><kbd>Mouse</kbd> or <kbd>Touch</kbd> : Direct Paddle Aim</div>
              <div><kbd>A</kbd> / <kbd>D</kbd> or <kbd>←</kbd> / <kbd>→</kbd> : Move Paddle</div>
              <div><kbd>Space</kbd> / <kbd>Click</kbd> : Launch Ball / Shoot Lasers</div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">BALL SPEED TUNING</span>
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
      const w = Math.max(rect ? Math.floor(rect.width) : 0, wrap ? wrap.clientWidth : 0, 300);
      const h = Math.max(rect ? Math.floor(rect.height) : 0, wrap ? wrap.clientHeight : 0, 440);

      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);

      this.paddle.y = h - 50;
      if (this.paddle.targetX === 400 || this.paddle.targetX > w) this.paddle.targetX = w / 2;
    };

    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 100);
    this.setupMouseTracking();
  }

  setupMouseTracking() {
    const updatePaddlePos = (clientX) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const w = this.width || 800;
      this.paddle.targetX = Math.max(this.paddle.w / 2 + 10, Math.min(w - this.paddle.w / 2 - 10, mouseX));
    };

    this.canvas.addEventListener('mousemove', (e) => updatePaddlePos(e.clientX));
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        updatePaddlePos(e.touches[0].clientX);
      }
    }, { passive: true });

    const handleAction = (clientX) => {
      if (clientX !== undefined) updatePaddlePos(clientX);
      if (this.gameOver || this.gameWon) {
        this.resetGame();
        return;
      }
      this.launchStuckBalls();
      if (this.paddle.isLaser) this.fireLasers();
    };

    this.canvas.addEventListener('pointerdown', (e) => handleAction(e.clientX));
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
      if (this.gameOver || this.gameWon) {
        this.resetGame();
        return;
      }
      this.launchStuckBalls();
      if (this.paddle.isLaser) this.fireLasers();
    });

    // Paddle buttons
    const btnLeft = document.getElementById('btn-pad-left');
    const btnRight = document.getElementById('btn-pad-right');

    const startLeft = (e) => { e.preventDefault(); this.keys.left = true; };
    const stopLeft = (e) => { e.preventDefault(); this.keys.left = false; };
    const startRight = (e) => { e.preventDefault(); this.keys.right = true; };
    const stopRight = (e) => { e.preventDefault(); this.keys.right = false; };

    btnLeft?.addEventListener('mousedown', startLeft);
    btnLeft?.addEventListener('mouseup', stopLeft);
    btnLeft?.addEventListener('mouseleave', stopLeft);
    btnLeft?.addEventListener('touchstart', startLeft, { passive: false });
    btnLeft?.addEventListener('touchend', stopLeft, { passive: false });

    btnRight?.addEventListener('mousedown', startRight);
    btnRight?.addEventListener('mouseup', stopRight);
    btnRight?.addEventListener('mouseleave', stopRight);
    btnRight?.addEventListener('touchstart', startRight, { passive: false });
    btnRight?.addEventListener('touchend', stopRight, { passive: false });

    // Keyboard
    this.keyDownHandler = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space') {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return;
        e.preventDefault();
        if (this.gameOver || this.gameWon) {
          this.resetGame();
          return;
        }
        this.launchStuckBalls();
        if (this.paddle.isLaser) this.fireLasers();
      }
    };

    this.keyUpHandler = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    };

    this.blurHandler = () => {
      this.keys.left = false;
      this.keys.right = false;
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
    window.addEventListener('blur', this.blurHandler);

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
    const marginX = w * 0.06;
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
        const isGold = (r === 1 && (c === 0 || c === 1 || c === 3 || c === 4)) || (r === 4 && (c === 0 || c === 4 || c === 5));

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
    const speed = 6.5 * this.speedMult;
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
    let launched = false;
    for (const b of this.balls) {
      if (b.stuck) {
        b.stuck = false;
        const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3);
        const speed = 6.5 * this.speedMult;
        b.vx = Math.cos(angle) * speed;
        b.vy = Math.sin(angle) * speed;
        launched = true;
      }
    }
    if (launched) {
      SoundFX.triggerBoilPop();
    }
  }

  triggerMultiball() {
    if (this.gameOver) this.resetGame();
    if (this.balls.length === 0) this.spawnBall(false);
    const origin = this.balls[0] || { x: this.paddle.x, y: this.paddle.y - 20 };

    for (let i = 0; i < 2; i++) {
      const angle = -Math.PI / 2 + (i === 0 ? -0.45 : 0.45);
      const speed = 7.0 * this.speedMult;
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
    this.paddle.laserTimer = 400;
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

  applyPowerup(type) {
    if (type === 'multiball') {
      this.triggerMultiball();
    } else if (type === 'laser') {
      this.activateLaser();
    } else if (type === 'wide') {
      this.paddle.w = Math.min(180, this.paddle.w + 30);
    } else if (type === 'life') {
      this.lives = Math.min(5, this.lives + 1);
      this.updateHUD();
    }
  }

  spawnPowerup(x, y) {
    const types = ['multiball', 'laser', 'wide', 'life'];
    const colors = { multiball: '#F59E0B', laser: '#EF4444', wide: '#3B82F6', life: '#10B981' };
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x,
      y,
      type,
      color: colors[type],
      vy: 2.2
    });
  }

  resetGame() {
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.balls = [];
    this.powerups = [];
    this.lasers = [];
    this.particles = [];
    this.paddle.w = 120;
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
      livesEl.textContent = Math.max(0, this.lives);
    }

    const levelEl = document.getElementById('hud-arkanoid-level');
    if (levelEl) levelEl.textContent = this.level;
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;

    const loop = (timestamp) => {
      if (!this.running) return;

      const w = this.width || 800;
      const h = this.height || 520;

      // 1. Update Paddle
      if (this.keys.left) this.paddle.targetX -= 10;
      if (this.keys.right) this.paddle.targetX += 10;
      this.paddle.targetX = Math.max(this.paddle.w / 2 + 10, Math.min(w - this.paddle.w / 2 - 10, this.paddle.targetX));
      this.paddle.x += (this.paddle.targetX - this.paddle.x) * 0.28;

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

        // Wall collisions with boundary displacement
        if (b.x - b.r < 12) {
          b.x = 12 + b.r;
          b.vx = Math.abs(b.vx);
          SoundFX.triggerBoilPop();
        } else if (b.x + b.r > w - 12) {
          b.x = w - 12 - b.r;
          b.vx = -Math.abs(b.vx);
          SoundFX.triggerBoilPop();
        }

        if (b.y - b.r < 12) {
          b.y = 12 + b.r;
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
              setTimeout(() => {
                if (!this.gameOver && !this.gameWon) {
                  this.spawnBall(true);
                }
              }, 400);
            } else {
              this.gameOver = true;
              SoundFX.triggerBumperHit('A3');
            }
          }
          continue;
        }

        // Paddle Collision
        const p = this.paddle;
        if (
          b.y + b.r >= p.y - p.h / 2 &&
          b.y - b.r <= p.y + p.h / 2 &&
          b.x >= p.x - p.w / 2 - 8 &&
          b.x <= p.x + p.w / 2 + 8 &&
          b.vy > 0
        ) {
          // Push ball cleanly above paddle top
          b.y = p.y - p.h / 2 - b.r - 0.5;

          const hitOffset = (b.x - p.x) / (p.w / 2); // -1 to 1
          const maxAngle = Math.PI * 0.38; // ~68 degrees
          const angle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, hitOffset * maxAngle - Math.PI / 2));
          const currentSpeed = Math.hypot(b.vx, b.vy);
          const newSpeed = Math.min(currentSpeed * 1.015, 11 * this.speedMult);

          b.vx = Math.cos(angle) * newSpeed;
          b.vy = Math.sin(angle) * newSpeed;

          // Prevent near-horizontal trapping
          if (Math.abs(b.vy) < 2.5) {
            b.vy = -2.5;
          }

          this.combo = 0;
          this.updateHUD();
          SoundFX.triggerBumperHit('G4');
        }

        // Brick Collisions with robust penetration ejection
        for (let j = this.bricks.length - 1; j >= 0; j--) {
          const br = this.bricks[j];
          const overlapLeft = (b.x + b.r) - br.x;
          const overlapRight = (br.x + br.w) - (b.x - b.r);
          const overlapTop = (b.y + b.r) - br.y;
          const overlapBottom = (br.y + br.h) - (b.y - b.r);

          if (overlapLeft > 0 && overlapRight > 0 && overlapTop > 0 && overlapBottom > 0) {
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (!b.fireball) {
              if (minOverlap === overlapLeft) {
                b.x = br.x - b.r - 0.5;
                b.vx = -Math.abs(b.vx);
              } else if (minOverlap === overlapRight) {
                b.x = br.x + br.w + b.r + 0.5;
                b.vx = Math.abs(b.vx);
              } else if (minOverlap === overlapTop) {
                b.y = br.y - b.r - 0.5;
                b.vy = -Math.abs(b.vy);
              } else {
                b.y = br.y + br.h + b.r + 0.5;
                b.vy = Math.abs(b.vy);
              }

              // Ensure minimal vertical velocity so ball doesn't get stuck in horizontal bounces
              if (Math.abs(b.vy) < 2.0) {
                b.vy = b.vy < 0 ? -2.0 : 2.0;
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
            break; // Handle one brick collision per frame
          }
        }
      }

      // 4. Update Powerups
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const pw = this.powerups[i];
        pw.y += pw.vy;

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

          // Launch Hint prompt if ball is waiting on paddle
          if (this.balls.some(b => b.stuck) && !this.gameOver) {
            this.ctx.save();
            this.ctx.font = "700 12px 'Space Grotesk', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = isDark ? "#F59E0B" : "#D97706";
            const bounce = Math.sin(timestamp * 0.008) * 4;
            this.ctx.fillText("CLICK OR PRESS SPACE TO LAUNCH", p.x, p.y - 32 + bounce);
            this.ctx.restore();
          }

          // Game Over Overlay
          if (this.gameOver) {
            this.ctx.save();
            this.ctx.fillStyle = isDark ? "rgba(10, 13, 17, 0.85)" : "rgba(244, 239, 230, 0.88)";
            this.ctx.fillRect(8, 8, w - 16, h - 16);

            this.ctx.font = "800 24px 'Space Grotesk', sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = "#EF4444";
            this.ctx.fillText("GAME OVER", w / 2, h / 2 - 20);

            this.ctx.font = "600 13px 'Fira Code', monospace";
            this.ctx.fillStyle = ink;
            this.ctx.fillText(`FINAL SCORE: ${this.score.toLocaleString()}`, w / 2, h / 2 + 10);

            this.ctx.font = "700 12px 'Space Grotesk', sans-serif";
            this.ctx.fillStyle = isDark ? "#F59E0B" : "#D97706";
            this.ctx.fillText("CLICK CANVAS OR PRESS SPACE TO PLAY AGAIN", w / 2, h / 2 + 42);
            this.ctx.restore();
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

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  suspend() {
    this.running = false;
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  resume() {
    this.running = true;
    this.startRenderLoop();
  }

  destroy() {
    this.suspend();
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.keyDownHandler) window.removeEventListener('keydown', this.keyDownHandler);
    if (this.keyUpHandler) window.removeEventListener('keyup', this.keyUpHandler);
    if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
  }
}
