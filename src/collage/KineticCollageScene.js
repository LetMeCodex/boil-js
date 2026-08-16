import * as THREE from 'three';
import { createPaperMaterial } from './PaperMaterial.js';
import { MountainSystem } from './MountainSystem.js';
import { CloudSystem } from './CloudSystem.js';
import { SunSystem } from './SunSystem.js';
import { ParallaxController } from './ParallaxController.js';
import { AnnotationSystem } from './AnnotationSystem.js';

/**
 * ============================================================================
 * KINETIC COLLAGE SCENE (Interactive Paper-Collage 3D Background)
 * ============================================================================
 * Orchestrates Three.js spatial depth layers, procedural paper shaders,
 * hand-cut layered mountains, organic clouds, terracotta sun, and Rough.js annotations.
 */

export class KineticCollageScene {
  constructor(container) {
    this.container = container;
    this.scrollProgress = 0;
    this.activeExperiment = 0;
    this.reducedMotion = false;
    this.renderLoop = null;

    this.init();
  }

  init() {
    if (!this.container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Three.js Scene & Shallow Perspective Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 14.0);

    // 2. Hardware WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.zIndex = '0';
    this.container.appendChild(this.renderer.domElement);

    // 3. 2D Canvas Overlay for Rough.js Annotations
    this.annotationCanvas = document.createElement('canvas');
    this.annotationCanvas.style.position = 'absolute';
    this.annotationCanvas.style.inset = '0';
    this.annotationCanvas.style.pointerEvents = 'none';
    this.annotationCanvas.style.zIndex = '1';
    this.container.appendChild(this.annotationCanvas);
    this.annotationSystem = new AnnotationSystem(this.annotationCanvas);
    this.annotationSystem.resize(width, height);

    // 4. Parallax Controller
    this.parallax = new ParallaxController();

    // 5. Sky Plane (Z = -18.0)
    this.buildSky();

    // 6. Layer Subsystems
    this.mountains = new MountainSystem(this.scene);
    this.clouds = new CloudSystem(this.scene);
    this.sun = new SunSystem(this.scene);

    // 7. Event Listeners
    this.bindEvents();
    this.startRenderLoop();

    window.boilCollageScene = this;
  }

  buildSky() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const skyColor = isDark ? 0x101721 : 0xC8DCE5;

    const skyGeo = new THREE.PlaneGeometry(60, 40);
    const skyMat = createPaperMaterial(skyColor, { grainStrength: 0.04 });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.skyMesh.position.set(0, 0, -18.0);
    this.scene.add(this.skyMesh);
  }

  bindEvents() {
    this.mouseMoveHandler = (e) => {
      if (this.reducedMotion) return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.parallax.setMouse(normX, normY);
    };

    this.resizeHandler = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (this.annotationSystem) {
        this.annotationSystem.resize(w, h);
      }
    };

    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('resize', this.resizeHandler);
  }

  setMouse(x, y) {
    if (this.reducedMotion) return;
    this.parallax.setMouse(x, y);
  }

  setScroll(progress) {
    this.scrollProgress = progress;
  }

  setExperiment(index) {
    this.activeExperiment = index;
  }

  setReducedMotion(bool) {
    this.reducedMotion = bool;
  }

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (timestamp) => {
      const delta = Math.min(0.05, (timestamp - lastTime) * 0.001);
      lastTime = timestamp;

      const time = timestamp * 0.001;

      // 1. Update Mouse Parallax & Wind
      const pState = this.reducedMotion
        ? { x: 0, y: 0, wind: 0 }
        : this.parallax.update(delta);

      // 2. Camera Choreography (Subtle travel along scroll progress)
      if (!this.reducedMotion) {
        const targetCamZ = 14.0 - this.scrollProgress * 3.5;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;
        this.camera.position.x = pState.x * 0.4;
        this.camera.position.y = pState.y * 0.25 - this.scrollProgress * 1.5;
      }

      // 3. Update Subsystems
      if (this.mountains) this.mountains.update(delta, time, pState);
      if (this.clouds) this.clouds.update(delta, time, pState, pState.wind);
      if (this.sun) this.sun.update(delta, time, pState, this.scrollProgress);

      // 4. Render WebGL 3D Layer Stack
      this.renderer.render(this.scene, this.camera);

      // 5. Render Rough.js Editorial Annotations
      if (this.annotationSystem) {
        this.annotationSystem.draw(timestamp, 10, this.scrollProgress);
      }

      this.renderLoop = requestAnimationFrame(loop);
    };

    this.renderLoop = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.renderLoop) cancelAnimationFrame(this.renderLoop);
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('resize', this.resizeHandler);

    if (this.mountains) this.mountains.dispose();
    if (this.clouds) this.clouds.dispose();
    if (this.sun) this.sun.dispose();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
    }

    if (this.annotationCanvas && this.annotationCanvas.parentElement) {
      this.annotationCanvas.parentElement.removeChild(this.annotationCanvas);
    }
  }
}
