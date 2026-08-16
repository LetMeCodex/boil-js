import Matter from 'matter-js';
import rough from 'roughjs';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class PuppetScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.renderLoop = null;

    this.costume = 'sunglasses'; // 'none' | 'sunglasses' | 'partyhat' | 'crown'
    this.snacks = [];
    this.mouseWorld = { x: 0, y: 0 };
    this.creatureType = 'octopus'; // 'octopus' | 'ragdoll'

    this.initDOM();
    this.setupMatterWorld();
    this.buildCreature();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout" style="grid-template-columns: 1fr 320px;">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card" style="min-height: 580px;">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Squishy Puppet & Monster Playground</span>
              <span class="toolbar-badge">Matter.js Ragdoll Constraints</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-puppet-tickle" class="tactile-btn amber">
                ${renderIcon('sparkle')}
                <span>Tickle Creature</span>
              </button>
              <button id="btn-puppet-party" class="tactile-btn primary">
                ${renderIcon('zap')}
                <span>Party Mode</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="puppet-canvas-wrap" style="min-height: 500px; user-select: none;">
            <canvas id="puppet-stage-canvas" class="main-stage-canvas"></canvas>
            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.72rem; color: var(--ink-muted); background: var(--paper-card); border: 1px solid var(--line); padding: 4px 12px; border-radius: var(--radius-xs); pointer-events: none;">
              Grab tentacles or limbs to fling & stretch • Feed snacks with buttons
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <!-- Feed Snacks Section -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">FEED CREATURE SNACKS</span>
            </div>
            <p style="font-size: 0.75rem; color: var(--ink-muted);">Drop boiling kinetic snacks for the creature to chomp:</p>
            <div class="style-pills-grid" style="grid-template-columns: 1fr 1fr 1fr; margin-top: 6px;">
              <button class="tactile-btn outline" id="btn-feed-donut">${renderIcon('donut')}<span>Donut</span></button>
              <button class="tactile-btn outline" id="btn-feed-apple">${renderIcon('apple')}<span>Apple</span></button>
              <button class="tactile-btn outline" id="btn-feed-fish">${renderIcon('fish')}<span>Fish</span></button>
            </div>
          </div>

          <!-- Creature Model & Costumes -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">DRESS-UP COSTUMES</span>
            </div>
            <div class="style-pills-grid" id="costume-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-costume="sunglasses">${renderIcon('shades')}<span>Cool Shades</span></button>
              <button class="style-pill-btn" data-costume="partyhat">${renderIcon('partyhat')}<span>Party Hat</span></button>
              <button class="style-pill-btn" data-costume="crown">${renderIcon('crown')}<span>Royal Crown</span></button>
              <button class="style-pill-btn" data-costume="none">${renderIcon('ban')}<span>No Costume</span></button>
            </div>
          </div>

          <!-- Creature Switcher -->
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">CREATURE TYPE</span>
            </div>
            <div class="style-pills-grid" id="creature-type-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-type="octopus">${renderIcon('octopus')}<span>Jelly Octopus</span></button>
              <button class="style-pill-btn" data-type="ragdoll">${renderIcon('ragdoll')}<span>Ragdoll Bot</span></button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupMatterWorld() {
    this.canvas = document.getElementById('puppet-stage-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    this.matterEngine = Matter.Engine.create({ enableSleeping: false });
    this.world = this.matterEngine.world;
    this.world.gravity.y = 0.9;

    const resize = () => {
      const wrap = document.getElementById('puppet-canvas-wrap');
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
      this.buildCreature();
    };

    this.resizeHandler = resize;
    window.addEventListener('resize', this.resizeHandler);
    this.resizeHandler();
    setTimeout(this.resizeHandler, 100);
    this.setupMouseInteraction();
  }

  rebuildBoundaries() {
    const w = this.width || 800;
    const h = this.height || 500;
    const thickness = 60;

    const ground = Matter.Bodies.rectangle(w / 2, h + thickness / 2 - 10, w * 2, thickness, { isStatic: true });
    const ceiling = Matter.Bodies.rectangle(w / 2, -thickness / 2 + 10, w * 2, thickness, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(-thickness / 2 + 10, h / 2, thickness, h * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(w + thickness / 2 - 10, h / 2, thickness, h * 2, { isStatic: true });

    Matter.World.add(this.world, [ground, ceiling, leftWall, rightWall]);
  }

  setupMouseInteraction() {
    const mouse = Matter.Mouse.create(this.canvas);
    mouse.pixelRatio = 1;
    this.mouseConstraint = Matter.MouseConstraint.create(this.matterEngine, {
      mouse: mouse,
      constraint: { stiffness: 0.25, damping: 0.1, render: { visible: false } }
    });
    Matter.World.add(this.world, this.mouseConstraint);

    // Direct pointer drag & tracking
    this.isGrabbing = false;
    this.grabbedBody = null;

    this.onCanvasPointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mouseWorld.x = x;
      this.mouseWorld.y = y;

      // Find nearest physics body to grab
      const allBodies = this.world.bodies.filter(b => !b.isStatic);
      for (const b of allBodies) {
        if (Math.hypot(b.position.x - x, b.position.y - y) < 60) {
          this.isGrabbing = true;
          this.grabbedBody = b;
          Matter.Body.setVelocity(b, { x: 0, y: 0 });
          SoundFX.playPop(520);
          return;
        }
      }

      // If clicked on empty space, drop a snack!
      const snackTypes = ['donut', 'apple', 'fish'];
      const chosen = snackTypes[Math.floor(Math.random() * snackTypes.length)];
      this.spawnSnack(chosen, x, y);
    };

    this.onWindowPointerMove = (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mouseWorld.x = x;
      this.mouseWorld.y = y;

      if (this.isGrabbing && this.grabbedBody) {
        Matter.Body.setPosition(this.grabbedBody, { x, y });
        Matter.Body.setVelocity(this.grabbedBody, { x: 0, y: 0 });
      }
    };

    this.onWindowPointerUp = () => {
      if (this.isGrabbing && this.grabbedBody) {
        this.isGrabbing = false;
        Matter.Body.setVelocity(this.grabbedBody, {
          x: (Math.random() - 0.5) * 6,
          y: -4 - Math.random() * 4
        });
        this.grabbedBody = null;
        SoundFX.playPop(620);
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

  buildCreature() {
    // Clear existing bodies except boundaries
    const staticBodies = this.world.bodies.filter(b => b.isStatic);
    Matter.World.clear(this.world, false);
    Matter.World.add(this.world, staticBodies);
    this.snacks = [];

    const w = this.width || 800;
    const h = this.height || 500;
    const cx = w * 0.5;
    const cy = h * 0.35;

    if (this.creatureType === 'octopus') {
      this.buildOctopus(cx, cy);
    } else {
      this.buildRagdoll(cx, cy);
    }
  }

  buildOctopus(cx, cy) {
    // Main Squishy Head
    this.creatureHead = Matter.Bodies.circle(cx, cy, 48, {
      density: 0.04,
      restitution: 0.6,
      friction: 0.1,
      label: 'head',
      customData: {
        r: 48,
        color: '#D97706',
        bellyScale: 1,
        eyeOffset: { x: 0, y: 0 },
        seed: Math.floor(Math.random() * 100000)
      }
    });

    // Anchor tether constraint so it floats buoyantly
    this.headAnchor = Matter.Constraint.create({
      pointA: { x: cx, y: cy - 40 },
      bodyB: this.creatureHead,
      stiffness: 0.03,
      damping: 0.05,
      length: 20
    });

    Matter.World.add(this.world, [this.creatureHead, this.headAnchor]);

    // 4 Articulated Tentacles (Chains of 4 segments each)
    this.tentacles = [];
    const tentacleCount = 4;
    const segCount = 4;
    const segLen = 22;
    const segRadius = 14;

    for (let t = 0; t < tentacleCount; t++) {
      const angleOffset = ((t - (tentacleCount - 1) / 2) * 0.45);
      let prevBody = this.creatureHead;
      const tentacleBodies = [];

      for (let s = 0; s < segCount; s++) {
        const segX = cx + Math.sin(angleOffset) * (s + 1) * segLen;
        const segY = cy + 40 + s * segLen;

        const seg = Matter.Bodies.circle(segX, segY, Math.max(6, segRadius - s * 2), {
          density: 0.02,
          frictionAir: 0.04,
          restitution: 0.4,
          label: 'tentacle',
          customData: {
            r: Math.max(6, segRadius - s * 2),
            color: '#059669',
            seed: Math.floor(Math.random() * 100000)
          }
        });

        const constraint = Matter.Constraint.create({
          bodyA: prevBody,
          bodyB: seg,
          pointA: s === 0 ? { x: Math.sin(angleOffset) * 28, y: 34 } : { x: 0, y: segLen * 0.5 },
          pointB: { x: 0, y: -segLen * 0.5 },
          stiffness: 0.8,
          damping: 0.1,
          length: 4
        });

        Matter.World.add(this.world, [seg, constraint]);
        tentacleBodies.push(seg);
        prevBody = seg;
      }
      this.tentacles.push(tentacleBodies);
    }
  }

  buildRagdoll(cx, cy) {
    // Ragdoll Bot
    this.creatureHead = Matter.Bodies.circle(cx, cy - 60, 26, {
      density: 0.04,
      restitution: 0.5,
      label: 'head',
      customData: { r: 26, color: '#DC2626', bellyScale: 1, seed: 2000 }
    });

    const torso = Matter.Bodies.rectangle(cx, cy, 38, 55, {
      density: 0.05,
      label: 'torso',
      customData: { w: 38, h: 55, color: '#4F46E5', seed: 2001 }
    });

    const neck = Matter.Constraint.create({
      bodyA: this.creatureHead,
      bodyB: torso,
      pointA: { x: 0, y: 24 },
      pointB: { x: 0, y: -26 },
      stiffness: 0.9
    });

    Matter.World.add(this.world, [this.creatureHead, torso, neck]);
    this.tentacles = [];
  }

  spawnSnack(type) {
    SoundFX.playPop(550);
    const w = this.width || 800;
    const x = w * 0.35 + Math.random() * (w * 0.3);
    const y = 40;

    let snack;
    if (type === 'donut') {
      snack = Matter.Bodies.circle(x, y, 16, {
        restitution: 0.7,
        label: 'snack',
        customData: { type: 'donut', r: 16, color: '#D97706', seed: Math.floor(Math.random() * 100000) }
      });
    } else if (type === 'apple') {
      snack = Matter.Bodies.circle(x, y, 15, {
        restitution: 0.6,
        label: 'snack',
        customData: { type: 'apple', r: 15, color: '#DC2626', seed: Math.floor(Math.random() * 100000) }
      });
    } else if (type === 'fish') {
      snack = Matter.Bodies.rectangle(x, y, 32, 14, {
        restitution: 0.5,
        label: 'snack',
        customData: { type: 'fish', w: 32, h: 14, color: '#0284C7', seed: Math.floor(Math.random() * 100000) }
      });
    }

    Matter.World.add(this.world, snack);
    this.snacks.push(snack);
  }

  triggerTickle() {
    SoundFX.playPop(720);
    anime({
      targets: this.creatureHead.customData,
      bellyScale: [1, 1.35, 0.85, 1.2, 1],
      duration: 700,
      easing: 'easeOutElastic(1, .3)'
    });

    // Apply erratic kinetic impulses
    Matter.Body.applyForce(this.creatureHead, this.creatureHead.position, {
      x: (Math.random() - 0.5) * 0.15,
      y: -0.12
    });
  }

  triggerParty() {
    SoundFX.playHarmonicChord();
    confetti({ particleCount: 50, spread: 70 });
    this.costume = 'partyhat';
    this.updateCostumePills('partyhat');

    this.triggerTickle();
  }

  updateCostumePills(costume) {
    const grid = document.getElementById('costume-grid');
    if (grid) {
      grid.querySelectorAll('.style-pill-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-costume') === costume);
      });
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

      // Step physics
      Matter.Engine.update(this.matterEngine, dt);

      // Check snack chomp eating collisions
      if (this.creatureHead) {
        for (let i = this.snacks.length - 1; i >= 0; i--) {
          const s = this.snacks[i];
          const dist = Math.hypot(s.position.x - this.creatureHead.position.x, s.position.y - (this.creatureHead.position.y + 15));
          if (dist < 45) {
            // Chomp!
            SoundFX.playPop(340);
            confetti({ particleCount: 15, spread: 40, origin: { x: s.position.x / window.innerWidth, y: s.position.y / window.innerHeight } });
            Matter.World.remove(this.world, s);
            this.snacks.splice(i, 1);

            // Belly expansion
            anime({
              targets: this.creatureHead.customData,
              bellyScale: [1.3, 1],
              duration: 500,
              easing: 'easeOutElastic(1, .4)'
            });
          }
        }
      }

      // Render
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const frameIdx = BoilEngine.getFrameIndex(timestamp, this.options.boilFps || 10, 4);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const ink = isDark ? '#F3F4F6' : '#1C1917';
        const gen = rough.generator();

        // 1. Draw Tentacles (Wobbly Curves)
        if (this.tentacles && this.tentacles.length > 0) {
          for (let t = 0; t < this.tentacles.length; t++) {
            const chain = this.tentacles[t];
            const pts = [[this.creatureHead.position.x + (t - 1.5) * 18, this.creatureHead.position.y + 30]];
            chain.forEach(seg => pts.push([seg.position.x, seg.position.y]));

            const tentacleCurve = gen.curve(pts, {
              seed: 1000 + t * 100 + frameIdx * 20,
              roughness: 1.8,
              bowing: 1.5,
              stroke: '#059669',
              strokeWidth: 9 - t,
              fill: '#059669'
            });
            this.rc.draw(tentacleCurve);
          }
        }

        // 2. Draw Creature Head
        if (this.creatureHead) {
          const hPos = this.creatureHead.position;
          const hData = this.creatureHead.customData;
          const currentR = hData.r * hData.bellyScale;

          const headSketch = gen.circle(hPos.x, hPos.y, currentR * 2, {
            seed: hData.seed + frameIdx * 30,
            roughness: 2.0,
            bowing: 1.8,
            stroke: ink,
            strokeWidth: 3,
            fill: hData.color,
            fillStyle: 'hachure',
            hachureAngle: 60
          });
          this.rc.draw(headSketch);

          // Animated Eyeballs looking at Cursor
          const dx = this.mouseWorld.x - hPos.x;
          const dy = this.mouseWorld.y - hPos.y;
          const lookAngle = Math.atan2(dy, dx);
          const pupilDist = 5;

          const eye1X = hPos.x - 16;
          const eye2X = hPos.x + 16;
          const eyeY = hPos.y - 8;

          // Eye whites
          [eye1X, eye2X].forEach((ex, idx) => {
            const eyeWhite = gen.circle(ex, eyeY, 20, {
              seed: 500 + idx * 50 + frameIdx * 10,
              roughness: 1.4,
              stroke: ink,
              strokeWidth: 2,
              fill: '#FFFFFF',
              fillStyle: 'solid'
            });
            this.rc.draw(eyeWhite);

            // Pupils
            const px = ex + Math.cos(lookAngle) * pupilDist;
            const py = eyeY + Math.sin(lookAngle) * pupilDist;
            const pupil = gen.circle(px, py, 8, {
              seed: 600 + idx * 50,
              stroke: ink,
              fill: ink,
              fillStyle: 'solid'
            });
            this.rc.draw(pupil);
          });

          // Smiling / Chomping Mouth
          const mouth = gen.arc(hPos.x, hPos.y + 16, 26, 18, 0, Math.PI, false, {
            seed: 700 + frameIdx * 10,
            roughness: 1.6,
            stroke: ink,
            strokeWidth: 2.5
          });
          this.rc.draw(mouth);

          // 3. Draw Costumes
          if (this.costume === 'sunglasses') {
            const shades = gen.rectangle(hPos.x - 28, eyeY - 8, 56, 16, {
              seed: 800 + frameIdx * 10,
              roughness: 1.4,
              stroke: ink,
              strokeWidth: 2,
              fill: '#1C1917',
              fillStyle: 'solid'
            });
            this.rc.draw(shades);
          } else if (this.costume === 'partyhat') {
            const hat = gen.polygon([[hPos.x - 16, hPos.y - currentR + 4], [hPos.x, hPos.y - currentR - 36], [hPos.x + 16, hPos.y - currentR + 4]], {
              seed: 900 + frameIdx * 10,
              roughness: 1.6,
              stroke: ink,
              strokeWidth: 2,
              fill: '#DC2626',
              fillStyle: 'cross-hatch'
            });
            this.rc.draw(hat);
          } else if (this.costume === 'crown') {
            const crown = gen.polygon([
              [hPos.x - 22, hPos.y - currentR + 2],
              [hPos.x - 22, hPos.y - currentR - 20],
              [hPos.x - 10, hPos.y - currentR - 10],
              [hPos.x, hPos.y - currentR - 24],
              [hPos.x + 10, hPos.y - currentR - 10],
              [hPos.x + 22, hPos.y - currentR - 20],
              [hPos.x + 22, hPos.y - currentR + 2]
            ], {
              seed: 950 + frameIdx * 10,
              roughness: 1.6,
              stroke: ink,
              strokeWidth: 2,
              fill: '#F59E0B',
              fillStyle: 'solid'
            });
            this.rc.draw(crown);
          }
        }

        // 4. Draw Falling Snacks
        for (let i = 0; i < this.snacks.length; i++) {
          const s = this.snacks[i];
          const data = s.customData;
          const seed = data.seed + frameIdx * 10;

          if (data.type === 'donut') {
            const donutOuter = gen.circle(s.position.x, s.position.y, data.r * 2, {
              seed, roughness: 1.6, stroke: ink, strokeWidth: 2, fill: data.color, fillStyle: 'hachure'
            });
            const donutHole = gen.circle(s.position.x, s.position.y, data.r * 0.7, {
              seed: seed + 5, stroke: ink, strokeWidth: 1.5, fill: isDark ? '#121417' : '#FFFFFF', fillStyle: 'solid'
            });
            this.rc.draw(donutOuter);
            this.rc.draw(donutHole);
          } else if (data.type === 'apple') {
            const apple = gen.circle(s.position.x, s.position.y, data.r * 2, {
              seed, roughness: 1.6, stroke: ink, strokeWidth: 2, fill: data.color, fillStyle: 'solid'
            });
            this.rc.draw(apple);
          } else if (data.type === 'fish') {
            const fish = gen.ellipse(s.position.x, s.position.y, data.w, data.h, {
              seed, roughness: 1.6, stroke: ink, strokeWidth: 2, fill: data.color, fillStyle: 'hachure'
            });
            this.rc.draw(fish);
          }
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
    document.getElementById('btn-puppet-tickle')?.addEventListener('click', () => this.triggerTickle());
    document.getElementById('btn-puppet-party')?.addEventListener('click', () => this.triggerParty());

    document.getElementById('btn-feed-donut')?.addEventListener('click', () => this.spawnSnack('donut'));
    document.getElementById('btn-feed-apple')?.addEventListener('click', () => this.spawnSnack('apple'));
    document.getElementById('btn-feed-fish')?.addEventListener('click', () => this.spawnSnack('fish'));

    // Costumes Grid
    const costumeGrid = document.getElementById('costume-grid');
    if (costumeGrid) {
      costumeGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        costumeGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.costume = btn.getAttribute('data-costume');
        SoundFX.playPop(520);
      });
    }

    // Creature Type Grid
    const creatureGrid = document.getElementById('creature-type-grid');
    if (creatureGrid) {
      creatureGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        creatureGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.creatureType = btn.getAttribute('data-type');
        this.buildCreature();
        SoundFX.playPop(580);
      });
    }
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
