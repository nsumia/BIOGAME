// Terrain texturing + auto-tiling. Pure functions -> palette index buffers (node-testable).
import { C } from './palette.js';
import { hash2 } from './pixel.js';
export const T = { WATER: 0, SAND: 1, GRASS: 2, MOSS: 3, PATH: 4, DECK: 5 };
export const TS = 16, WATER_FRAMES = 8;
const EDGE = [C.b4, C.s2, C.g2, C.g1, C.d2, C.d1];

function vnoise(x, y, s = 0) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function tex(t, X, Y, frame) {
  const n = hash2(X, Y, 1), lf = vnoise(X / 9, Y / 9, 4);
  switch (t) {
    case T.GRASS: {
      if (hash2(X >> 1, Y >> 1, 9) < 0.06 && n < 0.7) return C.g4;
      if (lf > 0.66 && n < 0.45) return C.g4;
      if (lf < 0.3 && n < 0.3) return C.g2;
      return n < 0.07 ? C.g4 : n < 0.12 ? C.g2 : C.g3;
    }
    case T.MOSS: {
      if (n < 0.02) return C.d1; if (n < 0.04) return C.d2;
      if (lf > 0.6 && n < 0.35) return C.g3;
      return n < 0.13 ? C.g1 : n < 0.19 ? C.g3 : C.g2;
    }
    case T.SAND: {
      const rip = Math.sin((X * 0.25 + vnoise(X / 7, Y / 7, 2) * 5) + Y * 0.9);
      if (n < 0.02) return C.w; if (n < 0.08) return C.s2; if (rip > 0.93) return C.s2;
      return lf > 0.7 && n < 0.3 ? C.w : C.s1;
    }
    case T.PATH: {
      if (n < 0.02) return C.n3; if (n < 0.035) return C.n2;
      if (n < 0.14) return C.d2; if (lf > 0.62 && n < 0.4) return C.s2;
      return C.d3;
    }
    case T.DECK: {
      const row = Math.floor(Y / 5), sh = (row * 11 + Math.floor(hash2(row, 2) * 4) * 8) % 32, xs = (X + sh) % 32, col = Math.floor((X + sh) / 32);
      if (Y % 5 === 4) return C.d1;
      if (xs === 0 || xs === 31 && false) return C.d1;
      if (xs === 3 && Y % 5 === 2 && hash2(col, row, 3) < 0.5) return C.n2;
      const tone = hash2(col, row, 5), grain = hash2(X >> 2, Y, 8) < 0.12;
      return grain ? C.d2 : tone < 0.34 ? C.d3 : tone < 0.7 ? C.d2 : C.d3;
    }
    default: { // water, animated
      const dir = (Y >> 1) & 1 ? 1 : -1, ph = hash2(Y >> 1, 3) * 16, len = 3 + Math.floor(hash2(Y >> 1, 5) * 4);
      const s = ((X + dir * frame * 2 + ph) % 16 + 16) % 16;
      const deep = vnoise(X / 14, Y / 14, 8);
      if ((Y & 1) === 0 && s < len && hash2(Y >> 1, 11) < 0.7) return deep > 0.55 ? C.b2 : C.b3;
      if (hash2(X, Y, 20 + (frame >> 1)) < 0.004) return C.b4;
      return deep > 0.74 ? C.b1 : C.b2;
    }
  }
}
// Produces Uint8Array (W*16 x H*16) palette indices for one water frame (0..7)
export function renderTerrain(map, frame) {
  const { W, H, terr } = map, PW = W * TS, out = new Uint8Array(PW * H * TS);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? terr[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))] : terr[y * W + x];
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const own = terr[ty * W + tx];
    // which higher neighbours exist
    const nb = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const t = at(tx + dx, ty + dy); if (t > own) nb.push([tx + dx, ty + dy, t]); }
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
      const X = tx * TS + x, Y = ty * TS + y;
      let best = own, edge = false, foam = false;
      if (nb.length) {
        const e = 2.6 + 3.2 * vnoise(X / 5, Y / 5, 6);
        let bestD = 99;
        for (const [nx, ny, t] of nb) {
          const dx = Math.max(nx * TS - X - 0.5, 0, X + 0.5 - (nx * TS + TS)), dy = Math.max(ny * TS - Y - 0.5, 0, Y + 0.5 - (ny * TS + TS));
          const d = Math.hypot(dx, dy);
          if (d < e && t > best) { best = t; edge = d > e - 1.1; }
          if (own === T.WATER) bestD = Math.min(bestD, d - e);
        }
        if (own === T.WATER && best === own && bestD >= 0) {
          const k = (frame >> 1) % 4;
          if ((bestD < 1.3 && k !== 3) || (bestD >= 1.3 && bestD < 2.6 && (k === 2 || k === 3 || k === 0 && hash2(X, Y, 2) < 0.35))) foam = true;
          else if (bestD >= 2.6 && bestD < 4.2 && hash2(X >> 1, Y, 8) < 0.5) foam = 'dark';
        }
      }
      let c = edge ? EDGE[best] : tex(best, X, Y, frame);
      if (foam === true) c = C.b4; else if (foam === 'dark') c = C.b1;
      out[Y * PW + X] = c;
    }
  }
  return out;
}
