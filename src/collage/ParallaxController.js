/**
 * ============================================================================
 * PARALLAX CONTROLLER (Weighted Spring Parallax & Cursor Wind Disturbance)
 * ============================================================================
 */

export class ParallaxController {
  constructor() {
    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.wind = 0;
    this.lastMouseX = 0;
    this.lastMouseTime = performance.now();
  }

  setMouse(normX, normY) {
    this.target.x = Math.max(-1, Math.min(1, normX));
    this.target.y = Math.max(-1, Math.min(1, normY));

    // Calculate subtle cursor wind disturbance
    const now = performance.now();
    const dt = Math.max(1, now - this.lastMouseTime);
    const dx = this.target.x - this.lastMouseX;
    this.wind = (dx / dt) * 12.0;

    this.lastMouseX = this.target.x;
    this.lastMouseTime = now;
  }

  update(delta) {
    // Weighted spring lerp (smooth and heavy)
    this.current.x += (this.target.x - this.current.x) * 0.05;
    this.current.y += (this.target.y - this.current.y) * 0.05;

    // Decay wind force
    this.wind *= 0.94;

    return {
      x: this.current.x,
      y: this.current.y,
      wind: this.wind
    };
  }
}
