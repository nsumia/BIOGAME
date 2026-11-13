// Tiny palette-indexed pixel grid toolkit (pure JS, no DOM) so art can be built & verified in node.
import { C } from './palette.js';
export class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  set(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = typeof c === 'string' ? C[c] : c; return this; }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / (rx + 0.3), dy = (y + 0.5 - cy) / (ry + 0.3);
      if (dx * dx + dy * dy <= 1) this.set(x, y, c);
    } return this;
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); return this;
  }
  blit(g, x, y) { for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) { const c = g.d[j * g.w + i]; if (c) this.set(x + i, y + j, c); } return this; }
  clone() { const g = new Grid(this.w, this.h); g.d.set(this.d); return g; }
  flipX() { const g = new Grid(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x]; return g; }
  // add 1px outline (4-neighbour) in colour c around all opaque pixels; grid must have 1px margin
  outline(c = 'k') {
    const ci = typeof c === 'string' ? C[c] : c, src = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x]) continue;
      if ((x > 0 && src[y * this.w + x - 1]) || (x < this.w - 1 && src[y * this.w + x + 1]) || (y > 0 && src[(y - 1) * this.w + x]) || (y < this.h - 1 && src[(y + 1) * this.w + x])) this.d[y * this.w + x] = ci;
    } return this;
  }
  count() { let n = 0; for (const v of this.d) if (v) n++; return n; }
  colors() { return new Set(this.d); }
}
// string-art helper: rows of chars, legend maps char -> palette name ('.' transparent)
export function art(rows, legend) {
  const g = new Grid(Math.max(...rows.map(r => r.length)), rows.length);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.' && legend[ch]) g.set(x, y, legend[ch]); }));
  return g;
}
// deterministic rng
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
export function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// translated drawing view over a grid (lets sprite code use a margin without rewriting coordinates)
export function view(g, ox, oy) {
  return { get w() { return g.w; }, get h() { return g.h; },
    set: (x, y, c) => g.set(x + ox, y + oy, c), get: (x, y) => g.get(x + ox, y + oy), rect: (x, y, w, h, c) => g.rect(x + ox, y + oy, w, h, c),
    ell: (x, y, rx, ry, c) => g.ell(x + ox, y + oy, rx, ry, c), line: (a, b, c, d, e) => g.line(a + ox, b + oy, c + ox, d + oy, e) };
}
