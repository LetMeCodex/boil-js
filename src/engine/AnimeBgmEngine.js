import { getTheme, subscribeTheme } from '../utils/theme.js';

/**
 * ============================================================================
 * BOIL.JS — NOSTALGIC ANIME PROCEDURAL BGM ENGINE (Web Audio API)
 * ============================================================================
 * An authentic, soothing, acoustic chiptune & music-box composition inspired by
 * classic nostalgic anime soundtracks (Doraemon, Shinchan, Totoro, Ghibli).
 * 
 * Features:
 * - Pure procedural Web Audio synthesis (0 external audio dependencies)
 * - Music box celesta, warm acoustic marimba, upright bass, and soft nostalgic pads
 * - Multi-phrase royal-road anime melody (Intro -> Sunny Theme -> Playful Stroll -> Twilight Resolution)
 * - Day/Night dynamic theme adaptation (Sunny waltz vs. Starry lullaby)
 * - Seamless looping, smooth gain crossfades, and autoplay policy compliance
 */

const NOTE_FREQS = {
  'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98, 'A6': 1760.00
};

export class AnimeBgmEngine {
  static instance = null;

  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.padGain = null;
    this.isPlaying = false;
    this.currentTheme = getTheme() || 'day';
    this.scheduleTimer = null;
    this.nextNoteTime = 0;
    this.currentStep = 0;
    this.bpm = 104;
    this.volume = 0.22;
    this.enabled = true;

