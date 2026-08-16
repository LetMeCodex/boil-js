import * as THREE from 'three';
import { TextGeometrySampler } from './TextGeometrySampler.js';

/**
 * ============================================================================
 * BEZIER TRAJECTORY ENGINE
 * ============================================================================
 */

export class BezierTrajectoryEngine {
  static generateParticleGeometry(totalPoints = 14000) {
    const geometry = new THREE.BufferGeometry();

    const createData = TextGeometrySampler.sampleWord3D('CREATE', totalPoints, {
      scale: 1.65,
      depth: 0.5,
      spacing: 1.6
    });

    const matterData = TextGeometrySampler.sampleWord3D('MATTER', totalPoints, {
      scale: 1.65,
      depth: 0.5,
      spacing: 1.65
    });

    const svgData = TextGeometrySampler.sampleSvgOutline('MATTER', totalPoints, 1.65);

    const P0 = createData.positions;
    const P3 = matterData.positions;
    const S0 = svgData;

    const P1 = new Float32Array(totalPoints * 3);
    const P2 = new Float32Array(totalPoints * 3);
    const delays = new Float32Array(totalPoints);
    const seeds = new Float32Array(totalPoints);
    const randomScales = new Float32Array(totalPoints);
    const particleColors = new Float32Array(totalPoints * 3);

    for (let i = 0; i < totalPoints; i++) {
      const i3 = i * 3;
      const x0 = P0[i3];
      const y0 = P0[i3 + 1];
      const z0 = P0[i3 + 2];

      const x3 = P3[i3];
      const y3 = P3[i3 + 1];
      const z3 = P3[i3 + 2];

      const letterIdx = createData.letterIndices[i];
      const seed = Math.random();
      seeds[i] = seed;

      const baseLetterDelay = (letterIdx / 6) * 0.16;
      delays[i] = 0.16 + baseLetterDelay + (Math.random() - 0.5) * 0.08;

      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const burstDist = 3.0 + Math.random() * 5.0;

      P1[i3] = x0 + Math.cos(theta) * Math.cos(phi) * burstDist;
      P1[i3 + 1] = y0 + Math.sin(phi) * burstDist * 1.2;
      P1[i3 + 2] = z0 + Math.sin(theta) * burstDist * 1.5;

      const vortexAngle = theta + Math.PI * 1.2;
      const vortexRadius = 2.0 + Math.random() * 3.5;

      P2[i3] = x3 + Math.cos(vortexAngle) * vortexRadius;
      P2[i3 + 1] = y3 + (Math.random() - 0.5) * 4.0;
      P2[i3 + 2] = z3 + Math.sin(vortexAngle) * vortexRadius;

      randomScales[i] = 0.7 + Math.random() * 0.8;

      const colorChoice = Math.random();
      if (colorChoice < 0.75) {
        particleColors[i3] = 0.95;
        particleColors[i3 + 1] = 0.95;
        particleColors[i3 + 2] = 0.94;
      } else if (colorChoice < 0.92) {
        particleColors[i3] = 0.92;
        particleColors[i3 + 1] = 0.65;
        particleColors[i3 + 2] = 0.32;
      } else {
        particleColors[i3] = 0.6;
        particleColors[i3 + 1] = 0.62;
        particleColors[i3 + 2] = 0.66;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(P0, 3));
    geometry.setAttribute('aP0', new THREE.BufferAttribute(P0, 3));
    geometry.setAttribute('aP1', new THREE.BufferAttribute(P1, 3));
    geometry.setAttribute('aP2', new THREE.BufferAttribute(P2, 3));
    geometry.setAttribute('aP3', new THREE.BufferAttribute(P3, 3));
    geometry.setAttribute('aS0', new THREE.BufferAttribute(S0, 3));
    geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(randomScales, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(particleColors, 3));

    return geometry;
  }
}
