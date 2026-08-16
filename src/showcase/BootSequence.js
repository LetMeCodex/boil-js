import anime from 'animejs';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * BOIL.JS — LABORATORY BOOT SEQUENCE & INTRO TERMINAL
 * ============================================================================
 * Short, art-directed initialization sequence communicating that the user
 * has entered an experimental motion engineering laboratory.
 * Skippable immediately on click, space, or enter.
 */

export class BootSequence {
  static init(onComplete) {
    // If user has already visited in this session, skip instantly
    if (sessionStorage.getItem('boil-booted') === 'true') {
      if (onComplete) onComplete();
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'boil-boot-overlay';
    overlay.className = 'boot-sequence-overlay';
    overlay.innerHTML = `
      <div class="boot-terminal-card">
        <div class="boot-header-bar">
          <div class="boot-status-pill">
            <span class="boot-indicator-dot"></span>
            <span>LABORATORY INITIALIZATION SEQUENCE // v1.0.0</span>
          </div>
          <button id="btn-skip-boot" class="boot-skip-btn">SKIP [ESC]</button>
        </div>

        <div class="boot-title-block">
          <div class="boot-big-logo">BOIL.JS</div>
          <div class="boot-sub">KINETIC HAND-DRAWN MOTION LAB</div>
        </div>

        <div class="boot-logs-container" id="boot-logs-list">
          <div class="boot-log-line" id="log-1">> MOUNTING WEBGL BUFFER GEOMETRIES (14,000 VERTICES) ... <span class="log-status ok">READY</span></div>
          <div class="boot-log-line" id="log-2">> COMPILING 2D ROUGH.JS PROCEDURAL LINE GENERATORS ... <span class="log-status ok">READY</span></div>
          <div class="boot-log-line" id="log-3">> INITIALIZING MATTER.JS RIGID-BODY SIMULATION WORLD ... <span class="log-status ok">READY</span></div>
          <div class="boot-log-line" id="log-4">> CONNECTING WEB AUDIO API 16-BAND FFT ANALYSER ... <span class="log-status ok">READY</span></div>
          <div class="boot-log-line" id="log-5">> SYNCHRONIZING LENIS INERTIAL SCROLL ENGINE ... <span class="log-status ok">READY</span></div>
        </div>

        <div class="boot-footer-action">
          <button id="btn-enter-lab" class="tactile-hero-btn primary boot-enter-btn">
            <span>ENTER MOTION LAB ↓</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const finish = () => {
      sessionStorage.setItem('boil-booted', 'true');
      SoundFX.playHarmonicChord();
      anime({
        targets: overlay,
        opacity: [1, 0],
        duration: 450,
        easing: 'easeOutExpo',
        complete: () => {
          overlay.remove();
          if (onComplete) onComplete();
        }
      });
    };

    document.getElementById('btn-skip-boot')?.addEventListener('click', finish);
    document.getElementById('btn-enter-lab')?.addEventListener('click', finish);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        finish();
      }
    }, { once: true });

    // Animate lines sequentially
    const lines = overlay.querySelectorAll('.boot-log-line');
    anime({
      targets: lines,
      opacity: [0, 1],
      translateX: [-10, 0],
      delay: anime.stagger(140, { start: 200 }),
      duration: 350,
      easing: 'easeOutQuad',
      complete: () => {
        const enterBtn = document.getElementById('btn-enter-lab');
        if (enterBtn) {
          enterBtn.classList.add('ready-pulsing');
        }
      }
    });
  }
}
