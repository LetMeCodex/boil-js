import Matter from 'matter-js';
import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class PinballScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.score = 0;
    this.multiplier = 1;
    this.combo = 0;
    this.ballsLeft = 3;
    this.balls = [];
    this.bumpers = [];
    this.spinners = [];
    this.targets = [];

    this.flipperKeys = { left: false, right: false };
    this.plungerPower = 0;
    this.isPlunging = false;

    this.initDOM();
    this.setupMatterWorld();
    this.buildTable();
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
              <span class="toolbar-title">Sketch Pinball Arcade</span>
              <span class="toolbar-badge">Hand-Drawn Pachinko Lab</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-pinball-multiball" class="tactile-btn amber">
                <span>💥 Multiball (4x)</span>
              </button>
              <button id="btn-pinball-reset" class="tactile-btn outline">
                <span>🔄 New Game</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="pinball-canvas-wrap" style="min-height: 520px; user-select: none;">
            <canvas id="pinball-stage-canvas" class="main-stage-canvas"></canvas>

            <!-- On-Screen Flipper Controls (Touch & Click) -->
            <div style="position: absolute; bottom: 16px; left: 24px; right: 24px; display: flex; justify-content: space-between; pointer-events: none;">
              <button id="btn-flip-left" class="tactile-btn primary" style="pointer-events: auto; padding: 12px 24px; font-size: 1rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>◀ LEFT FLIPPER (A)</span>
              </button>
              <button id="btn-plunger-pull" class="tactile-btn amber" style="pointer-events: auto; padding: 12px 20px; font-size: 0.9rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>🚀 LAUNCH BALL (SPACE)</span>
              </button>
              <button id="btn-flip-right" class="tactile-btn primary" style="pointer-events: auto; padding: 12px 24px; font-size: 1rem; border-radius: 9999px; box-shadow: var(--shadow-lg);">
                <span>RIGHT FLIPPER (D) ▶</span>
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
              <div style="font-family: 'Fira Code', monospace; font-size: 2.2rem; font-weight: 800; color: var(--accent-amber); line-height: 1;" id="hud-pinball-score">
                000,000
              </div>
              <div style="display: flex; justify-content: space-around; font-size: 0.78rem; font-family: 'Space Grotesk', sans-serif;">
                <span>MULTIPLIER: <strong id="hud-pinball-mult" style="color: var(--accent-sage);">1x</strong></span>
                <span>COMBO: <strong id="hud-pinball-combo" style="color: var(--accent-terracotta);">0</strong></span>
                <span>BALLS: <strong id="hud-pinball-balls">3</strong></span>
              </div>
            </div>
          </div>

          <!-- Controls Guide -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎮 Arcade Controls</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-secondary);">
              <div><kbd>A</kbd> or <kbd>←</kbd> : Left Flipper</div>
              <div><kbd>D</kbd> or <kbd>→</kbd> : Right Flipper</div>
              <div><kbd>Space</kbd> (Hold & Release) : Spring Plunger</div>
              <div>Click / Drag on canvas to interact directly!</div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">⚡ Bumper Tuning</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Bumper Restitution:</span>
                <span id="val-pinball-restitution" class="control-val">1.6x</span>
              </div>
              <input type="range" id="slider-pinball-restitution" min="1.0" max="2.5" step="0.1" value="1.6" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupMatterWorld() {
    this.canvas = document.getElementById('pinball-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    this.engineMatter = Matter.Engine.create({ enableSleeping: false });
    this.world = this.engineMatter.world;
    this.world.gravity.y = 1.1;

    const resize = () => {
      const wrap = document.getElementById('pinball-canvas-wrap');
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

      this.buildTable();
      if (this.balls.length === 0) {
        this.spawnBall();
      }
    };

    window.addEventListener('resize', resize);
    resize();
    setTimeout(resize, 100);
    this.setupCollisionEvents();
  }

  buildTable() {
    Matter.World.clear(this.world, false);
    this.balls = [];
    this.bumpers = [];
    this.spinners = [];
    this.targets = [];

    const w = this.width || 800;
    const h = this.height || 520;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';

    // Outer Boundaries
    const tableLeft = w * 0.12;
    const tableRight = w * 0.88;
    const tableTop = 20;
    const tableBottom = h - 20;
    const launchLaneX = tableRight - 55;

    // Walls
    const wallOpts = { isStatic: true, friction: 0.05, restitution: 0.5 };
    const leftWall = Matter.Bodies.rectangle(tableLeft, h / 2, 16, h, wallOpts);
    const rightWall = Matter.Bodies.rectangle(tableRight, h / 2, 16, h, wallOpts);
    const topWall = Matter.Bodies.rectangle(w / 2, tableTop, w, 16, wallOpts);
    const launchWall = Matter.Bodies.rectangle(launchLaneX, h / 2 + 30, 12, h - 80, wallOpts);

    // Curved Top Arch guides
    const arch1 = Matter.Bodies.rectangle(tableLeft + 60, tableTop + 50, 140, 16, { ...wallOpts, angle: 0.5 });
    const arch2 = Matter.Bodies.rectangle(launchLaneX - 45, tableTop + 40, 120, 16, { ...wallOpts, angle: -0.6 });

    // Lower Slanted Slingshot Guides
    const drainY = tableBottom - 60;
    const flipperY = tableBottom - 75;
    const guideLeft = Matter.Bodies.rectangle(tableLeft + 70, flipperY - 45, 120, 16, { ...wallOpts, angle: 0.65 });
    const guideRight = Matter.Bodies.rectangle(launchLaneX - 70, flipperY - 45, 120, 16, { ...wallOpts, angle: -0.65 });

    Matter.World.add(this.world, [leftWall, rightWall, topWall, launchWall, arch1, arch2, guideLeft, guideRight]);

    // 1. Interactive Flippers
    const flipperLen = 78;
    const flipperWidth = 18;

    // Left Flipper Pivot
    const leftPivotX = tableLeft + 120;
    this.leftFlipper = Matter.Bodies.rectangle(leftPivotX + flipperLen / 2 - 10, flipperY, flipperLen, flipperWidth, {
      chamfer: { radius: 8 },
      density: 0.08,
      restitution: 0.3,
      label: 'flipper'
    });
    this.leftConstraint = Matter.Constraint.create({
      pointA: { x: leftPivotX, y: flipperY },
      bodyB: this.leftFlipper,
      pointB: { x: -flipperLen / 2 + 10, y: 0 },
      stiffness: 0.9,
      length: 0
    });

    // Right Flipper Pivot
    const rightPivotX = launchLaneX - 120;
    this.rightFlipper = Matter.Bodies.rectangle(rightPivotX - flipperLen / 2 + 10, flipperY, flipperLen, flipperWidth, {
      chamfer: { radius: 8 },
      density: 0.08,
      restitution: 0.3,
      label: 'flipper'
    });
    this.rightConstraint = Matter.Constraint.create({
      pointA: { x: rightPivotX, y: flipperY },
      bodyB: this.rightFlipper,
      pointB: { x: flipperLen / 2 - 10, y: 0 },
      stiffness: 0.9,
      length: 0
    });

    Matter.World.add(this.world, [this.leftFlipper, this.leftConstraint, this.rightFlipper, this.rightConstraint]);

    // 2. Musical Bouncy Bumpers (Top Arc)
    const bumperColors = ['#D97706', '#059669', '#DC2626'];
    const bumperNotes = [329.63, 392.00, 523.25]; // E4, G4, C5

    const b1 = this.createBumper(w * 0.36, h * 0.28, 28, bumperColors[0], bumperNotes[0]);
    const b2 = this.createBumper(w * 0.54, h * 0.24, 30, bumperColors[1], bumperNotes[1]);
    const b3 = this.createBumper(w * 0.45, h * 0.42, 26, bumperColors[2], bumperNotes[2]);
    this.bumpers = [b1, b2, b3];

    // 3. Rotating Spinners
    const s1 = this.createSpinner(w * 0.28, h * 0.46);
    const s2 = this.createSpinner(w * 0.64, h * 0.46);
    this.spinners = [s1, s2];

    // Plunger Lane Spawn Zone
    this.plungerSpawn = { x: launchLaneX + 26, y: h - 90 };
  }

  createBumper(x, y, r, color, note) {
    const bumper = Matter.Bodies.circle(x, y, r, {
      isStatic: true,
      restitution: 1.6,
      label: 'bumper',
      customData: {
        r,
        baseR: r,
        color,
        note,
        scale: 1,
        seed: Math.floor(Math.random() * 100000)
      }
    });
    Matter.World.add(this.world, bumper);
    return bumper;
  }

  createSpinner(x, y) {
    const spinner = Matter.Bodies.rectangle(x, y, 44, 8, {
      isStatic: true,
      label: 'spinner',
      customData: {
        angle: 0,
        spinSpeed: 0,
        seed: Math.floor(Math.random() * 100000)
      }
    });
    Matter.World.add(this.world, spinner);
    return spinner;
  }

  spawnBall() {
    if (!this.plungerSpawn) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const ball = Matter.Bodies.circle(this.plungerSpawn.x, this.plungerSpawn.y, 14, {
      restitution: 0.7,
      friction: 0.02,
      density: 0.04,
      label: 'ball',
      customData: {
        color: isDark ? '#F59E0B' : '#D97706',
        seed: Math.floor(Math.random() * 100000)
      }
    });

    Matter.World.add(this.world, ball);
    this.balls.push(ball);
    SoundFX.playPop(520);
  }

  launchPlunger() {
    SoundFX.playPop(620);
    this.balls.forEach(b => {
      if (b.position.x > (this.width || 800) * 0.75 && b.position.y > (this.height || 520) - 150) {
        Matter.Body.setVelocity(b, { x: 0, y: -26 });
        Matter.Body.applyForce(b, b.position, { x: -0.01, y: -0.25 });
      }
    });
  }

  triggerMultiball() {
    SoundFX.playHarmonicChord();
    confetti({ particleCount: 35, spread: 60 });
    const w = this.width || 800;
    const h = this.height || 520;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const ball = Matter.Bodies.circle(w * 0.4 + (i - 1) * 40, h * 0.15, 14, {
          restitution: 0.85,
          friction: 0.02,
          density: 0.04,
          label: 'ball',
          customData: {
            color: ['#D97706', '#059669', '#DC2626'][i % 3],
            seed: Math.floor(Math.random() * 100000)
          }
        });
        Matter.Body.setVelocity(ball, { x: (Math.random() - 0.5) * 8, y: 4 });
        Matter.World.add(this.world, ball);
        this.balls.push(ball);
      }, i * 180);
    }
  }

  setupCollisionEvents() {
    Matter.Events.on(this.engineMatter, 'collisionStart', (e) => {
      e.pairs.forEach(pair => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const bumper = [bodyA, bodyB].find(b => b.label === 'bumper');
        const ball = [bodyA, bodyB].find(b => b.label === 'ball');
        const spinner = [bodyA, bodyB].find(b => b.label === 'spinner');

        if (bumper && ball) {
          const data = bumper.customData;
          // Play musical note
          if (data.note) SoundFX.playPop(data.note);

          // Score & Combo
          this.combo++;
          this.score += 150 * this.multiplier * Math.min(5, this.combo);
          this.updateScoreboard();

          // Elastic bumper pulse
          anime({
            targets: data,
            scale: [1.45, 1.0],
            duration: 350,
            easing: 'easeOutElastic(1, .4)'
          });

          // Blast ball with impulse
          const dx = ball.position.x - bumper.position.x;
          const dy = ball.position.y - bumper.position.y;
          const dist = Math.hypot(dx, dy) || 1;
          Matter.Body.applyForce(ball, ball.position, {
            x: (dx / dist) * 0.18,
            y: (dy / dist) * 0.18
          });
        }

        if (spinner && ball) {
          spinner.customData.spinSpeed = 0.35;
          this.score += 50;
          this.updateScoreboard();
          SoundFX.playPop(700);
        }
      });
    });
  }

  updateScoreboard() {
    const scoreEl = document.getElementById('hud-pinball-score');
    const comboEl = document.getElementById('hud-pinball-combo');
    const multEl = document.getElementById('hud-pinball-mult');

    if (scoreEl) scoreEl.textContent = this.score.toLocaleString().padStart(7, '0');
    if (comboEl) comboEl.textContent = `${this.combo}`;
    if (multEl) multEl.textContent = `${this.multiplier}x`;

    if (this.score >= 1000 && this.multiplier === 1) {
      this.multiplier = 2;
      confetti({ particleCount: 30, spread: 50 });
    }
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const dt = Math.min(32, timestamp - lastTime);
      lastTime = timestamp;

      // Update Flippers physics
      if (this.leftFlipper) {
        if (this.flipperKeys.left) {
          Matter.Body.setAngularVelocity(this.leftFlipper, -0.42);
        } else {
          Matter.Body.setAngularVelocity(this.leftFlipper, 0.25);
        }
      }
      if (this.rightFlipper) {
        if (this.flipperKeys.right) {
          Matter.Body.setAngularVelocity(this.rightFlipper, 0.42);
        } else {
          Matter.Body.setAngularVelocity(this.rightFlipper, -0.25);
        }
      }

      // Step Matter World
      Matter.Engine.update(this.engineMatter, dt);

      // Clean fallen balls below bottom drain
      const h = this.height || 520;
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i];
        if (b.position.y > h + 40) {
          Matter.World.remove(this.world, b);
          this.balls.splice(i, 1);
          if (this.balls.length === 0) {
            this.combo = 0;
            this.updateScoreboard();
            setTimeout(() => this.spawnBall(), 600);
          }
        }
      }

      // Render Hand-Drawn Table
      if (this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.width || 800, this.height || 520);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';
        const bgPlayfield = isDark ? '#181B22' : '#F8F6F0';

        const w = this.width || 800;
        const h = this.height || 520;
        const tl = w * 0.12;
        const tr = w * 0.88;
        const tt = 20;
        const tb = h - 20;
        const lx = tr - 55;

        // 0. Playfield Background & Frame
        this.ctx.fillStyle = bgPlayfield;
        this.ctx.fillRect(tl, tt, tr - tl, tb - tt);

        try {
          if (!this.rc) this.rc = rough.canvas(this.canvas);

          this.rc.polygon([[tl, tt], [tr, tt], [tr, tb], [tl, tb]], {
            seed: 1100 + frameIdx * 15,
            roughness: 1.5,
            bowing: 1.2,
            stroke: ink,
            strokeWidth: 3
          });

          // Plunger Lane Divider
          this.rc.line(lx, tt + 40, lx, tb, {
            seed: 1200 + frameIdx * 10,
            roughness: 1.4,
            stroke: ink,
            strokeWidth: 2.5
          });

          // Slingshot Guides
          this.rc.line(tl + 20, tb - 130, tl + 110, tb - 65, {
            seed: 1300 + frameIdx * 10,
            roughness: 1.6,
            stroke: amber,
            strokeWidth: 3.5
          });

          this.rc.line(lx - 20, tb - 130, lx - 110, tb - 65, {
            seed: 1400 + frameIdx * 10,
            roughness: 1.6,
            stroke: amber,
            strokeWidth: 3.5
          });

          // 1. Draw Table Bumpers
          for (let i = 0; i < this.bumpers.length; i++) {
            const b = this.bumpers[i];
            const data = b.customData;
            const currentR = data.baseR * data.scale;

            this.rc.circle(b.position.x, b.position.y, currentR * 2, {
              seed: data.seed + frameIdx * 30,
              roughness: 1.8,
              bowing: 1.5,
              stroke: ink,
              strokeWidth: 3,
              fill: data.color,
              fillStyle: 'cross-hatch'
            });

            this.rc.circle(b.position.x, b.position.y, currentR * 0.7, {
              seed: data.seed + 10,
              roughness: 1.4,
              stroke: '#FFFFFF',
              strokeWidth: 2,
              fill: '#FFFFFF',
              fillStyle: 'solid'
            });
          }

          // 2. Draw Flippers
          [this.leftFlipper, this.rightFlipper].forEach((f, idx) => {
            if (!f) return;
            this.ctx.save();
            this.ctx.translate(f.position.x, f.position.y);
            this.ctx.rotate(f.angle);

            this.rc.rectangle(-38, -9, 76, 18, {
              seed: 5000 + idx * 100 + frameIdx * 20,
              roughness: 1.5,
              bowing: 1.2,
              stroke: ink,
              strokeWidth: 2.5,
              fill: isDark ? '#F59E0B' : '#D97706',
              fillStyle: 'solid'
            });
            this.ctx.restore();
          });

          // 3. Draw Pinballs
          for (let i = 0; i < this.balls.length; i++) {
            const b = this.balls[i];
            const seed = (b.customData?.seed || 1000) + frameIdx * 20;

            this.rc.circle(b.position.x, b.position.y, 28, {
              seed,
              roughness: 1.5,
              bowing: 1.2,
              stroke: ink,
              strokeWidth: 2,
              fill: b.customData?.color || '#D97706',
              fillStyle: 'solid'
            });

            this.rc.circle(b.position.x - 4, b.position.y - 4, 6, {
              seed: seed + 5,
              stroke: 'transparent',
              fill: '#FFFFFF',
              fillStyle: 'solid'
            });
          }
        } catch (err) {
          // Native Canvas 2D Fallback
          this.ctx.strokeStyle = ink;
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(tl, tt, tr - tl, tb - tt);

          for (const b of this.bumpers) {
            this.ctx.beginPath();
            this.ctx.arc(b.position.x, b.position.y, b.customData.baseR, 0, Math.PI * 2);
            this.ctx.fillStyle = b.customData.color;
            this.ctx.fill();
            this.ctx.stroke();
          }

          for (const b of this.balls) {
            this.ctx.beginPath();
            this.ctx.arc(b.position.x, b.position.y, 14, 0, Math.PI * 2);
            this.ctx.fillStyle = '#D97706';
            this.ctx.fill();
            this.ctx.stroke();
          }
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
    // Direct Canvas Click & Drag for Flippers & Ball Flinging
    let isDraggingBall = false;
    let draggedBall = null;

    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if user clicked on any ball to drag/fling
      for (const b of this.balls) {
        if (Math.hypot(x - b.position.x, y - b.position.y) < 32) {
          isDraggingBall = true;
          draggedBall = b;
          Matter.Body.setVelocity(b, { x: 0, y: 0 });
          return;
        }
      }

      // If clicked on bottom table, trigger flippers!
      if (y > (this.height || 520) * 0.4) {
        if (x < (this.width || 800) * 0.5) {
          this.flipperKeys.left = true;
          SoundFX.playPop(480);
        } else {
          this.flipperKeys.right = true;
          SoundFX.playPop(480);
        }
      } else {
        // Upper canvas click triggers bumper explosion / ball impulse
        for (const b of this.balls) {
          const dx = b.position.x - x;
          const dy = b.position.y - y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 180) {
            Matter.Body.applyForce(b, b.position, {
              x: (dx / dist) * 0.04,
              y: (dy / dist) * 0.04 - 0.03
            });
            SoundFX.playPop(560);
          }
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (isDraggingBall && draggedBall) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(50, Math.min((this.width || 800) - 50, e.clientX - rect.left));
        const y = Math.max(50, Math.min((this.height || 520) - 50, e.clientY - rect.top));
        Matter.Body.setPosition(draggedBall, { x, y });
        Matter.Body.setVelocity(draggedBall, { x: 0, y: 0 });
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (isDraggingBall && draggedBall) {
        isDraggingBall = false;
        // Fling with release impulse
        Matter.Body.setVelocity(draggedBall, {
          x: (Math.random() - 0.5) * 8,
          y: -8 - Math.random() * 6
        });
        SoundFX.playPop(620);
        draggedBall = null;
      }
      this.flipperKeys.left = false;
      this.flipperKeys.right = false;
    });

    // Keyboard Controls
    this.keyDownHandler = (e) => {
      if (e.repeat) return;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.flipperKeys.left = true;
        SoundFX.playPop(480);
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.flipperKeys.right = true;
        SoundFX.playPop(480);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        this.launchPlunger();
      }
    };

    this.keyUpHandler = (e) => {
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.flipperKeys.left = false;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.flipperKeys.right = false;
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);

    // On-screen Buttons
    const leftBtn = document.getElementById('btn-flip-left');
    leftBtn?.addEventListener('pointerdown', () => { this.flipperKeys.left = true; SoundFX.playPop(480); });
    leftBtn?.addEventListener('pointerup', () => { this.flipperKeys.left = false; });

    const rightBtn = document.getElementById('btn-flip-right');
    rightBtn?.addEventListener('pointerdown', () => { this.flipperKeys.right = true; SoundFX.playPop(480); });
    rightBtn?.addEventListener('pointerup', () => { this.flipperKeys.right = false; });

    document.getElementById('btn-plunger-pull')?.addEventListener('click', () => this.launchPlunger());
    document.getElementById('btn-pinball-multiball')?.addEventListener('click', () => this.triggerMultiball());
    document.getElementById('btn-pinball-reset')?.addEventListener('click', () => {
      this.score = 0;
      this.multiplier = 1;
      this.combo = 0;
      this.updateScoreboard();
      this.buildTable();
      this.spawnBall();
    });
  }

  destroy() {
    this.suspend();
    window.removeEventListener('keydown', this.keyDownHandler);
    window.removeEventListener('keyup', this.keyUpHandler);
    Matter.World.clear(this.world, false);
    Matter.Engine.clear(this.engineMatter);
  }
}
