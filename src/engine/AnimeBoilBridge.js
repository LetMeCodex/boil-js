import anime from 'animejs';

/**
 * ============================================================================
 * ANIME BOIL BRIDGE — Choreography & Motion Bridge between Anime.js and Rough.js
 * ============================================================================
 */

export class AnimeBoilBridge {
  /**
   * Directly animates properties on a BoilShape instance using Anime.js.
   * @param {BoilShape|Array<BoilShape>} targets 
   * @param {Object} animeOptions 
   * @returns {anime.AnimeInstance}
   */
  static animate(targets, animeOptions = {}) {
    return anime({
      targets,
      easing: 'easeOutElastic(1, .6)',
      duration: 1000,
      ...animeOptions
    });
  }

  /**
   * Creates an Anime.js Timeline for multi-step choreography.
   * @param {Object} timelineOptions 
   * @returns {anime.AnimeTimelineInstance}
   */
  static createTimeline(timelineOptions = {}) {
    return anime.timeline({
      easing: 'easeInOutQuad',
      ...timelineOptions
    });
  }

  /**
   * Preset: Bouncing squash & stretch physics
   */
  static bounceSquash(shape, options = {}) {
    const startY = options.startY || shape.y;
    const targetY = options.targetY || (startY + 160);
    const duration = options.duration || 1200;

    return anime.timeline({ loop: true })
      .add({
        targets: shape,
        y: targetY,
        scaleY: [1, 0.7],
        scaleX: [1, 1.3],
        duration: duration * 0.45,
        easing: 'easeInQuad'
      })
      .add({
        targets: shape,
        scaleY: [0.7, 1.2, 1],
        scaleX: [1.3, 0.85, 1],
        duration: duration * 0.25,
        easing: 'easeOutQuad'
      })
      .add({
        targets: shape,
        y: startY,
        scaleY: 1,
        scaleX: 1,
        duration: duration * 0.3,
        easing: 'easeOutQuad'
      });
  }

  /**
   * Preset: Organic floating & swaying
   */
  static floatSway(shape, options = {}) {
    const deltaY = options.distance || 15;
    const deltaRot = options.rotation || 4;
    const duration = options.duration || 2400;

    const initialY = shape.y;
    const initialRot = shape.rotation;

    return anime.timeline({ loop: true, direction: 'alternate' })
      .add({
        targets: shape,
        y: initialY - deltaY,
        rotation: initialRot + deltaRot,
        duration: duration,
        easing: 'easeInOutSine'
      });
  }

  /**
   * Preset: Tactile press & spring release (for UI buttons / interactive elements)
   */
  static tactileTap(shape, onComplete) {
    return anime.timeline({
      complete: onComplete
    })
    .add({
      targets: shape,
      scaleX: 0.93,
      scaleY: 0.93,
      duration: 90,
      easing: 'easeOutQuad'
    })
    .add({
      targets: shape,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 180,
      easing: 'easeOutElastic(1, .4)'
    })
    .add({
      targets: shape,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      easing: 'easeOutQuad'
    });
  }

  /**
   * Preset: Organic Wobbly Jiggle
   */
  static wobble(shape, options = {}) {
    const duration = options.duration || 1600;
    return anime({
      targets: shape,
      rotation: [-3, 3, -2, 2, 0],
      scaleX: [1, 1.06, 0.95, 1.03, 1],
      scaleY: [1, 0.95, 1.06, 0.97, 1],
      duration: duration,
      easing: 'easeInOutSine',
      loop: true,
      direction: 'alternate'
    });
  }
}

/**
 * Handcrafted Organic Sound Synthesizer (Web Audio API)
 * Simulates gentle pencil scratch / pop / bubble sounds for tactile feedback.
 */
export class SoundFX {
  static enabled = true;
  static ctx = null;

  static init() {
    if (!SoundFX.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        SoundFX.ctx = new AudioCtx();
      }
    }
  }

  static playPop(freq = 420) {
    if (!SoundFX.enabled) return;
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      if (SoundFX.ctx.state === 'suspended') SoundFX.ctx.resume();

      const osc = SoundFX.ctx.createOscillator();
      const gain = SoundFX.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, SoundFX.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, SoundFX.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, SoundFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(SoundFX.ctx.destination);

      osc.start();
      osc.stop(SoundFX.ctx.currentTime + 0.08);
    } catch (e) {
      // Audio not permitted or interrupted
    }
  }

  static playScratch() {
    if (!SoundFX.enabled) return;
    try {
      SoundFX.init();
      if (!SoundFX.ctx) return;
      if (SoundFX.ctx.state === 'suspended') SoundFX.ctx.resume();

      const bufferSize = SoundFX.ctx.sampleRate * 0.04;
      const buffer = SoundFX.ctx.createBuffer(1, bufferSize, SoundFX.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = SoundFX.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = SoundFX.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 2.5;

      const gain = SoundFX.ctx.createGain();
      gain.gain.setValueAtTime(0.06, SoundFX.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, SoundFX.ctx.currentTime + 0.04);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(SoundFX.ctx.destination);

      whiteNoise.start();
    } catch (e) {}
  }
}
