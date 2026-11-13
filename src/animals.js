// Procedural wildlife sprites (side views face RIGHT; flip for left). All return Grid with 1px outline.
import { Grid, view } from './pixel.js';

const lerp = (a, b, t) => a + (b - a) * t;
function thick(g, x0, y0, x1, y1, r, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1) * 2; for (let i = 0; i <= n; i++) g.ell(lerp(x0, x1, i / n), lerp(y0, y1, i / n), r, r, c); }
const padded = (w, h, oy) => { const G = new Grid(w, h); return [G, view(G, 0, oy)]; };

export function deer(mode, f) {
  const [G, g] = padded(36, 34, 4), p = (f / 4) * Math.PI * 2;
  const walk = mode === 'walk' || mode === 'run', amp = mode === 'run' ? 4 : 2.6;
  const bob = walk ? (f % 2 ? -1 : 0) : 0;
  const leg = (x, ph, far) => {
    const dx = walk ? Math.round(Math.sin(p + ph) * amp) : 0, lift = walk ? Math.max(0, Math.round(Math.cos(p + ph) * 2)) : 0;
    g.line(x, 17 + bob, x + dx, 26 - lift, far ? 'd1' : 'd2'); g.line(x + 1, 17 + bob, x + 1 + dx, 26 - lift, far ? 'd1' : 'd2'); g.set(x + dx, 26 - lift, 'k'); g.set(x + 1 + dx, 26 - lift, 'k');
  };
  leg(9, Math.PI, true); leg(21, 0, true);
  g.ell(15, 14 + bob, 9.5, 4.8, 'd2'); g.ell(15, 17 + bob, 8, 2, 'd3'); g.ell(8, 13 + bob, 2.4, 3, 'w'); g.rect(5, 12 + bob, 1, 2, 'd2');
  g.ell(10, 12 + bob, 4, 2, 'd3');
  leg(7, 0, false); leg(19, Math.PI, false);
  // neck and head
  const down = mode === 'graze' && f === 0, alert = mode === 'alert';
  let hx, hy;
  if (down) { thick(g, 22, 12 + bob, 27, 19, 2.3, 'd2'); hx = 29; hy = 21; }
  else { thick(g, 22, 12 + bob, 26, 6 + (alert ? -1 : 0), 2.3, 'd2'); hx = 28; hy = 5 + (alert ? -1 : 0); }
  g.ell(hx, hy, 3.8, 2.6, 'd2'); g.ell(hx + 2, hy + 1, 2.2, 1.6, 'd3'); g.set(hx + 4, hy + 1, 'k'); g.set(hx + 1, hy - 1, 'k');
  const ey = down ? hy - 3 : hy - 3;
  g.ell(hx - 1, ey, 1.1, 2, 'd2'); g.set(hx - 1, ey, 'p2'); g.ell(hx + 2, ey + 0.5, 1.1, 1.8, 'd2');
  return G.outline('k');
}
export function fox(mode, f) {
  const g = new Grid(34, 18), p = (f / 4) * Math.PI * 2, walk = mode === 'walk' || mode === 'run';
  const bob = walk ? (f % 2 ? -1 : 0) : 0, amp = mode === 'run' ? 3.5 : 2.2;
  const leg = (x, ph, c) => { const dx = walk ? Math.round(Math.sin(p + ph) * amp) : 0, lift = walk ? Math.max(0, Math.round(Math.cos(p + ph) * 1.6)) : 0; g.line(x, 10 + bob, x + dx, 15 - lift, c); g.set(x + dx, 15 - lift, 'n1'); g.set(x + dx, 14 - lift, 'n1'); };
  leg(10, Math.PI, 'n1'); leg(22, 0, 'n1');
  const tw = mode === 'sit' ? (f % 2 ? -1 : 1) : (walk ? Math.round(Math.sin(p) * 1) : 0);
  g.ell(6, 9 + tw + bob, 6, 2.6, 'o1'); g.ell(1.5, 9 + tw + bob, 2.2, 2, 'w'); g.set(6, 8 + tw + bob, 'r2');
  g.ell(15, 9 + bob, 8, 3.8, 'o1'); g.ell(15, 11 + bob, 6, 1.6, 'w'); g.ell(11, 7 + bob, 3, 1.4, 'r2');
  leg(8, 0, 'n1'); leg(24, Math.PI, 'n1');
  g.ell(25, 6 + bob, 4, 3.2, 'o1'); g.ell(28.5, 7.5 + bob, 2.6, 1.6, 'w'); g.set(31, 7 + bob, 'k'); g.set(25, 5 + bob, 'k');
  g.line(23, 3 + bob, 23, 1 + bob, 'o1'); g.line(26, 3 + bob, 27, 1 + bob, 'o1'); g.set(23, 1 + bob, 'n1'); g.set(27, 1 + bob, 'n1');
  return g.outline('k');
}
export function kit(f) {
  const g = new Grid(18, 14), b = f % 2 ? -1 : 0;
  g.ell(7, 8 + b, 5, 3, 'o1'); g.ell(3, 9, 3, 1.6, 'o1'); g.set(1, 9, 'w'); g.ell(12, 6 + b, 3, 2.6, 'o1'); g.ell(14.5, 7 + b, 1.8, 1.2, 'w'); g.set(15, 6 + b, 'k'); g.set(12, 5 + b, 'k');
  g.line(11, 3 + b, 11, 2 + b, 'o1'); g.line(13, 3 + b, 14, 2 + b, 'o1');
  g.line(5, 10, 5, 12, 'n1'); g.line(9, 10, 9, 12, 'n1');
  return g.outline('k');
}
export function frog(mode, f) {
  const g = new Grid(18, 14);
  if (mode === 'idle') {
    const pf = f % 2;
    g.ell(8, 8, 5, 3.5 + pf * 0.4, 'g3'); g.ell(8, 9.5, 3.5, 1.5, 'g4'); g.ell(4, 10, 2, 1.4, 'g2'); g.ell(12, 10, 2, 1.4, 'g2');
    g.ell(5.5, 4.5, 1.6, 1.6, 'g3'); g.ell(10.5, 4.5, 1.6, 1.6, 'g3'); g.set(5, 4, 'k'); g.set(11, 4, 'k'); g.set(6, 4, 'y1'); g.set(10, 4, 'y1');
    g.set(8, 6 + pf, 'g1'); g.set(6, 8, 'g2'); g.set(10, 7, 'g2');
  } else {
    const t = [0.2, 0.7, 1][f % 3]; const sx = 3 + t * 5;
    g.ell(sx + 3, 7 - t * 2, 4 + t, 2.8, 'g3'); g.ell(sx + 5, 5.5 - t * 2, 1.6, 1.4, 'g3'); g.set(sx + 6, 5 - t * 2, 'k');
    g.line(sx, 9 - t * 2, sx - 3 * t - 1, 11, 'g2'); g.line(sx - 3 * t - 1, 11, sx - 3 * t - 3, 11, 'g2'); g.line(sx + 5, 9 - t * 2, sx + 7, 11, 'g2'); g.ell(sx + 3, 8 - t * 2, 3, 1.2, 'g4');
  }
  return g.outline('k');
}
const BF = { painted: ['o1', 'k', 'w'], blue: ['b3', 'b1', 'w'], brimstone: ['y1', 'g5', 'o1'], moth: ['n3', 'n2', 'w'] };
export function butterfly(kind, f) {
  const [m, a, d] = BF[kind], g = new Grid(16, 14), ww = [5, 3.5, 1.5, 3.5][f % 4];
  const cx = 8, cy = 7;
  for (const s of [-1, 1]) {
    g.ell(cx + s * (ww / 2 + 1), cy - 2, ww / 2 + 1.2, 3.2, m); g.ell(cx + s * (ww / 2 + 0.8), cy + 2.2, ww / 2 + 0.6, 2.2, m);
    if (ww > 2) { g.set(Math.round(cx + s * (ww / 2 + 1.5)), cy - 3, a); g.set(Math.round(cx + s * (ww / 2 + 2)), cy - 1, d); g.set(Math.round(cx + s * (ww / 2 + 1)), cy + 2, a); }
  }
  g.rect(cx - 0.5 | 0, cy - 3, 1, 7, 'k'); g.set(cx - 1, cy - 4, 'k'); g.set(cx + 1, cy - 4, 'k');
  return g.outline('k');
}
export function ladybird(f) {
  const g = new Grid(10, 10);
  g.ell(5, 5.5, 3.2, 3.5, 'r2'); g.rect(5, 3, 1, 6, 'k'); g.set(3, 4, 'k'); g.set(7, 4, 'k'); g.set(3, 7, 'k'); g.set(7, 7, 'k'); g.set(4, 6, 'k'); g.ell(5, 2, 1.6, 1.2, 'k'); g.set(3, 3, 'w'); g.set(7, 3, 'w');
  if (f % 2) { g.set(1, 5, 'k'); g.set(9, 6, 'k'); g.set(1, 8, 'k'); g.set(9, 4, 'k'); } else { g.set(1, 6, 'k'); g.set(9, 5, 'k'); g.set(1, 4, 'k'); g.set(9, 7, 'k'); }
  return g.outline('k');
}
export function bee(f) {
  const g = new Grid(14, 12);
  g.ell(7, 7, 4, 2.8, 'y1'); g.rect(5, 5, 1, 5, 'k'); g.rect(8, 5, 1, 5, 'k'); g.ell(11, 7, 2, 2, 'k'); g.set(12, 6, 'w'); g.set(1, 7, 'k');
  const up = f % 2 ? 4 : 2; g.ell(6, up, 2.5, 1.6, 'b4'); g.ell(8.5, up + 0.5, 2, 1.3, 'b4');
  return g.outline('k');
}
export function dragonfly(f) {
  const g = new Grid(22, 16), cy = 8, wy = [3, 5, 2, 5][f % 4];
  g.line(2, cy, 16, cy, 'b2'); g.line(2, cy + 1, 14, cy + 1, 'b1'); g.ell(18, cy, 2.4, 2, 'g3'); g.set(19, cy - 1, 'r2'); g.set(18, cy - 1, 'k');
  for (const sx of [10, 13]) { g.ell(sx, cy - wy, 4, 1.2, 'b4'); g.ell(sx - 1, cy + wy + 1, 4, 1.2, 'b4'); }
  return g.outline('k');
}
export function robin(mode, f) {
  const g = new Grid(18, 16);
  if (mode === 'fly') {
    const wy = [-4, -1, 3, 0][f % 4];
    g.ell(8, 8, 4, 2.6, 'd2'); g.ell(12, 6.5, 2.2, 2, 'd2'); g.set(14, 6, 'k'); g.set(15, 7, 'y1'); g.ell(11.5, 8.5, 2, 1.6, 'o1'); g.line(3, 9, 0, 10, 'd1');
    g.ell(7, 6 + wy, 3.5, 1.6, 'd1'); g.ell(8, 8 - wy / 2, 3, 1.3, 'd3');
  } else {
    const hop = mode === 'hop' ? (f % 2 ? -3 : -1) : 0, hd = mode === 'idle' && f % 2 ? 1 : 0;
    g.ell(8, 9 + hop, 4.2, 3.4, 'd2'); g.ell(11.5, 7 + hop + hd, 2.6, 2.4, 'd2'); g.ell(11, 9.5 + hop, 2.8, 2.6, 'o1'); g.set(12, 6 + hop + hd, 'k'); g.set(14, 7 + hop + hd, 'y1');
    g.line(3, 9 + hop, 0, 11 + hop, 'd1'); g.line(7, 12 + hop, 7, 14, 'd1'); g.line(10, 12 + hop, 10, 14, 'd1');
  }
  return g.outline('k');
}
export function heron(mode, f) {
  const [G, g] = padded(30, 46, 2);
  const st = mode === 'walk' ? (f % 2 ? 2 : -2) : 0, bob = mode === 'idle' && f % 2 ? 1 : 0;
  g.line(13, 24, 13 + st, 41, 'd3'); g.line(17, 24, 17 - st, 41, 'd3'); g.rect(11 + st, 41, 4, 1, 'd3'); g.rect(15 - st, 41, 4, 1, 'd3');
  g.ell(14, 21, 8, 5, 'n3'); g.ell(9, 22, 5.5, 3, 'n2'); g.ell(14, 24, 6, 2.5, 'w'); g.line(2, 21, 7, 20, 'n2');
  thick(g, 20, 18, 22, 8 + bob, 1.2, 'w'); thick(g, 22, 8 + bob, 20, 6 + bob, 1.2, 'w');
  g.ell(21, 5 + bob, 3, 2.5, 'w'); g.rect(19, 3 + bob, 5, 1, 'k'); g.line(24, 6 + bob, 29, 7 + bob, 'y1'); g.set(22, 5 + bob, 'k'); g.line(15, 3 + bob, 20, 4 + bob, 'k');
  return G.outline('k');
}
// bird silhouettes in flight for the bird-hide mini-game (4 frames)
export function birdFly(kind, f) {
  const wy = [-5, -2, 3, 1][f % 4];
  if (kind === 'goldfinch') {
    const g = new Grid(24, 18); g.ell(11, 10, 5, 2.6, 'd3'); g.ell(16, 8.5, 2.6, 2.3, 'w'); g.set(17, 8, 'r2'); g.set(18, 8, 'k'); g.set(19, 9, 'w'); g.line(6, 11, 1, 12, 'k');
    g.ell(10, 8 + wy, 4, 1.8, 'k'); g.rect(9, 8 + wy, 4, 1, 'y1'); g.ell(11, 10 - wy / 2, 3, 1.4, 'n1'); return g.outline('k');
  }
  if (kind === 'sparrowhawk') {
    const g = new Grid(36, 24); g.ell(16, 13, 8, 3.4, 'n2'); g.ell(16, 15, 6, 1.6, 'd3'); g.ell(25, 11, 3.2, 2.8, 'n2'); g.set(27, 10, 'y1'); g.set(28, 10, 'k'); g.rect(28, 12, 2, 2, 'k'); g.line(30, 13, 29, 14, 'n3');
    g.line(8, 14, 0, 16, 'n1'); g.line(8, 15, 0, 18, 'n1');
    g.ell(15, 9 + wy * 1.3, 7, 2.4, 'n1'); g.ell(14, 8 + wy * 1.3, 4, 1, 'n2'); g.ell(16, 14 - wy, 5, 1.8, 'n1'); return g.outline('k');
  }
  const g = new Grid(44, 30); g.ell(20, 16, 8, 3.2, 'n3'); thick(g, 27, 15, 30, 12, 1.2, 'w'); g.ell(32, 11, 2.6, 2, 'w'); g.line(34, 11, 42, 12, 'y1'); g.set(32, 10, 'k'); g.line(10, 16, 1, 17, 'd3'); g.line(10, 17, 1, 19, 'd3');
  g.ell(19, 11 + wy * 1.7, 10, 2.6, 'n2'); g.ell(18, 10 + wy * 1.7, 6, 1, 'n3'); g.ell(20, 17 - wy, 7, 2, 'n1'); return g.outline('k');
}
export function fish(f) {
  const g = new Grid(18, 10), t = [-1, 0, 1, 0][f % 4];
  g.ell(8, 5, 5, 2.4, 'b1'); g.ell(8, 4, 3.5, 1, 'b2'); g.line(13, 5, 16, 5 + t * 2, 'b1'); g.line(13, 5, 16, 4 + t, 'b1'); g.line(13, 5, 16, 7 + t * 2, 'b1'); g.set(4, 4, 'b4'); g.set(11, 4, 'b3');
  return g; // no outline: seen through water
}
export function crab(f) {
  const g = new Grid(20, 14), s = f % 2 ? 1 : 0, cl = [0, -1, 0, 1][f % 4];
  g.ell(10, 8, 5.4, 3.2, 'r2'); g.ell(10, 7, 3.4, 1.4, 'o1');
  g.set(8, 4, 'k'); g.set(12, 4, 'k'); g.line(8, 5, 8, 4, 'r2'); g.line(12, 5, 12, 4, 'r2');
  g.line(5, 7, 2, 4 + cl, 'r2'); g.ell(2, 3 + cl, 2, 1.6, 'r1'); g.line(15, 7, 18, 4 - cl, 'r2'); g.ell(18, 3 - cl, 2, 1.6, 'r1');
  for (const x of [6, 8]) g.line(x, 10, x - 2 + s, 12, 'r1'); for (const x of [12, 14]) g.line(x, 10, x + 2 - s, 12, 'r1');
  return g.outline('k');
}
export function starfish(kind = 'o') {
  const g = new Grid(16, 16), c = kind === 'o' ? 'o1' : 'p2', c2 = kind === 'o' ? 'r2' : 'p1';
  const cx = 8, cy = 8;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; for (let r = 0; r < 7; r++) g.ell(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.8 - r * 0.15, 1.8 - r * 0.15, c); g.set(Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 4), c2); }
  g.ell(cx, cy, 2.5, 2.5, c); g.set(cx, cy, c2);
  return g.outline('k');
}
export function anemone(f) {
  const g = new Grid(14, 14), w = f % 2 ? 1 : -1;
  g.ell(7, 10, 4.5, 3, 'r1'); for (let i = -4; i <= 4; i++) g.line(7 + i, 9, 7 + i * 1.3 + (Math.abs(i) < 3 ? w * 0 : w), 4 - (4 - Math.abs(i)) * 0.4, i % 2 ? 'r2' : 'o1');
  g.rect(4, 11, 7, 1, 'r1');
  return g.outline('k');
}
export function otter(mode, f) {
  const g = new Grid(40, 18), p = f / 4 * Math.PI * 2;
  if (mode === 'swim') {
    const b = Math.round(Math.sin(p) * 1);
    g.ell(10, 11 + b, 8, 2.6, 'd1'); g.ell(22, 9 + b, 3.6, 3, 'd2'); g.ell(26, 10 + b, 2.4, 1.8, 'd3'); g.set(27, 9 + b, 'k'); g.set(29, 10 + b, 'k'); g.set(24, 7 + b, 'k');
    g.set(21, 6 + b, 'd2'); g.line(1, 12 + b, 3, 11 + b, 'd1'); g.set(27, 12 + b, 'w'); g.set(28, 12 + b, 'w');
    g.ell(10, 14, 12, 1, 'b4'); g.rect(30, 13, 4, 1, 'b4');
  } else {
    const bob = mode === 'walk' ? (f % 2 ? -1 : 0) : 0, amp = 2;
    const leg = (x, ph) => { const dx = mode === 'walk' ? Math.round(Math.sin(p + ph) * amp) : 0; g.line(x, 11 + bob, x + dx, 15, 'd1'); g.set(x + dx, 15, 'k'); };
    leg(9, Math.PI); leg(25, 0);
    g.ell(8, 9.5 + bob, 9, 2.8, 'd2'); g.ell(8, 11 + bob, 7, 1.2, 'd3'); g.line(0, 11 + bob, 4, 10 + bob, 'd1');
    leg(7, 0); leg(27, Math.PI);
    g.ell(23, 8 + bob, 7, 3, 'd2'); g.ell(31, 7 + bob, 3.6, 2.8, 'd2'); g.ell(34, 8.5 + bob, 2.2, 1.6, 'd3'); g.set(36, 7 + bob, 'k'); g.set(31, 6 + bob, 'k'); g.set(29, 4 + bob, 'd1'); g.set(35, 10 + bob, 'w'); g.set(34, 10 + bob, 'w');
  }
  return g.outline('k');
}
export function hatchling(f) {
  const g = new Grid(18, 14), s = f % 2 ? 1 : -1;
  g.ell(8, 7, 5, 3.4, 'd1'); g.ell(8, 6, 3.4, 2, 'd2'); g.rect(8, 4, 1, 4, 'd1'); g.ell(14, 6, 2.2, 1.8, 'd3'); g.set(15, 5, 'k');
  g.line(6, 9, 3 + s, 12, 'd3'); g.line(11, 9, 13 - s, 12, 'd3'); g.line(4, 6, 1, 4 + s, 'd3'); g.line(11, 5, 12, 2 - s, 'd3'); g.set(3, 8, 'd3');
  return g.outline('k');
}
export function mayfly() {
  const g = new Grid(18, 10);
  g.ell(7, 5, 5, 1.8, 'd3'); g.ell(12, 5, 1.8, 1.6, 'd2'); g.set(13, 4, 'k'); g.line(2, 5, 0, 3, 'd1'); g.line(2, 5, 0, 5, 'd1'); g.line(2, 5, 0, 7, 'd1');
  for (const x of [5, 7, 9]) { g.line(x, 6, x - 1, 8, 'd1'); } g.rect(6, 3, 1, 2, 'd2'); g.rect(9, 3, 1, 2, 'd2');
  return g.outline('k');
}
export function fireflyIcon() { const g = new Grid(14, 12); g.ell(7, 7, 3.4, 2, 'n1'); g.ell(10, 7, 1.6, 1.4, 'n1'); g.ell(4, 7, 2.2, 1.6, 'y1'); g.ell(4, 7, 1.2, 1, 'w'); g.ell(6, 3, 2.5, 1.4, 'b4'); g.ell(8, 3.5, 2, 1.2, 'b4'); return g.outline('k'); }
export function spiderIcon() { const g = new Grid(14, 12); g.ell(7, 6, 2.2, 2, 'd1'); g.ell(7, 3.5, 1.4, 1.2, 'd1'); for (const d of [-1, 1]) for (const y of [2, 4, 6, 8]) g.line(7 + d, y + 1, 7 + d * 5, y - 1 + (y > 4 ? 3 : 0), 'k'); return g; }
export function tit(f) {
  const g = new Grid(18, 16), hop = 0;
  g.ell(8, 9, 4.2, 3.4, 'b2'); g.ell(8.5, 10.5, 3.4, 2.4, 'y1'); g.ell(11.5, 6, 2.8, 2.5, 'w'); g.ell(11, 4.6, 2.4, 1.3, 'b3'); g.set(12, 5, 'k'); g.set(14, 6, 'k'); g.rect(10, 5, 4, 1, 'k');
  g.line(3, 9, 0, 11, 'b1'); g.line(7, 12, 7, 14, 'k'); g.line(10, 12, 10, 14, 'k'); g.rect(5, 8, 3, 1, 'b3');
  return g.outline('k');
}
