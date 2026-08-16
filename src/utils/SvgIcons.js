import anime from 'animejs';

/**
 * ============================================================================
 * BOIL.JS — CUSTOM LABORATORY SVG ICONOGRAPHY & STROKE MOTION ENGINE
 * ============================================================================
 * Ultra-crisp, geometric, hand-drawn-feel SVG icons with built-in stroke
 * draw-in and morph animations using Anime.js.
 */

export const ICONS = {
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
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
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
  arrowDown: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <polyline points="19 12 12 19 5 12"></polyline>
    </svg>
  `,
  arrowUpRight: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  `,
  zap: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  `,
  menu: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon anim-icon icon-menu">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
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
  const paths = svgEl.querySelectorAll('path, polyline, line, circle, rect, polygon');
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
