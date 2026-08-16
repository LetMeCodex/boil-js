import { TextMotionScene } from '../scenes/TextMotionScene.js';
import { KuramaScene } from '../scenes/KuramaScene.js';
import { ArkanoidScene } from '../scenes/ArkanoidScene.js';
import { PuppetScene } from '../scenes/PuppetScene.js';
import { BubbleScene } from '../scenes/BubbleScene.js';
import { SlingshotScene } from '../scenes/SlingshotScene.js';
import { ThreeDScene } from '../scenes/ThreeDScene.js';
import { MorphScene } from '../scenes/MorphScene.js';
import { PhysicsScene } from '../scenes/PhysicsScene.js';
import { UiKitScene } from '../scenes/UiKitScene.js';
import { AudioSynthScene } from '../scenes/AudioSynthScene.js';

/**
 * ============================================================================
 * CANONICAL EXPERIMENT REGISTRY
 * ============================================================================
 * Single source of truth for all 11 experiments in BOIL.JS.
 * Defines metadata, scene constructors, section bindings, and DevTools specs.
 */

export const EXPERIMENTS = [
  {
    key: 'textmotion',
    navLabel: 'TEXT',
    navNum: '01',
    chapterNumber: 'CHAPTER 01',
    title: '3D Text Motion',
    subtitle: '14,000 GPU particle cubic Bézier transformation: CREATE ➔ MATTER with 3D curl-noise.',
    sectionId: 'section-01',
    stageId: 'stage-01',
    SceneClass: TextMotionScene,
    spec: {
      title: '01 // 3D TEXT MOTION',
      engine: 'Three.js / WebGL + Custom GLSL',
      libraries: 'Three.js, GSAP, Lenis, Anime.js',
      particles: '14,000 GPU Vertices',
      renderMode: 'GPU Vertex Shader (Cubic Bézier)',
      input: 'Scroll Progress + Pointer Force Field',
      physics: 'Simplex 3D Curl-Noise Turbulence',
      parameters: 'uProgress: 0.0-1.0, uScrollVelocity, uTurbulence: 1.0x',
      prompt: `Create a WebGL 3D text transformation using Three.js and custom GLSL shaders where 14,000 particles transform from the word "CREATE" through 3D cubic Bézier trajectories into a swirling 3D curl-noise particle vortex, then deterministically converge into the word "MATTER". Synchronize the sequence to master scroll progress with mouse force-field repulsion and soft-edge anti-aliased particle fragment shaders.`,
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
    }
  },
  {
    key: 'kurama',
    navLabel: 'KURAMA',
    navNum: '02',
    chapterNumber: 'FEATURED SHINOBI LAB',
    title: 'Naruto Kurama Mode (KCM)',
    subtitle: 'Nine-Tails blazing flame chakra cloak, 9 kinetic waving tails, and 3D Rasenshuriken / Bijuudama.',
    sectionId: 'section-kurama',
    stageId: 'stage-kurama',
    SceneClass: KuramaScene,
    spec: {
      title: '02 // NARUTO KURAMA CHAKRA MODE',
      engine: 'Rough.js + Three.js 3D + Anime.js',
      libraries: 'Rough.js, Three.js, Anime.js, Web Audio',
      particles: '9 Procedural Waving Tails + Flame Sparks',
      renderMode: 'Hand-Drawn Line Boil + Three.js 3D Avatar Wireframe',
      input: 'Mouse Aiming + Jutsu Mode Buttons (Rasengan, Rasenshuriken, Bijuudama)',
      physics: 'Harmonic Spline Waves + Rotational Wind Blades',
      parameters: 'Chakra Output: 100%, Tail Wave Speed: 1.0x, 4-Blade RPM: 1200',
      prompt: `Create an interactive Naruto Kurama Chakra Mode (KCM / Nine-Tails) kinetic animation combining Rough.js hand-drawn line boiling and Three.js 3D WebGL. Render Naruto in his golden Yang-Kurama chakra flame shroud with the Uzumaki spiral stomach seal, Six Paths magatama collar, and 9 dynamic kinetic flame tails waving with harmonic spline curves. Implement interactive jutsu modes (Planetary Rasengan, 4-Blade Spinning Rasenshuriken, and Ultra-Dense Bijuudama Tailed Beast Bomb).`,
      sourceCode: `// 9-Tails Kinetic Harmonic Flame Splines
for (let t = 0; t < 9; t++) {
  const tailAngle = -Math.PI * 0.5 + ((t - 4) / 4) * (Math.PI * 0.45);
  const wavePhase = timestamp * 0.003 * tailSpeed + t * 0.65;
  const p0 = [cx + (t - 4) * 8, cy + 80];
  const p1 = [cx + Math.sin(tailAngle) * 60 + Math.cos(wavePhase) * 28, cy + 80 - Math.cos(tailAngle) * 60];
  const p2 = [cx + Math.sin(tailAngle) * 120 + Math.sin(wavePhase * 1.2) * 45, cy + 80 - Math.cos(tailAngle) * 120];
  const p3 = [cx + Math.sin(tailAngle) * 160 + Math.cos(wavePhase * 1.5) * 35, cy + 80 - Math.cos(tailAngle) * 160];
  this.rc.curve([p0, p1, p2, p3], { stroke: '#D97706', strokeWidth: 8, fill: '#F59E0B' });
}`
    }
  },
  {
    key: 'arkanoid',
    navLabel: 'BRICKS',
    navNum: '02',
    chapterNumber: 'CHAPTER 02',
    title: 'Brick Breaker',
    subtitle: 'Kinetic neo-Arkanoid arcade with hand-drawn boiling bricks, powerup capsules, multiball, and laser blasters.',
    sectionId: 'section-02',
    stageId: 'stage-02',
    SceneClass: ArkanoidScene,
    spec: {
      title: '02 // SKETCH BRICK BREAKER',
      engine: 'Canvas 2D + Rough.js + Anime.js',
      libraries: 'Rough.js, Anime.js, Web Audio API',
      particles: 'Kinetic Brick Shards + Multiball Spheres',
      renderMode: '2D Hand-Drawn Neo-Arkanoid Boil',
      input: 'Mouse / Touch Aim + Keyboard (A/D/Space)',
      physics: 'Angle-Reflective Paddle & Brick Collision Physics',
      parameters: 'Ball Speed: 1.0x-1.8x, Paddle Width: 110px, Combo Chains: Up to 5x',
      prompt: `Build an interactive hand-drawn neo-Arkanoid brick breaker arcade game using Rough.js and Anime.js. The player aims an elastic boiling paddle using mouse or keyboard to bounce kinetic spheres into multi-tiered colored bricks (Ruby, Amber, Emerald, Sapphire, Amethyst). Golden bricks drop powerup capsules including 3x Multiball frenzy, Wide Paddle extensions, and Laser Blaster turrets. Include pentatonic chime collision sound effects, particle debris explosions, and combo multiplier streaks.`,
      sourceCode: `// Paddle Angle-Reflection Physics
const hitOffset = (ball.x - paddle.x) / (paddle.w / 2); // -1.0 to 1.0
const maxAngle = Math.PI * 0.38; // 68 degrees
const angle = hitOffset * maxAngle - Math.PI / 2;
const speed = Math.min(currentSpeed * 1.02, 11 * speedMult);
ball.vx = Math.cos(angle) * speed;
ball.vy = Math.sin(angle) * speed;`
    }
  },
  {
    key: 'puppet',
    navLabel: 'PUPPET',
    navNum: '03',
    chapterNumber: 'CHAPTER 03',
    title: 'Puppet Monster',
    subtitle: 'Articulated ragdoll constraint physics, snack feeding, and interactive tickling.',
    sectionId: 'section-03',
    stageId: 'stage-03',
    SceneClass: PuppetScene,
    spec: {
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
    }
  },
  {
    key: 'bubble',
    navLabel: 'BUBBLE',
    navNum: '04',
    chapterNumber: 'CHAPTER 04',
    title: 'Bubble Popper & Slime',
    subtitle: 'Tactile floating soap bubble physics, slicing pops, and elastic slime ropes.',
    sectionId: 'section-04',
    stageId: 'stage-04',
    SceneClass: BubbleScene,
    spec: {
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
  for (let p = 0; p < 8; p++) {
    particles.push({
      x: bubble.x, y: bubble.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed
    });
  }
}`
    }
  },
  {
    key: 'slingshot',
    navLabel: 'SIEGE',
    navNum: '05',
    chapterNumber: 'CHAPTER 05',
    title: 'Slingshot Siege',
    subtitle: 'Procedural castle demolition physics with elastic slingshot trajectory aiming, cluster bombs, and tumbling towers.',
    sectionId: 'section-05',
    stageId: 'stage-05',
    SceneClass: SlingshotScene,
    spec: {
      title: '05 // SLINGSHOT SIEGE',
      engine: 'Physics Demolition + Rough.js',
      libraries: 'Rough.js, Anime.js, Web Audio API',
      particles: 'Explosive Shrapnel + Tumbling Castle Blocks',
      renderMode: 'Hand-Drawn Procedural Vector Physics',
      input: 'Mouse / Touch Elastic Slingshot Pull & Aim',
      physics: 'Parabolic Ballistics + Rigid-Body Block Stacking',
      parameters: 'Catapult Velocity: 1.2x, Gravity: 0.38, Destruction Goal: 100%',
      prompt: `Build an interactive hand-drawn physics slingshot demolition game using Rough.js and Anime.js. The player pulls back an elastic slingshot pouch with real-time dotted parabolic trajectory prediction to launch kinetic heavy boulders, explosive ink bombs, and triple cluster splitters into destructible multi-tiered fortress towers. Stacked wooden beams and stone pillars tumble, collide, shatter into debris particles, and compute a total demolition percentage.`,
      sourceCode: `// Slingshot Ballistics & Impulse
const speed = powerMult * 0.22;
const vx = (slingshot.x - pouch.x) * speed;
const vy = (slingshot.y - pouch.y) * speed;
this.projectiles.push({ x: slingshot.x, y: slingshot.y, vx, vy, mass: 2.5 });`
    }
  },
  {
    key: 'threed',
    navLabel: '3D',
    navNum: '06',
    chapterNumber: 'CHAPTER 06',
    title: '3D Dimension & Cel Shading',
    subtitle: 'Hardware-accelerated Three.js WebGL with custom stepped GLSL line boil and pencil cross-hatching.',
    sectionId: 'section-06',
    stageId: 'stage-06',
    SceneClass: ThreeDScene,
    spec: {
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
    }
  },
  {
    key: 'morph',
    navLabel: 'VECTOR',
    navNum: '07',
    chapterNumber: 'CHAPTER 07',
    title: 'Metamorphic Vector Paths',
    subtitle: 'Continuous point-interpolated vector morphing across 8 geometric archetypes with dynamic boiling fills.',
    sectionId: 'section-07',
    stageId: 'stage-07',
    SceneClass: MorphScene,
    spec: {
      title: '07 // VECTOR MORPH',
      engine: 'Parametric Spline Interpolation + Rough.js',
      libraries: 'Rough.js, Anime.js',
      particles: '48 Uniform Point-Sampled Vertices',
      renderMode: 'Dynamic Continuous Hachure Fills',
      input: 'Target Pill Selectors + Scrubbing Slider',
      physics: 'Cubic Bézier Transition Curves',
      parameters: 'Point Resolution: 48, Morph Speed: 1.0x, Aura Rings: 3',
      prompt: `Create a continuous metamorphic path morphing laboratory using Rough.js and Anime.js. Sample 8 distinct vector shape archetypes (Heart, Skull, Lightbulb, Rocket, Diamond, Origami Bird, Coffee Mug, Infinity) into 48 uniform parametric vertices. Morph smoothly between any two shapes using cubic easing while rendering boiling hachure textures that rotate dynamically with the morph angle. Add pulsating concentric background aura rings.`,
      sourceCode: `// Parametric Morph Interpolation
for (let i = 0; i < this.pointCount; i++) {
  const p1 = fromPts[i];
  const p2 = toPts[i];
  const x = p1[0] + (p2[0] - p1[0]) * this.morphT;
  const y = p1[1] + (p2[1] - p1[1]) * this.morphT;
  morphedPts.push([x, y]);
}`
    }
  },
  {
    key: 'physics',
    navLabel: 'PHYSICS',
    navNum: '08',
    chapterNumber: 'CHAPTER 08',
    title: 'Matter.js Physics Sandbox',
    subtitle: 'Zero-g floating rigid bodies, stackable dominos, explosive shockwaves, and wind vortex storms.',
    sectionId: 'section-08',
    stageId: 'stage-08',
    SceneClass: PhysicsScene,
    spec: {
      title: '08 // RIGID-BODY PHYSICS',
      engine: 'Matter.js 2D + Rough.js Canvas Rendering',
      libraries: 'Matter.js, Rough.js, Anime.js',
      particles: '60+ Active Rigid Bodies (Spheres, Crates, Dominos, Stars)',
      renderMode: 'Hand-Drawn Cross-Hatched Rigid Bodies',
      input: 'Pointer Drag / Fling + Shockwave Bombs',
      physics: 'Verlet Integration + SAT Collision Resolution',
      parameters: 'Gravity: Earth (1.0) / Moon (0.2) / Zero-G (0.0), Restitution: 0.8',
      prompt: `Build a comprehensive hand-drawn 2D rigid-body physics sandbox using Matter.js and Rough.js. Support spawning tumbling crates, bouncy balls, domino chains, and 5-pointed stars. Include an interactive mouse drag & fling constraint, variable gravity environments (Earth, Moon, Zero-G, Inverted), explosive radial shockwaves, and wind storms that sweep across the arena.`,
      sourceCode: `// Radial Shockwave Explosion
const bodies = Matter.Composite.allBodies(this.world);
for (const b of bodies) {
  if (b.isStatic) continue;
  const dx = b.position.x - originX;
  const dy = b.position.y - originY;
  const dist = Math.hypot(dx, dy);
  if (dist < 260 && dist > 1) {
    const force = (1 - dist / 260) * 0.22;
    Matter.Body.applyForce(b, b.position, { x: (dx / dist) * force, y: (dy / dist) * force });
  }
}`
    }
  },
  {
    key: 'uikit',
    navLabel: 'UI KIT',
    navNum: '10',
    chapterNumber: 'CHAPTER 10',
    title: 'Tactile UI Component Kit',
    subtitle: 'Interactive hand-drawn buttons, sliding toggles, range sliders, checkboxes, and spring modal dialogs.',
    sectionId: 'section-uikit',
    stageId: 'stage-uikit',
    SceneClass: UiKitScene,
    spec: {
      title: '10 // ANIMATED UI KIT & BUTTONS',
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
this.rc.circle(knobX, knobY, 20, {
  seed: baseSeed + frameIdx * 20,
  fill: isActive ? '#059669' : '#DC2626',
  fillStyle: 'solid'
});`
    }
  },
  {
    key: 'synth',
    navLabel: 'PIANO',
    navNum: '11',
    chapterNumber: 'CHAPTER 11',
    title: 'Interactive Piano & Audio Synth',
    subtitle: 'Synthesized Web Audio pentatonic octave keys with real-time boiling 16-band FFT frequency visualizer.',
    sectionId: 'section-synth',
    stageId: 'stage-synth',
    SceneClass: AudioSynthScene,
    spec: {
      title: '11 // INTERACTIVE PIANO & AUDIO SYNTH',
      engine: 'Web Audio API + Rough.js + Anime.js',
      libraries: 'Web Audio API, Rough.js, Anime.js',
      particles: '16 FFT Boiling Spectrum Bars + Sound Waves',
      renderMode: '2D Hand-Drawn Boiling Piano Canvas + Frequency Spectrum',
      input: 'Keyboard (A-K keys) + Mouse Click on Piano Keys',
      physics: 'Harmonic Oscillator Frequencies & Filter Envelopes',
      parameters: 'C4-C5 Pentatonic Octave, 16-Band FFT Analyser, Lo-Fi Arpeggiator',
      prompt: `Build an interactive hand-drawn boiling piano and audio synthesizer using the Web Audio API, Rough.js, and Anime.js. Render clickable hand-drawn piano keys that play real synthesized triangle waveforms with lowpass resonant biquad filtering. Include an interactive 16-band FFT boiling frequency visualizer that reacts dynamically to key presses and an automated lo-fi arpeggio sequencer.`,
      sourceCode: `// Web Audio Tone Synthesis
playTone(freq, duration = 0.35) {
  const osc = this.audioCtx.createOscillator();
  const filter = this.audioCtx.createBiquadFilter();
  const gain = this.audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1600, this.audioCtx.currentTime);
  gain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
  osc.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination);
  osc.start(); osc.stop(this.audioCtx.currentTime + duration);
}`
    }
  }
];

/**
 * Lookup helper to get experiment by key.
 */
export function getExperimentByKey(key) {
  if (!key) return null;
  const normalizedKey = key.toLowerCase().trim();
  // Alias mappings for legacy or alternative names
  const aliasMap = {
    'pinball': 'arkanoid',
    'bricks': 'arkanoid',
    'space': 'slingshot',
    'siege': 'slingshot'
  };
  const resolvedKey = aliasMap[normalizedKey] || normalizedKey;
  return EXPERIMENTS.find(exp => exp.key === resolvedKey) || null;
}

/**
 * Get all experiment keys.
 */
export function getAllExperimentKeys() {
  return EXPERIMENTS.map(exp => exp.key);
}
