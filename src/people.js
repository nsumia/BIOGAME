// Procedural people sprites (player + NPCs) and portraits. Everything is drawn on palette-indexed grids.
import { Grid } from './pixel.js';

export const DIRS = ['d', 'u', 'l', 'r'];
const DEF = { skin: 'f1', hair: 'h1', hairStyle: 'short', top: 'b2', topS: 'b1', pants: 'n1', boots: 'd1', hat: null, hatS: null, coat: false, glasses: false, pack: 'g2', packS: 'g1', beard: false };

// Draw one person into grid g at offset (ox,oy). dir: d,u,r.  pose: walk (6 frames) | idle (4) ; opts.noArmR hides right arm (tool poses)
export function drawPerson(g, oIn, dir, pose, f, ox = 0, oy = 0, extra = {}) {
  const o = { ...DEF, ...oIn };
  const P = (x, y, c) => g.set(x + ox, y + oy, c);
  const R = (x, y, w, h, c) => g.rect(x + ox, y + oy, w, h, c);
  const E = (cx, cy, rx, ry, c) => g.ell(cx + ox, cy + oy, rx, ry, c);
  const p = (f / 6) * Math.PI * 2, sw = pose === 'walk' ? Math.sin(p) : 0;
  const b = pose === 'walk' ? ((f === 1 || f === 4) ? -1 : 0) : (pose === 'idle' && (f === 1 || f === 2) ? -1 : 0);
  const blink = pose === 'idle' && f === 3;
  const torsoBot = o.coat ? 19 : 16;
  const skinS = o.skin === 'f1' ? 'f2' : o.skin === 'f2' ? 'f3' : 'h1';
  if (dir === 'd' || dir === 'u') {
    // legs
    for (const side of [-1, 1]) {
      const lift = pose === 'walk' ? Math.max(0, Math.round(sw * side * -2)) : 0;
      const x0 = side < 0 ? 5 : 9;
      R(x0, 17, 2, 4 - lift, o.pants); R(x0, 21 - lift, 2, 1, o.boots);
      if (o.coat) R(x0, 17, 2, 2 - lift > 0 ? 2 : 0, o.top);
    }
    // arms
    const aL = Math.round(-sw * 1.5), aR = Math.round(sw * 1.5);
    const arm = (x, a) => { R(x, 12 + b + a, 2, 3, o.top); R(x, 15 + b + a, 2, 2, o.skin); R(x, 12 + b + a, 1, 3, o.topS); };
    arm(3, aL); if (!extra.noArmR) arm(11, aR);
    // torso
    R(5, 11 + b, 6, torsoBot - 10, o.top); R(5, torsoBot + b, 6, 1, o.topS);
    if (dir === 'd') {
      if (o.coat) { R(7, 12 + b, 2, 8, 'w'); R(5, 12 + b, 1, 7, o.topS); R(10, 12 + b, 1, 7, o.topS); R(9, 16 + b, 2, 2, o.topS); R(7, 11 + b, 2, 1, o.skin); }
      else { R(5, 11 + b, 1, 5, o.packS); R(10, 11 + b, 1, 5, o.packS); R(7, 11 + b, 2, 1, skinS); R(6, 15 + b, 4, 1, o.topS); }
    } else {
      R(4, 11 + b, 8, 6, o.pack); R(4, 16 + b, 8, 1, o.packS); R(5, 12 + b, 6, 1, 'g3'); R(6, 14 + b, 4, 2, o.packS);
      if (o.coat) { R(5, 17 + b, 6, 3, o.top); }
    }
    // head
    E(8, 6.5 + b, 4.2, 4, o.skin);
    if (dir === 'd') {
      E(8, 5.4 + b, 4.7, 3.3, o.hair);
      R(5, 6 + b, 6, 4, o.skin); P(4, 7 + b, o.skin); P(11, 7 + b, o.skin);
      if (o.hairStyle !== 'bald') { P(5, 6 + b, o.hair); P(10, 6 + b, o.hair); }
      if (o.hairStyle === 'long') { R(3, 6 + b, 2, 7, o.hair); R(11, 6 + b, 2, 7, o.hair); }
      if (o.hairStyle === 'bun') E(8, 1.5 + b, 2, 1.5, o.hair);
      if (o.hairStyle === 'curly') { E(8, 4 + b, 5.4, 3.6, o.hair); R(5, 6 + b, 6, 4, o.skin); }
      if (o.hairStyle === 'bald') { E(8, 5.4 + b, 4.4, 3.3, o.skin); R(4, 7 + b, 1, 2, o.hair); R(11, 7 + b, 1, 2, o.hair); }
      if (blink) { R(6, 8 + b, 1, 1, skinS); R(9, 8 + b, 1, 1, skinS); } else { P(6, 8 + b, 'k'); P(9, 8 + b, 'k'); }
      if (o.glasses) { R(5, 7 + b, 3, 1, 'n3'); R(8, 7 + b, 3, 1, 'n3'); P(5, 8 + b, 'n3'); P(7, 8 + b, 'n3'); P(8, 8 + b, 'n3'); P(10, 8 + b, 'n3'); if (!blink) { P(6, 8 + b, 'k'); P(9, 8 + b, 'k'); } }
      if (o.beard) { R(5, 9 + b, 6, 2, o.hair); R(7, 9 + b, 2, 1, skinS); }
      else P(8, 9 + b, skinS);
    } else {
      E(8, 6.3 + b, 4.7, 4.3, o.hair);
      if (o.hairStyle === 'long') R(3, 6 + b, 10, 7, o.hair);
      if (o.hairStyle === 'bun') E(8, 1.5 + b, 2, 1.5, o.hair);
      if (o.hairStyle === 'bald') E(8, 6.3 + b, 4.4, 4.1, o.skin);
    }
    if (o.hat) { E(8, 3.6 + b, 4.4, 2.6, o.hat); R(3, 5 + b, 10, 1, o.hatS || o.hat); R(4, 6 + b, 8, dir === 'd' ? 0 : 1, o.hatS || o.hat); if (dir === 'd') { R(5, 6 + b, 6, 1, o.hatS || o.hat); P(4, 6 + b, o.hatS); P(11, 6 + b, o.hatS); } }
  } else { // side, facing right
    const sx = Math.round(sw * 2.5);
    const legs = [[-1, o.pants === 'n1' ? 'n1' : o.pants], [1, o.pants]];
    for (const [side] of legs) {
      const lift = pose === 'walk' ? Math.max(0, Math.round(Math.cos(p) * side * -1.5)) : 0;
      const dx = side * sx, x0 = 7 + dx + (pose === 'walk' ? 0 : side);
      R(x0, 17, 3, 4 - lift, side < 0 ? (o.coat ? o.topS : 'n2') : o.pants);
      R(x0, 21 - lift, 3, 1, o.boots);
    }
    // far arm
    if (!extra.noArmR) { R(7 + Math.round(sw * 2), 12 + b, 2, 3, o.topS); R(7 + Math.round(sw * 2), 15 + b, 2, 1, skinS); }
    // pack (back is left)
    R(3, 11 + b, 4, 6, o.pack); R(3, 16 + b, 4, 1, o.packS); R(4, 12 + b, 2, 1, 'g3');
    R(6, 11 + b, 5, torsoBot - 10, o.top); R(6, torsoBot + b, 5, 1, o.topS);
    if (o.coat) { R(9, 15 + b, 2, 3, o.topS); R(6, 17 + b, 5, 3, o.top); }
    // head
    E(8.5, 6.5 + b, 4.2, 4, o.skin);
    E(7.6, 5.4 + b, 4.6, 3.4, o.hair); R(4, 6 + b, 4, 4, o.hair);
    R(9, 6 + b, 3, 4, o.skin); P(12, 8 + b, o.skin);
    if (o.hairStyle === 'long') R(4, 6 + b, 4, 7, o.hair);
    if (o.hairStyle === 'bun') E(5.5, 2.5 + b, 2, 1.8, o.hair);
    if (o.hairStyle === 'curly') E(7.5, 4.2 + b, 5, 3.6, o.hair);
    if (o.hairStyle === 'bald') { E(8.5, 5.4 + b, 4.2, 3.3, o.skin); R(4, 6 + b, 3, 3, o.hair); }
    if (blink) P(10, 7 + b, skinS); else P(10, 7 + b, 'k');
    if (o.glasses) { R(9, 7 + b, 3, 1, 'n3'); if (!blink) P(10, 7 + b, 'k'); }
    if (o.beard) { R(9, 9 + b, 3, 2, o.hair); }
    else P(11, 9 + b, skinS);
    // near arm
    if (!extra.noArmR) { const a = Math.round(-sw * 2.2); R(7 + a, 12 + b, 3, 3, o.top); R(7 + a, 12 + b, 3, 1, o.topS); R(7 + a, 15 + b, 3, 1, o.skin); }
    if (o.hat) { E(8.5, 3.6 + b, 4.3, 2.6, o.hat); R(4, 5 + b, 10, 1, o.hatS || o.hat); }
  }
}

