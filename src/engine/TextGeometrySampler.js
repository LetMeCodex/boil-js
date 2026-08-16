import * as THREE from 'three';

/**
 * ============================================================================
 * TEXT GEOMETRY SAMPLER
 * ============================================================================
 * Generates dense, mathematically accurate 3D points, surface normals,
 * and SVG boundary coordinates for "CREATE" and "MATTER".
 */

const GLYPH_PATHS = {
  // 'C'
  C: [
    { type: 'arc', cx: 0, cy: 0, r: 0.85, start: Math.PI * 0.25, end: Math.PI * 1.75 },
    { type: 'arc', cx: 0, cy: 0, r: 0.55, start: Math.PI * 1.75, end: Math.PI * 0.25, reverse: true },
    { type: 'line', p1: [0.6, 0.6], p2: [0.38, 0.38] },
    { type: 'line', p1: [0.6, -0.6], p2: [0.38, -0.38] }
  ],
  // 'R'
  R: [
    { type: 'line', p1: [-0.65, -0.85], p2: [-0.65, 0.85] },
    { type: 'line', p1: [-0.65, 0.85], p2: [0.15, 0.85] },
    { type: 'arc', cx: 0.15, cy: 0.35, r: 0.5, start: -Math.PI * 0.5, end: Math.PI * 0.5 },
    { type: 'line', p1: [0.15, -0.15], p2: [-0.65, -0.15] },
    { type: 'line', p1: [-0.15, -0.15], p2: [0.65, -0.85] }
  ],
  // 'E'
  E: [
    { type: 'line', p1: [-0.65, -0.85], p2: [-0.65, 0.85] },
    { type: 'line', p1: [-0.65, 0.85], p2: [0.65, 0.85] },
    { type: 'line', p1: [-0.65, 0.0], p2: [0.45, 0.0] },
    { type: 'line', p1: [-0.65, -0.85], p2: [0.65, -0.85] }
  ],
  // 'A'
  A: [
    { type: 'line', p1: [-0.65, -0.85], p2: [0.0, 0.85] },
    { type: 'line', p1: [0.0, 0.85], p2: [0.65, -0.85] },
    { type: 'line', p1: [-0.35, -0.15], p2: [0.35, -0.15] }
  ],
  // 'T'
  T: [
    { type: 'line', p1: [-0.75, 0.85], p2: [0.75, 0.85] },
    { type: 'line', p1: [0.0, 0.85], p2: [0.0, -0.85] }
  ],
  // 'M'
  M: [
    { type: 'line', p1: [-0.75, -0.85], p2: [-0.75, 0.85] },
    { type: 'line', p1: [-0.75, 0.85], p2: [0.0, 0.0] },
    { type: 'line', p1: [0.0, 0.0], p2: [0.75, 0.85] },
    { type: 'line', p1: [0.75, 0.85], p2: [0.75, -0.85] }
  ]
};

