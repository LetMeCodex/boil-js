import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * ============================================================================
 * SHOWCASE SCROLL ENGINE & KINETIC CHOREOGRAPHER
 * ============================================================================
 * Coordinates Lenis inertial smooth scrolling with GSAP ScrollTrigger
 * across all 11 chapters. Orchestrates section entry transitions and
 * color moods.
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
      // Entry animation timeline for each chapter artboard
      const header = el.querySelector('.chapter-header');
      const card = el.querySelector('.chapter-stage-container');

      if (header && card) {
        gsap.fromTo([header, card], {
          opacity: 0.85,
          y: 20
        }, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      return ScrollTrigger.create({
        trigger: el,
        start: 'top 60%',
        end: 'bottom 40%',
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
        if (this.onUpdate) {
          this.onUpdate({
            masterProgress: self.progress,
            velocity: this.velocity
          });
        }
      }
    });
  }

  setActiveChapter(index) {
    this.activeChapter = index;
    // Update floating nav items active state and scroll indicator
    const navItems = document.querySelectorAll('.lab-index-item');
    navItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
    });

    // Center active nav item in horizontal track on mobile
    const activeNav = navItems[index];
    if (activeNav && activeNav.parentElement) {
      const parent = activeNav.parentElement;
      const scrollLeft = activeNav.offsetLeft - parent.clientWidth / 2 + activeNav.clientWidth / 2;
      parent.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }

  scrollToElement(target, duration = 1.3) {
    if (this.lenis) {
      this.lenis.scrollTo(target, { duration, offset: -70 });
    }
  }

  destroy() {
    if (this.masterTrigger) this.masterTrigger.kill();
    if (this.chapterTriggers) this.chapterTriggers.forEach(t => t.kill());
    if (this.gsapTicker) gsap.ticker.remove(this.gsapTicker);
    if (this.lenis) this.lenis.destroy();
  }
}
