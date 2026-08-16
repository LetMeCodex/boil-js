import * as THREE from 'three';
import { createPaperMaterial } from './PaperMaterial.js';

/**
 * ============================================================================
 * CLOUD SYSTEM (Multi-Layer Organic Paper Clouds)
 * ============================================================================
 * Generates layered paper cut-out clouds drifting at different speeds.
 */

export class CloudSystem {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.buildClouds();
  }

  buildClouds() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Cloud Layer 1: Distant Cloud (Warm Ivory)
    const c1Color = isDark ? 0x222E3D : 0xFBF8EE;
    this.createCloud({
      x: -6.0, y: 3.2, z: -8.0,
      scaleX: 5.5, scaleY: 2.2,
      speed: 0.15,
      bobFreq: 0.8, bobAmp: 0.12,
      color: c1Color,
      parallax: 0.07,
      seed: 101
    });

    this.createCloud({
      x: 8.0, y: 4.1, z: -7.5,
      scaleX: 6.2, scaleY: 2.4,
      speed: 0.18,
      bobFreq: 0.6, bobAmp: 0.15,
      color: c1Color,
      parallax: 0.08,
      seed: 102
    });

    // Cloud Layer 2: Mid Cloud (Slightly dirty cream)
    const c2Color = isDark ? 0x1E2938 : 0xF3EEDB;
    this.createCloud({
      x: -12.0, y: 1.8, z: -4.5,
      scaleX: 7.2, scaleY: 2.8,
      speed: 0.32,
      bobFreq: 1.1, bobAmp: 0.18,
      color: c2Color,
      parallax: 0.10,
      seed: 201
    });

    this.createCloud({
      x: 3.5, y: 2.1, z: -4.0,
      scaleX: 6.8, scaleY: 2.6,
      speed: 0.28,
      bobFreq: 0.9, bobAmp: 0.14,
      color: c2Color,
      parallax: 0.11,
      seed: 202
    });

    // Cloud Layer 3: Foreground Floating Cloud
    const c3Color = isDark ? 0x182230 : 0xEDE6D0;
    this.createCloud({
      x: -2.0, y: -0.4, z: -1.8,
      scaleX: 8.5, scaleY: 3.2,
      speed: 0.48,
      bobFreq: 1.3, bobAmp: 0.22,
      color: c3Color,
      parallax: 0.15,
      seed: 301
    });
  }

  createCloud({ x, y, z, scaleX, scaleY, speed, bobFreq, bobAmp, color, parallax, seed }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.userData = {
      baseX: x, baseY: y, baseZ: z,
      speed, bobFreq, bobAmp,
      parallax, seed,
      currentX: x
    };

    // Generate irregular puffy cloud shape
    const shape = new THREE.Shape();
    const numPoints = 12;
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const rMod = 1.0 + Math.sin(angle * 3.0 + seed) * 0.22 + Math.cos(angle * 2.0) * 0.15;
      const px = Math.cos(angle) * (scaleX * 0.5) * rMod;
      const py = Math.sin(angle) * (scaleY * 0.5) * rMod;
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();

    // 1. Soft Paper Drop Shadow
    const shadowGeo = new THREE.ShapeGeometry(shape);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0.06, -0.08, -0.02);
    group.add(shadowMesh);

    // 2. Cloud Paper Body
    const geometry = new THREE.ShapeGeometry(shape);
    const material = createPaperMaterial(color, { grainStrength: 0.05 });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    this.scene.add(group);
    this.clouds.push(group);
  }

  update(delta, time, mouseParallax, windForce = 0) {
    const wrapWidth = 36.0;

    this.clouds.forEach(c => {
      const d = c.userData;

      // Horizontal organic drift
      d.currentX += (d.speed + windForce * 0.8) * delta;
      if (d.currentX > wrapWidth * 0.5) {
        d.currentX = -wrapWidth * 0.5;
      }

      // Vertical sine wave bobbing
      const bob = Math.sin(time * d.bobFreq + d.seed) * d.bobAmp;

      // Parallax application
      c.position.x = d.currentX + mouseParallax.x * d.parallax * 8.0;
      c.position.y = d.baseY + bob + mouseParallax.y * d.parallax * 4.0;
    });
  }

  dispose() {
    this.clouds.forEach(c => {
      c.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.scene.remove(c);
    });
    this.clouds = [];
  }
}
