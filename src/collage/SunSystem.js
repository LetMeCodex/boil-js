import * as THREE from 'three';
import { createPaperMaterial } from './PaperMaterial.js';

/**
 * ============================================================================
 * SUN SYSTEM (Imperfect Terracotta Cut-Paper Sun)
 * ============================================================================
 * Generates an imperfect hand-cut orange sun with subtle vertical breathing.
 */

export class SunSystem {
  constructor(scene) {
    this.scene = scene;
    this.buildSun();
  }

  buildSun() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const sunColor = isDark ? 0xE05A2B : 0xD95328;

    this.group = new THREE.Group();
    this.group.position.set(4.5, 2.5, -6.0);
    this.group.userData = {
      baseX: 4.5,
      baseY: 2.5,
      baseZ: -6.0,
      parallax: 0.08
    };

    // Generate imperfect hand-cut disc shape
    const shape = new THREE.Shape();
    const radius = 2.4;
    const numPoints = 16;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      // Controlled deterministic irregularity
      const rMod = radius * (1.0 + Math.sin(angle * 4.0 + 1.2) * 0.04 + Math.cos(angle * 3.0) * 0.03);
      const px = Math.cos(angle) * rMod;
      const py = Math.sin(angle) * rMod;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    // 1. Soft Paper Drop Shadow
    const shadowGeo = new THREE.ShapeGeometry(shape);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0.08, -0.10, -0.02);
    this.group.add(shadowMesh);

    // 2. Main Sun Paper Body
    const geometry = new THREE.ShapeGeometry(shape);
    const material = createPaperMaterial(sunColor, { grainStrength: 0.06 });
    const mesh = new THREE.Mesh(geometry, material);
    this.group.add(mesh);

    this.scene.add(this.group);
  }

  update(delta, time, mouseParallax, scrollProgress = 0) {
    if (!this.group) return;
    const d = this.group.userData;

    // Extremely subtle vertical breathing + scroll trajectory
    const breath = Math.sin(time * 0.5) * 0.15;
    const scrollSink = scrollProgress * 2.2;

    this.group.position.x = d.baseX + mouseParallax.x * d.parallax * 8.0;
    this.group.position.y = d.baseY + breath - scrollSink + mouseParallax.y * d.parallax * 4.0;
  }

  dispose() {
    if (this.group) {
      this.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.scene.remove(this.group);
    }
  }
}
