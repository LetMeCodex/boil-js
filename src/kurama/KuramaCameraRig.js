import * as THREE from 'three';

/**
 * ============================================================================
 * KURAMA CAMERA RIG
 * ============================================================================
 * 6-Stage weighted cinematic camera path with subtle mouse parallax.
 */

export class KuramaCameraRig {
  constructor(camera) {
    this.camera = camera;

    this.keyframes = [
      { progress: 0.00, pos: new THREE.Vector3(0, 0.2, 8.8), look: new THREE.Vector3(0, 1.0, 0) },
      { progress: 0.25, pos: new THREE.Vector3(0, 0.4, 7.5), look: new THREE.Vector3(0, 1.1, 0) },
      { progress: 0.50, pos: new THREE.Vector3(0.3, 0.2, 8.2), look: new THREE.Vector3(0, 1.1, 0) },
      { progress: 0.75, pos: new THREE.Vector3(1.6, 0.8, 6.6), look: new THREE.Vector3(0, 1.2, 0) },
      { progress: 1.00, pos: new THREE.Vector3(0, 0.6, 5.6), look: new THREE.Vector3(0, 1.3, 0) }
    ];

    this.currentPos = new THREE.Vector3(0, 0.2, 8.8);
    this.currentLook = new THREE.Vector3(0, 1.0, 0);
    this.targetPos = new THREE.Vector3(0, 0.2, 8.8);
    this.targetLook = new THREE.Vector3(0, 1.0, 0);

    this.mouseParallax = { x: 0, y: 0 };
    this.targetMouseParallax = { x: 0, y: 0 };
  }

  setMouse(ndcX, ndcY) {
    this.targetMouseParallax.x = ndcX * 0.45;
    this.targetMouseParallax.y = -ndcY * 0.3;
  }

  update(progress, delta = 0.016) {
    const p = Math.max(0, Math.min(1, progress));
    let segIdx = 0;
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (p >= this.keyframes[i].progress && p <= this.keyframes[i + 1].progress) {
        segIdx = i;
        break;
      }
    }

    const k0 = this.keyframes[segIdx];
    const k1 = this.keyframes[segIdx + 1];
    const segmentRange = k1.progress - k0.progress;
    const segT = segmentRange > 0 ? (p - k0.progress) / segmentRange : 0;
    const easedT = THREE.MathUtils.smoothstep(segT, 0, 1);

    this.targetPos.lerpVectors(k0.pos, k1.pos, easedT);
    this.targetLook.lerpVectors(k0.look, k1.look, easedT);

    // Damped spring mouse parallax
    this.mouseParallax.x += (this.targetMouseParallax.x - this.mouseParallax.x) * 0.06;
    this.mouseParallax.y += (this.targetMouseParallax.y - this.mouseParallax.y) * 0.06;

    this.camera.position.x = this.targetPos.x + this.mouseParallax.x;
    this.camera.position.y = this.targetPos.y + this.mouseParallax.y;
    this.camera.position.z = this.targetPos.z;

    this.camera.lookAt(
      this.targetLook.x + this.mouseParallax.x * 0.2,
      this.targetLook.y + this.mouseParallax.y * 0.2,
      this.targetLook.z
    );
  }
}
