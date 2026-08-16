/**
 * ============================================================================
 * VISIBILITY MANAGER (IntersectionObserver Performance Lifecycle)
 * ============================================================================
 * Automatically suspends off-screen scene animation loops and resumes them
 * seamlessly when they approach the viewport.
 */

export class VisibilityManager {
  constructor(options = {}) {
    this.observedScenes = new Map(); // element -> sceneInstance
    this.visibleElements = new Set();
    this.isPausedGlobally = false;

    const rootMargin = options.rootMargin || '250px 0px 250px 0px';
    const threshold = options.threshold || [0.0, 0.1];

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const scene = this.observedScenes.get(entry.target);
          if (!scene) return;

          if (entry.isIntersecting) {
            this.visibleElements.add(entry.target);
            if (!this.isPausedGlobally && typeof scene.resume === 'function') {
              scene.resume();
            }
          } else {
            this.visibleElements.delete(entry.target);
            if (typeof scene.suspend === 'function') {
              scene.suspend();
            }
          }
        });
      }, {
        root: null,
        rootMargin,
        threshold
      });
    }
  }

  register(element, sceneInstance) {
    if (!element || !sceneInstance) return;
    this.observedScenes.set(element, sceneInstance);

    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback if no IntersectionObserver
      if (typeof sceneInstance.resume === 'function') {
        sceneInstance.resume();
      }
    }
  }

  unregister(element) {
    if (!element) return;
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.observedScenes.delete(element);
    this.visibleElements.delete(element);
  }

  pauseAll() {
    this.isPausedGlobally = true;
    this.observedScenes.forEach(scene => {
      if (scene && typeof scene.suspend === 'function') {
        scene.suspend();
      }
    });
  }

  resumeVisible() {
    this.isPausedGlobally = false;
    this.visibleElements.forEach(el => {
      const scene = this.observedScenes.get(el);
      if (scene && typeof scene.resume === 'function') {
        scene.resume();
      }
    });
  }

  isElementVisible(element) {
    return this.visibleElements.has(element);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.observedScenes.clear();
    this.visibleElements.clear();
  }
}