const TOOLS = {
  net(g, x, y, ang, f) {
    const L = 9, tx = x + Math.cos(ang) * L, ty = y + Math.sin(ang) * L;
    g.line(x, y, tx, ty, 'd2');
    g.ell(tx + Math.cos(ang) * 1.5, ty + Math.sin(ang) * 1.5, 3.2, 3.2, 'd1');
    g.ell(tx + Math.cos(ang) * 1.5, ty + Math.sin(ang) * 1.5, 2.2, 2.2, 'w');
  },
  cam(g, x, y, ang, f) {
    g.rect(x - 3, y - 3, 7, 5, 'n1'); g.rect(x - 2, y - 2, 5, 1, 'n3'); g.rect(x, y - 1, 3, 3, 'n2'); g.set(x + 1, y, 'b3');
    if (f === 2) { g.set(x + 5, y - 4, 'y1'); g.set(x + 6, y - 5, 'w'); g.set(x + 4, y - 6, 'y1'); g.set(x + 6, y - 3, 'w'); g.set(x + 3, y - 4, 'w'); }
  },
  lens(g, x, y, ang, f) {
    const tx = x + Math.cos(ang) * 6, ty = y + Math.sin(ang) * 6 - [0, 1, 3, 1][f];
    g.line(x, y, tx, ty, 'd1'); g.ell(tx + Math.cos(ang) * 2, ty + Math.sin(ang) * 2, 3, 3, 'n3'); g.ell(tx + Math.cos(ang) * 2, ty + Math.sin(ang) * 2, 2, 2, 'b4');
  },
  jar(g, x, y, ang, f) {
    const dy = f; g.rect(x - 2, y - 3 + dy, 5, 6, 'b4'); g.rect(x - 2, y - 4 + dy, 5, 1, 'd2'); g.rect(x - 1, y + 1 + dy, 3, 2, 'b3');
  },
};
const DIRANG = { r: 0, d: Math.PI / 2, u: -Math.PI / 2 };
// 32x32 action sprite; person anchored with feet at (16,28)
export function actFrame(o, dir, f, tool) {
  const OX = 12, OY = 8, g = new Grid(40, 40), d = dir === 'l' ? 'r' : dir;
  drawPerson(g, o, d, 'idle', f === 1 || f === 2 ? 1 : 0, OX, OY, { noArmR: true });
  const hand = [OX + 11, OY + (d === 'u' ? 13 : 14)];
  let ang = DIRANG[d];
  if (tool === 'net') ang += (f - 1.5) * 0.85 * (d === 'u' ? -1 : 1);
  else ang = d === 'r' ? -0.2 : d === 'd' ? 1.1 : -1.1;
  const sh = [OX + 11, OY + 12];
  g.line(sh[0], sh[1], hand[0], hand[1], 'f1');
  if (d === 'u') g.set(sh[0], sh[1], o.top);
  const hx = hand[0] + (d === 'r' ? 1 : 0), hy = hand[1];
  TOOLS[tool](g, hx + (tool === 'net' ? 0 : d === 'r' ? 4 : 1), hy + (tool === 'net' ? 0 : d === 'd' ? 3 : d === 'u' ? -4 : 0), ang, f);
  g.outline('k');
  return dir === 'l' ? g.flipX() : g;
}
export function peopleSprite(o, dir, pose, f) {
  const g = new Grid(32, 32), d = dir === 'l' ? 'r' : dir;
  drawPerson(g, o, d, pose, f, 8, 6);
  g.outline('k');
  return dir === 'l' ? g.flipX() : g;
}

