import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ============================================================================
 * SHOWCASE SCROLL ENGINE
 * ============================================================================
 * Coordinates Lenis inertial smooth scrolling with GSAP ScrollTrigger
 * across all chapters of the Boil.js showcase.
 */

export class ShowcaseScrollEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.progress = 0;
    this.velocity = 0;
    this.activeChapter = 0;

    this.initLenis();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5
    });

    this.lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      this.velocity = e.velocity || 0;
    });

    this.gsapTicker = (time) => {
      this.lenis.raf(time * 1000);
    };
    gsap.ticker.add(this.gsapTicker);
    gsap.ticker.lagSmoothing(0);
  }

  setupTriggers(chapterElements) {
    this.chapterTriggers = chapterElements.map((el, idx) => {
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        end: 'bottom 20%',
        onEnter: () => this.setActiveChapter(idx),
        onEnterBack: () => this.setActiveChapter(idx),
        onUpdate: (self) => {
          if (this.onUpdate) {
            this.onUpdate({
              chapterIndex: idx,
              chapterProgress: self.progress,
              velocity: this.velocity,
              direction: self.direction
            });
          }
        }
      });
    });

    // Global document progress trigger
    this.masterTrigger = ScrollTrigger.create({
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        this.progress = self.progress;
        const progressEl = document.getElementById('global-scroll-progress');
        if (progressEl) {
          progressEl.style.width = `${self.progress * 100}%`;
        }
      }
    });
  }

  setActiveChapter(index) {
    this.activeChapter = index;
    // Update floating nav pills active state
    document.querySelectorAll('.lab-index-item').forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
    });
  }

  scrollToElement(target, duration = 1.4) {
    if (this.lenis) {
      this.lenis.scrollTo(target, { duration, offset: -40 });
    }
  }

  destroy() {
    if (this.masterTrigger) this.masterTrigger.kill();
    if (this.chapterTriggers) this.chapterTriggers.forEach(t => t.kill());
    if (this.gsapTicker) gsap.ticker.remove(this.gsapTicker);
    if (this.lenis) this.lenis.destroy();
  }
}
