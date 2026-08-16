import * as THREE from 'three';
import anime from 'animejs';
import confetti from 'canvas-confetti';
import { SoundFX } from '../engine/AnimeBoilBridge.js';

/**
 * ============================================================================
 * HIGH-PERFORMANCE 3D SKETCH DIMENSION (Three.js WebGL + Custom GLSL Boil Shader)
 * ============================================================================
 * 
 * Hardware-accelerated 60+ FPS 3D rendering with custom procedural cross-hatching,
 * stepped vertex boil jitter, and interactive 3D mechanics.
 */

// Custom GLSL Cross-Hatching & Line Boil Material
const createSketchShaderMaterial = (isDark = false) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLightPos: { value: new THREE.Vector3(5, 8, 5) },
      uInkColor: { value: new THREE.Color(isDark ? 0xF59E0B : 0x1C1917) },
      uPaperColor: { value: new THREE.Color(isDark ? 0x181B21 : 0xFAF8F3) },
      uAccentColor: { value: new THREE.Color(isDark ? 0x10B981 : 0xD97706) },
      uRoughness: { value: 1.8 },
      uBoilFps: { value: 10.0 },
      uHatchDensity: { value: 24.0 },
      uExplode: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uRoughness;
      uniform float uBoilFps;
      uniform float uExplode;
      
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying vec3 vViewPosition;

      // Pseudo-random hash
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      // Stepped noise for 10 FPS authentic hand-drawn boil
      float steppedNoise(vec3 p, float fps) {
        float timeStep = floor(uTime * fps);
        return hash(p + vec3(timeStep * 0.137));
      }

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;

        // Exploded view expansion along face normal
        if (uExplode > 0.0) {
          pos += normal * uExplode * 1.5;
        }

        // Stepped vertex jitter (Line Boil effect on GPU)
        float jitter = (steppedNoise(pos * 2.0, uBoilFps) - 0.5) * 0.045 * uRoughness;
        pos += normal * jitter;

        vec4 worldPos = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPos.xyz;

        vec4 mvPos = viewMatrix * worldPos;
        vViewPosition = -mvPos.xyz;

        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uLightPos;
      uniform vec3 uInkColor;
      uniform vec3 uPaperColor;
      uniform vec3 uAccentColor;
      uniform float uHatchDensity;
      uniform float uTime;
      uniform float uBoilFps;

      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      varying vec3 vViewPosition;

      float hash2(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 L = normalize(uLightPos - vWorldPos);
        vec3 V = normalize(vViewPosition);

        // Diffuse lighting intensity
        float diff = clamp(dot(N, L), 0.0, 1.0);
        
        // Rim / Fresnel highlight
        float fresnel = 1.0 - max(dot(N, V), 0.0);
        fresnel = pow(fresnel, 2.5);

        // Screen-space coordinates for procedural pencil hatching
        vec2 screenPos = gl_FragCoord.xy;
        float timeSeed = floor(uTime * uBoilFps) * 1.73;
        screenPos += vec2(sin(timeSeed), cos(timeSeed)) * 1.5;

        // Diagonal hatch patterns
        float hatch1 = sin((screenPos.x + screenPos.y) * 0.35 * uHatchDensity);
        float hatch2 = sin((screenPos.x - screenPos.y) * 0.35 * uHatchDensity);
        float hatch3 = sin(screenPos.y * 0.5 * uHatchDensity);

        // Multi-tier cel-shading pencil thresholds
        vec3 color = uPaperColor;

        if (diff < 0.75) {
          if (hatch1 > 0.15) color = mix(color, uInkColor, 0.7);
        }
        if (diff < 0.45) {
          if (hatch2 > 0.15) color = mix(color, uInkColor, 0.85);
        }
        if (diff < 0.20) {
          if (hatch3 > 0.0) color = uInkColor;
        }

        // Add subtle accent tint to rim highlights
        if (fresnel > 0.6) {
          color = mix(color, uAccentColor, 0.6);
        }

        // Ink contour silhouette edge detection
        if (dot(N, V) < 0.22) {
          color = uInkColor;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });
};

export class ThreeDScene {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.boilFps = options.boilFps || 10;
    this.renderLoop = null;

    this.activeModel = 'torus'; // 'torus' | 'island' | 'crystal' | 'tesseract' | 'galaxy' | 'dna'
    this.exploded = false;
    this.explodeVal = { factor: 0 };

    this.settings = {
      speed: 1.0,
      roughness: 1.8,
      hatchDensity: 24.0,
      wireframeOnly: false
    };

    this.mouse = {
      isDown: false,
      lastX: 0,
      lastY: 0,
      velX: 0,
      velY: 0
    };

