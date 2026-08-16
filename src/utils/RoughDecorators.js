import rough from 'roughjs';

/**
 * ============================================================================
 * BOIL.JS — ROUGH.JS CACHED DECORATORS & STAMPS
 * ============================================================================
 * Helper utilities to generate stable, high-performance hand-drawn SVG
 * annotations, underlines, corner brackets, and coordinate stamps.
 */

export class RoughDecorators {
  static drawUnderline(svgElement, width = 200, color = '#E8790C') {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const node = rc.curve([
      [4, 10],
      [width * 0.35, 14],
      [width * 0.7, 8],
      [width - 4, 12]
    ], {
      seed: 4242,
      roughness: 1.8,
      bowing: 1.5,
      stroke: color,
      strokeWidth: 3
    });
    svgElement.appendChild(node);
  }

  static drawButtonBorder(svgElement, width = 160, height = 48, color = 'currentColor', fill = 'none') {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const node = rc.rectangle(2, 2, width - 4, height - 4, {
      seed: 8899,
      roughness: 1.4,
      bowing: 1.2,
      stroke: color,
      strokeWidth: 2,
      fill: fill,
      fillStyle: 'solid'
    });
    svgElement.appendChild(node);
  }

  static drawCornerBrackets(svgElement, width = 400, height = 300, color = 'rgba(23,23,23,0.3)') {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const len = 16;
    // Top-left
    svgElement.appendChild(rc.linearPath([[2, len], [2, 2], [len, 2]], { roughness: 1.2, stroke: color, strokeWidth: 1.5 }));
    // Top-right
    svgElement.appendChild(rc.linearPath([[width - len, 2], [width - 2, 2], [width - 2, len]], { roughness: 1.2, stroke: color, strokeWidth: 1.5 }));
    // Bottom-left
    svgElement.appendChild(rc.linearPath([[2, height - len], [2, height - 2], [len, height - 2]], { roughness: 1.2, stroke: color, strokeWidth: 1.5 }));
    // Bottom-right
    svgElement.appendChild(rc.linearPath([[width - len, height - 2], [width - 2, height - 2], [width - 2, height - len]], { roughness: 1.2, stroke: color, strokeWidth: 1.5 }));
  }

  static drawCircleBadge(svgElement, size = 32, color = '#E8790C') {
    if (!svgElement) return;
    const rc = rough.svg(svgElement);
    while (svgElement.firstChild) svgElement.removeChild(svgElement.firstChild);

    const r = size / 2;
    const node = rc.circle(r, r, size - 4, {
      seed: 1234,
      roughness: 1.6,
      stroke: color,
      strokeWidth: 2
    });
    svgElement.appendChild(node);
  }
}
