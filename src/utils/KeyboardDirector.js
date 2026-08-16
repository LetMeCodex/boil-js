import { SoundFX } from '../engine/AnimeBoilBridge.js';
import confetti from 'canvas-confetti';

/**
 * ============================================================================
 * BOIL.JS — KEYBOARD DIRECTOR & SHORTCUTS ENGINE
 * ============================================================================
 * Handles global keyboard shortcuts and creative easter eggs:
 * - '1'-'9', '0', 'P': Fast travel to experiment chapters
 * - 'B': Boil Chaos Storm mode
 * - 'M': Audio Mute toggle
 * - 'T': Theme toggle (Parchment / Dark Charcoal)
 * - '?': Open Keyboard Shortcuts Guide
 */

export class KeyboardDirector {
  constructor(app) {
    this.app = app;
    this.initShortcutsModal();
    this.bindEvents();
  }

  initShortcutsModal() {
    if (document.getElementById('modal-shortcuts')) return;

    const modal = document.createElement('div');
    modal.id = 'modal-shortcuts';
    modal.className = 'dev-modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="dev-modal-card">
        <div class="dev-modal-header">
          <div class="dev-modal-title">⌨️ LABORATORY KEYBOARD SHORTCUTS</div>
          <button class="dev-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="dev-modal-body">
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>1</kbd> – <kbd>9</kbd><span>Jump to Chapters 01 – 09</span></div>
            <div class="shortcut-row"><kbd>U</kbd><span>Jump to UI Kit Lab</span></div>
            <div class="shortcut-row"><kbd>P</kbd><span>Jump to Piano / Synth Lab</span></div>
            <div class="shortcut-row"><kbd>B</kbd><span>⚡ Trigger Boil Chaos Storm</span></div>
            <div class="shortcut-row"><kbd>M</kbd><span>Toggle Audio Mute / Sound</span></div>
            <div class="shortcut-row"><kbd>T</kbd><span>Toggle Theme (Parchment / Dark)</span></div>
            <div class="shortcut-row"><kbd>?</kbd><span>Open This Shortcuts Guide</span></div>
            <div class="shortcut-row"><kbd>Esc</kbd><span>Close Active Modal / Fullscreen</span></div>
          </div>
        </div>
        <div class="dev-modal-footer">
          <button class="tactile-btn outline dev-modal-close">Close Guide</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.dev-modal-close').forEach(btn => {
      btn.addEventListener('click', () => { modal.style.display = 'none'; });
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is currently typing inside an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const key = e.key.toUpperCase();

      // Number keys 1-9 for chapter travel
      if (/^[1-9]$/.test(key)) {
        const num = parseInt(key, 10);
        const targetId = num === 2 ? '#section-kurama' : (num === 1 ? '#section-01' : `#section-0${num - 1}`);
        const el = document.querySelector(targetId);
        if (el && this.app.scrollEngine) {
          SoundFX.playPop(520);
          this.app.scrollEngine.scrollToElement(el, 1.0);
        }
      } else if (key === 'U') {
        const el = document.querySelector('#section-uikit');
        if (el && this.app.scrollEngine) {
          SoundFX.playPop(520);
          this.app.scrollEngine.scrollToElement(el, 1.0);
        }
      } else if (key === 'P') {
        const el = document.querySelector('#section-synth');
        if (el && this.app.scrollEngine) {
          SoundFX.playPop(520);
          this.app.scrollEngine.scrollToElement(el, 1.0);
        }
      } else if (key === 'B') {
        // Boil Chaos Easter Egg
        this.triggerBoilStorm();
      } else if (key === 'M') {
        const btn = document.getElementById('audio-toggle-btn');
        btn?.click();
      } else if (key === 'T') {
        this.app.toggleTheme();
      } else if (key === '?' || (e.shiftKey && e.key === '/')) {
        const modal = document.getElementById('modal-shortcuts');
        if (modal) {
          modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
          SoundFX.playPop(600);
        }
      }
    });
  }

  triggerBoilStorm() {
    SoundFX.playHarmonicChord();
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });

    document.body.classList.add('boil-chaos-active');
    const oldFps = this.app.boilFps || 10;

    // Temporarily crank boil FPS to max for 3 seconds
    Object.values(this.app.scenes).forEach(s => {
      if (typeof s.setBoilFps === 'function') s.setBoilFps(24);
    });

    setTimeout(() => {
      document.body.classList.remove('boil-chaos-active');
      Object.values(this.app.scenes).forEach(s => {
        if (typeof s.setBoilFps === 'function') s.setBoilFps(oldFps);
      });
    }, 3200);
  }
}
