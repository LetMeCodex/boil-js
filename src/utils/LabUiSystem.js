import anime from 'animejs';
import { SoundFX } from '../engine/AnimeBoilBridge.js';
import { animateIconStroke } from './SvgIcons.js';

/**
 * ============================================================================
 * BOIL.JS — UNIFIED LABORATORY UI SYSTEM & INTERACTION ENGINE
 * ============================================================================
 * Manages tactile buttons, physical sliders, mechanical toggles, custom
 * tooltips, and immersive fullscreen transitions.
 */

export class LabUiSystem {
  static init() {
    this.bindTactileButtons();
    this.bindCustomSliders();
    this.bindTooltips();
    this.bindFullscreenTransitions();
  }

  /**
   * 1. Tactile Buttons Interaction
   */
  static bindTactileButtons() {
    // Action Buttons & Tool Buttons spring click
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.tactile-btn, .tactile-hero-btn, .tool-btn, .lab-icon-btn');
      if (!btn) return;

      SoundFX.playPop(540);

      // Spring compression rebound
      anime({
        targets: btn,
        scale: [1, 0.93, 1.04, 1],
        duration: 320,
        easing: 'easeOutElastic(1, .5)'
      });

      // Animate nested SVG icon if present
      const svg = btn.querySelector('svg');
      if (svg) animateIconStroke(svg, 350);
    });

    // Hover stroke animation
    document.addEventListener('mouseenter', (e) => {
      const btn = e.target.closest('.tool-btn, .tactile-btn');
      if (!btn) return;
      const svg = btn.querySelector('svg');
      if (svg) animateIconStroke(svg, 300);
    }, true);
  }

  /**
   * 2. Custom Physical Sliders
   */
  static bindCustomSliders() {
    const updateSlider = (slider) => {
      if (!slider) return;
      const min = parseFloat(slider.min !== '' ? slider.min : 0);
      const max = parseFloat(slider.max !== '' ? slider.max : 100);
      const val = parseFloat(slider.value !== '' ? slider.value : min);
      const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 50;
      slider.style.setProperty('--slider-fill-pct', `${pct}%`);
    };

    // Global event delegation for all dynamic range inputs
    document.addEventListener('input', (e) => {
      if (e.target && e.target.matches && e.target.matches('input[type="range"]')) {
        updateSlider(e.target);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target && e.target.matches && e.target.matches('input[type="range"]')) {
        updateSlider(e.target);
      }
    });

    // Refresh all currently mounted sliders
    const refreshAll = () => {
      document.querySelectorAll('input[type="range"]').forEach(updateSlider);
    };

    refreshAll();
    setTimeout(refreshAll, 100);
    setTimeout(refreshAll, 500);
    setTimeout(refreshAll, 1500);

    // Watch for dynamically added scenes & inputs
    const observer = new MutationObserver(() => {
      refreshAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * 3. Custom Paper Tooltips
   */
  static bindTooltips() {
    let tooltipEl = document.getElementById('lab-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'lab-tooltip';
      tooltipEl.className = 'lab-paper-tooltip';
      document.body.appendChild(tooltipEl);
    }

    let hideTimer = null;

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) {
        tooltipEl.classList.remove('tooltip-visible');
        return;
      }

      const text = target.getAttribute('data-tooltip');
      tooltipEl.textContent = text;

      const rect = target.getBoundingClientRect();
      tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
      tooltipEl.style.top = `${rect.top - 8}px`;

      clearTimeout(hideTimer);
      tooltipEl.classList.add('tooltip-visible');
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        hideTimer = setTimeout(() => {
          tooltipEl.classList.remove('tooltip-visible');
        }, 80);
      }
    });
  }

  /**
   * 4. Immersive Fullscreen Transitions
   */
  static bindFullscreenTransitions() {
    let escIndicator = document.getElementById('fullscreen-esc-indicator');
    if (!escIndicator) {
      escIndicator = document.createElement('div');
      escIndicator.id = 'fullscreen-esc-indicator';
      escIndicator.className = 'fullscreen-esc-pill';
      escIndicator.innerHTML = `<span>[ ESC TO EXIT IMMERSIVE CANVAS ]</span>`;
      document.body.appendChild(escIndicator);
    }

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        document.body.classList.add('is-in-fullscreen');
        escIndicator.style.display = 'block';
        anime({
          targets: escIndicator,
          opacity: [0, 1],
          translateY: [-10, 0],
          duration: 350,
          easing: 'easeOutExpo'
        });
      } else {
        document.body.classList.remove('is-in-fullscreen');
        escIndicator.style.display = 'none';
      }
    });
  }
}
