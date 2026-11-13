// Canvas renderer: draws a Core state at 480x270 logical resolution.
import { SPR, OBJ_SPR } from './sprites.js';
import { gridToCanvas, flippedCanvas, buildTerrainFrames, drawText } from './gfx.js';
import { HEX, C } from './palette.js';
import { textWidth, wrap, LINE_H } from './font.js';
import { SPECIES, MISSIONS, SPEAKERS, NPCS } from './data.js';
import { fmtClock, fmtTime, speciesCount } from './logic.js';
export const VW = 480, VH = 270, TS = 16;
const col = n => HEX[C[n]];
const INK = col('k'), WHITE = col('w'), YEL = col('y1');

export class Renderer {
  constructor(canvas, core) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.core = core; this.ctx.imageSmoothingEnabled = false;
    this.terrain = buildTerrainFrames(core.map); this.map = core.map;
    this.statics = core.map.objs; this.t = 0;
    this.hits = [];
  }
  // sprite helpers ------------------------------------------------------
  spr(name, x, y, frame = 0, flip = false, alpha = 1, sc = 1) {
    const s = SPR[name]; if (!s) throw new Error('missing sprite ' + name);
    const n = s.frames.length, fi = Number.isFinite(frame) ? ((Math.floor(frame) % n) + n) % n : 0, g = s.frames[fi], ctx = this.ctx, cvs = flip ? flippedCanvas(g) : gridToCanvas(g), ax = flip ? g.w - 1 - s.ax : s.ax;
    const dx = Math.round(x - ax * sc - this.cx), dy = Math.round(y - s.ay * sc - this.cy);
    if (dx > VW || dy > VH || dx + g.w * sc < 0 || dy + g.h * sc < 0) return;
    if (alpha < 1) ctx.globalAlpha = alpha; if (sc === 1) ctx.drawImage(cvs, dx, dy); else ctx.drawImage(cvs, dx, dy, g.w * sc, g.h * sc); if (alpha < 1) ctx.globalAlpha = 1;
  }
  fr(name, t, fps) { const s = SPR[name]; return Math.floor(t * (fps ?? s.fps)) % s.frames.length; }
  shadow(x, y, w) { const ctx = this.ctx; ctx.fillStyle = 'rgba(26,20,35,0.28)'; const px = Math.round(x - this.cx), py = Math.round(y - this.cy); ctx.fillRect(px - w / 2 | 0, py - 1, w, 2); ctx.fillRect((px - w / 2 | 0) + 1, py - 2, w - 2, 1); ctx.fillRect((px - w / 2 | 0) + 1, py + 1, w - 2, 1); }
  hit(x, y, w, h, fn) { this.hits.push({ x, y, w, h, fn }); }
  rect(x, y, w, h, c) { this.ctx.fillStyle = c; this.ctx.fillRect(x, y, w, h); }
  panel(x, y, w, h, bg = 'rgba(26,20,35,0.88)', border = col('n3')) { const c = this.ctx; c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = border; c.fillRect(x, y, w, h); c.fillStyle = bg; c.fillRect(x + 1, y + 1, w - 2, h - 2); c.fillStyle = INK; c.fillRect(x, y, 1, 1); c.fillRect(x + w - 1, y, 1, 1); c.fillRect(x, y + h - 1, 1, 1); c.fillRect(x + w - 1, y + h - 1, 1, 1); }
  text(s, x, y, c = WHITE, align = 'left', sh = INK, sc = 1) { drawText(this.ctx, s, x, y, c, sh, align, sc); }
  // main ----------------------------------------------------------------
  draw(dt) {
    const core = this.core, ctx = this.ctx; this.t += dt; const t = this.t;
    ctx.imageSmoothingEnabled = false; this.hits = [];
    if (core.mode === 'title') { this.drawTitle(); return; }
    if (core.watch) { this.drawWatch(); this.drawOverlays(); return; }
    this.cx = Math.round(core.cam.x); this.cy = Math.round(core.cam.y);
    this.drawWorld(t);
    if (core.mode === 'end') this.drawEnd(); else this.drawHud();
    this.drawOverlays();
  }
  drawOverlays() {
    const core = this.core, ctx = this.ctx;
    if (core.dlg) this.drawDialogue(); if (core.quiz) this.drawQuiz();
    if (core.mode === 'journal') this.drawJournal(); if (core.mode === 'pause') this.drawPause();
    if (core.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, core.flash * 3)})`; ctx.fillRect(0, 0, VW, VH); }
    if (core.fade) { const f = core.fade.t, a = f < 0.8 ? f / 0.8 : Math.max(0, 1 - (f - 0.8) / 0.8); ctx.fillStyle = `rgba(20,14,30,${Math.min(1, a)})`; ctx.fillRect(0, 0, VW, VH); }
  }
  tint(hour) {
    const K = [[8, 255, 232, 205], [9.5, 255, 248, 235], [12, 255, 255, 255], [15, 255, 250, 238], [16.5, 255, 232, 190], [17.5, 255, 196, 140], [18.5, 220, 150, 160], [19.5, 120, 110, 180], [21, 80, 80, 150]];
    let a = K[0], b = K[K.length - 1]; for (let i = 0; i < K.length - 1; i++) if (hour >= K[i][0] && hour <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; break; }
    const f = a === b ? 0 : (hour - a[0]) / (b[0] - a[0]); return [1, 2, 3].map(i => Math.round(a[i] + (b[i] - a[i]) * Math.max(0, Math.min(1, f))));
  }
  drawWorld(t) {
    const core = this.core, ctx = this.ctx, cx = this.cx, cy = this.cy, map = this.map;
    ctx.drawImage(this.terrain[Math.floor(t * 5) % this.terrain.length], cx, cy, VW, VH, 0, 0, VW, VH);
    const inView = (x, y, m = 40) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m + 40;
    // ground layer decals
    for (const o of this.statics) {
      if (o.layer !== 0 || !inView(o.x, o.y)) continue;
      const k = o.k;
      if (k === 'flower') this.spr('flower_' + o.c, o.x, o.y, t * 1.6 + o.ph);
      else if (k === 'tuft') this.spr('tuft', o.x, o.y, t * 2 + o.ph);
      else if (k === 'lily') this.spr('lily', o.x, o.y, t * 0.8 + o.ph);
      else if (k === 'fern') this.spr('fern', o.x, o.y, t * 1.4 + o.ph);
      else if (k === 'shell') this.spr('shell', o.x, o.y, o.v);
      else if (k === 'seaweed') this.spr('seaweed', o.x, o.y, t * 1.5 + o.ph);
      else this.spr(OBJ_SPR[k], o.x, o.y);
    }
    for (const pr of core.prints) this.spr('pawprint', pr.x, pr.y, pr.flip, false, pr.done ? 0.7 : 1);
    for (const a of core.animals) if (a.kind === 'fish' && !a.hidden && inView(a.x, a.y)) this.spr('fish', a.x, a.y, t * 6 + a.id, a.dir < 0, 0.8);
    for (const a of core.animals) if (a.cls === 'ins' && a.z > 0 && inView(a.x, a.y)) this.shadow(a.x, a.y, 5);
    // sorted objects
    const list = [];
    for (const o of this.statics) { if (o.layer === 0 || !inView(o.x, o.y, 60)) continue; list.push({ y: o.y, o, s: 0 }); }
    for (const n of core.npcs) list.push({ y: n.y, n, s: 1 });
    for (const a of core.animals) if (!a.hidden && a.kind !== 'fish' && inView(a.x, a.y)) list.push({ y: a.y + (a.kind === 'heron' ? 0 : 0), a, s: 2 });
    for (const it of core.items) list.push({ y: it.y - 1, it, s: 3 });
    list.push({ y: core.p.y, pl: true, s: 4 });
    list.sort((u, v) => u.y - v.y);
    for (const e of list) {
      if (e.o) this.drawObj(e.o, t); else if (e.n) this.drawNpc(e.n, t); else if (e.a) this.drawAnimal(e.a, t); else if (e.it) this.drawItem(e.it, t); else this.drawPlayer(t);
    }
    // particles
    for (const q of core.parts) {
      const x = Math.round(q.x - cx), y = Math.round(q.y - cy);
      if (q.kind === 'fly') continue;
      ctx.globalAlpha = Math.max(0, 1 - q.t / q.life); ctx.fillStyle = col(q.c); ctx.fillRect(x, y, q.s, q.s); ctx.globalAlpha = 1;
    }
    this.drawLight(t);
    // quest markers & prompt (above light)
    if (core.mode === 'play' || core.mode === 'dialogue') this.drawMarkers(t);
  }
  drawObj(o, t) {
    const k = o.k;
    if (k === 'oak' || k === 'oak_autumn' || k === 'pine') {
      const sw = Math.round(Math.sin(t * 1.2 + o.ph) * 1.1); this.shadow(o.x, o.y, k === 'pine' ? 18 : 22);
      this.spr('trunk', o.x, o.y);
      if (k === 'pine') this.spr('pine_canopy', o.x + sw, o.y - 6, 0);
      else this.spr(k + '_canopy', o.x + sw, o.y - 14, 0);
      return;
    }
    if (k === 'bush') { this.shadow(o.x, o.y - 1, 18); this.spr('bush' + (o.v || 0), o.x, o.y + 1); return; }
    if (k === 'reed') { this.spr('reed', o.x, o.y + 2, t * 1.4 + o.ph); return; }
    if (k === 'mushroom_d') { this.spr('mushroom_d', o.x, o.y); return; }
    if (k === 'campfire') { this.spr('campfire', o.x, o.y + 3, t * 8); return; }
    if (k === 'lamp') { this.spr('lamp', o.x, o.y); return; }
    if (k === 'bench') { this.spr('bench', o.x, o.y); return; }
    if (k === 'rock' || k === 'rock2') { this.shadow(o.x, o.y - 1, 16); this.spr(k, o.x, o.y + 1); return; }
    this.spr(OBJ_SPR[k], o.x, o.y);
  }
  drawNpc(n, t) { this.shadow(n.x, n.y, 12); this.spr(`npc_${n.id}_${n.dir}`, n.x, n.y, t * 2.2 + n.t); }
  drawPlayer(t) {
    const p = this.core.p; this.shadow(p.x, p.y, 12);
    if (p.act) { const f = Math.min(3, Math.floor(p.act.t / p.act.dur * 4)); this.spr(`player_${p.act.tool}_${p.dir}`, p.x, p.y, f); }
    else if (p.moving) this.spr(`player_walk_${p.dir}`, p.x, p.y, p.ft);
    else this.spr(`player_idle_${p.dir}`, p.x, p.y, t * 2.5);
  }
  drawItem(it, t) {
    const b = Math.sin(it.t * 3) * 1.5;
    if (it.spr === 'ripple') { this.spr('ripple', it.x, it.y, it.t * 3); this.spr('sparkle', it.x + 5, it.y - 4 + b, it.t * 6); return; }
    if (it.spr !== 'sparkle') this.spr(it.spr, it.x, it.y);
    this.spr('sparkle', it.x + 4, it.y - 10 + b, it.t * 6);
  }
  drawAnimal(a, t) {
    const flip = a.dir < 0; let name = null, frame = 0, y = a.y;
    switch (a.kind) {
      case 'deer': if (a.st === 'flee') { name = 'deer_run'; frame = t * 12; } else if (a.st === 'walk' || a.st === 'return') { name = 'deer_walk'; frame = t * 7; } else if (a.st === 'away') name = 'deer_alert'; else { name = 'deer_graze'; frame = a.head ? 1 : 0; } this.shadow(a.x, a.y, 26); break;
      case 'fox': name = 'fox_sit'; frame = t * 2; this.shadow(a.x, a.y, 20); break;
      case 'kit': name = 'kit'; frame = t * 3 + a.id; this.shadow(a.x, a.y, 10); break;
      case 'otter': name = 'otter_swim'; frame = t * 5; break;
      case 'hatchling': name = 'hatchling'; frame = a.st === 'follow' || a.st === 'swim' ? t * 7 : 0; this.shadow(a.x, a.y, 9); break;
      case 'robin': name = a.st === 'fly' ? 'robin_fly' : a.st === 'hop' ? 'robin_hop' : 'robin_idle'; frame = a.st === 'fly' ? t * 12 : a.st === 'hop' ? 0 : t * 2 + a.id; y = a.y - (a.z || 0); if (a.st !== 'fly') this.shadow(a.x, a.y, 8); break;
      case 'frog': name = a.st === 'jump' ? 'frog_jump' : 'frog_idle'; frame = a.st === 'jump' ? (1 - a.stT / 0.5) * 3 : t * 2 + a.id; this.shadow(a.x, a.y, 10); break;
      case 'heron': if (a.st === 'fly') { name = 'bird_heron'; frame = t * 8; y = a.y - a.z; } else { name = 'heron_idle'; frame = t * 1 + a.id; this.shadow(a.x, a.y, 14); } break;
      case 'crab': name = 'crab'; frame = a.st === 'walk' || a.st === 'flee' ? t * 8 : 0; this.shadow(a.x, a.y, 12); break;
      default:
        if (a.cls === 'ins') { const kind = a.kind.slice(4); name = kind === 'painted' || kind === 'blue' || kind === 'brimstone' ? 'butterfly_' + kind : kind; frame = t * SPR[name].fps + a.id; y = a.y - a.z; }
    }
    if (name) this.spr(name, a.x, y, frame, flip);
  }
  drawLight(t) {
    const core = this.core, ctx = this.ctx, h = core.prog.clock;
    const [r, g, b] = this.tint(h);
    if (r < 255 || g < 255 || b < 255) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0, 0, VW, VH); ctx.globalCompositeOperation = 'source-over'; }
    if (h > 17.2) {
      const k = Math.min(1, (h - 17.2) / 1.5); ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, rad, a, c = '255,200,100') => { for (let i = 3; i > 0; i--) { ctx.fillStyle = `rgba(${c},${a * k / 3})`; const rr = rad * i / 3; ctx.beginPath(); ctx.arc(Math.round(x - this.cx), Math.round(y - this.cy), rr, 0, 6.3); ctx.fill(); } };
      for (const o of this.statics) { if (o.k === 'lamp' && o.x > this.cx - 40 && o.x < this.cx + VW + 40) glow(o.x, o.y - 24, 34, 0.35); if (o.k === 'campfire' && o.x > this.cx - 40 && o.x < this.cx + VW + 40) glow(o.x, o.y - 8, 42, 0.45, '255,150,60'); }
      for (const q of core.parts) if (q.kind === 'fly') { const a = 0.5 + 0.5 * Math.sin(q.ph + t * 3); const x = q.x + Math.sin(q.t * 1.3 + q.ph) * 12, y = q.y + Math.cos(q.t * 0.9 + q.ph) * 8; glow(x, y, 6, 0.8 * a * Math.min(1, q.t) * Math.min(1, (q.life - q.t)), '255,240,120'); ctx.fillStyle = `rgba(255,255,200,${a * k})`; ctx.fillRect(Math.round(x - this.cx), Math.round(y - this.cy), 1, 1); }
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  drawMarkers(t) {
    const core = this.core, s = core.step();
    if (s && s.t === 'talk' && core.mode === 'play') { const n = core.npcs.find(n => n.id === s.npc); this.marker(n.x, n.y - 36, t); }
    const pr = core.prompt(); if (pr) { const x = Math.round(pr.x - this.cx), y = Math.round(pr.y - this.cy) - (pr.kind === 'npc' || pr.kind === 'chat' ? 44 : 22); const w = textWidth(pr.text) + 8; this.panel(x - w / 2 | 0, y, w, 13, 'rgba(26,20,35,0.92)'); this.text(pr.text, x, y + 3, YEL, 'center'); }
  }
  marker(x, y, t) { const b = Math.round(Math.sin(t * 4) * 2); this.text('!', Math.round(x - this.cx), Math.round(y - this.cy) + b, YEL, 'center', INK, 2); }
  // HUD ---------------------------------------------------------------
  drawHud() {
    const core = this.core, ctx = this.ctx, P = core.prog, m = core.mission(), s = core.step();
    if (core.mode === 'play' || core.mode === 'dialogue' || core.mode === 'quiz' || core.mode === 'fade') {
      if (m && s) {
        let prog = null; if (s.t === 'catch') prog = [P.n, s.n]; else if (s.t === 'collect') prog = [P.got.length, s.items.length]; else if (s.t === 'trail') prog = [P.n, s.pts.length];
        const lines = wrap(s.hud || '', 152), h = 28 + lines.length * LINE_H + (prog ? 12 : 0); this.panel(4, 4, 164, h);
        this.text(`MISSION ${P.mi + 1}/${MISSIONS.length}`, 9, 8, col('n3')); this.text(m.title.toUpperCase(), 9, 19, YEL);
        lines.forEach((l, i) => this.text(l, 9, 31 + i * LINE_H, WHITE));
        if (prog) { const bx = 9, by = 31 + lines.length * LINE_H + 2; for (let i = 0; i < prog[1]; i++) { this.rect(bx + i * 12, by, 10, 6, INK); this.rect(bx + i * 12 + 1, by + 1, 8, 4, i < prog[0] ? col('g4') : col('n1')); } this.text(`${prog[0]}/${prog[1]}`, 162, by - 2, WHITE, 'right'); }
      }
      const clock = fmtClock(P.clock); const w = 132; this.panel(VW - w - 4, 4, w, 34);
      this.text(clock, VW - w + 4, 8, WHITE); this.text(`SPECIES ${speciesCount(P)}/${Object.keys(SPECIES).length}`, VW - 9, 8, col('g5'), 'right');
      this.text(core.zone ? core.zone.name : '', VW - w + 4, 20, col('s1'), 'left');
      const hh = P.clock; this.rect(VW - w + 4, 30, w - 10, 2, col('n1')); this.rect(VW - w + 4, 30, Math.round((w - 10) * Math.max(0, Math.min(1, (hh - 8) / 12))), 2, hh > 17.5 ? col('o1') : col('y1'));
      this.drawCompass();
      const tool = s && ({ catch: ['NET', 'net'], photo: ['CAMERA', 'cam'], collect: [s.tool === 'jar' ? 'JAR' : 'LENS', s.tool], trail: ['LENS', 'lens'] })[s.t] || ['NET', 'net'];
      this.panel(4, VH - 22, 56, 18); this.text(tool[0] + ' (E)', 9, VH - 17, col('s1'));
      let ty = 42; for (const t of core.toasts) { const a = Math.min(1, t.t * 4, (t.life - t.t) * 3); ctx.globalAlpha = a; this.drawToast(t, ty); ctx.globalAlpha = 1; ty += t.kind === 'lesson' ? 30 : 17; }
    }
    if (core.banner) { const b = core.banner, a = Math.min(1, b.t * 3, (b.life - b.t) * 2); ctx.globalAlpha = a; this.panel(VW / 2 - 110, 90 - (1 - a) * 10, 220, 46, 'rgba(26,20,35,0.92)', col('y1')); this.text(b.text, VW / 2, 98 - (1 - a) * 10, YEL, 'center', INK, 2); this.text(b.sub, VW / 2, 120 - (1 - a) * 10, WHITE, 'center'); ctx.globalAlpha = 1; }
    if (core.zoneBanner && core.mode === 'play') { const z = core.zoneBanner, a = Math.min(1, z.t * 2, (2.6 - z.t) * 2); ctx.globalAlpha = a; this.text(core.zone.name, VW / 2, 170, WHITE, 'center', INK, 2); ctx.globalAlpha = 1; }
  }
  drawToast(t, y) {
    if (t.kind === 'lesson') { const lines = wrap(t.text, 250); const h = 14 + lines.length * LINE_H; this.panel(VW / 2 - 130, y, 260, h, 'rgba(36,70,58,0.95)', col('g4')); this.text('FIELD NOTE', VW / 2, y + 3, col('g5'), 'center'); lines.forEach((l, i) => this.text(l, VW / 2, y + 13 + i * LINE_H, WHITE, 'center')); return; }
    const txt = (t.kind === 'discover' ? 'NEW  ' : '') + t.text, w = textWidth(txt) + (t.icon ? 30 : 12); const x = VW / 2 - w / 2 | 0;
    this.panel(x, y, w, 15, t.kind === 'discover' ? 'rgba(60,40,90,0.95)' : 'rgba(26,20,35,0.92)', t.kind === 'discover' ? col('y1') : col('n3'));
    if (t.icon) { const s = SPR[t.icon]; if (s) { const g = s.frames[0], sc = g.h > 24 ? 0.5 : 1; this.ctx.save(); this.ctx.beginPath(); this.ctx.rect(x + 2, y + 1, 20, 13); this.ctx.clip(); this.ctx.drawImage(gridToCanvas(g), x + 12 - g.w / 2 * sc | 0, y + 8 - g.h / 2 * sc | 0, g.w * sc, g.h * sc); this.ctx.restore(); } }
    this.text(txt, x + (t.icon ? 24 : 6), y + 4, t.kind === 'discover' ? YEL : WHITE);
  }
  drawCompass() {
    const core = this.core; if (core.mode !== 'play') return; const o = core.objective(); if (!o) return;
    const x = o.x - this.cx, y = o.y - this.cy; if (x > 16 && x < VW - 16 && y > 16 && y < VH - 16) return;
    const px = core.p.x - this.cx, py = core.p.y - this.cy - 10, a = Math.atan2(y - py, x - px);
    const ex = Math.max(14, Math.min(VW - 14, VW / 2 + Math.cos(a) * 400)), ey = Math.max(36, Math.min(VH - 14, VH / 2 + Math.sin(a) * 400));
    const ctx = this.ctx; ctx.save(); ctx.translate(Math.round(ex), Math.round(ey)); ctx.rotate(a);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-3, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = YEL; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-4, -6); ctx.lineTo(-2, 0); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // dialogue ----------------------------------------------------------
  drawDialogue() {
    const d = this.core.dlg, ctx = this.ctx, [who, text, mood = 'n'] = d.lines[d.i], sp = SPEAKERS[who];
    const x = 8, y = 188, w = 464, h = 74; this.panel(x, y, w, h, 'rgba(26,20,35,0.95)');
    let tx = x + 10;
    if (sp) {
      const bg = col(sp.bg); ctx.fillStyle = INK; ctx.fillRect(x + 7, y + 8, 56, 56); ctx.fillStyle = bg; ctx.fillRect(x + 8, y + 9, 54, 54);
      const talk = d.chars < text.length && Math.floor(this.t * 9) % 2 === 0;
      const g = SPR[`portrait_${who}_${mood}_${talk ? 1 : 0}`].frames[0]; ctx.drawImage(gridToCanvas(g), x + 11, y + 12);
      tx = x + 72;
      const nm = sp.name + (d.radio ? '  (radio)' : ''); const nw = textWidth(nm) + 10; this.panel(tx - 2, y - 7, nw, 14, col('p1'), col('p2')); this.text(nm, tx + 3, y - 4, WHITE);
    }
    const shown = text.slice(0, Math.floor(d.chars)), lines = wrap(text, w - (tx - x) - 12), sl = wrap(shown + (shown.length < text.length ? '' : ''), w - (tx - x) - 12);
    // wrap full text for stable layout, reveal by char count
    let rem = Math.floor(d.chars); lines.forEach((l, i) => { const part = l.slice(0, Math.max(0, rem)); rem -= l.length + 1; if (part) this.text(part, tx, y + 10 + i * LINE_H, WHITE); });
    if (d.chars >= text.length && Math.floor(this.t * 2.5) % 2 === 0) { ctx.fillStyle = YEL; ctx.fillRect(x + w - 16, y + h - 12, 7, 1); ctx.fillRect(x + w - 15, y + h - 11, 5, 1); ctx.fillRect(x + w - 14, y + h - 10, 3, 1); ctx.fillRect(x + w - 13, y + h - 9, 1, 1); }
  }
  drawQuiz() {
    const q = this.core.quiz, cur = q.list[q.qi], ctx = this.ctx; const x = 40, y = this.core.watch ? 118 : 46, w = 400;
    const ql = wrap(cur.q, w - 20), h = 30 + ql.length * LINE_H + cur.opts.length * 17 + (q.state !== 'ask' ? 36 : 0);
    this.panel(x, y, w, h, 'rgba(26,20,35,0.97)', col('y1')); this.text('QUESTION ' + (q.qi + 1) + '/' + q.list.length, x + 10, y + 6, YEL);
    ql.forEach((l, i) => this.text(l, x + 10, y + 18 + i * LINE_H, WHITE)); let oy = y + 22 + ql.length * LINE_H;
    cur.opts.forEach((o, i) => {
      const wrong = q.wrong.includes(i), right = q.state === 'right' && i === cur.a, sel = q.sel === i && q.state === 'ask';
      this.rect(x + 8, oy - 2, w - 16, 14, right ? col('g2') : sel ? col('p1') : wrong ? col('r1') : col('n1')); if (sel) this.rect(x + 8, oy - 2, 2, 14, YEL);
      this.text(String.fromCharCode(65 + i) + '  ' + o, x + 14, oy + 1, wrong ? col('n3') : WHITE); this.hit(x + 8, oy - 2, w - 16, 14, () => { if (q.state === 'ask') { if (!wrong) { q.sel = i; this.core.quizChoose(i); } } }); oy += 17;
    });
    if (q.state === 'wrong') { wrap('Not quite. ' + cur.hint, w - 20).forEach((l, i) => this.text(l, x + 10, oy + 2 + i * LINE_H, col('o1'))); this.text('Press E to try again', x + w - 10, y + h - 12, col('n3'), 'right'); }
    if (q.state === 'right') { wrap('Correct! ' + cur.fact, w - 20).forEach((l, i) => this.text(l, x + 10, oy + 2 + i * LINE_H, col('g5'))); this.text('Press E to continue', x + w - 10, y + h - 12, col('n3'), 'right'); }
  }
  // bird hide scene
  drawWatch() {
    const core = this.core, w = core.watch, ctx = this.ctx, t = this.t, round = w.s.rounds[Math.min(w.r, w.s.rounds.length - 1)];
    for (let y = 0; y < 130; y += 6) { ctx.fillStyle = [col('b4'), col('b4'), col('b3'), col('b3'), col('b3'), col('b3')][Math.min(5, y / 22 | 0)]; ctx.fillRect(0, y, VW, 6); }
    ctx.fillStyle = col('y1'); ctx.beginPath(); ctx.arc(390, 50, 16, 0, 6.3); ctx.fill(); ctx.fillStyle = col('w'); ctx.beginPath(); ctx.arc(390, 50, 11, 0, 6.3); ctx.fill();
    for (let x = 0; x < VW; x++) { const h1 = 120 + Math.sin(x * 0.018) * 10 + Math.sin(x * 0.05) * 4, h2 = 135 + Math.sin(x * 0.03 + 2) * 8; ctx.fillStyle = col('g2'); ctx.fillRect(x, h1, 1, 150); ctx.fillStyle = col('g3'); ctx.fillRect(x, h2, 1, 150); }
    for (let y = 150; y < VH; y += 2) for (let x = (y % 4) * 2; x < VW; x += 16) { ctx.fillStyle = (Math.floor(x / 16 + t * 2 + y) % 3) ? col('b2') : col('b3'); ctx.fillRect(x, y, 10, 1); }
    ctx.fillStyle = col('b2'); ctx.globalAlpha = 0.35; ctx.fillRect(0, 150, VW, VH - 150); ctx.globalAlpha = 1;
    this.cx = 0; this.cy = 0;
    for (let i = 0; i < 14; i++) this.spr('reed', 20 + i * 36, 230 + (i % 3) * 12, t * 1.4 + i, i % 2 === 1, 1, 2);
    // bird
    const kind = round.bird, sc = kind === 'heron' ? 2 : 3;
    if (w.phase === 'fly' || w.phase === 'quiz' || w.phase === 'say') { const prog = w.phase === 'fly' ? Math.min(1, w.t / 3.4) : w.phase === 'say' ? 0 : 1; const bx = w.phase === 'quiz' ? 240 : -40 + prog * 300, by = 70 + Math.sin(prog * 6 + t) * 6; this.spr('bird_' + kind, bx + 20, by + 30, t * 8, false, 1, sc); }
    // slit frame
    ctx.fillStyle = col('d1'); ctx.fillRect(0, 0, VW, 14); ctx.fillRect(0, VH - 8, VW, 8); ctx.fillStyle = col('k'); ctx.fillRect(0, 14, VW, 2); ctx.fillRect(0, VH - 10, VW, 2);
    this.text('BIRD HIDE', VW / 2, 3, col('s1'), 'center');
    ctx.fillStyle = 'rgba(255,200,120,0.12)'; ctx.fillRect(0, 0, VW, VH);
  }
  // screens -----------------------------------------------------------
  drawTitle() {
    const core = this.core, ctx = this.ctx, t = this.t, m = this.map;
    const tx = (Math.sin(t * 0.12) * 0.5 + 0.5), cx = 250 + tx * 230, cy = 70 + tx * 60; this.cx = Math.round(cx); this.cy = Math.round(cy);
    core.cam.x = cx; core.cam.y = cy; const save = core.prog.clock; core.prog.clock = 16.3 + Math.sin(t * 0.1) * 0.2;
    const ox = core.p.x, oy = core.p.y; core.p.x = -500; core.p.y = -500; this.drawWorld(t); core.p.x = ox; core.p.y = oy; core.prog.clock = save; this.cx = 0; this.cy = 0;
    ctx.fillStyle = 'rgba(26,20,35,0.35)'; ctx.fillRect(0, 0, VW, VH);
    this.panel(VW / 2 - 150, 38, 300, 74, 'rgba(26,20,35,0.8)', col('y1'));
    this.text('LANTERNFEN', VW / 2, 48, YEL, 'center', INK, 4); this.text('FIELD NOTES', VW / 2, 86, WHITE, 'center', INK, 3);
    this.spr('butterfly_painted', VW / 2 - 168 + Math.sin(t * 2) * 8, 70 + Math.sin(t * 3) * 4, t * 10, false, 1, 2); this.spr('butterfly_blue', VW / 2 + 168 + Math.sin(t * 2.4) * 8, 74 + Math.cos(t * 3) * 4, t * 10, true, 1, 2); this.spr('butterfly_brimstone', VW / 2 - 190 + Math.cos(t * 1.7) * 10, 150 + Math.sin(t * 2.2) * 6, t * 9, false, 1, 2);
    const opts = core.saveData ? ['Continue', 'New Game'] : ['New Game']; opts.forEach((o, i) => { const sel = core.menu.sel === i; if (sel) this.panel(VW / 2 - 60, 140 + i * 22, 120, 16, 'rgba(111,71,132,0.95)', col('y1')); this.text((sel ? '> ' : '') + o, VW / 2, 144 + i * 22, sel ? YEL : WHITE, 'center'); this.hit(VW / 2 - 60, 140 + i * 22, 120, 16, () => { core.menu.sel = i; core.press('act'); }); });
    this.text('WASD/Arrows move   E interact   Shift run   J journal', VW / 2, 232, col('s1'), 'center'); this.text('A cozy field-science adventure   about 15 minutes', VW / 2, 246, col('n3'), 'center');
    ctx.fillStyle = INK; ctx.fillRect(0, VH - 4, VW, 4);
  }
  drawPause() {
    const ctx = this.ctx; ctx.fillStyle = 'rgba(26,20,35,0.6)'; ctx.fillRect(0, 0, VW, VH);
    this.panel(VW / 2 - 80, 80, 160, 90); this.text('PAUSED', VW / 2, 90, YEL, 'center', INK, 2);
    ['Resume', this.core.muted ? 'Sound: OFF' : 'Sound: ON', 'Save and Quit'].forEach((o, i) => { const sel = this.core.pauseSel === i; if (sel) this.rect(VW / 2 - 70, 114 + i * 17 - 2, 140, 14, col('p1')); this.text((sel ? '> ' : '') + o, VW / 2, 114 + i * 17, sel ? YEL : WHITE, 'center'); this.hit(VW / 2 - 70, 114 + i * 17 - 2, 140, 14, () => { this.core.pauseSel = i; this.core.press('act'); }); });
  }
  drawEnd() {
    const core = this.core, ctx = this.ctx, P = core.prog; ctx.fillStyle = 'rgba(26,20,35,0.78)'; ctx.fillRect(0, 0, VW, VH);
    this.panel(60, 24, 360, 222, 'rgba(26,20,35,0.95)', col('y1'));
    this.text('SEASON COMPLETE', VW / 2, 34, YEL, 'center', INK, 3);
    this.text('You helped prove Lanternfen Reserve is thriving.', VW / 2, 66, WHITE, 'center');
    const rows = [['Play time', fmtTime(P.time)], ['Missions', `${P.done.length}/${MISSIONS.length}`], ['Species logged', `${speciesCount(P)}/${Object.keys(SPECIES).length}`], ['Photos taken', String(P.photos)], ['Quiz slips', String(P.mistakes)]];
    rows.forEach((r, i) => { this.text(r[0], 120, 88 + i * 16, col('n3')); this.text(r[1], 360, 88 + i * 16, WHITE, 'right'); });
    const rank = speciesCount(P) >= 24 ? 'Master Naturalist' : speciesCount(P) >= 20 ? 'Field Scientist' : 'Junior Naturalist'; this.text('Rank: ' + rank, VW / 2, 170, col('g5'), 'center', INK, 2);
    this.text('Open the journal anytime to finish your collection.', VW / 2, 194, col('s1'), 'center'); this.text('Press E to return to the title', VW / 2, 210, YEL, 'center');
    // pixel fireworks of discovered species icons
    const ids = Object.keys(P.journal); ids.slice(0, 12).forEach((id, i) => { const s = SPR[SPECIES[id].sprite]; if (!s) return; const g = s.frames[0]; const x = 70 + i * 28, y = 238 - Math.abs(Math.sin(this.t * 2 + i)) * 6; ctx.drawImage(gridToCanvas(g), x, y - g.h * 0.5, g.w * 0.5, g.h * 0.5); });
  }
  drawJournal() {
    const core = this.core, ctx = this.ctx, jr = core.jr, P = core.prog; ctx.fillStyle = 'rgba(26,20,35,0.7)'; ctx.fillRect(0, 0, VW, VH);
    this.panel(10, 8, 460, 254, 'rgba(60,40,28,0.97)', col('d3')); this.rect(12, 10, 456, 250, col('s1')); this.rect(14, 12, 452, 246, col('d3')); this.rect(16, 14, 448, 242, col('s1'));
    ['SPECIES', 'MISSIONS'].forEach((n, i) => { this.rect(20 + i * 80, 18, 76, 14, jr.tab === i ? col('d1') : col('d2')); this.hit(20 + i * 80, 18, 76, 14, () => { jr.tab = i; jr.sel = 0; }); this.text(n, 58 + i * 80, 21, jr.tab === i ? YEL : col('s1'), 'center'); });
    this.text('FIELD JOURNAL', 440, 21, col('d1'), 'right', null); this.text('TAB switch   Arrows select   J close', 240, 247, col('d1'), 'center', null);
    const ids = Object.keys(SPECIES);
    if (jr.tab === 0) {
      ids.forEach((id, i) => {
        const cx = 22 + (i % 7) * 34, cy = 38 + Math.floor(i / 7) * 34, got = P.journal[id] !== undefined; this.hit(cx, cy, 32, 32, () => { jr.sel = i; }); this.rect(cx, cy, 32, 32, jr.sel === i ? col('y1') : col('d2')); this.rect(cx + 1, cy + 1, 30, 30, got ? col('g5') : col('d1'));
        const s = SPR[SPECIES[id].sprite], g = s.frames[0], sc = g.w > 28 || g.h > 28 ? 0.5 : 1;
        if (got) ctx.drawImage(gridToCanvas(g), cx + 16 - g.w * sc / 2 | 0, cy + 16 - g.h * sc / 2 | 0, g.w * sc, g.h * sc); else this.text('?', cx + 16, cy + 10, col('d2'), 'center', null, 2);
      });
      const id = ids[jr.sel], got = P.journal[id] !== undefined, sp = SPECIES[id], x = 266;
      this.rect(x, 38, 192, 196, col('d3')); this.rect(x + 2, 40, 188, 192, col('w'));
      if (got) {
        const s = SPR[sp.sprite], g = s.frames[Math.floor(this.t * 3) % s.frames.length], sc = Math.max(1, Math.min(3, Math.floor(60 / g.w), Math.floor(56 / g.h)));
        this.rect(x + 6, 44, 180, 62, col('g4')); ctx.drawImage(gridToCanvas(g), x + 96 - g.w * sc / 2 | 0, 75 - g.h * sc / 2 | 0, g.w * sc, g.h * sc);
        this.text(sp.name, x + 96, 112, col('d1'), 'center', null); this.text(sp.latin, x + 96, 124, col('p1'), 'center', null); this.text(sp.group.toUpperCase(), x + 96, 136, col('g2'), 'center', null);
        wrap(sp.fact, 176).forEach((l, i) => this.text(l, x + 8, 150 + i * LINE_H, col('n1'), 'left', null)); this.text('Found at ' + fmtTime(P.journal[id]), x + 96, 222, col('n2'), 'center', null);
      } else { this.text('? ? ?', x + 96, 100, col('n3'), 'center', null, 2); this.text('Not discovered yet.', x + 96, 130, col('n2'), 'center', null); this.text(sp.group + ' - explore, scan and net wildlife!', x + 96, 144, col('n2'), 'center', null); }
      this.text(`${Object.keys(P.journal).length}/${ids.length} discovered`, 22, 190, col('d1'), 'left', null); this.text('Net, lens and camera reveal more species.', 22, 204, col('d2'), 'left', null);
    } else {
      MISSIONS.forEach((m, i) => {
        const y = 38 + i * 16, done = P.done.includes(m.id), cur = i === P.mi; this.hit(22, y - 1, 200, 15, () => { jr.sel = i; }); this.rect(22, y - 1, 200, 15, jr.sel === i ? col('y1') : col('d3')); this.rect(23, y, 198, 13, done ? col('g5') : cur ? col('w') : col('d2'));
        this.text(`${i + 1}. ${done || cur ? m.title : '???'}`, 28, y + 2, done ? col('g1') : cur ? col('p1') : col('d1'), 'left', null); if (done) this.text('DONE', 216, y + 2, col('g2'), 'right', null);
      });
      const m = MISSIONS[jr.sel], done = P.done.includes(m.id), x = 232;
      this.rect(x, 38, 228, 196, col('d3')); this.rect(x + 2, 40, 224, 192, col('w'));
      this.text(done || jr.sel === P.mi ? m.title : 'Unknown mission', x + 8, 46, col('p1'), 'left', null, 1); this.text('From ' + NPCS[m.giver].name, x + 8, 58, col('d1'), 'left', null);
      if (done) { this.text('WHAT YOU LEARNED', x + 8, 80, col('g2'), 'left', null); wrap(m.lesson, 208).forEach((l, i) => this.text(l, x + 8, 92 + i * LINE_H, col('n1'), 'left', null)); }
      else this.text(jr.sel === P.mi ? 'In progress. Check the hint at top-left.' : 'Complete earlier missions first.', x + 8, 80, col('n2'), 'left', null);
    }
  }
}
