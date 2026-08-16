/**
 * ============================================================================
 * VISIBILITY MANAGER (Performance & Lazy RAF Suspension)
 * ============================================================================
 * Pauses WebGL/Matter/2D canvas rendering loops when scrolled out of viewport.
 */

export class VisibilityManager {
  constructor() {
    this.observedScenes = new Map();
  }

  register(element, sceneInstance) {
    if (!element || !sceneInstance) return;
    this.observedScenes.set(element, sceneInstance);
    // Always ensure scene is running
    if (typeof sceneInstance.resume === 'function') {
      sceneInstance.resume();
    }
  }

  unregister(element) {
    if (!element) return;
    this.observedScenes.delete(element);
  }

  destroy() {
    this.observedScenes.clear();
  }
}
