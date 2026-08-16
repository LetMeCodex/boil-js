import rough from 'roughjs';

/**
 * ============================================================================
 * BOIL ENGINE — High-Performance Multi-Frame Rough.js Boiling Generator
 * ============================================================================
 * 
 * Line boil (Squigglevision) is created by rendering a shape with N distinct
 * random seeds, then cycling between these pre-buffered frames at a designated
 * frame rate (e.g. 8 - 14 FPS) while transforms interpolate smoothly at 60 FPS.
 */

export class BoilEngine {
  constructor(options = {}) {
    this.defaultBoilFps = options.boilFps || 10;
    this.defaultFrameCount = options.frameCount || 4;
    this.defaultRoughness = options.roughness !== undefined ? options.roughness : 1.8;
    this.defaultBowing = options.bowing !== undefined ? options.bowing : 1.5;
    this.generator = rough.generator();
  }

  /**
   * Generates an array of N rough.js drawables, each with a unique seed.
   * @param {string} shapeType - 'rectangle' | 'circle' | 'ellipse' | 'line' | 'path' | 'polygon' | 'arc'
   * @param {Array} args - Shape arguments
   * @param {Object} roughOptions - Rough.js configuration options
   * @param {number} frameCount - Number of pre-buffered seed frames (default 4)
   * @returns {Array} - Array of rough.js drawables
   */
  createBoilFrames(shapeType, args, roughOptions = {}, frameCount = this.defaultFrameCount) {
    const frames = [];
    const baseSeed = roughOptions.seed || Math.floor(Math.random() * 100000);

    for (let i = 0; i < frameCount; i++) {
      const frameOpts = {
        roughness: this.defaultRoughness,
        bowing: this.defaultBowing,
        strokeWidth: 2,
        ...roughOptions,
        seed: baseSeed + i * 137 // Guaranteed distinct seed offset
      };

      let drawable = null;
      switch (shapeType) {
        case 'rectangle':
          drawable = this.generator.rectangle(args[0], args[1], args[2], args[3], frameOpts);
          break;
        case 'circle':
          drawable = this.generator.circle(args[0], args[1], args[2], frameOpts);
          break;
        case 'ellipse':
          drawable = this.generator.ellipse(args[0], args[1], args[2], args[3], frameOpts);
          break;
        case 'line':
          drawable = this.generator.line(args[0], args[1], args[2], args[3], frameOpts);
          break;
        case 'path':
          drawable = this.generator.path(args[0], frameOpts);
          break;
        case 'polygon':
          drawable = this.generator.polygon(args[0], frameOpts);
          break;
        case 'arc':
          drawable = this.generator.arc(args[0], args[1], args[2], args[3], args[4], args[5], args[6] || false, frameOpts);
          break;
        case 'linearPath':
          drawable = this.generator.linearPath(args[0], frameOpts);
          break;
        case 'curve':
          drawable = this.generator.curve(args[0], frameOpts);
          break;
        default:
          console.warn(`Unknown shapeType: ${shapeType}`);
      }

      if (drawable) {
        frames.push(drawable);
      }
    }
    return frames;
  }

  /**
   * Calculates current active frame index based on time and boil FPS.
   * @param {number} timestamp - Performance timestamp in ms
   * @param {number} fps - Boil rate in frames per second
   * @param {number} frameCount - Total frames
   * @returns {number} Active frame index
   */
  static getFrameIndex(timestamp, fps = 10, frameCount = 4) {
    if (frameCount <= 1) return 0;
    return Math.floor((timestamp * fps) / 1000) % frameCount;
  }

  /**
   * Renders a rough.js drawable directly to canvas 2D context using rough's canvas renderer.
   * @param {RoughCanvas} rc - RoughCanvas instance
   * @param {Object} drawable - Rough drawable
   */
  static drawToCanvas(rc, drawable) {
    if (rc && drawable) {
      rc.draw(drawable);
    }
  }
}

/**
 * BoilShape — Object-oriented container for an animated boiling element.
 * Perfect for combining with Anime.js transforms and timelines.
 */
export class BoilShape {
  constructor(type, args, roughOptions = {}, engine = null) {
    this.type = type;
    this.args = args;
    this.roughOptions = { ...roughOptions };
    this.engine = engine || new BoilEngine();

    this.frameCount = roughOptions.frameCount || 4;
    this.boilFps = roughOptions.boilFps || 10;

    // Transform properties (interpolated by Anime.js at 60 FPS)
    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0; // in degrees
    this.opacity = 1;
    this.originX = 0;
    this.originY = 0;

    // Custom animation progress (e.g. for write-on stroke drawing 0..1)
    this.progress = 1;

    // Pre-buffer boiling frames
    this.rebuildFrames();
  }

  rebuildFrames() {
    this.frames = this.engine.createBoilFrames(
      this.type,
      this.args,
      this.roughOptions,
      this.frameCount
    );
  }

  updateOptions(newOptions) {
    this.roughOptions = { ...this.roughOptions, ...newOptions };
    if (newOptions.frameCount) this.frameCount = newOptions.frameCount;
    if (newOptions.boilFps) this.boilFps = newOptions.boilFps;
    this.rebuildFrames();
  }

  updateArgs(newArgs) {
    this.args = newArgs;
    this.rebuildFrames();
  }

  /**
   * Render this shape to canvas with current transforms and boiling frame.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {RoughCanvas} rc 
   * @param {number} timestamp 
   */
  render(ctx, rc, timestamp) {
    if (this.opacity <= 0 || !this.frames || this.frames.length === 0) return;

    ctx.save();

    // Apply transforms
    ctx.translate(this.x + this.originX, this.y + this.originY);
    if (this.rotation !== 0) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }
    if (this.originX !== 0 || this.originY !== 0) {
      ctx.translate(-this.originX, -this.originY);
    }

    if (this.opacity < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
    }

    // Select active boiling frame
    const frameIndex = BoilEngine.getFrameIndex(timestamp, this.boilFps, this.frames.length);
    const activeDrawable = this.frames[frameIndex];

    if (activeDrawable) {
      rc.draw(activeDrawable);
    }

    ctx.restore();
  }
}
