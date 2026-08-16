/**
 * ============================================================================
 * BOIL.JS — PRECISION LABORATORY CURSOR DIRECTOR
 * ============================================================================
 * Features:
 * - Ultra-smooth lerping with elastic micro-tension
 * - Expanding kinetic magnetic ring on interactive elements
 * - Contextual technical badge pills: [ INSPECT ], [ DRAG ], [ AIM ], [ SLICE ], [ CODE ], [ REMIX ]
 * - Automatic touch device suppression
 */

export class CursorDirector {
  constructor() {
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (this.isTouch) return;

    this.initDOM();
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.ringPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    this.bindEvents();
    this.startLoop();
  }

  initDOM() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'lab-precision-cursor';
    this.cursorEl.innerHTML = `
      <div class="cursor-inner-dot"></div>
      <div class="cursor-outer-ring"></div>
      <div class="cursor-context-badge"><span class="badge-text"></span></div>
    `;
    document.body.appendChild(this.cursorEl);

    this.dotEl = this.cursorEl.querySelector('.cursor-inner-dot');
    this.ringEl = this.cursorEl.querySelector('.cursor-outer-ring');
    this.badgeEl = this.cursorEl.querySelector('.cursor-context-badge');
    this.badgeTextEl = this.cursorEl.querySelector('.badge-text');
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      const target = e.target.closest('[data-cursor]');
      if (target) {
        const mode = target.getAttribute('data-cursor');
        this.setBadge(mode);
        this.cursorEl.classList.add('cursor-hover-active');
      } else if (e.target.closest('canvas')) {
        const canvasWrap = e.target.closest('.canvas-stage-wrapper') || e.target.closest('.chapter-stage-container');
        const key = canvasWrap?.closest('section')?.getAttribute('data-key');
        if (key === 'puppet' || key === 'physics') {
          this.setBadge('DRAG');
        } else if (key === 'slingshot') {
          this.setBadge('AIM');
        } else if (key === 'bubble') {
          this.setBadge('SLICE');
        } else if (key === 'arkanoid') {
          this.setBadge('PLAY');
        } else {
          this.setBadge('INTERACT');
        }
        this.cursorEl.classList.add('cursor-hover-active');
      } else if (e.target.closest('button, a, input, .tactile-btn, .tool-btn, .lab-index-item')) {
        this.cursorEl.classList.add('cursor-hover-active');
        this.clearBadge();
      } else {
        this.cursorEl.classList.remove('cursor-hover-active');
        this.clearBadge();
      }
    });

    window.addEventListener('mousedown', () => {
      this.cursorEl.classList.add('cursor-pressed');
    });

    window.addEventListener('mouseup', () => {
      this.cursorEl.classList.remove('cursor-pressed');
    });

    document.addEventListener('mouseleave', () => {
      this.cursorEl.classList.add('cursor-hidden');
    });

    document.addEventListener('mouseenter', () => {
      this.cursorEl.classList.remove('cursor-hidden');
    });
  }

  setBadge(text) {
    if (!this.badgeTextEl) return;
    this.badgeTextEl.textContent = `[ ${text} ]`;
    this.cursorEl.classList.add('has-badge');
  }

  clearBadge() {
    if (!this.cursorEl) return;
    this.cursorEl.classList.remove('has-badge');
  }

  startLoop() {
    const loop = () => {
      // Direct dot follow
      this.pos.x += (this.mouse.x - this.pos.x) * 0.35;
      this.pos.y += (this.mouse.y - this.pos.y) * 0.35;

      // Elastic outer ring follow
      this.ringPos.x += (this.mouse.x - this.ringPos.x) * 0.15;
      this.ringPos.y += (this.mouse.y - this.ringPos.y) * 0.15;

      if (this.dotEl) {
        this.dotEl.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
      }
      if (this.ringEl) {
        this.ringEl.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
      }
      if (this.badgeEl) {
        this.badgeEl.style.transform = `translate3d(${this.pos.x + 14}px, ${this.pos.y + 14}px, 0)`;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
