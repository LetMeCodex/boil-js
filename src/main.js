import rough from 'roughjs';
import anime from 'animejs';
import { SoundFX } from './engine/AnimeBoilBridge.js';
import { BoilEngine } from './engine/BoilEngine.js';
import { ShowcaseScrollEngine } from './engine/ShowcaseScrollEngine.js';
import { VisibilityManager } from './engine/VisibilityManager.js';
import { EXPERIMENTS, getExperimentByKey } from './engine/ExperimentRegistry.js';
import { CursorDirector } from './utils/CursorDirector.js';
import { KeyboardDirector } from './utils/KeyboardDirector.js';
import { BootSequence } from './showcase/BootSequence.js';
import { DevTools } from './showcase/DevTools.js';
import { HeroLab } from './showcase/HeroLab.js';
import { TechEcosystem } from './showcase/TechEcosystem.js';
import { FooterLab } from './showcase/FooterLab.js';
import { KineticCollageScene } from './engine/KineticCollageScene.js';
import { renderIcon } from './utils/SvgIcons.js';

class ShowcaseApp {
  constructor() {
    this.scenes = {};
    this.boilFps = 10;
    this.theme = localStorage.getItem('rough-theme') || 'parchment';
    this.soundEnabled = true;

    // Real FPS Tracker
    this.fpsHistory = [];
    this.lastFrameTime = performance.now();
    this.currentFps = 60;

    this.initDebugSuite();
    this.initTheme();
    this.initCursor();
    this.initBrandLogo();
    this.initDevTools();
    this.initCollageBackground();
    this.initHero();
    this.initChapters();
    this.initTechEcosystem();
    this.initFooter();
    this.initScrollEngine();
    this.initKeyboardDirector();
    this.bindGlobalEvents();
    this.startFpsLoop();

    // Trigger boot sequence
    BootSequence.init();
  }

  initDebugSuite() {
    window.BOIL_DEBUG = {
      sceneStatuses: {},
      failedScenes: [],
      activeScene: null,
      fps: 60,
      scenes: this.scenes,
      reportSceneError: (key, error) => {
        console.error(`[BOIL.JS ERROR in ${key}]:`, error);
        window.BOIL_DEBUG.failedScenes.push({ key, error: error.message || String(error) });
        window.BOIL_DEBUG.sceneStatuses[key] = 'ERROR';
      }
    };
  }

  initBrandLogo() {
    const canvas = document.getElementById('brand-logo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, 32, 32);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const color = isDark ? '#F59E0B' : '#E8790C';

      rc.circle(16, 16, 24, {
        seed: 100 + (frame % 4) * 10,
        roughness: 1.5,
        stroke: color,
        strokeWidth: 2,
        fill: color,
        fillStyle: 'dots'
      });
    };

    setInterval(() => {
      frame++;
      draw();
    }, 150);
  }

