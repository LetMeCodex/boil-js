import * as THREE from 'three';

/**
 * ============================================================================
 * KURAMA AVATAR GEOMETRY & CHAKRA SHADER
 * ============================================================================
 * Procedural stylized faceted humanoid / fox-avatar creature.
 */

export class KuramaAvatarGeometry {
  static createAvatarMesh() {
    const group = new THREE.Group();

    // 1. Faceted Avatar Material with Dynamic Chakra Glow & Rim Lighting
    const avatarMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uChakraIntensity: { value: 0.0 },
        uBaseColor: { value: new THREE.Color(0x121316) },
        uChakraOrange: { value: new THREE.Color(0xEA580C) },
        uChakraCrimson: { value: new THREE.Color(0xDC2626) },
        uChakraGold: { value: new THREE.Color(0xF59E0B) }
      },
      vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          vec3 pos = position;

          // Subtle breathing expansion
          float breath = sin(uTime * 2.2 + position.y * 1.5) * 0.02 * (1.0 + uChakraIntensity * 1.5);
          pos += normal * breath;

          // Forward combat lean at high chakra (Phase 05/06)
          if (uProgress > 0.6) {
            float leanFactor = (uProgress - 0.6) / 0.4;
            pos.z += (pos.y + 1.0) * 0.15 * leanFactor;
          }

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;

          vec4 mvPosition = viewMatrix * worldPos;
          vViewPosition = -mvPosition.xyz;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uChakraIntensity;
        uniform vec3 uBaseColor;
        uniform vec3 uChakraOrange;
        uniform vec3 uChakraCrimson;
        uniform vec3 uChakraGold;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);

          // Fresnel Rim Glow Calculation
          float NdotV = max(0.0, dot(normal, viewDir));
          float rim = pow(1.0 - NdotV, 3.0);

          // Chakra color gradient
          float heightFactor = clamp((vWorldPosition.y + 1.5) / 3.0, 0.0, 1.0);
          vec3 energyColor = mix(uChakraCrimson, uChakraOrange, heightFactor);
          energyColor = mix(energyColor, uChakraGold, rim * 0.8);

          // Stepped / Faceted stylized shading
          float light = dot(normal, normalize(vec3(0.5, 1.0, 0.8)));
          float steppedLight = smoothstep(-0.2, 0.8, light) * 0.6 + 0.4;

          // Base silhouette blends into blazing chakra avatar
          float glowAmount = clamp(uProgress * 1.4 + uChakraIntensity * 0.8, 0.0, 1.0);
          vec3 finalColor = mix(uBaseColor * steppedLight, energyColor, glowAmount * 0.85);

          // Intense rim glow
          finalColor += energyColor * rim * glowAmount * 1.8;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      transparent: false
    });

    // 2. Torso (Faceted Inverted Hexagonal Prism)
    const torsoGeo = new THREE.CylinderGeometry(0.7, 0.45, 1.8, 6);
    torsoGeo.computeVertexNormals();
    const torso = new THREE.Mesh(torsoGeo, avatarMaterial);
    torso.position.y = 0.9;
    group.add(torso);

    // 3. Chest Core Emitter (Glowing Octahedron)
    const coreGeo = new THREE.OctahedronGeometry(0.24, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 1.2, 0.4);
    group.add(core);

    // 4. Stylized Head (Angular Faceted Fox Form)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.1, 0.1);

    // Main cranium
    const headGeo = new THREE.DodecahedronGeometry(0.52, 0);
    const head = new THREE.Mesh(headGeo, avatarMaterial);
    headGroup.add(head);

    // Angular Snout
    const snoutGeo = new THREE.ConeGeometry(0.25, 0.65, 4);
    snoutGeo.rotateX(Math.PI * 0.5);
    const snout = new THREE.Mesh(snoutGeo, avatarMaterial);
    snout.position.set(0, -0.08, 0.55);
    headGroup.add(snout);

    // Sharp Fox Ears (Left & Right)
    const earGeo = new THREE.ConeGeometry(0.22, 0.75, 4);
    earGeo.rotateZ(0.2);

    const leftEar = new THREE.Mesh(earGeo, avatarMaterial);
    leftEar.position.set(-0.35, 0.65, -0.05);
    leftEar.rotation.set(-0.2, 0, -0.3);

    const rightEar = new THREE.Mesh(earGeo, avatarMaterial);
    rightEar.position.set(0.35, 0.65, -0.05);
    rightEar.rotation.set(-0.2, 0, 0.3);

    headGroup.add(leftEar, rightEar);

    // Glowing Fox Eyes
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.04, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 0.05, 0.42);
    leftEye.rotation.set(0.1, 0.2, -0.2);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 0.05, 0.42);
    rightEye.rotation.set(0.1, -0.2, 0.2);

    headGroup.add(leftEye, rightEye);
    group.add(headGroup);

    // 5. Limbs (Arms & Legs with Angular Joints)
    // Left Arm
    const armGeo = new THREE.CylinderGeometry(0.16, 0.12, 1.3, 5);
    const leftArm = new THREE.Mesh(armGeo, avatarMaterial);
    leftArm.position.set(-0.85, 0.8, 0);
    leftArm.rotation.z = 0.45;

    // Right Arm
    const rightArm = new THREE.Mesh(armGeo, avatarMaterial);
    rightArm.position.set(0.85, 0.8, 0);
    rightArm.rotation.z = -0.45;

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.22, 0.15, 1.5, 5);
    const leftLeg = new THREE.Mesh(legGeo, avatarMaterial);
    leftLeg.position.set(-0.4, -0.65, 0);

    const rightLeg = new THREE.Mesh(legGeo, avatarMaterial);
    rightLeg.position.set(0.4, -0.65, 0);

    group.add(leftArm, rightArm, leftLeg, rightLeg);

    return {
      group,
      avatarMaterial,
      core,
      headGroup,
      leftEye,
      rightEye
    };
  }
}