// 48x48 portrait (head and shoulders). mood: 'n','happy','wow','think'; talk: mouth open flag
export function portrait(oIn, mood = 'n', talk = false) {
  const o = { ...DEF, ...oIn }, g = new Grid(48, 48);
  const skinS = o.skin === 'f1' ? 'f2' : o.skin === 'f2' ? 'f3' : 'h1';
  // shoulders
  g.ell(24, 50, 20, 11, o.top); g.rect(4, 46, 40, 2, o.top);
  if (o.coat) { g.rect(18, 40, 12, 8, 'w'); g.rect(14, 42, 4, 6, 'w'); g.rect(30, 42, 4, 6, 'w'); g.rect(22, 44, 4, 4, o.top); g.line(20, 41, 24, 47, 'n3'); g.line(28, 41, 24, 47, 'n3'); }
  else { g.rect(19, 41, 10, 3, o.skin); g.rect(21, 44, 6, 1, o.skin); g.line(14, 40, 14, 47, o.topS); g.line(34, 40, 34, 47, o.topS); }
  // neck
  g.rect(20, 33, 8, 9, o.skin); g.rect(20, 36, 8, 2, skinS);
  // hair back (long)
  if (o.hairStyle === 'long') { g.ell(24, 26, 15, 15, o.hair); g.rect(9, 26, 30, 16, o.hair); }
  if (o.hairStyle === 'bun') g.ell(24, 5, 5, 4, o.hair);
  // head
  g.ell(24, 22, 12.5, 13.5, o.skin);
  g.ell(24, 33, 8, 4, o.skin);
  g.ell(11.5, 24, 1.6, 2.4, o.skin); g.ell(36.5, 24, 1.6, 2.4, o.skin);
  g.set(11, 24, skinS); g.set(36, 24, skinS);
  // hair top
  if (o.hairStyle !== 'bald') {
    g.ell(24, 14, 13.5, 8.5, o.hair);
    g.rect(11, 14, 3, 7, o.hair); g.rect(34, 14, 3, 7, o.hair);
    if (o.hairStyle === 'curly') { for (const [x, y] of [[13, 12], [18, 8], [24, 7], [30, 8], [35, 12], [12, 18], [36, 18]]) g.ell(x, y, 4, 4, o.hair); }
    // fringe
    for (let x = 14; x <= 34; x++) { const h = 17 + Math.round(2 * Math.sin(x * 0.9)); g.rect(x, 14, 1, h - 13, o.hair); }
    if (o.hairStyle === 'long') { g.rect(10, 17, 4, 14, o.hair); g.rect(34, 17, 4, 14, o.hair); }
  } else { g.ell(24, 13, 11, 5, 'f1'); g.rect(11, 20, 2, 5, o.hair); g.rect(35, 20, 2, 5, o.hair); }
  // hat
  if (o.hat) { g.ell(24, 11, 12.5, 7, o.hat); g.rect(8, 15, 32, 3, o.hatS || o.hat); g.rect(12, 14, 24, 1, o.hat); g.rect(14, 10, 20, 1, o.hatS || o.hat); }
  // face
  const ey = 24;
  const eye = (cx) => {
    g.rect(cx - 2, ey - 2, 5, 5, 'w'); g.rect(cx - 1, ey - 2, 3, 5, 'k'); g.rect(cx - 1, ey - 2, 1, 1, 'w');
    if (mood === 'wow') { g.rect(cx - 2, ey - 3, 5, 6, 'w'); g.rect(cx - 1, ey - 1, 3, 3, 'k'); g.set(cx - 1, ey - 1, 'w'); }
  };
  eye(18); eye(30);
  if (mood === 'happy') { g.rect(16, ey - 1, 5, 1, o.skin); g.rect(28, ey - 1, 5, 1, o.skin); g.line(16, ey, 20, ey, 'k'); g.line(28, ey, 32, ey, 'k'); g.line(16, ey + 1, 20, ey + 1, o.skin); g.line(28, ey + 1, 32, ey + 1, o.skin); }
  const bc = o.hairStyle === 'bald' || o.beard ? o.hair : o.hair;
  const by = mood === 'wow' ? ey - 5 : mood === 'think' ? ey - 4 : ey - 4;
  g.line(15, by + (mood === 'think' ? 1 : 0), 21, by - (mood === 'think' ? 1 : 0), bc); g.line(27, by - (mood === 'think' ? 0 : 0), 33, by, bc);
  g.rect(23, 26, 2, 4, skinS);
  g.rect(14, 29, 3, 2, 'p2'); g.rect(31, 29, 3, 2, 'p2');
  if (o.beard) { g.ell(24, 34, 9, 5, o.hair); g.rect(16, 28, 3, 7, o.hair); g.rect(29, 28, 3, 7, o.hair); }
  // mouth
  const my = 34;
  if (talk) { g.rect(21, my - 1, 6, 4, 'k'); g.rect(22, my + 1, 4, 1, 'r2'); }
  else if (mood === 'wow') { g.rect(22, my - 1, 4, 3, 'k'); }
  else if (mood === 'think') { g.line(21, my, 27, my - 1, 'k'); }
  else { g.line(20, my - 1, 21, my, 'k'); g.line(21, my, 27, my, 'k'); g.line(27, my, 28, my - 1, 'k'); }
  if (o.beard && !talk) { g.rect(21, my - 1, 7, 1, o.hair); g.rect(22, my, 5, 1, 'k'); }
  // glasses
  if (o.glasses) { for (const cx of [18, 30]) { g.rect(cx - 4, ey - 4, 9, 1, 'n1'); g.rect(cx - 4, ey + 3, 9, 1, 'n1'); g.rect(cx - 4, ey - 4, 1, 8, 'n1'); g.rect(cx + 4, ey - 4, 1, 8, 'n1'); } g.rect(22, ey - 1, 5, 1, 'n1'); }
  g.outline('k');
  return g;
}
