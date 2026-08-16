import anime from 'animejs';

/**
 * ============================================================================
 * BOIL.JS — CUSTOM HANDMADE LABORATORY SVG ICONOGRAPHY
 * ============================================================================
 * 100% custom, hand-crafted geometric and technical SVG icons (NO EMOJIS).
 * Every icon has stroke-dasharray and stroke-dashoffset animation support.
 */

export const ICONS = {
  // General Controls
  play: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-play">
      <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" fill-opacity="0.15"></polygon>
    </svg>
  `,
  pause: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-pause">
      <rect x="6" y="4" width="4" height="16" fill="currentColor" fill-opacity="0.15"></rect>
      <rect x="14" y="4" width="4" height="16" fill="currentColor" fill-opacity="0.15"></rect>
    </svg>
  `,
  reset: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-reset">
      <polyline points="1 4 1 10 7 10"></polyline>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
  `,
  fullscreen: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-fullscreen">
      <polyline points="15 3 21 3 21 9"></polyline>
      <polyline points="9 21 3 21 3 15"></polyline>
      <line x1="21" y1="3" x2="14" y2="10"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
  `,
  close: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-close">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `,
  inspect: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-inspect">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="16.5" y1="16.5" x2="21.5" y2="21.5"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  `,
  source: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-source">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
      <line x1="14" y1="4" x2="10" y2="20"></line>
    </svg>
  `,
  prompt: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-prompt">
      <path d="M12 2l2.4 5.2L20 8.2l-4 3.8 1 5.8-5-2.8-5 2.8 1-5.8-4-3.8 5.6-1z"></path>
      <path d="M19 16l1.2 2.6L23 19l-2 1.9.5 2.9-2.5-1.4-2.5 1.4.5-2.9-2-1.9 2.8-.4z" opacity="0.5"></path>
    </svg>
  `,
  remix: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-remix">
      <line x1="4" y1="21" x2="4" y2="14"></line>
      <line x1="4" y1="10" x2="4" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12" y2="3"></line>
      <line x1="20" y1="21" x2="20" y2="16"></line>
      <line x1="20" y1="12" x2="20" y2="3"></line>
      <circle cx="4" cy="12" r="2.5" fill="currentColor"></circle>
      <circle cx="12" cy="10" r="2.5" fill="currentColor"></circle>
      <circle cx="20" cy="14" r="2.5" fill="currentColor"></circle>
    </svg>
  `,
  soundOn: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-sound">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.2"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" class="sound-waves"></path>
    </svg>
  `,
  soundOff: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-sound">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.2"></polygon>
      <line x1="23" y1="9" x2="17" y2="15"></line>
      <line x1="17" y1="9" x2="23" y2="15"></line>
    </svg>
  `,
  sun: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-sun">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
    </svg>
  `,
  moon: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-moon">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `,
  copy: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-copy">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `,
  check: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-check">
      <polyline points="20 6 9 17 4 12" class="check-stroke"></polyline>
    </svg>
  `,
  keyboard: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-kbd">
      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
      <line x1="6" y1="8" x2="6.01" y2="8"></line>
      <line x1="10" y1="8" x2="10.01" y2="8"></line>
      <line x1="14" y1="8" x2="14.01" y2="8"></line>
      <line x1="18" y1="8" x2="18.01" y2="8"></line>
      <line x1="6" y1="12" x2="6.01" y2="12"></line>
      <line x1="18" y1="12" x2="18.01" y2="12"></line>
      <line x1="9" y1="16" x2="15" y2="16"></line>
    </svg>
  `,
  zap: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `,
  flame: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.5-3.5-1.5-3.5s-1.5 1.87-1.5 3.5z"></path>
      <path d="M12 2c1 3 5 4.5 5 9.5a5.5 5.5 0 0 1-11 0C6 6.5 10 5 12 2z"></path>
    </svg>
  `,
  sparkle: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"></path>
    </svg>
  `,
  crosshair: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="8"></circle>
      <line x1="12" y1="2" x2="12" y2="6"></line>
      <line x1="12" y1="18" x2="12" y2="22"></line>
      <line x1="2" y1="12" x2="6" y2="12"></line>
      <line x1="18" y1="12" x2="22" y2="12"></line>
    </svg>
  `,
  gear: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  `,

  // Vector Morph Targets (No emojis!)
  heart: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `,
  skull: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
      <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
      <path d="M12 3a8 8 0 0 0-8 8c0 3.2 1.8 5.6 3.5 6.8V21h9v-3.2c1.7-1.2 3.5-3.6 3.5-6.8a8 8 0 0 0-8-8z"></path>
      <line x1="10" y1="18" x2="10" y2="21"></line>
      <line x1="14" y1="18" x2="14" y2="21"></line>
    </svg>
  `,
  lightbulb: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 5.5V17h8v-2.5c1.5-1 3-3 3-5.5a7 7 0 0 0-7-7z"></path>
    </svg>
  `,
  rocket: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
      <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor"></circle>
    </svg>
  `,
  diamond: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="6 3 18 3 22 9 12 22 2 9"></polygon>
      <line x1="2" y1="9" x2="22" y2="9"></line>
      <line x1="12" y1="22" x2="7" y2="9"></line>
      <line x1="12" y1="22" x2="17" y2="9"></line>
    </svg>
  `,
  bird: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polyline points="2 12 8 4 14 12 22 8 16 18 8 16 2 12"></polyline>
      <line x1="8" y1="4" x2="8" y2="16"></line>
    </svg>
  `,
  coffee: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
  `,
  infinity: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M18.18 8.18a4.5 4.5 0 0 0-6.36 0L12 9l-.18-.82a4.5 4.5 0 1 0 0 6.36L12 15l.18.82a4.5 4.5 0 1 0 5.82-6.64l.18-.82z"></path>
    </svg>
  `,

  // 3D Dimension Models
  torus: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <ellipse cx="12" cy="12" rx="9" ry="5"></ellipse>
      <ellipse cx="12" cy="12" rx="4" ry="2"></ellipse>
    </svg>
  `,
  island: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="3 14 12 11 21 14 12 21"></polygon>
      <polyline points="7 12 12 5 17 12"></polyline>
    </svg>
  `,
  crystal: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="12 2 20 8 12 22 4 8"></polygon>
      <line x1="12" y1="2" x2="12" y2="22"></line>
      <line x1="4" y1="8" x2="20" y2="8"></line>
    </svg>
  `,
  tesseract: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <rect x="3" y="3" width="18" height="18"></rect>
      <rect x="8" y="8" width="8" height="8"></rect>
      <line x1="3" y1="3" x2="8" y2="8"></line>
      <line x1="21" y1="3" x2="16" y2="8"></line>
      <line x1="21" y1="21" x2="16" y2="16"></line>
      <line x1="3" y1="21" x2="8" y2="16"></line>
    </svg>
  `,
  galaxy: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
      <path d="M12 4a8 8 0 0 1 8 8c0 2.5-1 4.5-3 5.5"></path>
      <path d="M12 20a8 8 0 0 1-8-8c0-2.5 1-4.5 3-5.5"></path>
    </svg>
  `,
  dna: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M4 4c4 4 12 4 16 0M4 20c4-4 12-4 16 0M8 8v8M16 8v8M12 5v14"></path>
    </svg>
  `,

  // Puppet & Snack Icons
  donut: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="9"></circle>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `,
  apple: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M12 5c-4 0-7 3-7 7.5 0 4 3 6.5 7 6.5s7-2.5 7-6.5C19 8 16 5 12 5z"></path>
      <path d="M12 2c0 2-1 3-2 3"></path>
    </svg>
  `,
  fish: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M2 12s4-6 10-6c5 0 8 4 10 6-2 2-5 6-10 6-6 0-10-6-10-6z"></path>
      <circle cx="18" cy="12" r="1.5" fill="currentColor"></circle>
    </svg>
  `,
  shades: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="3 8 10 8 9 14 4 14"></polygon>
      <polygon points="14 8 21 8 20 14 15 14"></polygon>
      <line x1="10" y1="10" x2="14" y2="10"></line>
    </svg>
  `,
  partyhat: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="4 20 12 3 20 20"></polygon>
      <circle cx="12" cy="2" r="1.5" fill="currentColor"></circle>
    </svg>
  `,
  crown: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="2 18 5 8 12 14 19 8 22 18"></polygon>
      <line x1="2" y1="18" x2="22" y2="18"></line>
    </svg>
  `,
  ban: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="5.6" y1="5.6" x2="18.4" y2="18.4"></line>
    </svg>
  `,
  octopus: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="9" r="6"></circle>
      <path d="M6 15v4M9 15v5M12 15v5M15 15v5M18 15v4"></path>
    </svg>
  `,
  ragdoll: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="4" r="2.5"></circle>
      <line x1="12" y1="7" x2="12" y2="14"></line>
      <line x1="6" y1="10" x2="18" y2="10"></line>
      <line x1="12" y1="14" x2="8" y2="21"></line>
      <line x1="12" y1="14" x2="16" y2="21"></line>
    </svg>
  `,
  multiball: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="7" cy="14" r="3.5" fill="currentColor" fill-opacity="0.2"></circle>
      <circle cx="17" cy="14" r="3.5" fill="currentColor" fill-opacity="0.2"></circle>
      <circle cx="12" cy="7" r="3.5" fill="currentColor" fill-opacity="0.2"></circle>
    </svg>
  `,
  bomb: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="10" cy="14" r="7"></circle>
      <path d="M15 9l3-3M19 4l2 2M16 2l1 3"></path>
    </svg>
  `,
  cluster: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <circle cx="12" cy="12" r="3"></circle>
      <circle cx="5" cy="8" r="1.5"></circle>
      <circle cx="19" cy="8" r="1.5"></circle>
      <circle cx="6" cy="18" r="1.5"></circle>
      <circle cx="18" cy="18" r="1.5"></circle>
    </svg>
  `,
  dice: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <rect x="3" y="3" width="18" height="18" rx="3"></rect>
      <circle cx="8" cy="8" r="1.2" fill="currentColor"></circle>
      <circle cx="16" cy="8" r="1.2" fill="currentColor"></circle>
      <circle cx="12" cy="12" r="1.2" fill="currentColor"></circle>
      <circle cx="8" cy="16" r="1.2" fill="currentColor"></circle>
      <circle cx="16" cy="16" r="1.2" fill="currentColor"></circle>
    </svg>
  `,
  chat: `
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `
};

export function renderIcon(name) {
  return ICONS[name] || '';
}

/**
 * Triggers a stroke-dashoffset animation on an SVG icon
 */
export function animateIconStroke(svgEl, duration = 400) {
  if (!svgEl) return;
  const paths = svgEl.querySelectorAll('path, polyline, line, circle, rect, polygon, ellipse');
  paths.forEach(p => {
    const len = p.getTotalLength ? p.getTotalLength() : 60;
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;

    anime({
      targets: p,
      strokeDashoffset: [len, 0],
      duration,
      easing: 'easeOutCubic'
    });
  });
}
