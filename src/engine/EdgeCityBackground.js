import * as THREE from 'three';
import anime from 'animejs';

/**
 * ============================================================================
 * EDGE CITY 3D LIVING BACKGROUND & TOPOLOGICAL CITYSCAPE ENGINE
 * Inspired by Edge City ("Hello Friends" / posts.design)
 * ============================================================================
 * Undulating isometric voxel micro-city, topological wave terrain,
 * floating kinetic orbs, laser circuit lines, and ambient 3D coordinates.
 */

export class EdgeCityBackground {
  constructor(containerElement) {
    this.container = containerElement || document.body;
    this.enabled = true;
    this.mode = 'parchment'; // 'parchment' | 'sunset' | 'dark'
    this.waveSpeed = 0.8;
    this.waveAmp = 1.4;
    this.interactiveRipples = [];

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollProgress = 0;

    this.initWebGL();
    this.buildCityscape();
    this.buildCircuitLines();
    this.buildKineticOrbs();
    this.bindEvents();
    this.startRenderLoop();
  }

  initWebGL() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'edgecity-bg-canvas';
    this.canvas.style.position = 'fixed';
    this.canvas.style.inset = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none'; // Background layer
    this.canvas.style.zIndex = '0'; // Sits behind content
    this.canvas.style.opacity = '0.75';
    this.canvas.style.transition = 'opacity 0.5s ease';

    // Insert at beginning of body
    document.body.insertBefore(this.canvas, document.body.firstChild);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.scene.background = new THREE.Color(isDark ? 0x0A0A0C : 0xF7F4EC);
    this.scene.fog = new THREE.FogExp2(isDark ? 0x0A0A0C : 0xF7F4EC, 0.025);

