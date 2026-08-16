import * as THREE from 'three';
import { createPaperMaterial } from './PaperMaterial.js';

/**
 * ============================================================================
 * MOUNTAIN SYSTEM (Layered Hand-Cut Paper Mountains)
 * ============================================================================
 * Generates Far, Mid, and Foreground hand-cut mountain silhouettes with depth.
 */

export class MountainSystem {
  constructor(scene) {
    this.scene = scene;
    this.mountains = [];
    this.buildMountains();
  }

  buildMountains() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Mountain 1: Far Mountains (Atmospheric deep navy/slate)
    const farColor = isDark ? 0x182433 : 0x2C425E;
    const farMesh = this.createMountainLayer({
      points: [
        [-24, -8], [-24, 1.2], [-18, 3.8], [-13, 2.1], [-8, 4.5], [-3, 2.8],
        [2, 5.2], [7, 3.1], [12, 4.2], [17, 2.0], [24, 3.6], [24, -8]
      ],
      z: -12.0,
      color: farColor,
      parallax: 0.05,
      shadowOffset: 0.08
    });

    // Mountain 2: Mid Mountains (Deep ink blue)
    const midColor = isDark ? 0x111A24 : 0x1A2B42;
    const midMesh = this.createMountainLayer({
      points: [
        [-24, -8], [-24, -0.5], [-16, 2.2], [-11, 0.4], [-6, 3.1], [-1, 1.2],
        [4, 2.6], [9, 0.8], [15, 2.4], [20, -0.2], [24, 1.8], [24, -8]
      ],
      z: -2.8,
      color: midColor,
      parallax: 0.12,
      shadowOffset: 0.12
    });

    // Mountain 3: Foreground Mountain (Near-black ink)
    const foreColor = isDark ? 0x070B10 : 0x0A0F17;
    const foreMesh = this.createMountainLayer({
      points: [
        [-24, -8], [-24, -2.2], [-14, 0.6], [-8, -1.4], [-2, 0.9], [5, -0.8],
        [11, 1.1], [18, -1.6], [24, 0.2], [24, -8]
      ],
      z: -0.8,
      color: foreColor,
      parallax: 0.18,
      shadowOffset: 0.15
    });

    this.mountains = [farMesh, midMesh, foreMesh];
  }

  createMountainLayer({ points, z, color, parallax, shadowOffset }) {
    const group = new THREE.Group();
    group.position.z = z;
    group.userData = { parallax, baseZ: z, baseY: 0 };

    // 1. Soft Paper Drop Shadow Plane
    const shadowShape = new THREE.Shape();
    shadowShape.moveTo(points[0][0], points[0][1] - shadowOffset);
    for (let i = 1; i < points.length; i++) {
      shadowShape.lineTo(points[i][0], points[i][1] - shadowOffset);
    }
    const shadowGeo = new THREE.ShapeGeometry(shadowShape);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0.04, -0.06, -0.02);
    group.add(shadowMesh);

    // 2. Main Cut-Paper Mountain Mesh
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    const geometry = new THREE.ShapeGeometry(shape);
    const material = createPaperMaterial(color, { grainStrength: 0.06 });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    this.scene.add(group);
    return group;
  }

  update(delta, time, mouseParallax) {
    this.mountains.forEach((m, idx) => {
      const p = m.userData.parallax;
      // Damped mouse parallax
      m.position.x = mouseParallax.x * p * 8.0;
      m.position.y = mouseParallax.y * p * 4.0;
    });
  }

  dispose() {
    this.mountains.forEach(g => {
      g.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.scene.remove(g);
    });
    this.mountains = [];
  }
}
