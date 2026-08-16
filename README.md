# 🎨 Boil.js — Ultra Kinetic Hand-Drawn & 3D Motion Studio

> A state-of-the-art interactive playground and creative animation engine combining **Rough.js**, **Anime.js**, **Three.js GLSL**, **Matter.js Physics**, and **GSAP & Lenis**.

---

## 🌟 Highlights & Features

### 1. ✨ Experimental 3D Text Motion (`CREATE ➔ MATTER`)
- 14,000+ particles evaluated via custom GLSL cubic Bézier shaders ($B(t) = (1-t)^3 P_0 + 3(1-t)^2t P_1 + 3(1-t)t^2 P_2 + t^3 P_3$).
- 100% reversible scroll & scrub transformation ($0 \leftrightarrow 1$) with Lenis smooth scrolling and GSAP master progress timeline.
- 6-Stage cinematic camera rig, mouse force-field repulsion, 3D curl turbulence, and 2D SVG vector outline collapse mode.

### 2. 🏓 Sketch Pinball & Pachinko Arcade
- Fully articulated left & right flippers with spring recoil physics (<kbd>A</kbd>/<kbd>D</kbd> or <kbd>←</kbd>/<kbd>→</kbd>).
- Pull-back spring plunger launcher (<kbd>Space</kbd>).
- Musical bouncy bumpers with pentatonic Web Audio chimes and radial impulse blasts.
- Rotating spinners, multiplier ramps, and 4x Multiball frenzy!

### 3. 🐙 Squishy Ragdoll Monster Playground
- Matter.js revolute pin joints and floppy tentacle physics.
- Grab, stretch, and fling the creature across the stage.
- Snack feeding (Donuts 🍩, Apples 🍎, Fish 🐟) with animated chomp eating and belly expansion.
- Tickle mode, party hats, cool sunglasses, and disco confetti.

### 4. 🫧 Boiling Bubble Popper & Elastic Slime
- 14+ buoyant hand-drawn soap bubbles drifting with natural sine wobble.
- Click or slice to POP with juicy Web Audio pops and splash droplet sparks.
- Gooey hand-drawn slime strings that stretch and snap back.

### 5. 🚀 Retro Sketch Asteroids Space Blaster
- Vector arcade space physics with inertial thrusters and particle smoke.
- Destructible polygonal boiling asteroids that split into smaller debris.
- Weapon upgrades: Single Laser, Triple Spread Laser, and full-screen Ink Bomb Shockwaves (<kbd>B</kbd>).

### 6. 🧊 3D Dimension & Cel Shader
- Hardware-accelerated Three.js WebGL shader material with stepped vertex jitter noise and hand-drawn cross-hatching.

### 7. ⚡ Physics Sandbox & 🌀 Vector Morph
- Rigid-body simulation with shockwaves, gravity inversion, and 8-shape vector path morphing.

### 8. 🎹 Web Audio Synth & ⚙️ Kinetic Physics Lab
- Interactive keyboard synth with real-time frequency FFT visualizer, rotating gears, and planetary orbits.

---

## 🚀 Getting Started

```bash
# 1. Clone repository
git clone <your-repo-url>
cd rough-anime-boil

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Build production bundle
npm run build
```

---

## 🛠️ Built With

- **[Rough.js](https://roughjs.com/)** — Hand-drawn graphics generator
- **[Anime.js](https://animejs.com/)** — JavaScript animation engine
- **[Three.js](https://threejs.org/)** — 3D WebGL rendering & custom GLSL shaders
- **[Matter.js](https://brm.io/matter-js/)** — 2D rigid-body and ragdoll physics
- **[GSAP](https://greensock.com/gsap/) & [ScrollTrigger](https://greensock.com/scrolltrigger/)** — Master scroll choreography
- **[Lenis](https://lenis.darkroom.engineering/)** — Inertial smooth scrolling
- **[Vite](https://vitejs.dev/)** — Next Generation Frontend Tooling
- **Web Audio API** — Granular sound effects & procedural synth
