import rough from 'roughjs';
import anime from 'animejs';
import { SoundFX } from './engine/AnimeBoilBridge.js';
import { BoilEngine } from './engine/BoilEngine.js';
import { CursorTrail } from './utils/CursorTrail.js';

// Scene Imports
import { TextMotionScene } from './scenes/TextMotionScene.js';
import { PinballScene } from './scenes/PinballScene.js';
import { PuppetScene } from './scenes/PuppetScene.js';
import { BubbleScene } from './scenes/BubbleScene.js';
import { SpaceBlasterScene } from './scenes/SpaceBlasterScene.js';
import { ThreeDScene } from './scenes/ThreeDScene.js';
import { PhysicsScene } from './scenes/PhysicsScene.js';
import { MorphScene } from './scenes/MorphScene.js';
import { VortexScene } from './scenes/VortexScene.js';
import { AudioSynthScene } from './scenes/AudioSynthScene.js';
import { KineticScene } from './scenes/KineticScene.js';
import { Sketchpad } from './studio/Sketchpad.js';
import { CharacterScene } from './scenes/CharacterScene.js';
import { UiKitScene } from './scenes/UiKitScene.js';
import { CalligraphyScene } from './scenes/CalligraphyScene.js';
import { ChartsScene } from './scenes/ChartsScene.js';
import { CodeExporter } from './studio/CodeExporter.js';

class App {
  constructor() {
    this.currentSceneInstance = null;
    this.currentSceneKey = 'textmotion';
    this.boilFps = 10;
    this.theme = localStorage.getItem('rough-theme') || 'parchment';
    this.soundEnabled = true;

    this.sceneMap = {
      textmotion: TextMotionScene,
      pinball: PinballScene,
      puppet: PuppetScene,
      bubble: BubbleScene,
      space: SpaceBlasterScene,
      threed: ThreeDScene,
      physics: PhysicsScene,
      morph: MorphScene,
      vortex: VortexScene,
      synth: AudioSynthScene,
      kinetic: KineticScene,
      sketchpad: Sketchpad,
      character: CharacterScene,
      uikit: UiKitScene,
      calligraphy: CalligraphyScene,
      charts: ChartsScene,
      code: CodeExporter
    };

    this.initTheme();
    this.initLogoAnimation();
    this.initCursorTrail();
    this.bindGlobalEvents();
    this.switchScene('textmotion');
  }

  initCursorTrail() {
    this.cursorTrail = new CursorTrail();
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
    this.switchScene(this.currentSceneKey);
  }

  initLogoAnimation() {
    const canvas = document.getElementById('brand-logo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rc = rough.canvas(canvas);
    const gen = rough.generator();

    const frames = [0, 1, 2, 3].map(i => {
      return gen.polygon([[6, 38], [22, 6], [38, 38]], {
        seed: 100 + i * 50,
        roughness: 2.2,
        bowing: 1.8,
        stroke: '#D97706',
        strokeWidth: 2.5,
        fill: '#D97706',
        fillStyle: 'hachure',
        hachureAngle: 60
      });
    });

    const render = (timestamp) => {
      ctx.clearRect(0, 0, 44, 44);
      const frameIdx = BoilEngine.getFrameIndex(timestamp, 8, 4);
      rc.draw(frames[frameIdx]);
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  switchScene(sceneKey) {
    if (!this.sceneMap[sceneKey]) return;

    if (this.currentSceneInstance && typeof this.currentSceneInstance.destroy === 'function') {
      this.currentSceneInstance.destroy();
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
      const isActive = tab.getAttribute('data-scene') === sceneKey;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const container = document.getElementById('scene-container');
    if (!container) return;

    this.currentSceneKey = sceneKey;
    const SceneClass = this.sceneMap[sceneKey];
    this.currentSceneInstance = new SceneClass(container, { boilFps: this.boilFps });

    SoundFX.playPop(440);
  }

  bindGlobalEvents() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const scene = target.getAttribute('data-scene');
        if (scene && scene !== this.currentSceneKey) {
          this.switchScene(scene);
        }
      });
    });

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
      if (this.currentSceneInstance && typeof this.currentSceneInstance.setBoilFps === 'function') {
        this.currentSceneInstance.setBoilFps(this.boilFps);
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        if (this.currentSceneKey !== 'pinball' && this.currentSceneKey !== 'space') {
          e.preventDefault();
          if (this.currentSceneInstance && typeof this.currentSceneInstance.toggleAutoPlay === 'function') {
            this.currentSceneInstance.toggleAutoPlay();
          } else if (this.currentSceneInstance && typeof this.currentSceneInstance.togglePlayPause === 'function') {
            this.currentSceneInstance.togglePlayPause();
          }
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (this.currentSceneInstance && typeof this.currentSceneInstance.reseedAll === 'function') {
          this.currentSceneInstance.reseedAll();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        if (this.currentSceneInstance && typeof this.currentSceneInstance.clear === 'function') {
          this.currentSceneInstance.clear();
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
