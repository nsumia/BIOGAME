// Browser-side bitmap helpers: palette grids -> canvases (cached), terrain layers, pixel text.
import { rgba } from './palette.js';
import { GLYPHS, LINE_H, textWidth } from './font.js';
import { renderTerrain, WATER_FRAMES, TS } from './tiles.js';
const cache = new WeakMap(), flipCache = new WeakMap();
export function gridToCanvas(g) {
  let c = cache.get(g); if (c) return c;
  c = document.createElement('canvas'); c.width = g.w; c.height = g.h;
  const ctx = c.getContext('2d'), im = ctx.createImageData(g.w, g.h);
  for (let i = 0; i < g.d.length; i++) { const v = rgba(g.d[i]); im.data[i * 4] = v[0]; im.data[i * 4 + 1] = v[1]; im.data[i * 4 + 2] = v[2]; im.data[i * 4 + 3] = v[3]; }
  ctx.putImageData(im, 0, 0); cache.set(g, c); return c;
}
export function flippedCanvas(g) { let c = flipCache.get(g); if (!c) { c = gridToCanvas(g.flipX()); flipCache.set(g, c); } return c; }
export function bufToCanvas(buf, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'), im = ctx.createImageData(w, h);
  const lut = []; for (let i = 0; i < 40; i++) lut.push(rgba(i));
  for (let i = 0; i < buf.length; i++) { const v = lut[buf[i]]; im.data[i * 4] = v[0]; im.data[i * 4 + 1] = v[1]; im.data[i * 4 + 2] = v[2]; im.data[i * 4 + 3] = 255; }
  ctx.putImageData(im, 0, 0); return c;
}
export function buildTerrainFrames(map) { const out = []; for (let f = 0; f < WATER_FRAMES; f++) out.push(bufToCanvas(renderTerrain(map, f), map.W * TS, map.H * TS)); return out; }
// pixel text
const tcache = new Map();
function glyphCanvas(ch, hex) {
  const k = ch + hex; let c = tcache.get(k); if (c) return c;
  const g = GLYPHS[ch] || GLYPHS['?']; c = document.createElement('canvas'); c.width = g.w; c.height = LINE_H - 1; const x = c.getContext('2d'); x.fillStyle = hex; for (const [i, j] of g.px) x.fillRect(i, j, 1, 1); tcache.set(k, c); return c;
}
export function drawText(ctx, s, x, y, hex = '#f6f2e7', shadow = '#1a1423', align = 'left', sc = 1) {
  if (align === 'center') x -= Math.floor(textWidth(s) * sc / 2); else if (align === 'right') x -= textWidth(s) * sc;
  x = Math.floor(x); y = Math.floor(y);
  for (const pass of shadow ? [shadow, hex] : [hex]) {
    let cx = x; const off = pass === shadow && shadow !== hex ? 1 : 0;
    for (const ch of s) { const g = GLYPHS[ch] || GLYPHS['?'], gc = glyphCanvas(ch, pass); ctx.drawImage(gc, cx + off * sc, y + off * sc, gc.width * sc, gc.height * sc); cx += (g.w + 1) * sc; }
    if (!shadow) break;
  }
}
