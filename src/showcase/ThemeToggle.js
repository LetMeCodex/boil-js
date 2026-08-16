import gsap from 'gsap';
import { getTheme, initTheme, subscribeTheme, toggleTheme } from '../utils/theme.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

export class ThemeToggle {
  constructor(buttonEl) {
    this.button = buttonEl || document.getElementById('theme-toggle-btn');
    if (!this.button) return;

    this.tl = null;
    this.initDOM();
    this.bindEvents();

    // Initial state sync
    const initialTheme = initTheme();
    this.renderState(initialTheme, false);

    // Subscribe to theme store
    this.unsubscribe = subscribeTheme((theme) => {
      this.renderState(theme, true);
    });
  }

  initDOM() {
    this.button.innerHTML = `
      <svg viewBox="0 0 24 24" class="theme-toggle-svg" aria-hidden="true" style="width: 20px; height: 20px; overflow: visible; display: block;">
        <defs>
          <mask id="boil-moon-mask">
            <rect x="-4" y="-4" width="32" height="32" fill="#fff" />
            <circle id="boil-mask-circle" cx="30" cy="7.5" r="6.6" fill="#000" />
          </mask>
        </defs>
        <g id="theme-stars-group" style="color: var(--orange);">
          <g id="theme-stars-sub" opacity="0">
            <path d="M19.6 4.2v2.6M18.3 5.5h2.6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
            <circle cx="4.4" cy="6.6" r="0.85" fill="currentColor" />
            <path d="M21 15.2v1.8M20.1 16.1h1.8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" />
            <circle cx="3.3" cy="16.4" r="0.7" fill="currentColor" />
          </g>
        </g>
        <g id="theme-disc-group" style="color: var(--ink);">
          <circle cx="12" cy="12" r="5.1" fill="currentColor" mask="url(#boil-moon-mask)" />
          <g id="theme-sun-rays" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"
             opacity="1" style="transition: opacity 500ms ease;">
            <path d="M12 1.6v2.4M12 20v2.4M1.6 12h2.4M20 12h2.4M4.7 4.7l1.7 1.7M17.6 17.6l1.7 1.7M19.3 4.7l-1.7 1.7M6.4 17.6l-1.7 1.7" />
          </g>
        </g>
      </svg>
    `;

    this.discRef = this.button.querySelector('#theme-disc-group');
    this.maskRef = this.button.querySelector('#boil-mask-circle');
    this.starsRef = this.button.querySelector('#theme-stars-group');
    this.sunRaysRef = this.button.querySelector('#theme-sun-rays');
  }

  renderState(theme, animated = true) {
    const night = theme === 'night';
    this.button.setAttribute('aria-pressed', String(night));
    this.button.setAttribute('aria-label', night ? 'Switch the world to day' : 'Switch the world to night');
    this.button.title = night ? 'Daybreak' : 'Nightfall';

    if (this.tl) this.tl.kill();

    const stars = this.starsRef ? Array.from(this.starsRef.querySelectorAll('g > *')) : [];

    if (!animated) {
      if (this.discRef) {
        gsap.set(this.discRef, {
          rotate: night ? 140 : 0,
          y: night ? -1.5 : 0,
          transformOrigin: '50% 50%'
        });
      }
      if (this.maskRef) {
        this.maskRef.setAttribute('cx', night ? '15.5' : '30');
      }
      if (this.sunRaysRef) {
        this.sunRaysRef.style.opacity = night ? '0' : '1';
      }
      if (stars.length) {
        gsap.set(stars, {
          opacity: night ? 1 : 0,
          scale: night ? 1 : 0.4,
          transformOrigin: '50% 50%'
        });
      }
      return;
    }

    const t = gsap.timeline({ defaults: { ease: 'power3.inOut', duration: 0.8 } });
    if (this.discRef) {
      t.to(this.discRef, { rotate: night ? 140 : 0, y: night ? -1.5 : 0, transformOrigin: '50% 50%' }, 0);
    }
    if (this.maskRef) {
      t.to(this.maskRef, { attr: { cx: night ? 15.5 : 30 }, duration: 0.85 }, 0);
    }
    if (this.sunRaysRef) {
      this.sunRaysRef.style.opacity = night ? '0' : '1';
    }
    if (stars.length) {
      t.to(stars, {
        opacity: night ? 1 : 0,
        scale: night ? 1 : 0.4,
        transformOrigin: '50% 50%',
        duration: 0.5,
        stagger: { each: 0.07, from: 'random' }
      }, night ? 0.28 : 0);
    }
    this.tl = t;
  }

  bindEvents() {
    this.button.addEventListener('click', () => {
      toggleTheme();
      SoundFX.playPop(520);
    });
  }

  destroy() {
    if (this.tl) this.tl.kill();
    if (this.unsubscribe) this.unsubscribe();
  }
}