    // Isometric-angled Perspective Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(16, 22, 24);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 3-Point Lighting Balance
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
    this.dirLight = new THREE.DirectionalLight(0xF59E0B, 1.8);
    this.dirLight.position.set(20, 35, 20);
    this.rimLight = new THREE.DirectionalLight(0x0284C7, 0.9);
    this.rimLight.position.set(-20, -10, -20);
    this.scene.add(this.ambientLight, this.dirLight, this.rimLight);
  }

  buildCityscape() {
    // 36 x 36 Instanced Mesh of Architectural Voxel Towers
    this.gridSize = 36;
    this.totalBlocks = this.gridSize * this.gridSize;
    const spacing = 1.1;

    const blockGeo = new THREE.BoxGeometry(0.85, 4.0, 0.85);
    // Shift geometry origin so box scales upward from base
    blockGeo.translate(0, 2.0, 0);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    this.blockMat = new THREE.MeshLambertMaterial({
      color: isDark ? 0x1E2430 : 0xEFEBE0,
      wireframe: false
    });

    this.instancedCity = new THREE.InstancedMesh(blockGeo, this.blockMat, this.totalBlocks);
    this.instancedCity.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.dummy = new THREE.Object3D();
    this.blockPositions = [];

    const offset = (this.gridSize * spacing) / 2;

    let idx = 0;
    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const posX = x * spacing - offset;
        const posZ = z * spacing - offset;
        this.blockPositions.push({ x: posX, z: posZ, baseScale: 0.4 + Math.random() * 0.6 });

        this.dummy.position.set(posX, 0, posZ);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedCity.setMatrixAt(idx++, this.dummy.matrix);
      }
    }

    this.instancedCity.instanceMatrix.needsUpdate = true;
    this.scene.add(this.instancedCity);
  }

  buildCircuitLines() {
    // Glowing interconnected laser lines on key topological ridges
    const lineCount = 8;
    this.circuitLines = [];

    const lineMat = new THREE.LineBasicMaterial({
      color: 0xD97706,
      transparent: true,
      opacity: 0.65
    });

    for (let l = 0; l < lineCount; l++) {
      const points = [];
      const segs = 14;
      const startX = (Math.random() - 0.5) * 20;
      const startZ = (Math.random() - 0.5) * 20;

      for (let s = 0; s < segs; s++) {
        points.push(new THREE.Vector3(startX + s * 1.5, 0, startZ + Math.sin(s) * 3));
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      this.scene.add(line);
      this.circuitLines.push({ line, points, basePoints: points.map(p => p.clone()) });
    }
  }

  buildKineticOrbs() {
    // Floating Courier Orbs navigating the topological landscape
    this.orbs = [];
    const orbCount = 12;

    const orbGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });

    for (let i = 0; i < orbCount; i++) {
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      const angle = (i / orbCount) * Math.PI * 2;
      const radius = 6 + (i % 3) * 4;

      this.scene.add(mesh);
      this.orbs.push({
        mesh,
        angle,
        radius,
        speed: 0.008 + (i % 3) * 0.005,
        heightOffset: 2.5 + (i % 4) * 0.8
      });
    }
  }

  addRipple(worldX, worldZ) {
    this.interactiveRipples.push({
      x: worldX,
      z: worldZ,
      radius: 0.1,
      maxRadius: 18.0,
      strength: 2.2,
      alpha: 1.0
    });
  }

  setTheme(theme) {
    const isDark = theme === 'dark';
    const bgCol = isDark ? 0x0A0A0C : 0xF7F4EC;
    this.scene.background.set(bgCol);
    this.scene.fog.color.set(bgCol);
    this.blockMat.color.set(isDark ? 0x1E2430 : 0xEFEBE0);
    this.dirLight.color.set(isDark ? 0x60A5FA : 0xF59E0B);
  }

  bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    // Mouse Parallax
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Scroll Integration
    window.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    });

    // Interactive Click Ripple
    window.addEventListener('click', (e) => {
      const worldX = (e.clientX / window.innerWidth - 0.5) * 24;
      const worldZ = (e.clientY / window.innerHeight - 0.5) * 24;
      this.addRipple(worldX, worldZ);
    });
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const time = timestamp * 0.001 * this.waveSpeed;

      // 1. Smooth Camera Parallax & Scroll Flyover
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

      const baseCamX = 16 + this.mouse.x * 4;
      const baseCamY = 22 + this.mouse.y * 3 - this.scrollProgress * 6;
      const baseCamZ = 24 + this.mouse.x * 3 + this.scrollProgress * 4;

      this.camera.position.set(baseCamX, baseCamY, baseCamZ);
      this.camera.lookAt(0, 0, 0);

      // 2. Update Topological Wave Elevations for City Blocks
      let idx = 0;
      for (let i = 0; i < this.totalBlocks; i++) {
        const bp = this.blockPositions[i];

        // Multi-octave wave equation
        let elevation = (
          Math.sin(bp.x * 0.18 + time * 1.2) * Math.cos(bp.z * 0.18 + time * 1.0) * 1.5 +
          Math.sin((bp.x + bp.z) * 0.1 + time * 0.8) * 0.9 +
          Math.cos(Math.hypot(bp.x, bp.z) * 0.25 - time * 1.5) * 0.7
        ) * this.waveAmp;

        // Apply interactive ripples
        for (let r = 0; r < this.interactiveRipples.length; r++) {
          const rip = this.interactiveRipples[r];
          const dist = Math.hypot(bp.x - rip.x, bp.z - rip.z);
          const ripWave = Math.sin((dist - rip.radius) * 1.5) * rip.strength * rip.alpha;
          if (Math.abs(dist - rip.radius) < 4.0) {
            elevation += ripWave;
          }
        }

        const scaleY = Math.max(0.15, (elevation + 3.0) * bp.baseScale);

        this.dummy.position.set(bp.x, 0, bp.z);
        this.dummy.scale.set(1, scaleY, 1);
        this.dummy.updateMatrix();
        this.instancedCity.setMatrixAt(idx++, this.dummy.matrix);
      }
      this.instancedCity.instanceMatrix.needsUpdate = true;

      // 3. Update Interactive Ripples
      for (let r = this.interactiveRipples.length - 1; r >= 0; r--) {
        const rip = this.interactiveRipples[r];
        rip.radius += 0.35;
        rip.alpha -= 0.015;
        if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
          this.interactiveRipples.splice(r, 1);
        }
      }

      // 4. Update Kinetic Orbs along Orbits
      for (let o = 0; o < this.orbs.length; o++) {
        const orb = this.orbs[o];
        orb.angle += orb.speed;
        const ox = Math.cos(orb.angle) * orb.radius;
        const oz = Math.sin(orb.angle) * orb.radius;

        // Calculate height above terrain
        const terrainH = Math.sin(ox * 0.18 + time) * Math.cos(oz * 0.18 + time) * 2.0;
        orb.mesh.position.set(ox, terrainH + orb.heightOffset, oz);
      }

      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer) {
      this.renderer.dispose();
      if (this.canvas && this.canvas.parentElement) {
        this.canvas.parentElement.removeChild(this.canvas);
      }
    }
  }
}
