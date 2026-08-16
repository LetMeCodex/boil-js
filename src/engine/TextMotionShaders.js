import * as THREE from 'three';

/**
 * ============================================================================
 * TEXT MOTION GLSL SHADERS
 * ============================================================================
 */

export const createTextMotionMaterial = (isDark = false) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uProgress: { value: 0.0 },
      uTime: { value: 0.0 },
      uScrollVelocity: { value: 0.0 },
      uMouse: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0.0 },
      uSvgMode: { value: 0.0 },
      uTurbulence: { value: 1.0 },
      uReducedMotion: { value: 0.0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2.0) },
      uFogColor: { value: new THREE.Color(isDark ? 0x0A0A0C : 0xF7F4EC) },
      uFogDensity: { value: 0.04 }
    },
    vertexShader: `
      uniform float uProgress;
      uniform float uTime;
      uniform float uScrollVelocity;
      uniform vec3 uMouse;
      uniform float uMouseActive;
      uniform float uSvgMode;
      uniform float uTurbulence;
      uniform float uReducedMotion;
      uniform float uPixelRatio;

      attribute vec3 aP0;
      attribute vec3 aP1;
      attribute vec3 aP2;
      attribute vec3 aP3;
      attribute vec3 aS0;
      attribute float aDelay;
      attribute float aSeed;
      attribute float aScale;
      attribute vec3 aColor;

      varying vec3 vColor;
      varying float vAlpha;
      varying float vFogFactor;

      vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
        float oneMinusT = 1.0 - t;
        float oneMinusT2 = oneMinusT * oneMinusT;
        float oneMinusT3 = oneMinusT2 * oneMinusT;
        float t2 = t * t;
        float t3 = t2 * t;

        return oneMinusT3 * p0 +
               3.0 * oneMinusT2 * t * p1 +
               3.0 * oneMinusT * t2 * p2 +
               t3 * p3;
      }

      vec3 curlNoise(vec3 p, float time) {
        float x = sin(p.y * 1.8 + time * 0.8 + aSeed * 6.28) * cos(p.z * 1.5);
        float y = cos(p.z * 1.8 + time * 0.7 + aSeed * 3.14) * sin(p.x * 1.5);
        float z = sin(p.x * 1.8 + time * 0.9 + aSeed * 9.42) * cos(p.y * 1.5);
        return vec3(x, y, z);
      }

      void main() {
        vColor = aColor;

        if (uReducedMotion > 0.5) {
          vec3 target = mix(aP0, aP3, uProgress);
          vec4 mvPos = modelViewMatrix * vec4(target, 1.0);
          gl_Position = projectionMatrix * mvPos;
          gl_PointSize = 4.0 * uPixelRatio * (10.0 / -mvPos.z);
          vAlpha = 1.0;
          vFogFactor = 1.0;
          return;
        }

        float startT = aDelay;
        float endT = clamp(aDelay + 0.55, 0.45, 0.98);
        float localT = clamp((uProgress - startT) / (endT - startT), 0.0, 1.0);
        float easedT = smoothstep(0.0, 1.0, localT);

        vec3 finalP3 = mix(aP3, aS0, uSvgMode);
        vec3 pos = cubicBezier(aP0, aP1, aP2, finalP3, easedT);

        if (uProgress < 0.15) {
          float breathFactor = 1.0 - (uProgress / 0.15);
          pos.y += sin(uTime * 1.8 + aP0.x * 1.5) * 0.02 * breathFactor;
          pos.z += cos(uTime * 1.5 + aP0.y * 1.5) * 0.02 * breathFactor;
        } else if (uProgress > 0.88) {
          float breathFactor = (uProgress - 0.88) / 0.12;
          pos.y += sin(uTime * 1.8 + aP3.x * 1.5) * 0.02 * breathFactor;
          pos.z += cos(uTime * 1.5 + aP3.y * 1.5) * 0.02 * breathFactor;
        }

        float midFlightFactor = sin(easedT * 3.14159);
        if (midFlightFactor > 0.01) {
          float velocityAmp = 1.0 + clamp(abs(uScrollVelocity) * 3.5, 0.0, 4.0);
          vec3 turbulence = curlNoise(pos * 0.5, uTime * 0.7) * 0.85 * midFlightFactor * velocityAmp * uTurbulence;
          pos += turbulence;
        }

        if (uMouseActive > 0.5) {
          vec3 toMouse = pos - uMouse;
          float dist = length(toMouse);
          float radius = 2.4;
          if (dist < radius && dist > 0.01) {
            float force = (1.0 - dist / radius) * 0.8;
            pos += normalize(toMouse) * force;
          }
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float depthDist = -mvPosition.z;
        float baseSize = 4.5 * aScale;
        baseSize += midFlightFactor * 2.0 + clamp(abs(uScrollVelocity) * 1.5, 0.0, 3.0);
        
        gl_PointSize = baseSize * uPixelRatio * (8.5 / max(0.5, depthDist));
        gl_PointSize = clamp(gl_PointSize, 1.5, 32.0);

        vAlpha = clamp(1.0 - (depthDist - 12.0) / 8.0, 0.2, 1.0);
        vFogFactor = exp(-pow(depthDist * 0.045, 2.0));
      }
    `,
    fragmentShader: `
      uniform vec3 uFogColor;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vFogFactor;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) {
          discard;
        }

        float softEdge = smoothstep(0.5, 0.15, dist);
        float core = smoothstep(0.2, 0.0, dist) * 0.35;
        vec3 finalColor = vColor + vec3(core);

        finalColor = mix(uFogColor, finalColor, vFogFactor);

        gl_FragColor = vec4(finalColor, softEdge * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
};
