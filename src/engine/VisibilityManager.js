/**
 * ============================================================================
 * VISIBILITY MANAGER (Performance & Lazy RAF Suspension)
 * ============================================================================
 * Pauses WebGL/Matter/2D canvas rendering loops when scrolled out of viewport.
 */

export class VisibilityManager {
  constructor() {
    this.observedScenes = new Map();

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const scene = this.observedScenes.get(entry.target);
        if (scene) {
          if (entry.isIntersecting) {
            if (typeof scene.resume === 'function') scene.resume();
          } else {
            if (typeof scene.suspend === 'function') scene.suspend();
          }
        }
      });
    }, {
      rootMargin: '400px 0px 400px 0px',
      threshold: 0.0
    });
  }

  register(element, sceneInstance) {
    if (!element || !sceneInstance) return;
    this.observedScenes.set(element, sceneInstance);
    this.observer.observe(element);
  }

  unregister(element) {
    if (!element) return;
    this.observer.unobserve(element);
    this.observedScenes.delete(element);
  }

  destroy() {
    this.observer.disconnect();
    this.observedScenes.clear();
  }
}
