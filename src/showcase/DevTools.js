import confetti from 'canvas-confetti';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * DEV TOOLS & EXPERIMENT DEVELOPER SUITE
 * ============================================================================
 * Manages [INSPECT], [VIEW SOURCE], [COPY PROMPT], [REMIX THIS], and [FULLSCREEN].
 */

export const EXPERIMENT_SPECS = {
  uikit: {
    title: '🎛️ ANIMATED UI KIT & BUTTONS',
    engine: 'Rough.js + Anime.js Tactile Physics',
    libraries: 'Rough.js, Anime.js, Web Audio',
    particles: 'Hand-Drawn Interactive UI Elements',
    renderMode: 'Multi-Buffer Line Boil with 60 FPS Spring Physics',
    input: 'Direct Click / Drag on Canvas Elements (Buttons, Sliders, Toggles, Radios)',
    physics: 'Anime.js Elastic Spring Dampening',
    parameters: 'Boil Cadence: 10 FPS, Spring Mass: 1.0, Elasticity: 0.5',
    prompt: `Create a complete hand-drawn boiling UI component kit using Rough.js and Anime.js. Include interactive tactile buttons with spring click feedback, toggle switches with smooth sliding knobs, continuous custom range sliders with boiling progress fill, checkboxes and radio selector groups, and an animated hand-drawn modal dialog with rough cross-hatching. Implement 4-frame seed buffers for smooth 10 FPS line boil without geometry reconstruction overhead.`,
    sourceCode: `// Tactile Button Hover & Click Elasticity
anime({
  targets: buttonElement,
  scale: [1, 0.94, 1.05, 1],
  duration: 400,
  easing: 'easeOutElastic(1, .4)'
});

// Smooth Boiling Toggle Switch
const switchKnob = gen.circle(knobX, knobY, 20, {
  seed: baseSeed + frameIdx * 20,
  fill: isActive ? '#059669' : '#DC2626',
  fillStyle: 'solid'
});`
  },
  kurama: {
    title: '🦊 NARUTO KURAMA CHAKRA MODE',
    engine: 'Rough.js + Three.js 3D + Anime.js',
    libraries: 'Rough.js, Three.js, Anime.js, Web Audio',
    particles: '9 Procedural Waving Tails + Flame Sparks',
    renderMode: 'Hand-Drawn Line Boil + Three.js 3D Avatar Wireframe',
    input: 'Mouse Aiming + Jutsu Mode Buttons (Rasengan, Rasenshuriken, Bijuudama)',
    physics: 'Harmonic Spline Waves + Rotational Wind Blades',
    parameters: 'Chakra Output: 100%, Tail Wave Speed: 1.0x, 4-Blade RPM: 1200',
    prompt: `Create an interactive Naruto Kurama Chakra Mode (KCM / Nine-Tails) kinetic animation combining Rough.js hand-drawn line boiling and Three.js 3D WebGL. Render Naruto in his golden Yang-Kurama chakra flame shroud with the Uzumaki spiral stomach seal, Six Paths black magatama collar necklace, and facial whiskers. Add 9 dynamic kinetic flame tails waving with harmonic spline curves. Implement interactive jutsu modes (Planetary Rasengan with orbiting chakra rings, 4-Blade Spinning Rasenshuriken, and Ultra-Dense Bijuudama Tailed Beast Bomb). Include a Bijuu Roar shockwave and 3D wireframe Kurama avatar aura.`,
    sourceCode: `// 9-Tails Kinetic Harmonic Flame Splines
for (let t = 0; t < 9; t++) {
  const tailAngle = -Math.PI * 0.5 + ((t - 4) / 4) * (Math.PI * 0.45);
  const wavePhase = timestamp * 0.003 * tailSpeed + t * 0.65;
  const p0 = [cx + (t - 4) * 8, cy + 80];
  const p1 = [cx + Math.sin(tailAngle) * 60 + Math.cos(wavePhase) * 28, cy + 80 - Math.cos(tailAngle) * 60];
  const p2 = [cx + Math.sin(tailAngle) * 120 + Math.sin(wavePhase * 1.2) * 45, cy + 80 - Math.cos(tailAngle) * 120];
  const p3 = [cx + Math.sin(tailAngle) * 160 + Math.cos(wavePhase * 1.5) * 35, cy + 80 - Math.cos(tailAngle) * 160];
  rc.draw(gen.curve([p0, p1, p2, p3], { stroke: '#D97706', strokeWidth: 8, fill: '#F59E0B' }));
}`
  },
  textmotion: {
    title: '01 // 3D TEXT MOTION',
    engine: 'Three.js / WebGL + Custom GLSL',
    libraries: 'Three.js, GSAP, Lenis, Anime.js',
    particles: '14,000 GPU Vertices',
    renderMode: 'GPU Vertex Shader (Cubic Bézier)',
    input: 'Scroll Progress + Pointer Force Field',
    physics: 'Simplex 3D Curl-Noise Turbulence',
    parameters: 'uProgress: 0.0-1.0, uScrollVelocity, uTurbulence: 1.0x',
    prompt: `Create a WebGL 3D text transformation using Three.js and custom GLSL shaders where 14,000 particles transform from the word "CREATE" through 3D cubic Bézier trajectories B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃ into a swirling 3D curl-noise particle vortex, then deterministically converge into the word "MATTER". Synchronize the entire sequence to a master normalized scroll progress (0.0 to 1.0) using Lenis smooth scroll and GSAP ScrollTrigger. Provide mouse force-field repulsion and circular soft-edge anti-aliased particle fragment shaders.`,
    sourceCode: `// 3D Cubic Bézier Trajectory GPU Shader
vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float oneMinusT = 1.0 - t;
  return oneMinusT * oneMinusT * oneMinusT * p0 +
         3.0 * oneMinusT * oneMinusT * t * p1 +
         3.0 * oneMinusT * t * t * p2 +
         t * t * t * p3;
}

// 3D Simplex Curl Turbulence
vec3 curlNoise(vec3 p, float time) {
  float x = sin(p.y * 1.8 + time * 0.8) * cos(p.z * 1.5);
  float y = cos(p.z * 1.8 + time * 0.7) * sin(p.x * 1.5);
  float z = sin(p.x * 1.8 + time * 0.9) * cos(p.y * 1.5);
  return vec3(x, y, z);
}`
  },
  pinball: {
    title: '02 // PINBALL ARCADE',
    engine: 'Matter.js + Rough.js + Web Audio API',
    libraries: 'Matter.js, Rough.js, Anime.js',
    particles: '4x Multiball Rigid-Bodies',
    renderMode: '2D Canvas Hand-Drawn Boil',
    input: 'Keyboard (A/D/Space) + Pointer Drag',
    physics: 'Rigid-Body 2D Physics + Spring Constraints',
    parameters: 'Restitution: 1.6x, Gravity: 1.1, Flipper Speed: 0.42 rad/s',
    prompt: `Build an interactive hand-drawn boiling Pinball & Pachinko arcade game using Matter.js, Rough.js, and Anime.js. Include realistic left and right flippers hinged with revolute constraints, a pull-back spring plunger launcher, 3 musical bouncy bumpers that trigger pentatonic Web Audio chimes on collision and blast balls with radial impulse, rotating spinners, multitrack scoring, and 4x multiball frenzy with confetti celebration.`,
    sourceCode: `// Matter.js Flipper Constraint
this.leftFlipper = Matter.Bodies.rectangle(pivotX + len/2, flipperY, len, 18, {
  density: 0.08, restitution: 0.3
});
this.leftConstraint = Matter.Constraint.create({
  pointA: { x: pivotX, y: flipperY },
  bodyB: this.leftFlipper,
  pointB: { x: -len/2, y: 0 },
  stiffness: 0.9
});

// Bumper collision impulse & chime
Matter.Events.on(engine, 'collisionStart', (e) => {
  // Apply radial impulse & play pentatonic note
  Matter.Body.applyForce(ball, ball.position, { x: dx * 0.18, y: dy * 0.18 });
});`
  },
  puppet: {
    title: '03 // PUPPET MONSTER',
    engine: 'Matter.js Ragdoll Constraints + Rough.js',
    libraries: 'Matter.js, Rough.js, Anime.js',
    particles: '4 Multicellular Articulated Tentacles',
    renderMode: 'Hand-Drawn Procedural Curves',
    input: 'Mouse Drag & Fling + Snack Drop Buttons',
    physics: 'Verlet Distance & Chain Constraints',
    parameters: 'Head Radius: 48px, Tentacle Segments: 4, Gravity: 0.9',
    prompt: `Create a squishy hand-drawn ragdoll monster puppet using Matter.js and Rough.js. The creature features an articulated buoyant head with eyes that dynamically track the mouse position, and 4 floppy tentacles constructed from chained revolute constraints. Add interactive snack feeding (donuts, apples, fish) where the creature chomps snacks on contact with a belly expansion animation, a tickle mode with spring vibrations, and costume dress-up options.`,
    sourceCode: `// Articulated Tentacle Chain
for (let s = 0; s < segCount; s++) {
  const seg = Matter.Bodies.circle(segX, segY, radius, {
    density: 0.02, frictionAir: 0.04
  });
  const link = Matter.Constraint.create({
    bodyA: prevBody, bodyB: seg,
    stiffness: 0.8, damping: 0.1, length: 4
  });
  Matter.World.add(world, [seg, link]);
  prevBody = seg;
}`
  },
  bubble: {
    title: '04 // BUBBLE POPPER & SLIME',
    engine: 'Soft-Body Canvas 2D + Rough.js',
    libraries: 'Rough.js, Anime.js, Web Audio API',
    particles: '14+ Buoyant Soap Bubbles + Splash Sparks',
    renderMode: 'Boiling Hachures & Dot Fills',
    input: 'Pointer Click / Drag Blade Slicing',
    physics: 'Buoyancy Float + Sine Wave Wobble + Elastic Slime',
    parameters: 'Buoyancy Speed: -0.8px/f, Wobble Frequency: 0.002',
    prompt: `Build an interactive boiling soap bubble popper and elastic slime physics sandbox using Rough.js and Anime.js. Render 14+ floating soap bubbles with upward buoyancy and sine-wave elliptical wobble. Slicing or clicking bubbles pops them with juicy Web Audio sound effects, score increments, and splash droplet spark particles. Allow users to drag across the canvas to stretch gooey elastic slime strings that snap back with spring tension.`,
    sourceCode: `// Bubble Slicing & Pop Mechanics
const dist = Math.hypot(cursorX - bubble.x, cursorY - bubble.y);
if (dist < bubble.r * 1.2) {
  // Pop bubble, spawn 8 splash spark droplets
  for (let p = 0; p < 8; p++) {
    particles.push({
      x: bubble.x, y: bubble.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed
    });
  }
}`
  },
  space: {
    title: '05 // SPACE BLASTER',
    engine: 'Vector Physics + Rough.js Line Boil',
    libraries: 'Rough.js, Anime.js',
    particles: 'Rocket Thruster Smoke + Asteroid Debris',
    renderMode: 'Hand-Drawn Vector Polygon Rendering',
    input: 'Keyboard (WASD/Arrows/Space) + On-Screen Buttons',
    physics: 'Inertial Thrust + Rotational Dynamics + Boundary Wrap',
    parameters: 'Thrust Force: 0.22, Friction: 0.985, Bullet Speed: 11px/f',
    prompt: `Create a retro arcade vector asteroids space blaster game rendered entirely in hand-drawn line boil using Rough.js. The player controls a triangular spaceship with inertial thrusters, turning dynamics, particle smoke emissions, and screen boundary wrapping. Firing ink laser bullets shatters polygonal boiling asteroids into smaller fragments. Include weapon power-ups (Triple Spread Laser) and an Ink Bomb Shockwave.`,
    sourceCode: `// Asteroid Shatter Physics
function destroyAsteroid(a) {
  if (a.tier > 1) {
    createAsteroid(a.x - 10, a.y - 10, a.r * 0.6, a.tier - 1);
    createAsteroid(a.x + 10, a.y + 10, a.r * 0.6, a.tier - 1);
  }
}`
  },
  threed: {
    title: '06 // 3D DIMENSION',
    engine: 'Three.js WebGL + Cel Shading GLSL',
    libraries: 'Three.js, Rough.js, Anime.js',
    particles: 'Procedural Stepped Noise Jitter Vertices',
    renderMode: 'Hardware 3D Cel-Shader with Cross-Hatching',
    input: 'Mouse Orbit Parallax + Lighting Controls',
    physics: 'Rotational Inertia + Vertex Displacement',
    parameters: 'Noise Frequency: 10 FPS, Light Intensity: 1.4',
    prompt: `Create an authentic hand-drawn 3D cel-shaded rendering engine using Three.js and custom GLSL shaders. The shader executes a stepped vertex noise displacement at a fixed boiling frequency (floor(uTime * 10.0)) and renders cross-hatched tone bands across 3D polyhedra (Icosahedron, Torus Knot, Octahedron). Include interactive lighting, wireframe toggles, and mouse camera parallax.`,
    sourceCode: `// Stepped Vertex Boil GLSL
float steppedTime = floor(uTime * uBoilCadence) / uBoilCadence;
vec3 noiseOffset = vec3(
  sin(position.y * 3.0 + steppedTime * 12.0),
  cos(position.z * 3.0 + steppedTime * 10.0),
  sin(position.x * 3.0 + steppedTime * 14.0)
) * uBoilIntensity;
vec3 displacedPos = position + normal * noiseOffset;`
  },
  morph: {
    title: '07 // VECTOR PATH MORPH',
    engine: 'Anime.js + Rough.js SVG Path Interpolation',
    libraries: 'Anime.js, Rough.js',
    particles: 'Geometric Path Anchor Points',
    renderMode: 'Hand-Drawn Vector SVG Path Morphing',
    input: 'Shape Selector Buttons + Elastic Spring Slider',
    physics: 'Cubic Bézier Interpolation & Path Morphing',
    parameters: 'Morph Duration: 1200ms, Roughness: 2.2',
    prompt: `Build an organic vector path morphing system using Anime.js and Rough.js that smoothly interpolates between 8 distinct complex SVG geometric shapes (Circle, Star, Flower, Heart, Polygon, Shield, Cloud, Lightning). Render the animated morphing curves with live hand-drawn line boiling and display the visible geometric anchor vertices.`,
    sourceCode: `anime({
  targets: pathData,
  d: targetShapePath,
  duration: 1200,
  easing: 'easeInOutCubic',
  update: () => redrawBoilCanvas()
});`
  },
  physics: {
    title: '08 // PHYSICS SANDBOX',
    engine: 'Matter.js 2D Rigid-Body Physics Lab',
    libraries: 'Matter.js, Rough.js, Anime.js',
    particles: 'Kinetic Shockwave Force Field Particles',
    renderMode: 'Hand-Drawn Physical Canvas Bodies',
    input: 'Mouse Fling + Gravity Inverter + Shockwave Blast',
    physics: 'Rigid-Body Collisions + Newton Dynamics',
    parameters: 'Gravity Y: 1.0 (Invertible), Friction: 0.1, Restitution: 0.7',
    prompt: `Create a comprehensive 2D rigid-body physics playground using Matter.js and Rough.js with hand-drawn boiling line rendering. Support interactive mouse dragging, multiple geometric body types (spheres, cubes, polygons), kinetic shockwave explosions that fling bodies outward, a gravity inverter button, and dynamic collision particle bursts.`,
    sourceCode: `// Kinetic Radial Shockwave
bodies.forEach(b => {
  const dx = b.position.x - shockOrigin.x;
  const dy = b.position.y - shockOrigin.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist < radius) {
    const force = (1.0 - dist / radius) * 0.25;
    Matter.Body.applyForce(b, b.position, {
      x: (dx / dist) * force, y: (dy / dist) * force
    });
  }
});`
  }
};

