import { getTheme, initTheme, subscribeTheme, toggleTheme } from '../utils/theme.js';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * BOIL.JS — 3D PHYSICAL CELESTIAL DAY/NIGHT TOGGLE SWITCH
 * ============================================================================
 * Features:
 * - 3D tactile pill switch chassis with depth lighting & dynamic gradient
 * - Day Mode: Sun orb with coronal glow + floating volumetric layered clouds
 * - Night Mode: Moon orb with lunar craters + twinkling starry constellation
 * - Spring physics transformation & haptic sound pop
 */

export class ThemeToggle {
  constructor(buttonEl) {
    this.button = buttonEl || document.getElementById('theme-toggle-btn');
    if (!this.button) return;

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
      <div class="switch-chassis" id="theme-switch-chassis">
        <!-- 1. Ambient Glow Backdrops -->
        <div class="switch-backdrops">
          <div class="switch-backdrop"></div>
        </div>

        <!-- 2. Volumetric Clouds Layer (Day Mode) -->
        <div class="switch-clouds">
          <div class="switch-cloud cloud-1"></div>
          <div class="switch-cloud cloud-2"></div>
          <div class="switch-cloud cloud-3"></div>
        </div>

        <!-- 3. Twinkling Constellation Stars Layer (Night Mode) -->
        <div class="switch-stars">
          <div class="switch-star star-1"></div>
          <div class="switch-star star-2"></div>
          <div class="switch-star star-3"></div>
          <div class="switch-star star-4"></div>
        </div>

        <!-- 4. 3D Tactile Sun / Moon Orb with Craters -->
        <div class="switch-sun-moon">
          <div class="switch-craters">
            <div class="crater crater-1"></div>
            <div class="crater crater-2"></div>
            <div class="crater crater-3"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderState(theme, animated = true) {
    const night = theme === 'night';
    this.button.classList.toggle('night-active', night);
    this.button.setAttribute('aria-checked', String(night));
    this.button.setAttribute('aria-label', night ? 'Switch to Daybreak' : 'Switch to Nightfall');
    this.button.title = night ? 'Daybreak [T]' : 'Nightfall [T]';
  }

  bindEvents() {
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      const current = getTheme();
      const next = current === 'night' ? 'day' : 'night';
      toggleTheme();
      try {
        SoundFX.playPop(next === 'night' ? 620 : 480);
      } catch (err) {
        // audio context fallback
      }
    });
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
  }
}
