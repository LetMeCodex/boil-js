import * as THREE from 'three';

/**
 * ============================================================================
 * KURAMA GPU PARTICLE FIELD (12,000 Particles)
 * ============================================================================
 */

export class KuramaParticles {
  constructor(count = 12000) {
    this.count = count;
    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const colorPalette = [
      new THREE.Color(0xEA580C), // Burnt Orange
      new THREE.Color(0xDC2626), // Deep Crimson
      new THREE.Color(0xF59E0B), // Warm Gold
      new THREE.Color(0x7C2D12)  // Charcoal Embers
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const radius = 1.0 + Math.random() * 4.5;

      positions[i3] = Math.cos(theta) * Math.cos(phi) * radius;
      positions[i3 + 1] = Math.sin(phi) * radius + 1.0;
      positions[i3 + 2] = Math.sin(theta) * Math.cos(phi) * radius;

      seeds[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
      sizes[i] = 2.0 + Math.random() * 4.0;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    this.geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uChakraIntensity: { value: 0.0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
      },
      vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;
        uniform vec3 uMouse;
        uniform float uPixelRatio;

        attribute float aSeed;
        attribute float aPhase;
        attribute float aSize;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;

          vec3 pos = position;

          // 1. Idle dormant drift (Phase 01: 0.0 - 0.2)
          float dormantFactor = max(0.0, 1.0 - uProgress / 0.25);
          pos.y += sin(uTime * 1.5 + aPhase) * 0.08 * dormantFactor;
          pos.x += cos(uTime * 1.2 + aSeed * 6.28) * 0.05 * dormantFactor;

          // 2. Inward Spiral Vortex (Phase 02: 0.2 - 0.4)
          if (uProgress >= 0.15 && uProgress < 0.45) {
            float spiralT = (uProgress - 0.15) / 0.3;
            float spiralAngle = uTime * 4.0 + aPhase * 2.0;
            float pullRadius = mix(length(pos.xz), 0.3, spiralT);
            pos.x = cos(spiralAngle) * pullRadius;
            pos.z = sin(spiralAngle) * pullRadius;
            pos.y += sin(uTime * 3.0 + aSeed) * 0.1;
          }

          // 3. Shockwave Radial Explosion (Phase 03: 0.4 - 0.6)
          if (uProgress >= 0.4 && uProgress < 0.65) {
            float shockT = (uProgress - 0.4) / 0.25;
            float burstRadius = shockT * (4.5 + aSeed * 3.0);
            vec3 burstDir = normalize(pos - vec3(0.0, 1.2, 0.0));
            pos += burstDir * burstRadius;
          }

          // 4. Nine Tail Orbit & Blazing Field (Phase 04/05/06: 0.6 - 1.0)
          if (uProgress >= 0.6) {
            float fieldT = (uProgress - 0.6) / 0.4;
            float orbitSpeed = uTime * (2.5 + uChakraIntensity * 3.0);
            float orbitRadius = 1.2 + aSeed * 3.2;
            
            // Simplex-like curl turbulence
            float curlX = sin(pos.y * 2.0 + orbitSpeed + aPhase) * 0.6;
            float curlY = cos(pos.z * 2.0 + orbitSpeed + aSeed * 3.14) * 0.8;
            float curlZ = sin(pos.x * 2.0 + orbitSpeed) * 0.6;

            pos += vec3(curlX, curlY, curlZ) * fieldT;
          }

          // 5. Mouse Repulsion Force Field
          vec3 toMouse = pos - uMouse;
          float dist = length(toMouse);
          if (dist < 2.0 && dist > 0.01) {
            pos += normalize(toMouse) * (1.0 - dist / 2.0) * 0.6;
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Dynamic Point Size
          float pSize = aSize * (1.0 + uChakraIntensity * 1.5);
          gl_PointSize = pSize * uPixelRatio * (6.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.5, 24.0);

          vAlpha = clamp(1.0 - (-mvPosition.z - 4.0) / 10.0, 0.2, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float softEdge = smoothstep(0.5, 0.1, dist);
          float core = smoothstep(0.2, 0.0, dist) * 0.6;

          gl_FragColor = vec4(vColor + vec3(core), softEdge * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  update(progress, time, chakraIntensity = 0.0, mouseWorld = new THREE.Vector3(0, 0, 0)) {
    this.material.uniforms.uProgress.value = progress;
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uChakraIntensity.value = chakraIntensity;
    this.material.uniforms.uMouse.value.copy(mouseWorld);
  }

  destroy() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
