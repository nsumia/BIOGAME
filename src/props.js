// Procedural scenery sprites: trees, plants, buildings, items. Anchored at bottom-centre unless noted.
import { Grid, rng } from './pixel.js';

function clumpCanopy(w, h, cols, seed) {
  const g = new Grid(w, h), r = rng(seed), [dark, mid, light, hi] = cols;
  const blobs = [];
  for (let i = 0; i < 9; i++) blobs.push([w * (0.2 + 0.6 * r()), h * (0.28 + 0.46 * r()), w * (0.16 + 0.1 * r())]);
  blobs.push([w / 2, h * 0.5, w * 0.34]);
  for (const [x, y, rad] of blobs) g.ell(x, y + 2, rad, rad * 0.88, dark);
  for (const [x, y, rad] of blobs) g.ell(x - 1, y, rad * 0.9, rad * 0.78, mid);
  for (const [x, y, rad] of blobs) g.ell(x - rad * 0.2, y - rad * 0.28, rad * 0.62, rad * 0.5, light);
  for (let i = 0; i < 16; i++) { const [x, y, rad] = blobs[Math.floor(r() * blobs.length)]; g.ell(x - rad * 0.35 + r() * 3, y - rad * 0.5 + r() * 2, 1.6, 1.1, hi); }
  for (let i = 0; i < 18; i++) { const x = 3 + r() * (w - 6), y = h * 0.45 + r() * h * 0.45; if (g.get(x | 0, y | 0)) g.set(x | 0, y | 0, dark); }
  return g.outline('k');
}
export function oakCanopy(autumn = false) { return clumpCanopy(46, 40, autumn ? ['r1', 'o1', 'y1', 'g5'] : ['g1', 'g2', 'g3', 'g4'], autumn ? 77 : 12); }
export function trunk() {
  const g = new Grid(14, 22);
  g.rect(4, 0, 6, 19, 'd2'); g.rect(4, 0, 2, 19, 'd3'); g.rect(8, 0, 2, 19, 'd1'); g.ell(7, 19, 6, 2.2, 'd2'); g.rect(1, 18, 3, 2, 'd1'); g.rect(10, 18, 3, 2, 'd1');
  g.set(6, 6, 'd1'); g.set(7, 10, 'd1'); g.set(6, 13, 'd1'); g.rect(5, 3, 1, 3, 'd1');
  return g.outline('k');
}
export function pineCanopy() {
  const g = new Grid(30, 48);
  for (let t = 0; t < 4; t++) {
    const y0 = 2 + t * 10, w = 10 + t * 6, cx = 15;
    for (let y = 0; y < 14; y++) { const hw = Math.round((y / 13) * w / 2 + 1); for (let x = cx - hw; x <= cx + hw; x++) g.set(x, y0 + y, y > 10 ? 'g1' : x < cx - hw * 0.2 ? 'g2' : 'g1'); }
    for (let y = 1; y < 11; y += 3) { const hw = Math.round((y / 13) * w / 2); g.line(cx - hw + 1, y0 + y, cx - 1, y0 + y - 1, 'g3'); }
    g.set(cx - 3, y0 + 4, 'g4');
  }
  return g.outline('k');
}
export function snowless() { return null; }
export function bush(kind = 0) {
  const g = new Grid(22, 18), cols = ['g1', 'g2', 'g3', 'g4'];
  g.ell(11, 11, 9, 6, cols[0]); g.ell(10, 10, 8, 5.4, cols[1]); g.ell(8, 8, 5, 3.4, cols[2]); g.set(6, 6, cols[3]); g.set(9, 5, cols[3]); g.set(13, 8, cols[2]);
  if (kind === 1) for (const [x, y] of [[6, 10], [12, 7], [15, 11], [9, 13]]) { g.rect(x, y, 2, 2, 'r2'); g.set(x, y, 'r1'); }
  if (kind === 2) for (const [x, y] of [[6, 10], [12, 8], [15, 11]]) { g.rect(x, y, 2, 2, 'p2'); g.set(x + 1, y + 1, 'w'); }
  return g.outline('k');
}
export function flower(color, f) {
  const g = new Grid(10, 12), s = f % 2 ? 1 : 0;
  g.line(5, 11, 5 + s, 5, 'g2'); g.set(4, 9, 'g3'); g.set(6, 8, 'g3');
  const c = { r: 'r2', y: 'y1', p: 'p2', w: 'w', b: 'b3' }[color];
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.set(5 + s + dx, 4 + dy, c); g.set(5 + s, 4, color === 'y' ? 'o1' : 'y1');
  return g.outline('k');
}
export function tuft(f) {
  const g = new Grid(12, 10), sh = [-1, 0, 1][f % 3];
  for (const [x, h, c] of [[3, 6, 'g3'], [5, 8, 'g4'], [7, 7, 'g3'], [9, 5, 'g2']]) { g.line(x, 9, x + Math.round(sh * h / 6), 9 - h, c); g.line(x + 1, 9, x + 1 + Math.round(sh * h / 6), 9 - h + 1, 'g2'); }
  return g;
}
export function reed(f) {
  const g = new Grid(14, 28), sh = [-1, 0, 1, 0][f % 4];
  for (const [x, h] of [[4, 22], [7, 26], [10, 19]]) { g.line(x, 27, x + sh * 2, 27 - h, 'g3'); g.line(x + 1, 27, x + 1 + sh * 2, 27 - h, 'g2'); g.rect(x + sh * 2, 27 - h - 1, 2, 5, 'd1'); g.set(x + sh * 2, 27 - h - 1, 'd2'); }
  g.line(2, 27, 0 + sh, 17, 'g4'); g.line(12, 27, 13 + sh, 15, 'g4');
  return g.outline('k');
}
export function lily(f) {
  const g = new Grid(16, 10);
  g.ell(8, 5, 6.5, 3.6, 'g3'); g.ell(8, 5, 5, 2.6, 'g4'); g.set(8, 5, 'b2'); g.rect(8, 2, 1, 3, 'b2'); g.set(11, 3, 'b2');
  if (f % 2) { g.set(5, 4, 'p2'); g.set(6, 3, 'w'); g.set(7, 4, 'p2'); g.set(6, 4, 'y1'); } else { g.set(5, 4, 'p2'); g.set(6, 3, 'w'); g.set(7, 4, 'p2'); g.set(6, 4, 'y1'); g.set(6, 2, 'p2'); }
  return g.outline('k');
}
export function rock(size = 0) {
  const g = new Grid(size ? 34 : 22, size ? 26 : 18), w = g.w, h = g.h;
  g.ell(w / 2, h * 0.62, w * 0.42, h * 0.36, 'n1'); g.ell(w / 2 - 1, h * 0.56, w * 0.4, h * 0.32, 'n2'); g.ell(w / 2 - 3, h * 0.42, w * 0.26, h * 0.2, 'n3');
  g.rect(Math.floor(w * 0.55), Math.floor(h * 0.45), 3, 1, 'n1'); g.set(Math.floor(w * 0.4), Math.floor(h * 0.4), 'w');
  g.ell(w * 0.3, h * 0.75, 3, 1.6, 'g2');
  return g.outline('k');
}
export function sign() {
  const g = new Grid(18, 20);
  g.rect(8, 10, 2, 9, 'd1'); g.rect(2, 2, 14, 9, 'd3'); g.rect(2, 2, 14, 1, 'd2'); g.rect(2, 10, 14, 1, 'd1'); g.rect(4, 5, 10, 1, 'd1'); g.rect(4, 7, 7, 1, 'd1'); g.set(3, 3, 'k'); g.set(15, 3, 'k');
  return g.outline('k');
}
export function fenceH() { const g = new Grid(16, 18); g.rect(0, 8, 16, 2, 'd3'); g.rect(0, 13, 16, 2, 'd3'); g.rect(0, 9, 16, 1, 'd2'); for (const x of [1, 12]) { g.rect(x, 5, 3, 12, 'd2'); g.rect(x, 5, 3, 1, 'd3'); } return g.outline('k'); }
export function lamp() { const g = new Grid(12, 34); g.rect(5, 8, 2, 25, 'n1'); g.rect(3, 31, 6, 2, 'n1'); g.rect(2, 2, 8, 7, 'n3'); g.rect(3, 3, 6, 5, 'y1'); g.rect(4, 4, 2, 2, 'w'); g.rect(1, 1, 10, 2, 'n1'); return g.outline('k'); }
export function campfire(f) {
  const g = new Grid(20, 22), s = [0, 1, 0, -1][f % 4];
  g.ell(10, 18, 8, 3, 'n2'); for (const x of [3, 6, 9, 12, 15]) g.ell(x + 1, 18, 1.8, 1.6, 'n3');
  g.line(4, 19, 15, 16, 'd1'); g.line(5, 16, 14, 19, 'd2');
  g.ell(10, 12 + s, 4, 5.4 + s, 'r2'); g.ell(10, 13 + s, 2.8, 4 + s, 'o1'); g.ell(10, 14, 1.6, 2.4, 'y1'); g.set(8 + s, 6, 'r2'); g.set(12 - s, 7, 'o1');
  return g.outline('k');
}
export function crate() { const g = new Grid(18, 16); g.rect(1, 3, 16, 12, 'd3'); g.rect(1, 3, 16, 2, 'd2'); g.rect(1, 13, 16, 2, 'd1'); g.rect(1, 3, 2, 12, 'd2'); g.rect(15, 3, 2, 12, 'd2'); g.line(3, 5, 14, 12, 'd2'); g.line(3, 12, 14, 5, 'd2'); return g.outline('k'); }
export function bench() { const g = new Grid(26, 18); g.rect(2, 2, 22, 3, 'd3'); g.rect(2, 4, 22, 1, 'd2'); g.rect(2, 8, 22, 3, 'd3'); g.rect(2, 10, 22, 1, 'd2'); g.rect(3, 11, 3, 5, 'd1'); g.rect(20, 11, 3, 5, 'd1'); g.rect(3, 5, 2, 4, 'd1'); g.rect(21, 5, 2, 4, 'd1'); return g.outline('k'); }
export function barrel() { const g = new Grid(14, 16); g.ell(7, 8, 5.5, 6.5, 'd2'); g.rect(2, 5, 10, 1, 'n2'); g.rect(2, 11, 10, 1, 'n2'); g.rect(4, 3, 2, 10, 'd3'); return g.outline('k'); }

