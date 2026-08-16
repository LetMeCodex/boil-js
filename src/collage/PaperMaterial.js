import * as THREE from 'three';

/**
 * ============================================================================
 * PAPER MATERIAL (Custom Procedural Paper Grain & Fiber Shader)
 * ============================================================================
 * Generates subtle tactile paper grain, fiber noise, micro-contrast,
 * and printed editorial ink textures.
 */

export const createPaperMaterial = (colorHex, options = {}) => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const grainStrength = options.grainStrength !== undefined ? options.grainStrength : 0.055;
  const opacity = options.opacity !== undefined ? options.opacity : 1.0;

  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uGrainStrength: { value: grainStrength },
      uTime: { value: 0.0 },
      uOpacity: { value: opacity },
      uPaperTint: { value: new THREE.Color(isDark ? 0x14171D : 0xF7F4EC) }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uGrainStrength;
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uPaperTint;

      varying vec2 vUv;
      varying vec3 vPosition;

      // Fast procedural hash noise for fine paper fiber texture
      float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float paperNoise(vec2 uv) {
        vec2 p = uv * 380.0;
        float n1 = hash(p);
        float n2 = hash(p * 2.1 + vec2(12.3, 45.6));
        float n3 = hash(p * 0.5 + vec2(78.9, 10.1));
        return (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) - 0.5;
      }

      void main() {
        vec3 baseColor = uColor;

        // Add subtle paper grain & fiber variation
        float grain = paperNoise(vUv);
        
        // Micro tonal modulation
        vec3 finalColor = baseColor + vec3(grain * uGrainStrength);

        // Soft printed paper tint blend
        finalColor = mix(finalColor, uPaperTint, 0.04);

        gl_FragColor = vec4(finalColor, uOpacity);
      }
    `,
    transparent: opacity < 1.0,
    depthWrite: true,
    side: THREE.DoubleSide
  });
};
