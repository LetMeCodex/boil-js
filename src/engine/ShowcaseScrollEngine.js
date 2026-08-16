import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import anime from 'animejs';

gsap.registerPlugin(ScrollTrigger);

/**
 * ============================================================================
 * SHOWCASE SCROLL ENGINE & KINETIC CONTROL RAIL CHOREOGRAPHER
 * ============================================================================
 * Coordinates Lenis inertial smooth scrolling with GSAP ScrollTrigger,
 * dynamic navbar compression, and smooth traveling active indicators.
 */

export class ShowcaseScrollEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.progress = 0;
    this.velocity = 0;
    this.activeChapter = 0;
    this.lastScrollY = 0;

    this.initLenis();
    this.initNavbarScrollTracker();
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
      this.handleNavbarCompression(e.scroll);
    });

    this.gsapTicker = (time) => {
      this.lenis.raf(time * 1000);
    };
    gsap.ticker.add(this.gsapTicker);
    gsap.ticker.lagSmoothing(0);
  }

  initNavbarScrollTracker() {
    // Initial position of traveling indicator
    setTimeout(() => this.updateTravelIndicator(0), 100);
  }

  handleNavbarCompression(scrollY) {
    const rail = document.getElementById('main-control-rail');
    if (!rail) return;

    if (scrollY > 120) {
      rail.classList.add('rail-compact');
    } else {
      rail.classList.remove('rail-compact');
    }
  }

  setupTriggers(chapterElements) {
    this.chapterTriggers = chapterElements.map((el, idx) => {
      const header = el.querySelector('.chapter-header');
      const card = el.querySelector('.chapter-stage-container');

      if (header && card) {
        gsap.fromTo([header, card], {
          opacity: 0.88,
          y: 16
        }, {
          opacity: 1,
          y: 0,
          duration: 0.7,
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

    // Global progress trigger
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

    const navItems = document.querySelectorAll('.rail-nav-item');
    navItems.forEach((item, idx) => {
      item.classList.toggle('active', idx === index);
    });

    this.updateTravelIndicator(index);

    // Update mobile selector label
    const activeNav = navItems[index];
    if (activeNav) {
      const num = activeNav.querySelector('.item-num')?.textContent || '';
      const name = activeNav.querySelector('.item-name')?.textContent || '';
      const mobileLabel = document.getElementById('mobile-current-chapter');
      if (mobileLabel) mobileLabel.textContent = `${num} ${name}`;
    }
  }

  updateTravelIndicator(index) {
    const indicator = document.getElementById('nav-travel-indicator');
    const track = document.getElementById('rail-nav-track');
    const items = document.querySelectorAll('.rail-nav-item');
    const targetItem = items[index];

    if (!indicator || !track || !targetItem) return;

    const trackRect = track.getBoundingClientRect();
    const itemRect = targetItem.getBoundingClientRect();
    const left = itemRect.left - trackRect.left;
    const width = itemRect.width;

    anime({
      targets: indicator,
      left: `${left}px`,
      width: `${width}px`,
      duration: 380,
      easing: 'easeOutExpo'
    });
  }

  scrollToElement(target, duration = 1.3) {
    if (this.lenis) {
      this.lenis.scrollTo(target, { duration, offset: -74 });
    }
  }

  destroy() {
    if (this.masterTrigger) this.masterTrigger.kill();
    if (this.chapterTriggers) this.chapterTriggers.forEach(t => t.kill());
    if (this.gsapTicker) gsap.ticker.remove(this.gsapTicker);
    if (this.lenis) this.lenis.destroy();
  }
}