    this.rotations = { x: 0.3, y: 0.4 };
    this.targetRotations = { x: 0.3, y: 0.4 };

    // Performance tracking
    this.fpsData = { lastTime: performance.now(), frames: 0, fps: 60 };

    this.initDOM();
    this.setupWebGL();
    this.buildModel(this.activeModel);
    this.startRenderLoop();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="scene-layout">
        <!-- Canvas Viewport -->
        <div class="canvas-viewport-card">
          <div class="viewport-toolbar">
            <div class="toolbar-title-group">
              <span class="toolbar-title">3D Sketch Dimension</span>
              <span class="toolbar-badge">GPU WebGL 60 FPS + GLSL Line Boil</span>
            </div>
            <div class="toolbar-actions">
              <button id="btn-3d-explode" class="tactile-btn amber">
                <span>💥 Exploded View</span>
              </button>
              <button id="btn-3d-pulse" class="tactile-btn outline">
                <span>⚡ Spring Jump</span>
              </button>
            </div>
          </div>

          <div class="canvas-wrapper" id="threed-canvas-wrap">
            <canvas id="threed-gl-canvas" class="main-stage-canvas"></canvas>
            
            <!-- Real-Time HUD Overlay -->
            <div style="position: absolute; top: 16px; left: 16px; display: flex; gap: 8px; pointer-events: none;">
              <span class="stat-badge pulse-badge" id="threed-fps-badge">⚡ 60 FPS (Hardware)</span>
              <span class="stat-badge">GLSL Cross-Hatch</span>
            </div>

            <div style="position: absolute; bottom: 16px; left: 16px; font-size: 0.75rem; color: var(--text-secondary); background: var(--bg-glass); backdrop-filter: blur(8px); padding: 4px 12px; border-radius: 9999px; pointer-events: none; box-shadow: var(--shadow-sm);">
              🖱️ Drag anywhere to rotate in 3D • Scroll to zoom in/out
            </div>
          </div>
        </div>

        <!-- Controls Panel -->
        <div class="controls-panel">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🧊 3D Worlds & Meshes</span>
            </div>
            <div class="style-pills-grid" id="threed-models-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="style-pill-btn active" data-model="torus">Torus Knot</button>
              <button class="style-pill-btn" data-model="island">Floating Island</button>
              <button class="style-pill-btn" data-model="crystal">Low-Poly Crystal</button>
              <button class="style-pill-btn" data-model="tesseract">4D Tesseract</button>
              <button class="style-pill-btn" data-model="galaxy">3D Star Galaxy</button>
              <button class="style-pill-btn" data-model="dna">DNA Double Helix</button>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎛️ Dynamics & Kinematics</span>
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Rotation Velocity:</span>
                <span id="val-3d-speed" class="control-val">1.0x</span>
              </div>
              <input type="range" id="slider-3d-speed" min="0" max="3" step="0.1" value="1" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Hatching Density:</span>
                <span id="val-3d-density" class="control-val">24</span>
              </div>
              <input type="range" id="slider-3d-density" min="10" max="60" step="2" value="24" class="custom-range">
            </div>
            <div class="control-group">
              <div class="control-label-row">
                <span>Pencil Roughness:</span>
                <span id="val-3d-roughness" class="control-val">1.8</span>
              </div>
              <input type="range" id="slider-3d-roughness" min="0.2" max="4.0" step="0.2" value="1.8" class="custom-range">
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">🎨 Visual FX</span>
            </div>
            <div class="style-pills-grid" style="grid-template-columns: 1fr 1fr;">
              <button class="tactile-btn outline" id="btn-toggle-wire">Wireframe Overlay</button>
              <button class="tactile-btn outline" id="btn-toggle-invert">Invert Accents</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  setupWebGL() {
    this.canvas = document.getElementById('threed-gl-canvas');
    const wrap = document.getElementById('threed-canvas-wrap');
    const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 500 };

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // 1. WebGL Renderer with capped DPR for 60+ FPS
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(rect.width, rect.height);

    // 2. Scene & Perspective Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, rect.width / rect.height, 0.1, 100);
    this.camera.position.set(0, 0, 7.5);

    // 3. Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(5, 10, 7);
    this.scene.add(this.ambientLight);
    this.scene.add(this.dirLight);

    // 4. Main Mesh Container Group
    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    // 5. Shader Material
    this.sketchMaterial = createSketchShaderMaterial(isDark);
    this.wireMaterial = new THREE.MeshBasicMaterial({
      color: isDark ? 0xF59E0B : 0x1C1917,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });

