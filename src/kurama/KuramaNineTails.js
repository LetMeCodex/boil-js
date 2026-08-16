import * as THREE from 'three';

/**
 * ============================================================================
 * KURAMA NINE TAILS ENGINE
 * ============================================================================
 * 9 dynamic Catmull-Rom spline tails with procedural noise displacement,
 * secondary harmonic motion, and staggered growth activation.
 */

export class KuramaNineTails {
  constructor() {
    this.group = new THREE.Group();
    this.tails = [];
    this.tailCount = 9;

    this.tailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uChakraIntensity: { value: 0.0 },
        uChakraOrange: { value: new THREE.Color(0xEA580C) },
        uChakraCrimson: { value: new THREE.Color(0xDC2626) },
        uChakraGold: { value: new THREE.Color(0xF59E0B) }
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;
        uniform vec3 uChakraOrange;
        uniform vec3 uChakraCrimson;
        uniform vec3 uChakraGold;

        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          float NdotV = max(0.0, dot(normal, viewDir));
          float rim = pow(1.0 - NdotV, 2.5);

          // Flowing energy waves moving along the tail length (UV.x)
          float wave = sin(vUv.x * 16.0 - uTime * 6.0) * 0.5 + 0.5;
          float core = smoothstep(0.0, 0.4, vUv.y) * smoothstep(1.0, 0.6, vUv.y);

          vec3 color = mix(uChakraCrimson, uChakraOrange, vUv.x);
          color = mix(color, uChakraGold, wave * 0.6 + rim * 0.7);

          // Tip and edge transparency
          float alpha = smoothstep(0.0, 0.08, vUv.x) * (0.85 + rim * 0.3);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.initTails();
  }

  initTails() {
    // Fan angles across 180 degrees behind character
    for (let i = 0; i < this.tailCount; i++) {
      const angle = (i - (this.tailCount - 1) / 2) * 0.28; // -1.12 to +1.12 radians
      const elevation = Math.sin((i / (this.tailCount - 1)) * Math.PI) * 0.4 + 0.2;

      // Staggered appearance threshold (0.52 to 0.82)
      const activationThreshold = 0.52 + (i / this.tailCount) * 0.28;

      const controlPoints = [
        new THREE.Vector3(0, 0.4, -0.2), // Root
        new THREE.Vector3(Math.sin(angle) * 1.0, 0.8 + elevation, -0.8),
        new THREE.Vector3(Math.sin(angle) * 2.2, 1.6 + elevation * 1.5, -1.8),
        new THREE.Vector3(Math.sin(angle) * 3.4, 2.4 + elevation * 2.0, -2.6),
        new THREE.Vector3(Math.sin(angle) * 4.2, 3.2 + elevation * 1.8, -3.2)  // Tip
      ];

      this.tails.push({
        index: i,
        angle,
        elevation,
        activationThreshold,
        basePoints: controlPoints.map(p => p.clone()),
        currentPoints: controlPoints.map(p => p.clone()),
        mesh: null,
        freq: 1.8 + Math.random() * 0.8,
        phase: (i / this.tailCount) * Math.PI * 2,
        amplitude: 0.35 + Math.random() * 0.25
      });
    }
  }

  update(progress, time, chakraIntensity = 0.0) {
    this.tailMaterial.uniforms.uProgress.value = progress;
    this.tailMaterial.uniforms.uTime.value = time;
    this.tailMaterial.uniforms.uChakraIntensity.value = chakraIntensity;

    this.tails.forEach((tail) => {
      // Determine tail growth scale based on progress & activation threshold
      const localGrowth = Math.max(0, Math.min(1, (progress - tail.activationThreshold) / 0.18));

      if (localGrowth <= 0.01) {
        if (tail.mesh) {
          tail.mesh.visible = false;
        }
        return;
      }

      // Update control points with procedural noise & harmonic oscillation
      const pts = [];
      const ptCount = tail.basePoints.length;

      for (let j = 0; j < ptCount; j++) {
        const base = tail.basePoints[j];
        const segRatio = j / (ptCount - 1);

        // Sinusoidal wave + noise displacement
        const waveX = Math.sin(time * tail.freq + tail.phase + j * 0.8) * tail.amplitude * segRatio;
        const waveY = Math.cos(time * tail.freq * 0.9 + tail.phase + j * 0.6) * tail.amplitude * segRatio;
        const waveZ = Math.sin(time * tail.freq * 1.2 + j * 0.5) * tail.amplitude * 0.8 * segRatio;

        // Scaled outward by growth factor
        const px = base.x * localGrowth + waveX * localGrowth;
        const py = (base.y * localGrowth + waveY * localGrowth) + (chakraIntensity * 0.5 * segRatio);
        const pz = base.z * localGrowth + waveZ * localGrowth;

        pts.push(new THREE.Vector3(px, py, pz));
      }

      // Generate smooth spline curve
      const curve = new THREE.CatmullRomCurve3(pts);
      const segments = 28;
      const radius = 0.16 * localGrowth;

      // Rebuild / update tube geometry
      if (tail.mesh) {
        this.group.remove(tail.mesh);
        if (tail.mesh.geometry) tail.mesh.geometry.dispose();
      }

      const tubeGeo = new THREE.TubeGeometry(curve, segments, radius, 6, false);
      tail.mesh = new THREE.Mesh(tubeGeo, this.tailMaterial);
      tail.mesh.visible = true;
      this.group.add(tail.mesh);
    });
  }

  destroy() {
    this.tails.forEach(tail => {
      if (tail.mesh) {
        this.group.remove(tail.mesh);
        if (tail.mesh.geometry) tail.mesh.geometry.dispose();
      }
    });
    this.tailMaterial.dispose();
  }
}
