/**
 * ============================================================================
 * CURSOR DIRECTOR (Contextual Badges & Particle Trail)
 * ============================================================================
 */

export class CursorDirector {
  constructor() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-lab-cursor';
    this.cursorEl.innerHTML = '<span class="cursor-dot"></span><span class="cursor-badge"></span>';
    document.body.appendChild(this.cursorEl);

    this.badgeEl = this.cursorEl.querySelector('.cursor-badge');
    this.dotEl = this.cursorEl.querySelector('.cursor-dot');

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      const target = e.target.closest('[data-cursor]');
      if (target) {
        const mode = target.getAttribute('data-cursor');
        this.setBadge(mode);
      } else if (e.target.closest('canvas')) {
        this.setBadge('PLAY');
      } else {
        this.clearBadge();
      }
    });

    window.addEventListener('mousedown', () => {
      this.cursorEl.classList.add('active-press');
    });

    window.addEventListener('mouseup', () => {
      this.cursorEl.classList.remove('active-press');
    });
  }

  setBadge(text) {
    if (!this.badgeEl) return;
    this.badgeEl.textContent = `[ ${text} ]`;
    this.cursorEl.classList.add('has-badge');
  }

  clearBadge() {
    if (!this.badgeEl) return;
    this.cursorEl.classList.remove('has-badge');
  }

  startLoop() {
    const loop = () => {
      this.current.x += (this.mouse.x - this.current.x) * 0.2;
      this.current.y += (this.mouse.y - this.current.y) * 0.2;

      this.cursorEl.style.transform = `translate3d(${this.current.x}px, ${this.current.y}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
