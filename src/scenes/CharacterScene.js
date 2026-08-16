import rough from 'roughjs';
import anime from 'animejs';
import { BoilShape, BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { renderIcon } from '../utils/SvgIcons.js';

export class CharacterScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.engine = new BoilEngine({ boilFps: options.boilFps || 10 });
    this.shapes = [];
    this.animations = [];
    this.renderLoop = null;

    this.settings = {
      windStrength: 1,
      charSpeed: 1,
      roughness: 1.6,
      bowing: 1.8
    };

    this.initDOM();
    this.setupCanvas();
    this.createObjects();
    this.startAnimations();
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">Storybook Character & Nature Animation</span>
              <span class="toolbar-badge">Multi-Layer Boil + Path Motion</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-reseed-char" class="tactile-btn outline" title="Generate new rough seeds">
                ${renderIcon('dice')}
                <span>Reseed</span>
              </button>
              <button id="btn-wave-char" class="tactile-btn amber" title="Trigger waving gesture">
                ${renderIcon('sparkle')}
                <span>Wave Hello</span>
              </button>
            </div>
          </div>
          <div class="canvas-wrapper" id="char-canvas-wrap">
            <canvas id="char-canvas" class="main-stage-canvas"></canvas>
          </div>
        </div>

        <!-- Controls Inspector Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">MASCOT ACTIONS</span>
            </div>
            <div class="style-pills-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="tactile-btn outline" id="btn-action-dance">${renderIcon('sparkle')}<span>Dance</span></button>
              <button class="tactile-btn outline" id="btn-action-jump">${renderIcon('rocket')}<span>Jump</span></button>
              <button class="tactile-btn outline" id="btn-action-blink">${renderIcon('shades')}<span>Blink</span></button>
              <button class="tactile-btn outline" id="btn-action-fly">${renderIcon('origami')}<span>Fly Plane</span></button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">ENVIRONMENTAL PHYSICS</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Wind Breeze:</span>
                <span id="val-wind" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-wind" min="0.2" max="2.5" step="0.1" value="1" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Roughness:</span>
                <span id="val-char-roughness" class="control-val">1.6</span>
              </div>
              <input type="range" id="slider-char-roughness" min="0.2" max="4.0" step="0.2" value="1.6" class="custom-range">
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupCanvas() {
    this.canvas = document.getElementById('char-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.rc = rough.canvas(this.canvas);

    const resize = () => {
      const wrap = document.getElementById('char-canvas-wrap');
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(rect.width || 0, 300);
      const h = Math.max(rect.height || 0, 380);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

      this.canvas.width = Math.floor(w * dpr);
      this.canvas.height = Math.floor(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.width = w;
      this.height = h;
      this.rc = rough.canvas(this.canvas);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  createObjects() {
    this.shapes = [];
    const w = this.width || 800;
    const h = this.height || 500;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ink = isDark ? '#F3F4F6' : '#1C1917';
    const sage = isDark ? '#10B981' : '#059669';
    const lightSage = isDark ? '#065F46' : '#A7F3D0';
    const amber = isDark ? '#F59E0B' : '#D97706';
    const sky = isDark ? '#38BDF8' : '#0284C7';
    const brown = isDark ? '#854D0E' : '#78350F';
    const softSkin = isDark ? '#374151' : '#FED7AA';

    const baseOpts = {
      roughness: this.settings.roughness,
      bowing: this.settings.bowing,
      stroke: ink,
      strokeWidth: 2,
      frameCount: 4,
      boilFps: this.options.boilFps || 10
    };

    // Ground Grass Line
    const groundY = h * 0.82;
    this.groundLine = new BoilShape('line', [w * 0.08, groundY, w * 0.92, groundY], {
      ...baseOpts,
      strokeWidth: 3.5
    }, this.engine);

    // ==========================================
    // 1. WIND-BLOWN SAGE TREE (Left)
    // ==========================================
    const treeX = w * 0.24;
    // Trunk
    this.treeTrunk = new BoilShape('polygon', [[
      [treeX - 16, groundY],
      [treeX - 8, groundY - 140],
      [treeX + 8, groundY - 140],
      [treeX + 16, groundY]
    ]], {
      ...baseOpts,
      fill: brown,
      fillStyle: 'hachure',
      hachureAngle: 90,
      fillWeight: 2
    }, this.engine);

    // Tree Foliage (3 boiling clouds)
    this.foliage1 = new BoilShape('circle', [0, 0, 95], {
      ...baseOpts,
      fill: sage,
      fillStyle: 'hachure',
      hachureAngle: 45,
      fillWeight: 2
    }, this.engine);
    this.foliage1.x = treeX;
    this.foliage1.y = groundY - 170;

    this.foliage2 = new BoilShape('circle', [0, 0, 75], {
      ...baseOpts,
      fill: lightSage,
      fillStyle: 'cross-hatch',
      fillWeight: 1.5
    }, this.engine);
    this.foliage2.x = treeX - 35;
    this.foliage2.y = groundY - 150;

    this.foliage3 = new BoilShape('circle', [0, 0, 80], {
      ...baseOpts,
      fill: sage,
      fillStyle: 'dots',
      fillWeight: 1.8
    }, this.engine);
    this.foliage3.x = treeX + 35;
    this.foliage3.y = groundY - 160;

    // Drifting leaf
    this.driftingLeaf = new BoilShape('ellipse', [0, 0, 18, 9], {
      ...baseOpts,
      fill: amber,
      fillStyle: 'solid'
    }, this.engine);
    this.driftingLeaf.x = treeX + 30;
    this.driftingLeaf.y = groundY - 120;

    // ==========================================
    // 2. BOILING CHARACTER ("BOILY") (Center-Right)
    // ==========================================
    const charX = w * 0.62;
    const charY = groundY - 100;

    this.charRoot = { x: charX, y: charY };

    // Shadow
    this.charShadow = new BoilShape('ellipse', [charX, groundY + 4, 70, 16], {
      ...baseOpts,
      fill: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
      fillStyle: 'solid',
      stroke: 'transparent'
    }, this.engine);

    // Feet
    this.leftFoot = new BoilShape('rectangle', [charX - 24, groundY - 12, 18, 12], {
      ...baseOpts,
      fill: ink,
      fillStyle: 'solid'
    }, this.engine);

    this.rightFoot = new BoilShape('rectangle', [charX + 6, groundY - 12, 18, 12], {
      ...baseOpts,
      fill: ink,
      fillStyle: 'solid'
    }, this.engine);

    // Legs
    this.leftLeg = new BoilShape('line', [charX - 15, charY + 40, charX - 15, groundY - 6], {
      ...baseOpts,
      strokeWidth: 3
    }, this.engine);

    this.rightLeg = new BoilShape('line', [charX + 15, charY + 40, charX + 15, groundY - 6], {
      ...baseOpts,
      strokeWidth: 3
    }, this.engine);

    // Torso (Robot Body)
    this.charBody = new BoilShape('rectangle', [-32, -30, 64, 60], {
      ...baseOpts,
      fill: sky,
      fillStyle: 'hachure',
      hachureAngle: 60,
      fillWeight: 2
    }, this.engine);
    this.charBody.x = charX;
    this.charBody.y = charY + 15;

    // Heart Screen on Chest
    this.charScreen = new BoilShape('rectangle', [-18, -14, 36, 28], {
      ...baseOpts,
      fill: isDark ? '#1F242D' : '#FFFFFF',
      fillStyle: 'solid'
    }, this.engine);
    this.charScreen.x = charX;
    this.charScreen.y = charY + 15;

    // Heart Pulse / Dial
    this.charHeart = new BoilShape('circle', [0, 0, 12], {
      ...baseOpts,
      fill: amber,
      fillStyle: 'solid'
    }, this.engine);
    this.charHeart.x = charX;
    this.charHeart.y = charY + 15;

    // Head
    this.charHead = new BoilShape('circle', [0, 0, 52], {
      ...baseOpts,
      fill: softSkin,
      fillStyle: 'solid'
    }, this.engine);
    this.charHead.x = charX;
    this.charHead.y = charY - 42;

    // Antenna
    this.charAntennaRod = new BoilShape('line', [charX, charY - 68, charX, charY - 88], {
      ...baseOpts,
      strokeWidth: 2.5
    }, this.engine);

    this.charAntennaBulb = new BoilShape('circle', [charX, charY - 92, 12], {
      ...baseOpts,
      fill: amber,
      fillStyle: 'solid'
    }, this.engine);

    // Eyes
    this.leftEye = new BoilShape('circle', [charX - 10, charY - 44, 7], {
      ...baseOpts,
      fill: ink,
      fillStyle: 'solid'
    }, this.engine);

    this.rightEye = new BoilShape('circle', [charX + 10, charY - 44, 7], {
      ...baseOpts,
      fill: ink,
      fillStyle: 'solid'
    }, this.engine);

    // Smile
    this.charSmile = new BoilShape('arc', [charX, charY - 36, 18, 12, 0, Math.PI, false], {
      ...baseOpts,
      strokeWidth: 2
    }, this.engine);

    // Left Arm (Resting)
    this.leftArm = new BoilShape('line', [charX - 32, charY, charX - 44, charY + 30], {
      ...baseOpts,
      strokeWidth: 3
    }, this.engine);

    // Right Arm (Waving - attached at shoulder)
    this.rightArm = new BoilShape('line', [0, 0, 24, -28], {
      ...baseOpts,
      strokeWidth: 3
    }, this.engine);
    this.rightArm.x = charX + 32;
    this.rightArm.y = charY;

    this.rightHand = new BoilShape('circle', [24, -28, 10], {
      ...baseOpts,
      fill: softSkin,
      fillStyle: 'solid'
    }, this.engine);
    this.rightHand.x = charX + 32;
    this.rightHand.y = charY;

    // ==========================================
    // 3. FLYING PAPER AIRPLANE (Sky Path)
    // ==========================================
    this.airplane = new BoilShape('polygon', [[
      [0, -10],
      [36, 0],
      [0, 10],
      [8, 0]
    ]], {
      ...baseOpts,
      fill: amber,
      fillStyle: 'hachure',
      hachureAngle: 30
    }, this.engine);
    this.airplane.x = w * 0.15;
    this.airplane.y = h * 0.2;

    this.shapes = [
      this.groundLine,
      this.treeTrunk,
      this.foliage1,
      this.foliage2,
      this.foliage3,
      this.driftingLeaf,
      this.charShadow,
      this.leftLeg,
      this.rightLeg,
      this.leftFoot,
      this.rightFoot,
      this.charBody,
      this.charScreen,
      this.charHeart,
      this.charHead,
      this.charAntennaRod,
      this.charAntennaBulb,
      this.leftEye,
      this.rightEye,
      this.charSmile,
      this.leftArm,
      this.rightArm,
      this.rightHand,
      this.airplane
    ];
  }

  startAnimations() {
    this.animations.forEach(a => a.pause());
    this.animations = [];

    // 1. Nature Swaying Foliage
    const windSpeed = 2200 / this.settings.windStrength;
    const foliageAnim = anime({
      targets: [this.foliage1, this.foliage2, this.foliage3],
      rotation: [-4, 5],
      y: (el, i) => el.y - (i * 2),
      duration: windSpeed,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true
    });

    // Drifting falling leaf
    const groundY = (this.height || 500) * 0.82;
    const leafAnim = anime.timeline({ loop: true })
      .add({
        targets: this.driftingLeaf,
        x: [this.treeTrunk.args[0][0][0] + 30, this.treeTrunk.args[0][0][0] + 160],
        y: [groundY - 140, groundY - 5],
        rotation: [0, 360],
        duration: 4500,
        easing: 'easeInOutQuad'
      })
      .add({
        targets: this.driftingLeaf,
        opacity: [1, 0],
        duration: 600,
        easing: 'easeOutQuad'
      });

    // 2. Character Breathing & Antenna Bob
    const charBob = anime({
      targets: [this.charBody, this.charScreen, this.charHeart, this.charHead, this.charAntennaRod, this.charAntennaBulb, this.leftEye, this.rightEye, this.charSmile, this.leftArm, this.rightArm, this.rightHand],
      y: (el) => el.y - 6,
      duration: 1200,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true
    });

    // Heart Pulse
    const heartPulse = anime({
      targets: this.charHeart,
      scaleX: [1, 1.4, 1],
      scaleY: [1, 1.4, 1],
      duration: 800,
      easing: 'easeInOutQuad',
      loop: true
    });

    // Waving Arm Animation
    const waveAnim = anime({
      targets: [this.rightArm, this.rightHand],
      rotation: [-25, 30],
      duration: 550,
      direction: 'alternate',
      easing: 'easeInOutSine',
      loop: true
    });

    // Flying Airplane Along Path
    const w = this.width || 800;
    const planeAnim = anime({
      targets: this.airplane,
      keyframes: [
        { x: w * 0.1, y: 70, rotation: 10, duration: 1800 },
        { x: w * 0.5, y: 130, rotation: 25, duration: 2000 },
        { x: w * 0.85, y: 60, rotation: -15, duration: 2000 },
        { x: w * 0.95, y: 110, rotation: 5, duration: 1200 }
      ],
      easing: 'easeInOutQuad',
      direction: 'alternate',
      loop: true
    });

    this.animations = [foliageAnim, leafAnim, charBob, heartPulse, waveAnim, planeAnim];
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        for (const shape of this.shapes) {
          shape.render(this.ctx, this.rc, timestamp);
        }
      }
      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  triggerDance() {
    SoundFX.playPop(520);
    anime({
      targets: [this.charBody, this.charScreen, this.charHeart, this.charHead, this.charAntennaRod, this.charAntennaBulb, this.leftEye, this.rightEye, this.charSmile],
      rotation: [-12, 12, -10, 10, 0],
      duration: 1000,
      easing: 'easeInOutSine'
    });
  }

  triggerJump() {
    SoundFX.playPop(620);
    const initialY = this.charRoot.y;
    anime.timeline()
      .add({
        targets: [this.charBody, this.charScreen, this.charHeart, this.charHead, this.charAntennaRod, this.charAntennaBulb, this.leftEye, this.rightEye, this.charSmile, this.leftArm, this.rightArm, this.rightHand, this.leftLeg, this.rightLeg],
        y: (el) => el.y - 70,
        duration: 350,
        easing: 'easeOutQuad'
      })
      .add({
        targets: [this.charBody, this.charScreen, this.charHeart, this.charHead, this.charAntennaRod, this.charAntennaBulb, this.leftEye, this.rightEye, this.charSmile, this.leftArm, this.rightArm, this.rightHand, this.leftLeg, this.rightLeg],
        y: (el) => el.y + 70,
        duration: 400,
        easing: 'easeInQuad',
        complete: () => SoundFX.playPop(300)
      });
  }

  triggerBlink() {
    SoundFX.playPop(700);
    anime.timeline()
      .add({
        targets: [this.leftEye, this.rightEye],
        scaleY: 0.1,
        duration: 80,
        easing: 'easeOutQuad'
      })
      .add({
        targets: [this.leftEye, this.rightEye],
        scaleY: 1,
        duration: 120,
        easing: 'easeOutElastic(1, .5)'
      });
  }

  setBoilFps(fps) {
    this.options.boilFps = fps;
    this.shapes.forEach(s => s.updateOptions({ boilFps: fps }));
  }

  reseedAll() {
    this.shapes.forEach(s => {
      s.updateOptions({ seed: Math.floor(Math.random() * 100000) });
    });
    SoundFX.playScratch();
  }

  bindEvents() {
    document.getElementById('btn-reseed-char')?.addEventListener('click', () => this.reseedAll());
    document.getElementById('btn-wave-char')?.addEventListener('click', () => {
      SoundFX.playPop(480);
      anime({
        targets: [this.rightArm, this.rightHand],
        rotation: [-45, 55, -45, 55, 0],
        duration: 800,
        easing: 'easeInOutSine'
      });
    });

    document.getElementById('btn-action-dance')?.addEventListener('click', () => this.triggerDance());
    document.getElementById('btn-action-jump')?.addEventListener('click', () => this.triggerJump());
    document.getElementById('btn-action-blink')?.addEventListener('click', () => this.triggerBlink());
    document.getElementById('btn-action-fly')?.addEventListener('click', () => {
      SoundFX.playPop(550);
      const w = this.width || 800;
      anime({
        targets: this.airplane,
        x: [0, w + 50],
        y: [120, 40, 180, 80],
        duration: 3000,
        easing: 'easeInOutCubic'
      });
    });

    const windSlider = document.getElementById('slider-wind');
    if (windSlider) {
      windSlider.addEventListener('input', (e) => {
        this.settings.windStrength = parseFloat(e.target.value);
        document.getElementById('val-wind').textContent = `${this.settings.windStrength.toFixed(1)}x`;
        this.startAnimations();
      });
    }

    const roughSlider = document.getElementById('slider-char-roughness');
    if (roughSlider) {
      roughSlider.addEventListener('input', (e) => {
        this.settings.roughness = parseFloat(e.target.value);
        document.getElementById('val-char-roughness').textContent = this.settings.roughness.toFixed(1);
        this.shapes.forEach(s => s.updateOptions({ roughness: this.settings.roughness }));
      });
    }
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    this.animations.forEach(a => a.pause());
  }
}