    // Resize Handler
    this.resizeHandler = () => {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(r.width, r.height);
    };
    window.addEventListener('resize', this.resizeHandler);

    this.setupInteractions();
  }

  setupInteractions() {
    // Mouse Drag Rotation
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.isDown = true;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
      SoundFX.playPop(440);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.mouse.isDown) return;
      const dx = e.clientX - this.mouse.lastX;
      const dy = e.clientY - this.mouse.lastY;

      this.targetRotations.y += dx * 0.007;
      this.targetRotations.x += dy * 0.007;

      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });

    // Wheel Zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camera.position.z = Math.max(3.5, Math.min(15, this.camera.position.z + e.deltaY * 0.005));
    }, { passive: false });
  }

  buildModel(type) {
    this.activeModel = type;
    this.customAnimObjects = [];

    // Clear previous meshes cleanly
    while (this.meshGroup.children.length > 0) {
      const obj = this.meshGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.meshGroup.remove(obj);
    }

    if (type === 'torus') {
      // 1. Torus Knot
      const geom = new THREE.TorusKnotGeometry(1.6, 0.48, 80, 16, 2, 3);
      const mesh = new THREE.Mesh(geom, this.sketchMaterial);
      const wire = new THREE.Mesh(geom, this.wireMaterial);
      this.meshGroup.add(mesh, wire);
    } else if (type === 'island') {
      // 2. Floating Low-Poly Sketch Island
      this.buildFloatingIsland();
    } else if (type === 'crystal') {
      // 3. Low-Poly Floating Crystal Cluster
      this.buildCrystalCluster();
    } else if (type === 'tesseract') {
      // 4. 4D Hypercube Tesseract Wireframe
      this.buildTesseract();
    } else if (type === 'galaxy') {
      // 5. 3D Boiling Star Galaxy Swarm
      this.buildGalaxy();
    } else if (type === 'dna') {
      // 6. DNA Double Helix
      this.buildDnaHelix();
    }
  }

  buildFloatingIsland() {
    // Rock Base (Inverted Cone)
    const baseGeom = new THREE.ConeGeometry(2.4, 2.2, 7);
    baseGeom.rotateX(Math.PI);
    const baseMesh = new THREE.Mesh(baseGeom, this.sketchMaterial);
    baseMesh.position.y = -0.6;
    this.meshGroup.add(baseMesh);

    // Island Top Grass (Cylinder)
    const topGeom = new THREE.CylinderGeometry(2.4, 2.2, 0.4, 7);
    const topMesh = new THREE.Mesh(topGeom, this.sketchMaterial);
    topMesh.position.y = 0.5;
    this.meshGroup.add(topMesh);

    // Sketch Tree Trunk & Foliage
    const trunkGeom = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 5);
    const trunkMesh = new THREE.Mesh(trunkGeom, this.sketchMaterial);
    trunkMesh.position.set(-0.4, 1.2, 0.3);
    trunkMesh.rotation.z = -0.1;
    this.meshGroup.add(trunkMesh);

    const foliageGeom = new THREE.DodecahedronGeometry(0.7, 0);
    const foliageMesh = new THREE.Mesh(foliageGeom, this.sketchMaterial);
    foliageMesh.position.set(-0.5, 1.9, 0.3);
    this.meshGroup.add(foliageMesh);

    // Floating Orbiting Sketch Gem
    const gemGeom = new THREE.OctahedronGeometry(0.4, 0);
    const gemMesh = new THREE.Mesh(gemGeom, this.sketchMaterial);
    gemMesh.position.set(1.2, 1.5, -0.4);
    this.meshGroup.add(gemMesh);

    this.customAnimObjects.push({
      update: (time) => {
        gemMesh.position.y = 1.4 + Math.sin(time * 3) * 0.15;
        gemMesh.rotation.y += 0.02;
        gemMesh.rotation.x += 0.01;
      }
    });
  }

  buildCrystalCluster() {
    const cluster = new THREE.Group();
    const count = 7;

    for (let i = 0; i < count; i++) {
      const height = 1.5 + Math.random() * 1.8;
      const radius = 0.35 + Math.random() * 0.25;
      const geom = new THREE.ConeGeometry(radius, height, 5);
      const mesh = new THREE.Mesh(geom, this.sketchMaterial);

      const angle = (i / count) * Math.PI * 2;
      const dist = 0.6 + Math.random() * 0.4;
      mesh.position.set(Math.cos(angle) * dist, height / 2 - 1, Math.sin(angle) * dist);
      mesh.rotation.x = (Math.random() - 0.5) * 0.4;
      mesh.rotation.z = (Math.random() - 0.5) * 0.4;

      cluster.add(mesh);
    }
    this.meshGroup.add(cluster);
  }

  buildTesseract() {
    // 4D Wireframe Matrix
    const group = new THREE.Group();

    // Outer Cube
    const outerGeom = new THREE.BoxGeometry(3, 3, 3);
    const outerWire = new THREE.Mesh(outerGeom, this.sketchMaterial);
    group.add(outerWire);

    // Inner Cube
    const innerGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const innerWire = new THREE.Mesh(innerGeom, this.sketchMaterial);
    group.add(innerWire);

    // Connecting struts
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xF59E0B,
      linewidth: 2
    });

    const corners = [
      [1.5, 1.5, 1.5], [1.5, 1.5, -1.5], [1.5, -1.5, 1.5], [1.5, -1.5, -1.5],
      [-1.5, 1.5, 1.5], [-1.5, 1.5, -1.5], [-1.5, -1.5, 1.5], [-1.5, -1.5, -1.5]
    ];

    corners.forEach(c => {
      const pts = [
        new THREE.Vector3(c[0], c[1], c[2]),
        new THREE.Vector3(c[0] * 0.5, c[1] * 0.5, c[2] * 0.5)
      ];
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const l = new THREE.Line(g, lineMat);
      group.add(l);
    });

    this.meshGroup.add(group);

    this.customAnimObjects.push({
      update: (time) => {
        innerWire.rotation.x = time * 0.8;
        innerWire.rotation.y = time * 0.6;
      }
    });
  }

  buildGalaxy() {
    // 400 3D Star Particles
    const starCount = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const c1 = new THREE.Color(0xF59E0B);
    const c2 = new THREE.Color(0x10B981);
    const c3 = new THREE.Color(0x38BDF8);

    for (let i = 0; i < starCount; i++) {
      const r = 0.5 + Math.pow(Math.random(), 0.5) * 3.5;
      const theta = Math.random() * Math.PI * 2 * 3; // Spiral arms
      const armOffset = (i % 3) * (Math.PI * 2 / 3);
      const spiralAngle = theta + armOffset;

      const x = Math.cos(spiralAngle) * r;
      const y = (Math.random() - 0.5) * 0.6 * (1 / (r + 0.2));
      const z = Math.sin(spiralAngle) * r;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixed = (i % 3 === 0) ? c1 : (i % 3 === 1 ? c2 : c3);
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    const points = new THREE.Points(geom, pMat);
    this.meshGroup.add(points);

    // Center glowing core
    const coreGeom = new THREE.IcosahedronGeometry(0.4, 0);
    const coreMesh = new THREE.Mesh(coreGeom, this.sketchMaterial);
    this.meshGroup.add(coreMesh);

    this.customAnimObjects.push({
      update: (time) => {
        points.rotation.y = time * 0.3;
      }
    });
  }

  buildDnaHelix() {
    const group = new THREE.Group();
    const steps = 24;
    const r = 1.3;

    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 4;
      const y = (i - steps / 2) * 0.24;

      // Strand 1 node
      const n1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), this.sketchMaterial);
      n1.position.set(Math.cos(t) * r, y, Math.sin(t) * r);
      group.add(n1);

      // Strand 2 node
      const n2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), this.sketchMaterial);
      n2.position.set(Math.cos(t + Math.PI) * r, y, Math.sin(t + Math.PI) * r);
      group.add(n2);

      // Base pair bridge
      const bridgeGeom = new THREE.CylinderGeometry(0.04, 0.04, r * 2, 4);
      bridgeGeom.rotateZ(Math.PI / 2);
      bridgeGeom.rotateY(-t);
      const bridge = new THREE.Mesh(bridgeGeom, this.sketchMaterial);
      bridge.position.set(0, y, 0);
      group.add(bridge);
    }

    this.meshGroup.add(group);
  }

  triggerExplode() {
    this.exploded = !this.exploded;
    SoundFX.playPop(580);
    const btn = document.getElementById('btn-3d-explode');
    if (btn) btn.classList.toggle('active', this.exploded);

    anime({
      targets: this.explodeVal,
      factor: this.exploded ? 1.0 : 0.0,
      duration: 1100,
      easing: 'easeOutElastic(1, .5)',
      update: () => {
        this.sketchMaterial.uniforms.uExplode.value = this.explodeVal.factor;
      }
    });
  }

  triggerPulse() {
    SoundFX.playPop(660);
    confetti({ particleCount: 30, spread: 50 });

    anime.timeline()
      .add({
        targets: this.meshGroup.scale,
        x: 1.35,
        y: 1.35,
        z: 1.35,
        duration: 220,
        easing: 'easeOutQuad'
      })
      .add({
        targets: this.meshGroup.scale,
        x: 1,
        y: 1,
        z: 1,
        duration: 600,
        easing: 'easeOutElastic(1, .4)'
      });
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      // 1. Performance FPS Monitor
      this.fpsData.frames++;
      if (timestamp - this.fpsData.lastTime >= 1000) {
        this.fpsData.fps = this.fpsData.frames;
        this.fpsData.frames = 0;
        this.fpsData.lastTime = timestamp;
        const badge = document.getElementById('threed-fps-badge');
        if (badge) badge.textContent = `⚡ ${this.fpsData.fps} FPS (Hardware)`;
      }

      // 2. Smooth Lerp Orbit Rotation
      this.rotations.x += (this.targetRotations.x - this.rotations.x) * 0.12;
      this.rotations.y += (this.targetRotations.y - this.rotations.y) * 0.12;

      // Auto rotation drift
      this.targetRotations.y += 0.005 * this.settings.speed;
      this.targetRotations.x += 0.002 * this.settings.speed;

      this.meshGroup.rotation.x = this.rotations.x;
      this.meshGroup.rotation.y = this.rotations.y;

      // 3. Update Shader Uniforms
      const timeInSec = timestamp * 0.001;
      this.sketchMaterial.uniforms.uTime.value = timeInSec;
      this.sketchMaterial.uniforms.uBoilFps.value = this.boilFps;

      // Update custom scene animations
      for (let i = 0; i < this.customAnimObjects.length; i++) {
        this.customAnimObjects[i].update(timeInSec);
      }

      // 4. Render GPU Frame
      this.renderer.render(this.scene, this.camera);

      this.renderLoop = requestAnimationFrame(loop);
    };
    this.renderLoop = requestAnimationFrame(loop);
  }

  setBoilFps(fps) {
    this.boilFps = fps;
    if (this.sketchMaterial) {
      this.sketchMaterial.uniforms.uBoilFps.value = fps;
    }
  }

  bindEvents() {
    document.getElementById('btn-3d-explode')?.addEventListener('click', () => this.triggerExplode());
    document.getElementById('btn-3d-pulse')?.addEventListener('click', () => this.triggerPulse());

    // Models Selector
    const modelsGrid = document.getElementById('threed-models-grid');
    if (modelsGrid) {
      modelsGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.style-pill-btn');
        if (!btn) return;
        modelsGrid.querySelectorAll('.style-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const model = btn.getAttribute('data-model');
        this.buildModel(model);
        SoundFX.playPop(520);
      });
    }

    // Sliders
    document.getElementById('slider-3d-speed')?.addEventListener('input', (e) => {
      this.settings.speed = parseFloat(e.target.value);
      document.getElementById('val-3d-speed').textContent = `${this.settings.speed.toFixed(1)}x`;
    });

    document.getElementById('slider-3d-density')?.addEventListener('input', (e) => {
      this.settings.hatchDensity = parseFloat(e.target.value);
      this.sketchMaterial.uniforms.uHatchDensity.value = this.settings.hatchDensity;
      document.getElementById('val-3d-density').textContent = Math.round(this.settings.hatchDensity);
    });

    document.getElementById('slider-3d-roughness')?.addEventListener('input', (e) => {
      this.settings.roughness = parseFloat(e.target.value);
      this.sketchMaterial.uniforms.uRoughness.value = this.settings.roughness;
      document.getElementById('val-3d-roughness').textContent = this.settings.roughness.toFixed(1);
    });

    // Wireframe toggle
    document.getElementById('btn-toggle-wire')?.addEventListener('click', () => {
      this.settings.wireframeOnly = !this.settings.wireframeOnly;
      this.sketchMaterial.wireframe = this.settings.wireframeOnly;
      SoundFX.playPop(480);
    });

    // Invert accents
    document.getElementById('btn-toggle-invert')?.addEventListener('click', () => {
      const cur = this.sketchMaterial.uniforms.uAccentColor.value;
      this.sketchMaterial.uniforms.uAccentColor.value = new THREE.Color(
        cur.r === 0.05 ? 0xD97706 : 0x059669
      );
      SoundFX.playPop(550);
    });
  }

  suspend() {
    if (this.renderLoop) {
      cancelAnimationFrame(this.renderLoop);
      this.renderLoop = null;
    }
  }

  resume() {
    if (!this.renderLoop) {
      this.startRenderLoop();
    }
  }

  destroy() {
    this.suspend();
    window.removeEventListener('resize', this.resizeHandler);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