    // Listen to Day / Night theme transitions
    subscribeTheme((t) => {
      this.currentTheme = t;
      this.updateThemeAtmosphere();
    });
  }

  static get() {
    if (!AnimeBgmEngine.instance) {
      AnimeBgmEngine.instance = new AnimeBgmEngine();
    }
    return AnimeBgmEngine.instance;
  }

  initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Warm Lowpass Filter (Lo-Fi Vintage Character)
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.setValueAtTime(6500, this.ctx.currentTime);
    this.masterFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

    this.masterGain.connect(this.masterFilter);
    this.masterFilter.connect(this.ctx.destination);
  }

  start() {
    this.initContext();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.currentStep = 0;

    // Smooth fade in
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 1.2);

    this.scheduler();
  }

  stop() {
    if (!this.isPlaying) return;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    }
    setTimeout(() => {
      this.isPlaying = false;
      if (this.scheduleTimer) {
        clearTimeout(this.scheduleTimer);
        this.scheduleTimer = null;
      }
    }, 650);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  updateThemeAtmosphere() {
    if (!this.ctx || !this.masterFilter) return;
    const isNight = this.currentTheme === 'night';
    const targetFreq = isNight ? 3800 : 7000;
    this.masterFilter.frequency.cancelScheduledValues(this.ctx.currentTime);
    this.masterFilter.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 1.5);
  }

  // ==========================================================================
  // PROCEDURAL INSTRUMENT SYNTHESIZERS
  // ==========================================================================

  playMusicBox(note, time, duration = 0.8, gainLevel = 0.18) {
    if (!this.ctx || !NOTE_FREQS[note]) return;
    const freq = NOTE_FREQS[note];

    // Primary bell tone (Sine)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Harmonic chime overtone (Ratio 2.76)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.76, time);

    // Exponential music box envelope
    gain1.gain.setValueAtTime(gainLevel, time);
    gain1.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    gain2.gain.setValueAtTime(gainLevel * 0.22, time);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + duration * 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }

  playMarimba(note, time, duration = 0.45, gainLevel = 0.22) {
    if (!this.ctx || !NOTE_FREQS[note]) return;
    const freq = NOTE_FREQS[note];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.08, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(1.8, time);

    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBass(note, time, duration = 0.55, gainLevel = 0.28) {
    if (!this.ctx || !NOTE_FREQS[note]) return;
    const freq = NOTE_FREQS[note];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);

    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBrush(time, gainLevel = 0.04) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.035;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4500, time);
    filter.Q.setValueAtTime(2.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainLevel, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  playPadChord(notes, time, duration = 2.2, gainLevel = 0.07) {
    if (!this.ctx) return;
    notes.forEach((n, idx) => {
      if (!NOTE_FREQS[n]) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(NOTE_FREQS[n] + (idx % 2 === 0 ? 0.4 : -0.4), time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(gainLevel, time + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // ==========================================================================
  // NOSTALGIC SCORE SCHEDULER (DORAEMON & SHINCHAN VIBES)
  // ==========================================================================

  scheduler() {
    if (!this.isPlaying || !this.ctx) return;

    const lookAhead = 0.25;
    const stepDuration = (60 / this.bpm) / 2; // 8th note duration (~0.288s)

    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 64; // 32-bar cycle (64 8th steps)
    }

    this.scheduleTimer = setTimeout(() => this.scheduler(), 80);
  }

  scheduleStep(step, time) {
    const isNight = this.currentTheme === 'night';
    const celestaVol = isNight ? 0.24 : 0.19;
    const marimbaVol = isNight ? 0.12 : 0.24;

    // 1. Rhythmic Light Brush on off-beats
    if (step % 2 === 1) {
      this.playBrush(time, isNight ? 0.02 : 0.04);
    }

    // 2. Chord Pads on Bar Starts (every 4 steps)
    if (step % 4 === 0) {
      const bar = Math.floor(step / 4);
      const chordMap = [
        ['C4', 'E4', 'G4', 'B4'], // Bar 0: Cmaj7
        ['B3', 'D4', 'G4', 'B4'], // Bar 1: G/B
        ['A3', 'C4', 'E4', 'G4'], // Bar 2: Am7
        ['G3', 'B3', 'E4', 'G4'], // Bar 3: Em7
        ['F3', 'A3', 'C4', 'E4'], // Bar 4: Fmaj7
        ['E3', 'G3', 'B3', 'E4'], // Bar 5: Em7
        ['D3', 'F3', 'A3', 'C4'], // Bar 6: Dm7
        ['G3', 'B3', 'D4', 'F4'], // Bar 7: G7
        ['C4', 'E4', 'G4', 'B4'], // Bar 8: Cmaj7
        ['D4', 'F#4', 'A4', 'C5'],// Bar 9: D7
        ['B3', 'D4', 'F#4', 'A4'],// Bar 10: Bm7
        ['E3', 'G3', 'B3', 'E4'], // Bar 11: Em7
        ['A3', 'C4', 'E4', 'G4'], // Bar 12: Am7
        ['D3', 'F3', 'A3', 'C4'], // Bar 13: Dm7
        ['G3', 'B3', 'D4', 'F4'], // Bar 14: G7
        ['C4', 'E4', 'G4', 'C5']  // Bar 15: C
      ];
      if (chordMap[bar]) {
        this.playPadChord(chordMap[bar], time, 1.8, isNight ? 0.09 : 0.05);
      }
    }

    // 3. Acoustic Walking Bassline
    const bassMap = {
      0: 'C2', 2: 'G2', 4: 'B2', 6: 'G2',
      8: 'A2', 10: 'E2', 12: 'E2', 14: 'B2',
      16: 'F2', 18: 'C3', 20: 'E2', 22: 'B2',
      24: 'D2', 26: 'A2', 28: 'G2', 30: 'D2',
      32: 'C2', 34: 'G2', 36: 'D2', 38: 'A2',
      40: 'B2', 42: 'F#2', 44: 'E2', 46: 'B2',
      48: 'A2', 50: 'E2', 52: 'D2', 54: 'A2',
      56: 'G2', 58: 'D2', 60: 'C2', 62: 'G2'
    };
    if (bassMap[step]) {
      this.playBass(bassMap[step], time, 0.42, isNight ? 0.22 : 0.28);
    }

    // 4. Nostalgic Melody Lines (Celesta + Marimba blend)
    // Classic Japanese Anime royal-road pentatonic motif
    const melodyMap = {
      // Bar 0 - 3: Sunny Nostalgia
      0: 'E5', 1: 'G5', 2: 'A5', 4: 'G5', 6: 'E5',
      8: 'D5', 10: 'C5', 12: 'D5', 14: 'E5',
      16: 'G5', 17: 'A5', 18: 'C6', 20: 'B5', 22: 'G5',
      24: 'A5', 26: 'G5', 28: 'E5', 30: 'D5',

      // Bar 4 - 7: Whimsical Shinchan Stroll
      32: 'E5', 33: 'G5', 34: 'C6', 36: 'D6', 38: 'E6',
      40: 'D6', 42: 'C6', 44: 'A5', 46: 'G5',
      48: 'A5', 50: 'C6', 52: 'D6', 54: 'C6',
      56: 'B5', 58: 'G5', 60: 'C5', 62: 'E5'
    };

    if (melodyMap[step]) {
      const note = melodyMap[step];
      this.playMusicBox(note, time, isNight ? 1.1 : 0.75, celestaVol);
      if (!isNight) {
        this.playMarimba(note, time + 0.005, 0.4, marimbaVol);
      }
    }

    // 5. Playful Counter-melody & Bell Arpeggios (Night Sparkles / Sunny Accents)
    const arpeggioMap = {
      3: 'C5', 7: 'D5', 11: 'E5', 15: 'G5',
      19: 'A5', 23: 'C6', 27: 'E6', 31: 'G5',
      35: 'E5', 39: 'G5', 43: 'C6', 47: 'D6',
      51: 'E6', 55: 'G5', 59: 'D5', 63: 'C5'
    };

    if (arpeggioMap[step]) {
      const note = arpeggioMap[step];
      this.playMusicBox(note, time, 0.6, isNight ? 0.16 : 0.11);
    }
  }
}
