import rough from 'roughjs';

/**
 * ============================================================================
 * BOIL.JS — ROUGH.JS CACHED DECORATORS & STAMPS
 * ============================================================================
 * Generates stable, high-performance hand-drawn SVG annotations, underlines,
 * corner brackets, and coordinate stamps with deterministic seeds.
 */

export class RoughDecorators {
  static drawUnderline(svgElement, width = 200, color = '#E8790C', seed = 4242) {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const node = rc.curve([
      [2, 8],
      [width * 0.35, 12],
      [width * 0.7, 6],
      [width - 2, 10]
    ], {
      seed,
      roughness: 1.6,
      bowing: 1.4,
      stroke: color,
      strokeWidth: 2.5
    });
    svgElement.appendChild(node);
  }

  static drawButtonBorder(svgElement, width = 160, height = 44, color = 'currentColor', seed = 8899) {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const node = rc.rectangle(2, 2, width - 4, height - 4, {
      seed,
      roughness: 1.4,
      bowing: 1.2,
      stroke: color,
      strokeWidth: 1.8
    });
    svgElement.appendChild(node);
  }

  static drawCornerBrackets(svgElement, width = 400, height = 300, color = 'rgba(23,23,23,0.3)', seed = 1234) {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const len = 14;
    // Top-left
    svgElement.appendChild(rc.linearPath([[2, len], [2, 2], [len, 2]], { seed, roughness: 1.1, stroke: color, strokeWidth: 1.5 }));
    // Top-right
    svgElement.appendChild(rc.linearPath([[width - len, 2], [width - 2, 2], [width - 2, len]], { seed: seed + 1, roughness: 1.1, stroke: color, strokeWidth: 1.5 }));
    // Bottom-left
    svgElement.appendChild(rc.linearPath([[2, height - len], [2, height - 2], [len, height - 2]], { seed: seed + 2, roughness: 1.1, stroke: color, strokeWidth: 1.5 }));
    // Bottom-right
    svgElement.appendChild(rc.linearPath([[width - len, height - 2], [width - 2, height - 2], [width - 2, height - len]], { seed: seed + 3, roughness: 1.1, stroke: color, strokeWidth: 1.5 }));
  }

  static drawCircleBadge(svgElement, size = 32, color = '#E8790C', seed = 5555) {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const r = size / 2;
    const node = rc.circle(r, r, size - 4, {
      seed,
      roughness: 1.5,
      stroke: color,
      strokeWidth: 2
    });
    svgElement.appendChild(node);
  }

  static drawSliderThumb(svgElement, size = 16, color = '#E8790C', fill = '#F4EFE6') {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const node = rc.circle(size / 2, size / 2, size - 2, {
      seed: 9911,
      roughness: 1.3,
      stroke: color,
      strokeWidth: 2,
      fill: fill,
      fillStyle: 'solid'
    });
    svgElement.appendChild(node);
  }
}