export function lab() {
  const g = new Grid(104, 76);
  // roof
  for (let y = 0; y < 30; y++) { const ins = Math.round((29 - y) * 0.45); for (let x = 4 + ins; x < 100 - ins; x++) g.set(x, 4 + y, (y % 6 === 5) ? 'r1' : ((x + (Math.floor(y / 6) % 2) * 5) % 10 === 0 ? 'r1' : 'r2')); }
  g.rect(14, 33, 76, 2, 'r1'); g.rect(10, 4, 84, 2, 'o1');
  g.rect(78, 0, 8, 12, 'n2'); g.rect(78, 0, 8, 2, 'n3'); // chimney
  // walls
  g.rect(10, 35, 84, 38, 's1'); g.rect(10, 35, 84, 3, 's2'); for (let x = 10; x < 94; x += 6) g.rect(x, 38, 1, 35, 'd3'); g.rect(10, 70, 84, 3, 'n2');
  g.rect(10, 35, 3, 38, 'd2'); g.rect(91, 35, 3, 38, 'd2');
  for (const wx of [18, 70]) { g.rect(wx, 44, 16, 16, 'd1'); g.rect(wx + 2, 46, 12, 12, 'b3'); g.rect(wx + 2, 46, 12, 3, 'b4'); g.rect(wx + 7, 46, 2, 12, 'd1'); g.rect(wx + 2, 51, 12, 2, 'd1'); g.set(wx + 3, 48, 'w'); g.rect(wx - 1, 60, 18, 2, 'd2'); g.rect(wx + 1, 62, 3, 2, 'g3'); g.rect(wx + 5, 62, 3, 2, 'p2'); g.rect(wx + 10, 62, 3, 2, 'y1'); }
  g.rect(44, 46, 16, 27, 'd1'); g.rect(46, 48, 12, 25, 'd2'); g.rect(51, 48, 2, 25, 'd1'); g.set(55, 61, 'y1');
  g.rect(40, 72, 24, 3, 'n3'); g.rect(42, 70, 20, 2, 'n2');
  g.ell(52, 40, 4, 2.4, 'g3'); g.rect(51, 39, 2, 3, 'g1'); g.rect(47, 41, 10, 1, 'd1');
  return g.outline('k');
}
export function cabin() {
  const g = new Grid(70, 60);
  for (let y = 0; y < 22; y++) { const ins = Math.round((21 - y) * 0.5); for (let x = 2 + ins; x < 68 - ins; x++) g.set(x, 2 + y, y % 5 === 4 ? 'g1' : (x + y) % 7 === 0 ? 'g3' : 'g2'); }
  g.rect(8, 24, 54, 33, 'd3'); for (let y = 26; y < 57; y += 5) { g.rect(8, y, 54, 1, 'd2'); } g.rect(8, 55, 54, 2, 'd1'); g.rect(8, 24, 54, 2, 'd2');
  g.rect(8, 24, 3, 33, 'd2'); g.rect(59, 24, 3, 33, 'd2');
  g.rect(16, 34, 14, 12, 'd1'); g.rect(18, 36, 10, 8, 'y1'); g.rect(22, 36, 1, 8, 'd1'); g.rect(18, 40, 10, 1, 'd1'); g.rect(18, 36, 10, 2, 'w');
  g.rect(40, 34, 13, 23, 'd1'); g.rect(42, 36, 9, 21, 'd2'); g.set(49, 47, 'y1');
  g.rect(50, 6, 6, 10, 'n2'); g.rect(50, 6, 6, 1, 'n3');
  return g.outline('k');
}
export function hide() {
  const g = new Grid(64, 52);
  for (let y = 0; y < 14; y++) for (let x = 2 + Math.round((13 - y) * 0.2); x < 62 - Math.round((13 - y) * 0.2); x++) g.set(x, 4 + y, (x + y * 2) % 5 === 0 ? 's2' : y % 4 === 3 ? 'd3' : 's1');
  g.rect(6, 18, 52, 26, 'd2'); for (let y = 20; y < 44; y += 4) g.rect(6, y, 52, 1, 'd1'); g.rect(6, 18, 52, 2, 'd1');
  g.rect(10, 26, 16, 5, 'n1'); g.rect(38, 26, 16, 5, 'n1'); g.rect(10, 26, 16, 1, 'b2'); g.rect(38, 26, 16, 1, 'b2');
  g.rect(28, 28, 8, 16, 'n1'); g.rect(8, 44, 4, 6, 'd1'); g.rect(52, 44, 4, 6, 'd1'); g.rect(8, 42, 48, 2, 'd1');
  g.rect(14, 33, 5, 4, 'g3'); g.rect(44, 34, 6, 3, 'p2');
  return g.outline('k');
}
export function tent() {
  const g = new Grid(44, 34);
  for (let y = 0; y < 28; y++) { const hw = Math.round(y * 0.7) + 2; for (let x = 22 - hw; x <= 22 + hw; x++) g.set(x, 3 + y, Math.floor((x + 40) / 5) % 2 ? 'w' : 'y1'); }
  g.ell(22, 28, 4.6, 6, 'n1'); g.rect(18, 24, 9, 7, 'n1'); g.line(22, 3, 22, 30, 'o1'); g.line(22, 1, 22, 4, 'd1'); g.set(23, 1, 'r2');
  g.rect(3, 31, 38, 1, 'g1');
  return g.outline('k');
}
// pickups & decor
export function mushroom() { const g = new Grid(14, 14); g.rect(6, 7, 3, 6, 'w'); g.ell(7, 6, 5.4, 3.6, 'r2'); g.rect(2, 6, 11, 2, 'r2'); g.set(5, 4, 'w'); g.set(8, 3, 'w'); g.set(10, 6, 'w'); g.set(3, 6, 'w'); g.set(7, 5, 'w'); g.rect(6, 12, 3, 1, 'n3'); return g.outline('k'); }
export function fern(f) { const g = new Grid(20, 18), s = f % 2 ? 1 : 0; for (let i = -3; i <= 3; i++) { g.line(10, 16, 10 + i * 3 + s * (i > 0 ? 1 : -1), 16 - 11 + Math.abs(i) * 2, i % 2 ? 'g3' : 'g2'); g.line(10, 16, 10 + i * 2, 16 - 8 + Math.abs(i), 'g4'); } return g.outline('k'); }
export function leafPile() { const g = new Grid(16, 12); g.ell(8, 8, 6, 3, 'd1'); g.ell(6, 6, 3.4, 2.2, 'o1'); g.ell(10, 7, 3.4, 2.2, 'y1'); g.ell(8, 5, 3, 2, 'r2'); g.line(8, 3, 8, 8, 'd1'); return g.outline('k'); }
export function oakLeaf() { const g = new Grid(14, 14); g.ell(7, 7, 4, 5, 'g3'); for (const [x, y] of [[3, 4], [11, 4], [3, 8], [11, 8], [4, 11], [10, 11]]) g.ell(x, y, 1.6, 1.6, 'g3'); g.line(7, 1, 7, 13, 'g2'); g.set(6, 5, 'g4'); g.set(8, 9, 'g2'); return g.outline('k'); }
export function pawprint(f) { const g = new Grid(12, 12); const c = 'd1'; g.ell(6, 8, 2.6, 2, c); for (const [x, y] of [[2, 5], [5, 2], [8, 2], [10, 5]]) g.ell(x, y, 1.1, 1.3, c); if (f === 1) { g.set(1, 3, 'd1'); } return g; }
export function sparkle(f) { const g = new Grid(10, 10), r = [1, 2, 3, 2][f % 4]; g.line(5 - r, 5, 5 + r, 5, 'y1'); g.line(5, 5 - r, 5, 5 + r, 'y1'); g.set(5, 5, 'w'); if (r > 1) { g.set(4, 4, 'w'); g.set(6, 6, 'w'); } return g; }
export function ripple(f) { const g = new Grid(20, 12), r = 3 + f * 2; for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; g.set(10 + Math.cos(t) * r, 6 + Math.sin(t) * r * 0.5, f > 2 ? 'b3' : 'b4'); } g.set(10, 6, 'w'); return g; }
export function shell(k) { const g = new Grid(10, 8); if (k) { g.ell(5, 4, 3, 2.4, 'p2'); g.line(3, 6, 5, 2, 'w'); g.line(5, 2, 7, 6, 'w'); } else { g.ell(5, 4, 3.2, 2.2, 'w'); g.line(2, 4, 8, 4, 'n3'); g.set(7, 3, 'n3'); } return g.outline('k'); }
export function driftwood() { const g = new Grid(26, 10); g.rect(1, 3, 24, 4, 'd2'); g.rect(1, 3, 24, 1, 'd3'); g.rect(1, 6, 24, 1, 'd1'); g.line(8, 3, 11, 0, 'd2'); g.line(18, 6, 21, 9, 'd2'); return g.outline('k'); }
export function seaweed(f) { const g = new Grid(10, 14), s = f % 2; g.line(3, 13, 2 + s, 4, 'g1'); g.line(5, 13, 5 - s, 2, 'g2'); g.line(7, 13, 8 + s, 6, 'g1'); return g.outline('k'); }
export function boat() { const g = new Grid(44, 22); g.ell(22, 12, 20, 7, 'd2'); g.rect(0, 5, 44, 7, 'b2'); g.ell(22, 12, 17, 5, 'd3'); g.rect(4, 8, 36, 2, 'd1'); g.rect(10, 6, 24, 1, 'w'); g.rect(21, 0, 2, 8, 'd1'); return g.outline('k'); }
export function heartIcon() { const g = new Grid(9, 8); g.ell(2.5, 2.5, 2.2, 2.2, 'r2'); g.ell(6.5, 2.5, 2.2, 2.2, 'r2'); for (let y = 3; y < 8; y++) g.rect(y - 3 + 0, y, Math.max(0, 9 - 2 * (y - 3)), 1, 'r2'); g.set(2, 1, 'w'); return g.outline('k'); }
export function nestbox() { const g = new Grid(14, 20); g.rect(6, 12, 2, 8, 'd1'); g.rect(2, 3, 10, 10, 'd3'); g.rect(2, 3, 10, 2, 'd2'); g.rect(1, 2, 12, 2, 'd1'); g.ell(7, 8, 2, 2, 'k'); g.rect(2, 12, 10, 1, 'd1'); return g.outline('k'); }
