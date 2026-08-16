import Matter from 'matter-js';
import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class PhysicsScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.bodies = [];
    this.shockwaves = [];
    this.gravityState = 'down'; // 'down' | 'up' | 'zero'
    this.settings = {
      roughness: 1.8,
      bowing: 1.5,
      bounciness: 0.85
    };

    this.initDOM();
    this.setupMatterWorld();
    this.spawnDefaultScene();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Chaotic Rigid-Body Physics Lab</span>
              <span class="toolbar-badge">Matter.js + Boiling Rigid Bodies</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-physics-explode" class="tactile-btn amber" title="Click on canvas or here to trigger shockwave explosion">
                ${renderIcon('sparkle')}
                <span>Shockwave Blast</span>
              </button>
              <button id="btn-physics-clear" class="tactile-btn outline">
                ${renderIcon('reset')}
                <span>Reset World</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="physics-canvas-wrap">
            <canvas id="physics-stage-canvas" class="main-stage-canvas"></canvas>
            <div id="physics-hint" style="position: absolute; bottom: 16px; left: 16px; font-size: 0.72rem; color: var(--ink-muted); background: var(--paper-card); border: 1px solid var(--line); padding: 4px 12px; border-radius: var(--radius-xs); pointer-events: none;">
              Click & Drag to fling objects • Click empty space to trigger shockwaves
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">SPAWN OBJECTS</span>
            </div>
            <div class="style-pills-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="tactile-btn outline" id="btn-spawn-balls">${renderIcon('multiball')}<span>5 Balls</span></button>
              <button class="tactile-btn outline" id="btn-spawn-crates">${renderIcon('tesseract')}<span>Crate Tower</span></button>
              <button class="tactile-btn outline" id="btn-spawn-dominos">${renderIcon('dna')}<span>Domino Run</span></button>
              <button class="tactile-btn outline" id="btn-spawn-stars">${renderIcon('sparkle')}<span>Stars</span></button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">GRAVITY & FORCES</span>
            </div>
            <div class="style-pills-grid" id="gravity-pills-grid" style="grid-template-columns: 1fr 1fr 1fr;">
              <button class="style-pill-btn active" data-gravity="down">Normal ↓</button>
              <button class="style-pill-btn" data-gravity="up">Inverted ↑</button>
              <button class="style-pill-btn" data-gravity="zero">Zero-G</button>
            </div>
            <div class="control-group" style="margin-top: 10px;">
              <button id="btn-wind-storm" class="tactile-btn primary" style="width: 100%;">
                ${renderIcon('galaxy')}
                <span>Trigger Wind Vortex</span>
              </button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">LINE BOIL GEOMETRY</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-phys-roughness" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-phys-roughness" min="0.2" max="4.0" step="0.2" value="1.8" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupMatterWorld() {
    this.canvas = document.getElementById('physics-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    // Matter.js setup
    this.matterEngine = Matter.Engine.create({
      enableSleeping: false
    });
    this.world = this.matterEngine.world;
    this.world.gravity.y = 1.0;

    const resize = () => {
      const wrap = document.getElementById('physics-canvas-wrap');
      const rect = wrap ? wrap.getBoundingClientRect() : null;
      const w = Math.max(rect ? Math.floor(rect.width) : 0, wrap ? wrap.clientWidth : 0, 780);
      const h = Math.max(rect ? Math.floor(rect.height) : 0, wrap ? wrap.clientHeight : 0, 500);

      this.width = w;
      this.height = h;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.rc = rough.canvas(this.canvas);

      this.rebuildBoundaries();
      if (!this.bodies || this.bodies.length === 0) {
        this.spawnDefaultScene();
      }
    };

    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 100);
    this.setupMouseInteraction();
  }

  rebuildBoundaries() {
    if (this.boundaries) {
      Matter.World.remove(this.world, this.boundaries);
    }

    const w = this.width || 800;
    const h = this.height || 500;
    const thickness = 60;

    const ground = Matter.Bodies.rectangle(w / 2, h + thickness / 2 - 10, w * 2, thickness, { isStatic: true, label: 'ground' });
    const ceiling = Matter.Bodies.rectangle(w / 2, -thickness / 2 + 10, w * 2, thickness, { isStatic: true, label: 'ceiling' });
    const leftWall = Matter.Bodies.rectangle(-thickness / 2 + 10, h / 2, thickness, h * 2, { isStatic: true, label: 'leftWall' });
    const rightWall = Matter.Bodies.rectangle(w + thickness / 2 - 10, h / 2, thickness, h * 2, { isStatic: true, label: 'rightWall' });

    // Funnel / bouncy slanted ramps
    const ramp1 = Matter.Bodies.rectangle(w * 0.2, h * 0.45, 140, 16, { isStatic: true, angle: 0.35, label: 'ramp' });
    const ramp2 = Matter.Bodies.rectangle(w * 0.8, h * 0.55, 140, 16, { isStatic: true, angle: -0.35, label: 'ramp' });

    this.boundaries = [ground, ceiling, leftWall, rightWall, ramp1, ramp2];
    Matter.World.add(this.world, this.boundaries);
  }

  setupMouseInteraction() {
    const mouse = Matter.Mouse.create(this.canvas);
    mouse.pixelRatio = 1;
    this.mouseConstraint = Matter.MouseConstraint.create(this.matterEngine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.3,
        damping: 0.05,
        render: { visible: false }
      }
    });
    Matter.World.add(this.world, this.mouseConstraint);

    // Direct pointer drag & fling fallback for guaranteed responsiveness
    this.isGrabbing = false;
    this.grabbedBody = null;

    this.onCanvasPointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicked directly on any physics body
      const dynamicBodies = this.world.bodies.filter(b => !b.isStatic);
      for (const b of dynamicBodies) {
        if (Math.hypot(b.position.x - x, b.position.y - y) < 45) {
          this.isGrabbing = true;
          this.grabbedBody = b;
          Matter.Body.setVelocity(b, { x: 0, y: 0 });
          SoundFX.playPop(520);
          return;
        }
      }

      // If clicked on empty canvas, trigger shockwave explosion!
      this.triggerShockwave(x, y);
    };

    this.onWindowPointerMove = (e) => {
      if (!this.canvas) return;
      if (this.isGrabbing && this.grabbedBody) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        Matter.Body.setPosition(this.grabbedBody, { x, y });
        Matter.Body.setVelocity(this.grabbedBody, { x: 0, y: 0 });
      }
    };

    this.onWindowPointerUp = () => {
      if (this.isGrabbing && this.grabbedBody) {
        this.isGrabbing = false;
        Matter.Body.setVelocity(this.grabbedBody, {
          x: (Math.random() - 0.5) * 8,
          y: -5 - Math.random() * 5
        });
        this.grabbedBody = null;
        SoundFX.playPop(580);
      }
    };

    this.onBlur = () => {
      this.isGrabbing = false;
      this.grabbedBody = null;
    };

    this.canvas.addEventListener('pointerdown', this.onCanvasPointerDown);
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);
    window.addEventListener('blur', this.onBlur);
  }

  spawnDefaultScene() {
    Matter.World.remove(this.world, this.bodies);
    this.bodies = [];

    const w = this.width || 800;
    const h = this.height || 500;

    // Spawn 6 Bouncing Balls
    for (let i = 0; i < 6; i++) {
      this.spawnBall(w * 0.2 + i * 40, 60 + (i % 2) * 40, 22 + Math.random() * 8);
    }

    // Spawn Crate Pyramid
    this.spawnCrates(w * 0.5, h * 0.6);

    // Spawn Domino Run
    this.spawnDominos(w * 0.65, h - 30);
  }

  spawnBall(x, y, r = 24) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = ['#D97706', '#059669', '#DC2626', '#4F46E5', '#0284C7', '#D97706'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const ball = Matter.Bodies.circle(x, y, r, {
      restitution: 0.9,
      friction: 0.05,
      density: 0.002,
      customData: {
        type: 'circle',
        r,
        color,
        fill: Math.random() > 0.4 ? color : undefined,
        pattern: ['hachure', 'cross-hatch', 'dots', 'zigzag'][Math.floor(Math.random() * 4)],
        seed: Math.floor(Math.random() * 100000)
      }
    });

    Matter.World.add(this.world, ball);
    this.bodies.push(ball);
    SoundFX.playPop(500);
  }

  spawnCrates(centerX, baseY) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const size = 38;
    const rows = 4;

    for (let r = 0; r < rows; r++) {
      const count = rows - r;
      const startX = centerX - (count * size) / 2 + size / 2;
      const y = baseY - r * (size + 4);

      for (let c = 0; c < count; c++) {
        const x = startX + c * size;
        const box = Matter.Bodies.rectangle(x, y, size, size, {
          restitution: 0.4,
          friction: 0.4,
          density: 0.003,
          customData: {
            type: 'rectangle',
            w: size,
            h: size,
            color: '#D97706',
            fill: '#D97706',
            pattern: 'hachure',
            seed: Math.floor(Math.random() * 100000)
          }
        });
        Matter.World.add(this.world, box);
        this.bodies.push(box);
      }
    }
    SoundFX.playPop(480);
  }

  spawnDominos(startX, baseY) {
    const count = 7;
    const w = 8;
    const h = 42;

    for (let i = 0; i < count; i++) {
      const x = startX + i * 26;
      const domino = Matter.Bodies.rectangle(x, baseY - h / 2, w, h, {
        restitution: 0.2,
        friction: 0.5,
        customData: {
          type: 'rectangle',
          w,
          h,
          color: '#059669',
          fill: '#059669',
          pattern: 'solid',
          seed: Math.floor(Math.random() * 100000)
        }
      });
      Matter.World.add(this.world, domino);
      this.bodies.push(domino);
    }
  }

  spawnStars(count = 4) {
    const w = this.width || 800;
    for (let i = 0; i < count; i++) {
      const x = w * 0.3 + Math.random() * (w * 0.4);
      const y = 80 + Math.random() * 80;
      const star = Matter.Bodies.polygon(x, y, 5, 26, {
        restitution: 0.95,
        friction: 0.05,
        customData: {
          type: 'polygon',
          radius: 26,
          sides: 5,
          color: '#DC2626',
          fill: '#DC2626',
          pattern: 'cross-hatch',
          seed: Math.floor(Math.random() * 100000)
        }
      });
      Matter.World.add(this.world, star);
      this.bodies.push(star);
    }
    SoundFX.playPop(620);
  }

  triggerShockwave(cx, cy) {
    SoundFX.playPop(680);
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { x: cx / window.innerWidth, y: cy / window.innerHeight }
    });

    const shockwave = { cx, cy, r: 10, opacity: 1 };
    this.shockwaves.push(shockwave);

    anime({
      targets: shockwave,
      r: 180,
      opacity: 0,
      duration: 600,
      easing: 'easeOutQuad',
      complete: () => {
        const idx = this.shockwaves.indexOf(shockwave);
        if (idx !== -1) this.shockwaves.splice(idx, 1);
      }
    });

    // Apply radial physics impulse to nearby bodies
    const blastForce = 0.08;
    this.bodies.forEach(b => {
      const dx = b.position.x - cx;
      const dy = b.position.y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 220 && dist > 5) {
        const forceMag = (1 - dist / 220) * blastForce;
        const normX = dx / dist;
        const normY = dy / dist;
        Matter.Body.applyForce(b, b.position, {
          x: normX * forceMag,
          y: normY * forceMag - 0.02
        });
      }
    });
  }

  triggerWindStorm() {
    SoundFX.playPop(550);
    const vortexObj = { strength: 0 };
    anime.timeline()
      .add({
        targets: vortexObj,
        strength: 0.04,
        duration: 1200,
        easing: 'easeInQuad',
        update: () => {
          this.bodies.forEach(b => {
            Matter.Body.applyForce(b, b.position, {
              x: (Math.random() - 0.4) * vortexObj.strength,
              y: -vortexObj.strength * 1.5
            });
          });
        }
      })
      .add({
        targets: vortexObj,
        strength: 0,
        duration: 800,
        easing: 'easeOutQuad'
      });
  }

  setGravity(type) {
    this.gravityState = type;
    SoundFX.playPop(480);
    if (type === 'down') {
      this.world.gravity.y = 1.0;
    } else if (type === 'up') {
      this.world.gravity.y = -0.8;
    } else if (type === 'zero') {
      this.world.gravity.y = 0;
    }
  }

  startRenderLoop() {
    if (this.renderLoop) return;
    this.running = true;
    let lastTime = performance.now();

    const loop = (timestamp) => {
      if (!this.running) return;

      const dt = Math.min(32, timestamp - lastTime);
      lastTime = timestamp;

      // Step physics world
      Matter.Engine.update(this.matterEngine, dt);

      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const amber = isDark ? '#F59E0B' : '#D97706';
        const gen = rough.generator();

        // 1. Draw Static Ramps & Boundaries
        if (this.boundaries) {
          const ramp1 = this.boundaries[4];
          const ramp2 = this.boundaries[5];

          [ramp1, ramp2].forEach((r, idx) => {
            this.ctx.save();
            this.ctx.translate(r.position.x, r.position.y);
            this.ctx.rotate(r.angle);
            const rampSketch = gen.rectangle(-70, -8, 140, 16, {
              seed: 500 + idx * 100 + frameIdx * 20,
              roughness: 1.6,
              bowing: 1.2,
              stroke: ink,
              strokeWidth: 2.5,
              fill: isDark ? '#2E3440' : '#E5E0D4',
              fillStyle: 'solid'
            });
            this.rc.draw(rampSketch);
            this.ctx.restore();
          });
        }

        // 2. Draw Dynamic Boiling Rigid Bodies
        for (let i = 0; i < this.bodies.length; i++) {
          const b = this.bodies[i];
          const data = b.customData;
          if (!data) continue;

          this.ctx.save();
          this.ctx.translate(b.position.x, b.position.y);
          this.ctx.rotate(b.angle);

          const seed = data.seed + frameIdx * 33;
          const roughOpts = {
            seed,
            roughness: this.settings.roughness,
            bowing: this.settings.bowing,
            stroke: ink,
            strokeWidth: 2,
            fill: data.fill,
            fillStyle: data.pattern,
            hachureAngle: 45,
            fillWeight: 1.8
          };

          if (data.type === 'circle') {
            const ballDrawable = gen.circle(0, 0, data.r * 2, roughOpts);
            this.rc.draw(ballDrawable);
            // Motion indicator seam
            const seam = gen.line(0, 0, data.r, 0, { seed: seed + 5, stroke: ink, strokeWidth: 2 });
            this.rc.draw(seam);
          } else if (data.type === 'rectangle') {
            const rectDrawable = gen.rectangle(-data.w / 2, -data.h / 2, data.w, data.h, roughOpts);
            this.rc.draw(rectDrawable);
          } else if (data.type === 'polygon') {
            const pts = b.vertices.map(v => [v.x - b.position.x, v.y - b.position.y]);
            const polyDrawable = gen.polygon(pts, roughOpts);
            this.rc.draw(polyDrawable);
          }

          this.ctx.restore();
        }

        // 3. Draw Shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
          const sw = this.shockwaves[i];
          if (sw.opacity > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = sw.opacity;
            const shockRing = gen.circle(sw.cx, sw.cy, sw.r * 2, {
              seed: 9999 + frameIdx * 50,
              roughness: 2.2,
              stroke: amber,
              strokeWidth: 3.5,
              fill: 'transparent'
            });
            this.rc.draw(shockRing);
            this.ctx.restore();
          }
        }

        // 4. Draw Mouse Drag Line
        if (this.mouseConstraint.body) {
          const m = this.mouseConstraint.mouse.position;
          const b = this.mouseConstraint.body.position;
          const dragLine = gen.line(m.x, m.y, b.x, b.y, {
            seed: 8888 + frameIdx * 20,
            roughness: 1.5,
            stroke: amber,
            strokeWidth: 2.5
          });
          this.rc.draw(dragLine);
        }
      }

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
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

  setBoilFps(fps) {
    this.options.boilFps = fps;
  }

  bindEvents() {
    document.getElementById('btn-spawn-balls')?.addEventListener('click', () => {
      const w = this.width || 800;
      for (let i = 0; i < 5; i++) this.spawnBall(w * 0.3 + Math.random() * (w * 0.4), 60 + i * 30);
    });

    document.getElementById('btn-spawn-crates')?.addEventListener('click', () => {
      const w = this.width || 800;
      const h = this.height || 500;
      this.spawnCrates(w * 0.5, h * 0.6);
    });

    document.getElementById('btn-spawn-dominos')?.addEventListener('click', () => {
      const w = this.width || 800;
      const h = this.height || 500;
      this.spawnDominos(w * 0.4, h - 30);
    });

    document.getElementById('btn-spawn-stars')?.addEventListener('click', () => this.spawnStars(4));

    document.getElementById('btn-physics-explode')?.addEventListener('click', () => {
      const w = this.width || 800;
      const h = this.height || 500;
      this.triggerShockwave(w / 2, h / 2);
    });

    document.getElementById('btn-physics-clear')?.addEventListener('click', () => {
      this.spawnDefaultScene();
      SoundFX.playScratch();
    });

    document.getElementById('btn-wind-storm')?.addEventListener('click', () => this.triggerWindStorm());

    // Gravity selector
    const gravityGrid = document.getElementById('gravity-pills-grid');
    if (gravityGrid) {
      gravityGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        gravityGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const grav = btn.getAttribute('data-gravity');
        this.setGravity(grav);
      });
    }

    document.getElementById('slider-phys-roughness')?.addEventListener('input', (e) => {
      this.settings.roughness = parseFloat(e.target.value);
      document.getElementById('val-phys-roughness').textContent = this.settings.roughness.toFixed(1);
    });
  }

  destroy() {
    this.suspend();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.canvas && this.onCanvasPointerDown) {
      this.canvas.removeEventListener('pointerdown', this.onCanvasPointerDown);
    }
    if (this.onWindowPointerMove) {
      window.removeEventListener('pointermove', this.onWindowPointerMove);
      window.removeEventListener('pointerup', this.onWindowPointerUp);
      window.removeEventListener('pointercancel', this.onWindowPointerUp);
      window.removeEventListener('blur', this.onBlur);
    }
    if (this.world) {
      Matter.World.clear(this.world, false);
    }
    if (this.matterEngine) {
      Matter.Engine.clear(this.matterEngine);
    }
  }
}