export class DevTools {
  static init() {
    DevTools.createModals();
    DevTools.bindGlobalTriggers();
  }

  static createModals() {
    if (document.getElementById('devtools-modal-container')) return;

    const container = document.createElement('div');
    container.id = 'devtools-modal-container';
    container.innerHTML = `
      <!-- 1. INSPECTOR MODAL -->
      <div id="modal-inspector" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title-group">
              <span class="dev-modal-badge">DEVELOPER INSPECTOR</span>
              <h3 id="inspect-title" class="dev-modal-title">EXPERIMENT SPEC</h3>
            </div>
            <button class="dev-modal-close" data-close="inspector">×</button>
          </div>
          <div class="dev-modal-body">
            <div class="inspect-grid">
              <div class="inspect-item">
                <span class="inspect-label">ENGINE:</span>
                <strong id="inspect-engine" class="inspect-val">—</strong>
              </div>
              <div class="inspect-item">
                <span class="inspect-label">LIBRARIES:</span>
                <strong id="inspect-libraries" class="inspect-val">—</strong>
              </div>
              <div class="inspect-item">
                <span class="inspect-label">PARTICLES / BODIES:</span>
                <strong id="inspect-particles" class="inspect-val">—</strong>
              </div>
              <div class="inspect-item">
                <span class="inspect-label">RENDER MODE:</span>
                <strong id="inspect-rendermode" class="inspect-val">—</strong>
              </div>
              <div class="inspect-item">
                <span class="inspect-label">INPUT INTERACTION:</span>
                <strong id="inspect-input" class="inspect-val">—</strong>
              </div>
              <div class="inspect-item">
                <span class="inspect-label">PHYSICS / MATH:</span>
                <strong id="inspect-physics" class="inspect-val">—</strong>
              </div>
            </div>
            <div class="inspect-params-box">
              <span class="inspect-label">KEY MATHEMATICAL PARAMETERS:</span>
              <code id="inspect-params" class="inspect-code">—</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. SOURCE CODE MODAL -->
      <div id="modal-source" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card wide">
          <div class="dev-modal-header">
            <div class="dev-modal-title-group">
              <span class="dev-modal-badge">SOURCE CODE ACCESS</span>
              <h3 id="source-title" class="dev-modal-title">SOURCE VIEWER</h3>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="btn-copy-code" class="tactile-btn amber">
                <span>📋 Copy Code</span>
              </button>
              <button class="dev-modal-close" data-close="source">×</button>
            </div>
          </div>
          <div class="dev-modal-body">
            <pre class="source-code-block"><code id="source-code-content"></code></pre>
          </div>
        </div>
      </div>

      <!-- 3. PROMPT LIBRARY MODAL -->
      <div id="modal-prompt" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title-group">
              <span class="dev-modal-badge">AI PROMPT LIBRARY</span>
              <h3 id="prompt-title" class="dev-modal-title">RECREATION PROMPT</h3>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button id="btn-copy-prompt" class="tactile-btn amber">
                <span>✨ Copy Prompt</span>
              </button>
              <button class="dev-modal-close" data-close="prompt">×</button>
            </div>
          </div>
          <div class="dev-modal-body">
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 12px;">
              Copy this prompt to recreate this exact animation system in your AI IDE of choice:
            </p>
            <div class="prompt-text-box" id="prompt-text-content"></div>
            <div class="prompt-compat-bar">
              <span style="font-size: 0.7rem; color: var(--text-muted);">USE WITH:</span>
              <span class="compat-pill">Gemini</span>
              <span class="compat-pill">Claude</span>
              <span class="compat-pill">Cursor</span>
              <span class="compat-pill">ChatGPT</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. REMIX DRAWER -->
      <div id="modal-remix" class="dev-modal-backdrop" style="display: none;">
        <div class="dev-modal-card">
          <div class="dev-modal-header">
            <div class="dev-modal-title-group">
              <span class="dev-modal-badge">REMIX MODE</span>
              <h3 id="remix-title" class="dev-modal-title">LIVE PARAMETER LAB</h3>
            </div>
            <button class="dev-modal-close" data-close="remix">×</button>
          </div>
          <div class="dev-modal-body">
            <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 14px;">
              Tweak parameters in real-time. Changes update the running experiment live:
            </p>
            <div class="remix-controls-group">
              <div class="control-group">
                <div class="control-label-row">
                  <span>Simulation Intensity / Turbulence:</span>
                  <span id="val-remix-intensity" class="control-val">1.0x</span>
                </div>
                <input type="range" id="slider-remix-intensity" min="0.2" max="2.5" step="0.1" value="1.0" class="custom-range">
              </div>

              <div class="control-group">
                <div class="control-label-row">
                  <span>Line Roughness / Boil Jitter:</span>
                  <span id="val-remix-roughness" class="control-val">1.8x</span>
                </div>
                <input type="range" id="slider-remix-roughness" min="0.5" max="3.5" step="0.1" value="1.8" class="custom-range">
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button id="btn-apply-remix" class="tactile-btn primary" style="flex: 1;">
                <span>⚡ Apply Live Remix</span>
              </button>
              <button id="btn-copy-remix-code" class="tactile-btn outline">
                <span>📋 Copy Remix</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    DevTools.bindModalCloseEvents();
  }

  static openInspector(key) {
    const spec = EXPERIMENT_SPECS[key] || EXPERIMENT_SPECS.textmotion;
    document.getElementById('inspect-title').textContent = spec.title;
    document.getElementById('inspect-engine').textContent = spec.engine;
    document.getElementById('inspect-libraries').textContent = spec.libraries;
    document.getElementById('inspect-particles').textContent = spec.particles;
    document.getElementById('inspect-rendermode').textContent = spec.renderMode;
    document.getElementById('inspect-input').textContent = spec.input;
    document.getElementById('inspect-physics').textContent = spec.physics;
    document.getElementById('inspect-params').textContent = spec.parameters;

    DevTools.showModal('modal-inspector');
    SoundFX.playPop(520);
  }

  static openSource(key) {
    const spec = EXPERIMENT_SPECS[key] || EXPERIMENT_SPECS.textmotion;
    document.getElementById('source-title').textContent = `SOURCE // ${spec.title}`;
    document.getElementById('source-code-content').textContent = spec.sourceCode;

    const copyBtn = document.getElementById('btn-copy-code');
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(spec.sourceCode);
      copyBtn.innerHTML = '<span>COPIED ✓</span>';
      SoundFX.playPop(700);
      confetti({ particleCount: 20, spread: 45 });
      setTimeout(() => { copyBtn.innerHTML = '<span>📋 Copy Code</span>'; }, 2000);
    };

