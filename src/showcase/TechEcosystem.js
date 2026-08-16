import rough from 'roughjs';
import anime from 'animejs';
import { BoilEngine } from '../engine/BoilEngine.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class TechEcosystem {
  static init() {
    TechEcosystem.initCards();
  }

  static initCards() {
    const cards = [
      { id: 'tech-three', name: 'Three.js', desc: 'Hardware WebGL 3D & GLSL shaders' },
      { id: 'tech-matter', name: 'Matter.js', desc: '2D rigid-body & ragdoll physics' },
      { id: 'tech-gsap', name: 'GSAP', desc: 'Master timeline scrubbing choreography' },
      { id: 'tech-lenis', name: 'Lenis', desc: 'Inertial smooth scrolling layer' },
      { id: 'tech-anime', name: 'Anime.js', desc: 'Micro-motion & SVG path morphing' },
      { id: 'tech-rough', name: 'Rough.js', desc: 'Organic hand-drawn boiling lines' }
    ];

    cards.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) {
        el.addEventListener('mouseenter', () => {
          SoundFX.playPop(520);
          anime({
            targets: el,
            scale: [1, 1.04],
            duration: 250,
            easing: 'easeOutElastic(1, .5)'
          });
        });
        el.addEventListener('mouseleave', () => {
          anime({
            targets: el,
            scale: 1.0,
            duration: 200,
            easing: 'easeOutQuad'
          });
        });
      }
    });
  }
}
