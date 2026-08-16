import * as THREE from 'three';

/**
 * ============================================================================
 * KURAMA CHAKRA AURA SHADER
 * ============================================================================
 * Procedural simplex noise displacement aura shell enveloping the avatar.
 */

export class KuramaAuraShader {
  static createAuraMesh() {
    const geo = new THREE.IcosahedronGeometry(1.6, 4);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uChakraIntensity: { value: 0.0 },
        uColorA: { value: new THREE.Color(0xDC2626) }, // Crimson
        uColorB: { value: new THREE.Color(0xEA580C) }, // Orange
        uColorC: { value: new THREE.Color(0xF59E0B) }  // Gold
      },
      vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          vec3 pos = position;

          // Multi-octave procedural noise displacement
          float noiseA = sin(pos.y * 3.0 + uTime * 6.0) * cos(pos.x * 3.0 + uTime * 4.0);
          float noiseB = cos(pos.z * 4.0 + uTime * 5.0) * sin(pos.y * 4.0 + uTime * 7.0);
          float displacement = (noiseA + noiseB * 0.5) * (0.12 + uChakraIntensity * 0.25);

          pos += normal * displacement * uProgress;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vViewPosition = -mvPosition.xyz;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float NdotV = max(0.0, dot(normal, viewDir));
          float fresnel = pow(1.0 - NdotV, 3.0);

          float wave = sin(uTime * 8.0 + normal.y * 6.0) * 0.5 + 0.5;
          vec3 auraColor = mix(uColorA, uColorB, wave);
          auraColor = mix(auraColor, uColorC, fresnel * 0.8);

          float alpha = fresnel * (0.1 + uProgress * 0.45 + uChakraIntensity * 0.35);

          gl_FragColor = vec4(auraColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 1.0;
    return { mesh, material: mat };
  }
}