  initCollageBackground() {
    const canvas = document.getElementById('kinetic-collage-bg');
    if (!canvas) return;
    try {
      this.collageScene = new KineticCollageScene(canvas, { quality: 'desktop' });
      this.collageScene.init();

      window.boilScene = {
        setExperiment: (i) => this.collageScene?.setExperiment(i),
        setScrollProgress: (p) => this.collageScene?.setScroll(p),
        setMouse: (x, y) => this.collageScene?.setMouse(x, y),
        setReducedMotion: (v) => this.collageScene?.setReducedMotion(v),
      };

      const onMove = (e) => {
        this.collageScene?.setMouse((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      };
      const onResize = () => this.collageScene?.resize();
      const onVis = () => this.collageScene?.setVisible(!document.hidden);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVis);
    } catch (err) {
      console.warn('Kinetic collage background initialization warning:', err);
    }
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const themeIconSpan = document.getElementById('theme-btn-icon');
    if (themeIconSpan) {
      themeIconSpan.innerHTML = this.theme === 'dark' ? renderIcon('sun') : renderIcon('moon');
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'parchment' ? 'dark' : 'parchment';
    localStorage.setItem('rough-theme', this.theme);
    this.initTheme();
    SoundFX.playPop(520);
  }

  initCursor() {
    this.cursor = new CursorDirector();
  }

  initKeyboardDirector() {
    this.keyboardDirector = new KeyboardDirector(this);
  }

  initDevTools() {
    DevTools.init();
    window.DevTools = DevTools;
  }

  initHero() {
    const heroCanvas = document.getElementById('hero-living-canvas');
    if (heroCanvas) {
      try {
        this.heroLab = new HeroLab(heroCanvas);
        this.scenes.hero = this.heroLab;
        window.BOIL_DEBUG.sceneStatuses.hero = 'RUNNING';
      } catch (err) {
        window.BOIL_DEBUG.reportSceneError('hero', err);
      }
    }
  }

  initChapters() {
    this.visibilityManager = new VisibilityManager();

    EXPERIMENTS.forEach(exp => {
      const container = document.getElementById(exp.stageId);
      if (!container) {
        console.warn(`Stage container #${exp.stageId} for experiment ${exp.key} not found.`);
        return;
      }

      try {
        const instance = new exp.SceneClass(container, { boilFps: this.boilFps });
        this.scenes[exp.key] = instance;
        window.BOIL_DEBUG.sceneStatuses[exp.key] = 'MOUNTED';

        const sectionEl = document.getElementById(exp.sectionId) || container.closest('.showcase-chapter-section');
        if (sectionEl) {
          this.visibilityManager.register(sectionEl, instance);
        }
      } catch (err) {
        window.BOIL_DEBUG.reportSceneError(exp.key, err);
        container.innerHTML = `
          <div class="scene-error-card" style="padding: 40px; text-align: center; border: 2px dashed #DC2626; border-radius: 12px; background: rgba(220, 38, 38, 0.05); margin: 20px;">
            <div style="font-size: 2rem; margin-bottom: 8px;">⚠️</div>
            <div style="font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: #DC2626;">EXPERIMENT TEMPORARILY UNAVAILABLE</div>
            <div style="font-size: 0.85rem; color: var(--ink-muted); margin-top: 6px; font-family: 'Fira Code', monospace;">${exp.title} (${exp.key})</div>
            <p style="font-size: 0.8rem; margin-top: 12px; color: var(--ink-muted);">${err.message || 'Scene failed to initialize'}</p>
          </div>
        `;
      }
    });

    this.bindChapterToolbarButtons();
  }

  bindChapterToolbarButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const key = btn.getAttribute('data-key');
        const targetId = btn.getAttribute('data-target');
        const sceneInstance = this.scenes[key];

        if (action === 'inspect') {
          DevTools.openInspector(key);
        } else if (action === 'source') {
          DevTools.openSource(key);
        } else if (action === 'prompt') {
          DevTools.openPrompt(key);
        } else if (action === 'remix') {
          DevTools.openRemix(key, sceneInstance);
        } else if (action === 'fullscreen') {
          const targetEl = document.getElementById(targetId);
          if (targetEl) DevTools.toggleFullscreen(targetEl);
        }
      });
    });
  }

  initTechEcosystem() {
    TechEcosystem.init();
  }

  initFooter() {
    const footerCanvas = document.getElementById('footer-living-canvas');
    if (footerCanvas) {
      try {
        this.footerLab = new FooterLab(footerCanvas);
        this.scenes.footer = this.footerLab;
        window.BOIL_DEBUG.sceneStatuses.footer = 'RUNNING';
      } catch (err) {
        window.BOIL_DEBUG.reportSceneError('footer', err);
      }
    }
  }

  initScrollEngine() {
    const chapterSections = Array.from(document.querySelectorAll('.showcase-chapter-section'));

    this.scrollEngine = new ShowcaseScrollEngine((state) => {
      if (this.heroLab && state.chapterIndex === 0 && state.chapterProgress !== undefined) {
        this.heroLab.setScrollProgress(state.chapterProgress);
      }
      if (this.collageScene) {
        if (state.masterProgress !== undefined) {
          this.collageScene.setScroll(state.masterProgress);
        }
        if (state.chapterIndex !== undefined) {
          this.collageScene.setExperiment(state.chapterIndex);
        }
      }
    });

    if (chapterSections.length > 0) {
      this.scrollEngine.setupTriggers(chapterSections);
    }

    // Bind nav item click smooth scrolling
    document.querySelectorAll('.lab-index-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetHash = item.getAttribute('href');
        const targetEl = document.querySelector(targetHash);
        if (targetEl) {
          SoundFX.playPop(520);
          const key = targetEl.getAttribute('data-key');
          if (key && this.scenes[key] && typeof this.scenes[key].resume === 'function') {
            this.scenes[key].resume();
          }
          this.scrollEngine.scrollToElement(targetEl, 1.2);
        }
      });
    });

    document.getElementById('btn-hero-explore')?.addEventListener('click', (e) => {
      e.preventDefault();
      const targetEl = document.querySelector('#section-01');
      if (targetEl) {
        SoundFX.playPop(580);
        this.scrollEngine.scrollToElement(targetEl, 1.2);
      }
    });

    document.getElementById('btn-hero-source')?.addEventListener('click', () => {
      DevTools.openSource('textmotion');
    });

    document.getElementById('footer-btn-shortcuts')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-shortcuts');
      if (modal) {
        modal.style.display = 'flex';
        SoundFX.playPop(520);
      }
    });
  }

  bindGlobalEvents() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    const audioBtn = document.getElementById('audio-toggle-btn');
    const audioIconSpan = document.getElementById('audio-btn-icon');
    if (audioIconSpan) {
      audioIconSpan.innerHTML = renderIcon('soundOn');
    }

    audioBtn?.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      SoundFX.enabled = this.soundEnabled;
      if (audioIconSpan) {
        audioIconSpan.innerHTML = this.soundEnabled ? renderIcon('soundOn') : renderIcon('soundOff');
      }
      if (this.soundEnabled) SoundFX.playPop(520);
    });

    const fpsSlider = document.getElementById('global-fps-slider');
    const boilVal = document.getElementById('global-boil-val');
    fpsSlider?.addEventListener('input', (e) => {
      this.boilFps = parseInt(e.target.value, 10);
      if (boilVal) boilVal.textContent = `${this.boilFps}Hz`;
      Object.values(this.scenes).forEach(s => {
        if (typeof s.setBoilFps === 'function') s.setBoilFps(this.boilFps);
      });
    });

    document.getElementById('shortcuts-btn')?.addEventListener('click', () => {
      const modal = document.getElementById('modal-shortcuts');
      if (modal) {
        modal.style.display = 'flex';
        SoundFX.playPop(600);
      }
    });

    // Handle background tab switching and visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.visibilityManager?.pauseAll();
      } else {
        this.visibilityManager?.resumeVisible();
      }
    });
  }

  startFpsLoop() {
    const fpsValEl = document.getElementById('global-fps-val');
    let frames = 0;
    let lastTime = performance.now();

    const checkFps = (time) => {
      frames++;
      if (time >= lastTime + 500) {
        const fps = Math.round((frames * 1000) / (time - lastTime));
        this.currentFps = Math.min(60, fps);
        if (fpsValEl) {
          fpsValEl.textContent = `${this.currentFps} FPS`;
        }
        if (window.BOIL_DEBUG) {
          window.BOIL_DEBUG.fps = this.currentFps;
        }
        frames = 0;
        lastTime = time;
      }
      requestAnimationFrame(checkFps);
    };
    requestAnimationFrame(checkFps);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ShowcaseApp();
});