export class TextGeometrySampler {
  static sampleWord3D(word, totalPoints = 14000, options = {}) {
    const scale = options.scale || 1.6;
    const depth = options.depth || 0.45;
    const spacing = options.spacing || 1.65;
    const pointsPerLetter = Math.floor(totalPoints / word.length);

    const positions = new Float32Array(totalPoints * 3);
    const normals = new Float32Array(totalPoints * 3);
    const letterIndices = new Float32Array(totalPoints);

    const totalWidth = (word.length - 1) * spacing;
    const startX = -totalWidth / 2;

    let writeIdx = 0;

    for (let l = 0; l < word.length; l++) {
      const char = word[l];
      const letterCenterX = startX + l * spacing;
      const letterCenterY = 0;
      const paths = GLYPH_PATHS[char] || GLYPH_PATHS['E'];

      for (let p = 0; p < pointsPerLetter && writeIdx < totalPoints; p++) {
        const segment = paths[p % paths.length];
        const t = Math.random();
        let lx = 0, ly = 0;
        let nx = 0, ny = 0, nz = 1;

        if (segment.type === 'line') {
          lx = segment.p1[0] + (segment.p2[0] - segment.p1[0]) * t;
          ly = segment.p1[1] + (segment.p2[1] - segment.p1[1]) * t;
          const dx = segment.p2[0] - segment.p1[0];
          const dy = segment.p2[1] - segment.p1[1];
          nx = -dy;
          ny = dx;
        } else if (segment.type === 'arc') {
          const angle = segment.start + (segment.end - segment.start) * t;
          lx = segment.cx + Math.cos(angle) * segment.r;
          ly = segment.cy + Math.sin(angle) * segment.r;
          nx = Math.cos(angle);
          ny = Math.sin(angle);
        }

        const strokeSpread = (Math.random() - 0.5) * 0.16;
        const normLen = Math.hypot(nx, ny) || 1;
        lx += (nx / normLen) * strokeSpread;
        ly += (ny / normLen) * strokeSpread;

        let lz = 0;
        const depthChoice = Math.random();
        if (depthChoice < 0.42) {
          lz = depth / 2;
          nz = 1;
        } else if (depthChoice < 0.84) {
          lz = -depth / 2;
          nz = -1;
        } else {
          lz = (Math.random() - 0.5) * depth;
          nz = 0;
        }

        const i3 = writeIdx * 3;
        positions[i3] = (lx * scale * 0.85) + letterCenterX;
        positions[i3 + 1] = (ly * scale * 0.85) + letterCenterY;
        positions[i3 + 2] = lz;

        normals[i3] = nx;
        normals[i3 + 1] = ny;
        normals[i3 + 2] = nz;

        letterIndices[writeIdx] = l;
        writeIdx++;
      }
    }

    while (writeIdx < totalPoints) {
      const i3 = writeIdx * 3;
      const refIdx = (writeIdx % (totalPoints - 10)) * 3;
      positions[i3] = positions[refIdx] + (Math.random() - 0.5) * 0.05;
      positions[i3 + 1] = positions[refIdx + 1] + (Math.random() - 0.5) * 0.05;
      positions[i3 + 2] = positions[refIdx + 2];
      normals[i3] = normals[refIdx];
      normals[i3 + 1] = normals[refIdx + 1];
      normals[i3 + 2] = normals[refIdx + 2];
      letterIndices[writeIdx] = letterIndices[refIdx / 3];
      writeIdx++;
    }

    return { positions, normals, letterIndices };
  }

  static sampleSvgOutline(word, totalPoints = 14000, scale = 1.6) {
    const spacing = 1.65;
    const totalWidth = (word.length - 1) * spacing;
    const startX = -totalWidth / 2;
    const pointsPerLetter = Math.floor(totalPoints / word.length);
    const positions = new Float32Array(totalPoints * 3);

    let writeIdx = 0;
    for (let l = 0; l < word.length; l++) {
      const char = word[l];
      const letterCenterX = startX + l * spacing;
      const paths = GLYPH_PATHS[char] || GLYPH_PATHS['E'];

      for (let p = 0; p < pointsPerLetter && writeIdx < totalPoints; p++) {
        const segment = paths[p % paths.length];
        const t = Math.random();
        let lx = 0, ly = 0;

        if (segment.type === 'line') {
          lx = segment.p1[0] + (segment.p2[0] - segment.p1[0]) * t;
          ly = segment.p1[1] + (segment.p2[1] - segment.p1[1]) * t;
        } else if (segment.type === 'arc') {
          const angle = segment.start + (segment.end - segment.start) * t;
          lx = segment.cx + Math.cos(angle) * segment.r;
          ly = segment.cy + Math.sin(angle) * segment.r;
        }

        const i3 = writeIdx * 3;
        positions[i3] = (lx * scale * 0.85) + letterCenterX;
        positions[i3 + 1] = (ly * scale * 0.85);
        positions[i3 + 2] = 0;
        writeIdx++;
      }
    }

    while (writeIdx < totalPoints) {
      const i3 = writeIdx * 3;
      const refIdx = (writeIdx % (totalPoints - 10)) * 3;
      positions[i3] = positions[refIdx];
      positions[i3 + 1] = positions[refIdx + 1];
      positions[i3 + 2] = 0;
      writeIdx++;
    }

    return positions;
  }
}
