import rough from 'roughjs';
import anime from 'animejs';
import { SoundFX } from './engine/AnimeBoilBridge.js';
import { BoilEngine } from './engine/BoilEngine.js';
import { ShowcaseScrollEngine } from './engine/ShowcaseScrollEngine.js';
import { VisibilityManager } from './engine/VisibilityManager.js';
import { CursorDirector } from './utils/CursorDirector.js';
import { DevTools } from './showcase/DevTools.js';
import { HeroLab } from './showcase/HeroLab.js';
import { TechEcosystem } from './showcase/TechEcosystem.js';
import { FooterLab } from './showcase/FooterLab.js';
import { KineticCollageScene } from './collage/KineticCollageScene.js';

// Scene Imports
import { TextMotionScene } from './scenes/TextMotionScene.js';
import { KuramaScene } from './scenes/KuramaScene.js';
import { PinballScene } from './scenes/PinballScene.js';
import { PuppetScene } from './scenes/PuppetScene.js';
import { BubbleScene } from './scenes/BubbleScene.js';
import { SpaceBlasterScene } from './scenes/SpaceBlasterScene.js';
import { ThreeDScene } from './scenes/ThreeDScene.js';
import { MorphScene } from './scenes/MorphScene.js';
import { PhysicsScene } from './scenes/PhysicsScene.js';
import { UiKitScene } from './scenes/UiKitScene.js';

class ShowcaseApp {
  constructor() {
    this.scenes = {};
    this.boilFps = 10;
    this.theme = localStorage.getItem('rough-theme') || 'parchment';
    this.soundEnabled = true;

    this.initTheme();
    this.initCursor();
    this.initDevTools();
    this.initCollageBackground();
    this.initHero();
    this.initChapters();
    this.initTechEcosystem();
    this.initFooter();
    this.initScrollEngine();
    this.bindGlobalEvents();
  }

  initCollageBackground() {
    const wrap = document.getElementById('paper-collage-background-wrap');
    if (wrap) {
      this.collageScene = new KineticCollageScene(wrap);
    }
  }

  initTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = this.theme === 'dark' ? '<span class="theme-icon">☀️</span>' : '<span class="theme-icon">🌙</span>';
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

  initDevTools() {
    DevTools.init();
    window.DevTools = DevTools; // Expose for inline handlers
  }

  initHero() {
    const heroCanvas = document.getElementById('hero-living-canvas');
    if (heroCanvas) {
      this.heroLab = new HeroLab(heroCanvas);
    }
  }

  initChapters() {
    this.visibilityManager = new VisibilityManager();

    const chapterConfigs = [
      { id: 'stage-01', key: 'textmotion', Class: TextMotionScene },
      { id: 'stage-kurama', key: 'kurama', Class: KuramaScene },
      { id: 'stage-02', key: 'pinball', Class: PinballScene },
      { id: 'stage-03', key: 'puppet', Class: PuppetScene },
      { id: 'stage-04', key: 'bubble', Class: BubbleScene },
      { id: 'stage-05', key: 'space', Class: SpaceBlasterScene },
      { id: 'stage-06', key: 'threed', Class: ThreeDScene },
      { id: 'stage-07', key: 'morph', Class: MorphScene },
      { id: 'stage-08', key: 'physics', Class: PhysicsScene },
      { id: 'stage-uikit', key: 'uikit', Class: UiKitScene }
    ];

    chapterConfigs.forEach(cfg => {
      const container = document.getElementById(cfg.id);
      if (container) {
        try {
          const instance = new cfg.Class(container, { boilFps: this.boilFps });
          this.scenes[cfg.key] = instance;
          const sectionEl = container.closest('.showcase-chapter-section');
          if (sectionEl) {
            this.visibilityManager.register(sectionEl, instance);
          }
        } catch (e) {
          console.error(`Failed to mount scene ${cfg.key}:`, e);
        }
      }
    });

    this.bindChapterToolbarButtons();
  }

  bindChapterToolbarButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
      this.footerLab = new FooterLab(footerCanvas);
    }
  }

  initScrollEngine() {
    const chapterSections = Array.from(document.querySelectorAll('.showcase-chapter-section'));

    this.scrollEngine = new ShowcaseScrollEngine((state) => {
      if (this.heroLab && state.chapterIndex === 0) {
        this.heroLab.setScrollProgress(state.chapterProgress);
      }
      if (this.collageScene) {
        this.collageScene.setScroll(state.masterProgress);
        this.collageScene.setExperiment(state.chapterIndex);
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
  }

  bindGlobalEvents() {
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    const audioBtn = document.getElementById('audio-toggle-btn');
    audioBtn?.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      SoundFX.enabled = this.soundEnabled;
      audioBtn.innerHTML = this.soundEnabled ? '<span class="btn-icon">🔊</span>' : '<span class="btn-icon">🔇</span>';
      if (this.soundEnabled) SoundFX.playPop(520);
    });

    const fpsSlider = document.getElementById('global-fps-slider');
    const fpsVal = document.getElementById('global-fps-val');
    fpsSlider?.addEventListener('input', (e) => {
      this.boilFps = parseInt(e.target.value);
      if (fpsVal) fpsVal.textContent = `${this.boilFps} FPS`;
      Object.values(this.scenes).forEach(s => {
        if (typeof s.setBoilFps === 'function') s.setBoilFps(this.boilFps);
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ShowcaseApp();
});