    DevTools.showModal('modal-source');
    SoundFX.playPop(550);
  }

  static openPrompt(key) {
    const spec = EXPERIMENT_SPECS[key] || EXPERIMENT_SPECS.textmotion;
    document.getElementById('prompt-title').textContent = `PROMPT // ${spec.title}`;
    document.getElementById('prompt-text-content').textContent = spec.prompt;

    const copyBtn = document.getElementById('btn-copy-prompt');
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(spec.prompt);
      copyBtn.innerHTML = '<span>PROMPT COPIED ✓</span>';
      SoundFX.playPop(750);
      confetti({ particleCount: 25, spread: 50 });
      setTimeout(() => { copyBtn.innerHTML = '<span>✨ Copy Prompt</span>'; }, 2000);
    };

    DevTools.showModal('modal-prompt');
    SoundFX.playPop(580);
  }

  static openRemix(key, sceneInstance) {
    const spec = EXPERIMENT_SPECS[key] || EXPERIMENT_SPECS.textmotion;
    document.getElementById('remix-title').textContent = `REMIX // ${spec.title}`;

    const applyBtn = document.getElementById('btn-apply-remix');
    applyBtn.onclick = () => {
      const intensity = parseFloat(document.getElementById('slider-remix-intensity').value);
      if (sceneInstance && typeof sceneInstance.setTurbulence === 'function') {
        sceneInstance.setTurbulence(intensity);
      }
      SoundFX.playHarmonicChord();
      confetti({ particleCount: 30, spread: 60 });
      DevTools.hideModals();
    };

    DevTools.showModal('modal-remix');
    SoundFX.playPop(520);
  }

  static toggleFullscreen(targetElement) {
    if (!document.fullscreenElement) {
      targetElement.requestFullscreen().catch(err => {});
      SoundFX.playPop(600);
    } else {
      document.exitFullscreen();
      SoundFX.playPop(480);
    }
  }

  static showModal(id) {
    DevTools.hideModals();
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
  }

  static hideModals() {
    document.querySelectorAll('.dev-modal-backdrop').forEach(m => {
      m.style.display = 'none';
    });
  }

  static bindModalCloseEvents() {
    document.querySelectorAll('.dev-modal-close').forEach(btn => {
      btn.addEventListener('click', () => DevTools.hideModals());
    });

    document.querySelectorAll('.dev-modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) DevTools.hideModals();
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') DevTools.hideModals();
    });
  }

  static bindGlobalTriggers() {
    // Dynamic delegation
  }
}
