// Game simulation core: player, world entities, mission engine, dialogue, quiz. No DOM; runs in node for tests.
import { rng } from './pixel.js';
import { T } from './tiles.js';
import { zoneAt, bfs } from './map.js';
import { NPCS, SPECIES, MISSIONS, DIALOGUE, QUIZZES, RADIO, CHAT } from './data.js';
import * as L from './logic.js';

const TS = 16, WALK = 58, RUN = 92;
const DV = { d: [0, 1], u: [0, -1], l: [-1, 0], r: [1, 0] };
const tilePx = (p) => ({ x: p.x * TS + 8, y: p.y * TS + 13 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Core {
  constructor(map, seed = 7) {
    this.map = map; this.rnd = rng(seed); this.mode = 'title'; this.prev = 'play';
    this.held = {}; this.pressed = new Set(); this.sfxq = []; this.t = 0;
    this.prog = L.newProgress(); this.saveData = null;
    this.cam = { x: 0, y: 0 }; this.focus = null;
    this.reset();
  }
  reset() {
    const sp = tilePx(this.map.points.spawn);
    this.p = { x: sp.x, y: sp.y, dir: 'd', moving: false, run: false, act: null, ft: 0, step: 0 };
    this.npcs = []; this.animals = []; this.items = []; this.prints = []; this.parts = []; this.toasts = []; this.banner = null;
    this.dlg = null; this.quiz = null; this.watch = null; this.fade = null; this.flash = 0; this.zone = null; this.hint = null; this.nextId = 1; this.timers = [];
    this.stats = { swings: 0 }; this.autosaveT = 0; this.respawnT = 0; this.carryWarn = 0; this.ending = 0;
    this.menu = { sel: 0 }; this.jr = { tab: 0, sel: 0 }; this.pauseSel = 0;
  }
  // ---------- lifecycle ----------
  newGame() { this.prog = L.newProgress(); this.reset(); this.spawnWorld(); this.mode = 'play'; this.enterStep(); this.focusCam(true); this.sfx('start'); this.fade = { t: 0.8, fired: true, mid() {} }; }
  loadGame(save) {
    this.prog = save.prog; this.reset(); const p = this.p; if (save.px) { p.x = save.px; p.y = save.py; p.dir = save.dir || 'd'; }
    this.spawnWorld(); this.mode = 'play'; if (this.prog.finished) { this.mode = 'end'; } else this.enterStep(); this.focusCam(true);
  }
  serialize() { return L.serialize(this.prog, { px: Math.round(this.p.x), py: Math.round(this.p.y), dir: this.p.dir }); }
  sfx(n) { this.sfxq.push(n); }
  press(n) { this.pressed.add(n); }
  // ---------- world setup ----------
  spawnWorld() {
    const m = this.map;
    for (const [id, n] of Object.entries(NPCS)) { const pt = tilePx(m.points[n.at]); this.npcs.push({ id, x: pt.x, y: pt.y, dir: n.face, t: this.rnd() * 5 }); }
    const mk = (...a) => this.mk(...a);
    this.respawnInsects(true);
    const dp = tilePx(m.points.deer); mk('deer', dp.x, dp.y, { sp: 'roe_deer', st: 'graze' });
    const walk = (x, y) => !m.solid[y * m.W + x];
    const find = (x0, y0, x1, y1, pred, n) => { const out = []; for (let t = 0; t < 400 && out.length < n; t++) { const x = x0 + Math.floor(this.rnd() * (x1 - x0)), y = y0 + Math.floor(this.rnd() * (y1 - y0)); if (pred(x, y)) out.push(tilePx({ x, y })); } return out; };
    for (const q of find(2, 2, 19, 15, (x, y) => walk(x, y) && m.terr[y * m.W + x] === T.MOSS, 4)) mk('robin', q.x, q.y, { sp: 'robin' });
    const near = (x, y, t) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.terr[(y + dy) * m.W + x + dx] === t);
    for (const q of find(2, 20, 19, 34, (x, y) => walk(x, y) && near(x, y, T.WATER) && m.terr[y * m.W + x] !== T.DECK, 3)) mk('frog', q.x, q.y, { sp: 'frog' });
    mk('heron', 6 * TS + 8, 23 * TS + 13, { sp: 'grey_heron' });
    for (const q of find(18, 3, 26, 36, (x, y) => m.terr[y * m.W + x] === T.WATER, 6)) mk('fish', q.x, q.y, { sp: 'trout', mode: 'river' });
    for (const q of find(3, 23, 15, 31, (x, y) => m.terr[y * m.W + x] === T.WATER, 4)) mk('fish', q.x, q.y, { sp: 'trout', mode: 'pond' });
    for (const q of find(1, 40, 58, 44, (x, y) => m.terr[y * m.W + x] === T.WATER, 5)) mk('fish', q.x, q.y, { sp: null, mode: 'sea' });
    for (const q of find(30, 35, 58, 38, (x, y) => walk(x, y) && m.terr[y * m.W + x] === T.SAND, 4)) mk('crab', q.x, q.y, { sp: 'shore_crab' });
    for (const o of m.objs) if (o.k === 'sign') o.id = o.id || (o.x < 400 ? 'station' : 'beach');
  }
  mk(kind, x, y, o = {}) { const a = { id: this.nextId++, kind, x, y, home: { x, y }, st: 'idle', stT: this.rnd() * 2, t: this.rnd() * 9, dir: this.rnd() < 0.5 ? 1 : -1, z: 0, vx: 0, vy: 0, ...o }; this.animals.push(a); return a; }
  respawnInsects(initial) {
    const kinds = ['painted', 'blue', 'brimstone', 'ladybird', 'bee', 'dragonfly', 'painted', 'blue'];
    const alive = this.animals.filter(a => a.cls === 'ins').length, want = kinds.length;
    for (let i = alive; i < want; i++) {
      const kind = kinds[(initial ? i : Math.floor(this.rnd() * kinds.length))];
      let x, y, tries = 0;
      do { x = (28 + this.rnd() * 28) * TS; y = (3 + this.rnd() * 11) * TS; tries++; } while ((this.solidAt(x, y) || (!initial && Math.hypot(x - this.p.x, y - this.p.y) < 150)) && tries < 30);
      const sp = { painted: 'painted_lady', blue: 'common_blue', brimstone: 'brimstone', ladybird: 'ladybird', bee: 'bumblebee', dragonfly: 'dragonfly' }[kind];
      this.mk('ins_' + kind, x, y, { cls: 'ins', sp, z: kind === 'ladybird' ? 0 : 6 + this.rnd() * 6 });
    }
  }
  // ---------- collision ----------
  solidAt(x, y) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx < 0 || ty < 0 || tx >= this.map.W || ty >= this.map.H) return true; return !!this.map.solid[ty * this.map.W + tx]; }
  boxFree(x, y, hw = 5) { return !(this.solidAt(x - hw, y) || this.solidAt(x + hw, y) || this.solidAt(x - hw, y - 4) || this.solidAt(x + hw, y - 4)); }
  waterAt(x, y) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); return tx >= 0 && ty >= 0 && tx < this.map.W && ty < this.map.H && this.map.terr[ty * this.map.W + tx] === T.WATER; }
  moveBox(e, dx, dy, hw = 5) { if (dx && this.boxFree(e.x + dx, e.y, hw)) e.x += dx; if (dy && this.boxFree(e.x, e.y + dy, hw)) e.y += dy; }
  // ---------- steps / missions ----------
  step() { return L.currentStep(this.prog); }
  mission() { return L.currentMission(this.prog); }
  enterStep() {
    const s = this.step(), m = this.map; this.items = []; this.prints = [];
    if (!s) return;
    const P = this.prog;
    if (s.t === 'collect') for (const it of s.items) if (!P.got.includes(it.id)) { const pt = tilePx(m.points[it.at]); this.items.push({ ...it, x: pt.x, y: pt.y, t: this.rnd() * 5 }); }
    if (s.t === 'trail') s.pts.forEach((k, i) => { if (i <= P.n) { const pt = tilePx(m.points[k]); this.prints.push({ x: pt.x, y: pt.y, i, done: i < P.n, flip: i % 2 }); } });
    if (s.t === 'carry' && !this.animals.some(a => a.kind === 'hatchling')) { const pt = tilePx(m.points.hatch); this.mk('hatchling', pt.x, pt.y, { sp: 'loggerhead', st: 'idle' }); }
    if (s.t === 'photo' && s.target === 'otter' && !this.animals.some(a => a.kind === 'otter')) this.mk('otter', 20 * TS, 24 * TS, { sp: 'otter', st: 'swim', stT: 6, dir: 1, dive: 0 });
    if (s.t === 'cutscene') { if (s.lines === 'm5_end') this.spawnFoxes(); this.runLines(s.lines, () => this.afterLines(s)); }
    this.hint = null;
  }
  spawnFoxes() { if (this.animals.some(a => a.kind === 'fox')) return; const d = tilePx(this.map.points.den); this.mk('fox', d.x + 6, d.y + 4, { sp: 'red_fox', st: 'sit' }); this.mk('kit', d.x - 10, d.y + 6, { sp: null }); this.mk('kit', d.x + 14, d.y - 6, { sp: null }); this.focus = { x: d.x, y: d.y }; this.discover('red_fox'); }
  runLines(key, done) { const lines = DIALOGUE[key]; if (typeof lines[0] === 'string') this.say(lines.map(t => ['', t]), done, false); else this.say(lines, done, RADIO.has(key)); }
  afterLines(s) {
    const go = () => { if (s.after) this.runLines(s.after, () => this.advance()); else this.advance(); };
    if (s.quiz) this.startQuiz(QUIZZES[s.quiz], go); else go();
  }
  advance() {
    const s = this.step(), m = this.mission(); const r = L.completeStep(this.prog); this.focus = null;
    if (r.missionDone) {
      this.banner = { text: 'MISSION COMPLETE', sub: m.title, t: 0, life: 3.4 }; this.sfx('win'); this.save();
      this.toast(m.lesson, null, 'lesson');
    }
    if (r.finished) { this.ending = 3.5; return; }
    this.enterStep(); if (!r.missionDone) this.sfx('ok');
  }
  discover(id) {
    if (!id) return false; const first = L.discover(this.prog, id, this.prog.time);
    if (first) { this.toast(SPECIES[id].name, SPECIES[id].sprite, 'discover'); this.sfx('discover'); }
    return first;
  }
  toast(text, icon, kind = 'info') { this.toasts.push({ text, icon, kind, t: 0, life: kind === 'lesson' ? 5 : 2.8 }); if (this.toasts.length > 4) this.toasts.shift(); }
  save() { this.onSave && this.onSave(); }
  // ---------- dialogue / quiz ----------
  say(lines, done, radio = false) { this.dlg = { lines, i: 0, chars: 0, done, radio, t: 0 }; this.mode = 'dialogue'; this.sfx('open'); }
  startQuiz(list, done) { this.quiz = { list, qi: 0, sel: 0, state: 'ask', wrong: [], done, t: 0 }; this.mode = 'quiz'; }
  quizChoose(i) {
    const q = this.quiz; if (!q) return; const cur = q.list[q.qi];
    if (q.state === 'ask') {
      if (i === cur.a) { q.state = 'right'; this.sfx('ok'); } else { q.state = 'wrong'; if (!q.wrong.includes(i)) q.wrong.push(i); this.prog.mistakes++; this.sfx('bad'); }
    } else if (q.state === 'wrong') { q.state = 'ask'; q.sel = [0, 1, 2].find(k => !q.wrong.includes(k)) ?? 0; }
    else if (q.state === 'right') {
      q.qi++; q.state = 'ask'; q.wrong = []; q.sel = 0;
      if (q.qi >= q.list.length) { const d = q.done; this.quiz = null; this.mode = 'play'; d && d(); }
    }
  }
  // ---------- objective (HUD arrow / bot) ----------
  objective() {
    const s = this.step(), P = this.map.points; if (!s) return null;
    const pt = k => tilePx(P[k]);
    switch (s.t) {
      case 'talk': { const n = this.npcs.find(n => n.id === s.npc); return { x: n.x, y: n.y, kind: 'npc', id: s.npc }; }
      case 'read': { const o = this.map.objs.find(o => o.k === 'sign' && o.id === s.sign); return { x: o.x, y: o.y, kind: 'sign' }; }
      case 'catch': { const ins = this.animals.filter(a => a.cls === 'ins'); if (!ins.length) return { ...pt('quill'), kind: 'zone' }; const n = ins.sort((a, b) => dist(a, this.p) - dist(b, this.p))[0]; return { x: n.x, y: n.y, kind: 'insect', ref: n }; }
      case 'collect': { const it = this.items[0]; return it ? { x: it.x, y: it.y, kind: 'item', ref: it } : null; }
      case 'photo': { const a = this.animals.find(a => a.kind === (s.target === 'deer' ? 'deer' : 'otter')); return a ? { x: a.x, y: a.y, kind: 'animal', ref: a } : null; }
      case 'trail': { const pr = this.prints.find(p => !p.done); return pr ? { x: pr.x, y: pr.y, kind: 'item', ref: pr } : null; }
      case 'carry': { const h = this.animals.find(a => a.kind === 'hatchling'); if (!h) return null; return dist(h, this.p) > 40 && h.st !== 'swim' ? { x: h.x, y: h.y, kind: 'animal', ref: h } : { ...pt('sea'), kind: 'zone' }; }
      case 'watch': return { ...pt('hidedoor'), kind: 'door' };
      case 'rest': return { ...pt('bench'), kind: 'bench' };
      default: return null;
    }
  }
  // ---------- main update ----------
  update(dt) {
    const pr = this.pressed; this.pressed = new Set(); this.t += dt;
    if (this.timers.length) { for (const tm of this.timers) tm.t -= dt; const due = this.timers.filter(t => t.t <= 0); this.timers = this.timers.filter(t => t.t > 0); due.forEach(d => d.fn()); }
    if (this.fade) this.tickFade(dt);
    this.sfxq.length > 40 && (this.sfxq.length = 0);
    if (this.mode === 'title') { this.updTitle(pr); this.particles(dt); return; }
    if (this.mode === 'end') { if (pr.has('act') || pr.has('pause')) this.toTitle(); this.updWorld(dt * 0.5, true); return; }
    if (this.mode === 'journal') { this.updJournal(pr); return; }
    if (this.mode === 'pause') { this.updPause(pr); return; }
    this.prog.time += dt; L.advanceClock(this.prog, dt);
    if (this.mode === 'play' && pr.has('journal')) { this.mode = 'journal'; this.jr.sel = 0; return; }
    if (this.mode === 'play' && pr.has('pause')) { this.mode = 'pause'; this.pauseSel = 0; return; }
    if (this.mode === 'dialogue') this.updDialogue(dt, pr);
    else if (this.mode === 'quiz') this.updQuiz(dt, pr);
    else if (this.mode === 'watch') this.updWatch(dt, pr);
    else if (this.mode === 'play') this.updPlayer(dt, pr);
    this.updWorld(dt);
    if (this.ending > 0) { this.ending -= dt; if (this.ending <= 0) { this.mode = 'end'; this.save(); } }
    this.autosaveT += dt; if (this.autosaveT > 20 && this.mode === 'play') { this.autosaveT = 0; this.save(); }
  }
  toTitle() { this.mode = 'title'; this.menu.sel = 0; }
  updTitle(pr) {
    const opts = this.saveData ? 2 : 1;
    if (pr.has('down')) this.menu.sel = (this.menu.sel + 1) % opts; if (pr.has('up')) this.menu.sel = (this.menu.sel + opts - 1) % opts;
    if (pr.has('act')) { this.sfx('open'); if (this.saveData && this.menu.sel === 0) this.loadGame(this.saveData); else this.newGame(); }
  }
  updPause(pr) {
    if (pr.has('pause')) { this.mode = 'play'; return; }
    if (pr.has('down')) this.pauseSel = (this.pauseSel + 1) % 3; if (pr.has('up')) this.pauseSel = (this.pauseSel + 2) % 3;
    if (pr.has('act')) { if (this.pauseSel === 0) this.mode = 'play'; else if (this.pauseSel === 1) { this.sfx('mute'); } else { this.save(); this.toTitle(); } }
  }
  updJournal(pr) {
    if (pr.has('journal') || pr.has('pause')) { this.mode = 'play'; return; }
    const ids = Object.keys(SPECIES), jr = this.jr;
    if (pr.has('tab')) { jr.tab = (jr.tab + 1) % 2; jr.sel = 0; }
    const n = jr.tab === 0 ? ids.length : MISSIONS.length, cols = jr.tab === 0 ? 7 : 1;
    if (pr.has('right')) jr.sel = (jr.sel + 1) % n; if (pr.has('left')) jr.sel = (jr.sel + n - 1) % n;
    if (pr.has('down')) jr.sel = Math.min(n - 1, jr.sel + cols); if (pr.has('up')) jr.sel = Math.max(0, jr.sel - cols);
  }
  updDialogue(dt, pr) {
    const d = this.dlg; d.t += dt; const line = d.lines[d.i], len = line[1].length;
    if (d.chars < len) { const before = Math.floor(d.chars); d.chars = Math.min(len, d.chars + dt * 48); if (Math.floor(d.chars) !== before && Math.floor(d.chars) % 3 === 0) this.sfx('blip'); }
    if (pr.has('act')) {
      if (d.chars < len) d.chars = len;
      else { d.i++; d.chars = 0; if (d.i >= d.lines.length) { const f = d.done; this.dlg = null; this.mode = 'play'; f && f(); } else this.sfx('blip2'); }
    }
  }
  updQuiz(dt, pr) {
    const q = this.quiz; q.t += dt; const n = q.list[q.qi].opts.length;
    if (q.state === 'ask') {
      if (pr.has('down')) { do { q.sel = (q.sel + 1) % n; } while (q.wrong.includes(q.sel)); }
      if (pr.has('up')) { do { q.sel = (q.sel + n - 1) % n; } while (q.wrong.includes(q.sel)); }
      if (pr.has('act')) this.quizChoose(q.sel);
    } else if (pr.has('act')) this.quizChoose(q.sel);
  }
  transition(mid) { this.fade = { t: 0, mid, fired: false }; this.mode = 'fade'; }
  tickFade(dt) { const f = this.fade; f.t += dt; if (f.t > 0.8 && !f.fired) { f.fired = true; f.mid(); } if (f.t > 1.6) { this.fade = null; if (this.mode === 'fade') this.mode = 'play'; } }
  // ---------- player ----------
  updPlayer(dt, pr) {
    const p = this.p, h = this.held;
    if (p.act) { p.act.t += dt; if (!p.act.fired && p.act.t >= p.act.hitAt) { p.act.fired = true; p.act.onHit && p.act.onHit(); } if (p.act.t >= p.act.dur) p.act = null; p.moving = false; }
    else {
      let dx = (h.right ? 1 : 0) - (h.left ? 1 : 0), dy = (h.down ? 1 : 0) - (h.up ? 1 : 0);
      p.moving = !!(dx || dy);
      if (p.moving) {
        const len = Math.hypot(dx, dy); dx /= len; dy /= len; p.run = !!h.run;
        const sp = p.run ? RUN : WALK; p.dir = Math.abs(dx) > Math.abs(dy) || (Math.abs(dx) === Math.abs(dy) && (p.dir === 'l' || p.dir === 'r')) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u');
        const ox = p.x, oy = p.y; this.moveBox(p, dx * sp * dt, dy * sp * dt);
        const moved = Math.hypot(p.x - ox, p.y - oy); p.ft += moved / (p.run ? 7 : 8.5) * 1; p.step += moved;
        if (p.step > (p.run ? 14 : 22)) { p.step = 0; this.sfx('step'); if (p.run || this.rnd() < 0.5) this.dust(p.x, p.y); }
        if (!moved) p.moving = false;
      } else { p.run = false; }
      if (pr.has('act')) this.interact();
    }
  }
  nearest(list, r, pos = this.p) { let best = null, bd = r; for (const e of list) { const d = dist(e, pos); if (d < bd) { bd = d; best = e; } } return best; }
  targets() {
    const s = this.step(), out = [];
    if (!s) return out;
    if (s.t === 'talk') { const n = this.npcs.find(n => n.id === s.npc); out.push({ kind: 'npc', x: n.x, y: n.y, r: 26, ref: n }); }
    for (const n of this.npcs) if (!out.some(o => o.ref === n)) out.push({ kind: 'chat', x: n.x, y: n.y, r: 24, ref: n });
    if (s.t === 'read') { const o = this.map.objs.find(o => o.k === 'sign' && o.id === s.sign); out.push({ kind: 'sign', x: o.x, y: o.y, r: 26, ref: o }); }
    if (s.t === 'collect') for (const it of this.items) out.push({ kind: 'item', x: it.x, y: it.y, r: it.water ? 30 : 24, ref: it });
    if (s.t === 'trail') for (const pr of this.prints) if (!pr.done) out.push({ kind: 'print', x: pr.x, y: pr.y, r: 24, ref: pr });
    if (s.t === 'watch') { const pt = tilePx(this.map.points.hidedoor); out.push({ kind: 'door', x: pt.x, y: pt.y, r: 24, ref: s }); }
    if (s.t === 'rest') { const pt = tilePx(this.map.points.bench); out.push({ kind: 'bench', x: pt.x, y: pt.y, r: 26, ref: s }); }
    return out;
  }
  prompt() { if (this.mode !== 'play') return null; const t = this.nearest(this.targets().filter(t => dist(t, this.p) < t.r), 99); if (!t) return null; return { x: t.x, y: t.y, text: { npc: 'E  Talk', chat: 'E  Chat', sign: 'E  Read', item: 'E  Examine', print: 'E  Examine', door: 'E  Watch', bench: 'E  Rest' }[t.kind], kind: t.kind }; }
  interact() {
    const s = this.step(), p = this.p;
    const cands = this.targets().filter(t => dist(t, p) < t.r).sort((a, b) => (a.kind === 'chat') - (b.kind === 'chat') || dist(a, p) - dist(b, p));
    const t = cands[0];
    if (t) {
      p.dir = this.faceDir(t);
      switch (t.kind) {
        case 'npc': return this.talkTo(t.ref, s);
        case 'chat': return this.chat(t.ref);
        case 'sign': return this.say(DIALOGUE[s.lines].map(x => ['', x]), () => this.advance());
        case 'item': return this.collectItem(t.ref, s);
        case 'print': return this.examinePrint(t.ref, s);
        case 'door': return this.startWatch(s);
        case 'bench': return this.rest(s);
      }
    }
    if (s && s.t === 'photo') return this.takePhoto(s);
    // scan nearby wildlife with lens
    const an = this.animals.filter(a => a.sp && !a.hidden && a.cls !== 'ins' && dist(a, p) < (a.kind === 'fish' ? 34 : 38)).sort((a, b) => dist(a, p) - dist(b, p))[0];
    if (an && an.kind !== 'deer' && an.kind !== 'otter') { p.dir = this.faceDir(an); return this.startAct('lens', 0.6, 0.35, () => { if (this.discover(an.sp)) this.burst(an.x, an.y - 6, 'y1'); else this.toast('Already in your journal: ' + SPECIES[an.sp].name); }); }
    this.swingNet();
  }
  dirTo(from, to) { const dx = to.x - from.x, dy = to.y - from.y; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'); }
  faceDir(t) { return this.dirTo(this.p, t); }
  after(sec, fn) { this.timers.push({ t: sec, fn }); }
  startAct(tool, dur, hitAt, onHit) { this.p.act = { tool, t: 0, dur, hitAt, onHit, fired: false }; this.p.moving = false; }
  swingNet() {
    this.stats.swings++; this.sfx('swish');
    this.startAct('net', 0.44, 0.22, () => {
      const v = DV[this.p.dir], c = { x: this.p.x + v[0] * 15, y: this.p.y - 4 + v[1] * 11 };
      const hit = this.nearest(this.animals.filter(a => a.cls === 'ins'), 17, c);
      if (hit) {
        this.animals.splice(this.animals.indexOf(hit), 1); this.discover(hit.sp); this.burst(hit.x, hit.y - hit.z, 'w'); this.sfx('catch');
        const s = this.step();
        if (s && s.t === 'catch') { this.prog.n++; this.toast(`Caught: ${SPECIES[hit.sp].name}  (${Math.min(this.prog.n, s.n)}/${s.n})`); if (this.prog.n >= s.n) this.advance(); }
        else this.toast(`Caught and released: ${SPECIES[hit.sp].name}`);
        this.respawnT = 5;
      }
    });
  }
  talkTo(n, s) {
    this.focus = null;
    const key = s.lines; this.runLines(key, () => { if (s.give) this.toast('Field kit received: net, camera, lens, jar'); this.afterLines(s); });
  }
  chat(n) {
    const list = CHAT[n.id], i = (n.ci = ((n.ci ?? -1) + 1) % list.length); n.dir = this.dirTo(n, this.p);
    this.say([[n.id, list[i], 'n']], null);
  }
  collectItem(it, s) {
    this.startAct(s.tool, 0.7, 0.45, () => {
      this.items.splice(this.items.indexOf(it), 1); this.prog.got.push(it.id); this.discover(it.sp); this.burst(it.x, it.y - 4, it.water ? 'b4' : 'y1');
      this.toast(`${it.label} collected (${this.prog.got.length}/${s.items.length})`);
      const done = () => { if (this.prog.got.length >= s.items.length) this.advance(); };
      if (it.event === 'frog') { const f = this.mk('frog', it.x + 8, it.y + 14, { sp: 'frog', st: 'jump', stT: 1.2, vx: 30, vy: 20 }); this.discover('frog'); this.runLines('m6_frog', done); } else done();
    });
  }
  examinePrint(pr, s) {
    this.startAct('lens', 0.5, 0.3, () => {
      pr.done = true; this.prog.n++; this.sfx('ok'); this.toast(`Paw print ${this.prog.n}/${s.pts.length}`);
      if (this.prog.n >= s.pts.length) { this.advance(); } else { const pt = tilePx(this.map.points[s.pts[this.prog.n]]); this.prints.push({ x: pt.x, y: pt.y, i: this.prog.n, done: false, flip: this.prog.n % 2 }); }
    });
  }
  rest(s) {
    this.transition(() => { this.prog.clock = Math.max(this.prog.clock, s.until); this.discover('firefly'); this.runLines(s.lines, () => this.advance()); });
  }
  // ---------- photo ----------
  takePhoto(s) {
    const a = this.animals.find(a => a.kind === (s.target === 'deer' ? 'deer' : 'otter')); this.sfx('click');
    this.startAct('cam', 0.55, 0.3, () => {
      this.flash = 0.35; if (!a) return; this.stats.photoTries = (this.stats.photoTries || 0) + 1;
      const d = dist(a, this.p), v = DV[this.p.dir], dot = ((a.x - this.p.x) * v[0] + (a.y - this.p.y) * v[1]) / Math.max(d, 1);
      const spooked = a.st === 'flee' || a.hidden || (a.kind === 'otter' && a.st === 'dive');
      if (spooked) return this.toast('Too late. It is gone. Wait for it to return.');
      if (d > (a.kind === 'deer' ? 105 : 130)) return this.toast('Too far. Move a little closer, quietly.');
      if (d < 26) return this.toast('Too close!');
      if (dot < 0.25) return this.toast('Not in frame. Face the animal.');
      this.prog.photos++; this.discover(a.sp); this.toast('Great shot!'); this.burst(a.x, a.y - 10, 'w');
      if (s.lines) this.runLines(s.lines, () => this.advance()); else this.advance();
    });
  }
  // ---------- bird hide ----------
  startWatch(s) { this.watch = { r: 0, phase: 'wait', t: 0, bird: null, s }; this.mode = 'watch'; this.sfx('open'); }
  updWatch(dt, pr) {
    const w = this.watch, round = w.s.rounds[w.r]; w.t += dt;
    if (w.phase === 'wait' && w.t > 1.2) { w.phase = 'fly'; w.t = 0; this.say([['raman', ['Quick, here comes one! Study the beak.', 'Another one! Look at the beak and the eyes.', 'One more! Watch it fly, then tell me who it is.'][w.r % 3], 'wow']], () => { this.mode = 'watch'; w.phase = 'fly'; w.t = 0; }); w.phase = 'say'; }
    else if (w.phase === 'fly' && w.t > 3.4) { w.phase = 'quiz'; w.t = 0; this.startQuiz(QUIZZES[round.quiz], () => { this.discover(round.sp); w.r++; this.mode = 'watch'; if (w.r >= w.s.rounds.length) { w.phase = 'out'; w.t = 0; } else { w.phase = 'wait'; w.t = 0; } }); }
    else if (w.phase === 'out' && w.t > 0.8) { this.watch = null; this.mode = 'play'; this.advance(); }
  }
  // ---------- world update ----------
  updWorld(dt, noPlayerLogic) {
    const p = this.p;
    for (const n of this.npcs) { n.t += dt; const d = dist(n, p); if (d < 70 && this.mode !== 'end') n.dir = this.dirTo(n, p); else if (d > 120) n.dir = NPCS[n.id].face; }
    for (const a of [...this.animals]) this.updAnimal(a, dt);
    if (this.respawnT > 0) { this.respawnT -= dt; if (this.respawnT <= 0) this.respawnInsects(false); }
    for (const it of this.items) it.t += dt;
    this.particles(dt);
    for (const t of this.toasts) t.t += dt; this.toasts = this.toasts.filter(t => t.t < t.life);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.life) this.banner = null; }
    if (this.flash > 0) this.flash -= dt;
    // zone banner
    const z = zoneAt(this.map, Math.floor(p.x / TS), Math.floor(p.y / TS));
    if (!this.zone || this.zone.id !== z.id) { if (this.zone && this.mode === 'play') this.zoneBanner = { text: z.name, t: 0 }; this.zone = z; }
    if (this.zoneBanner) { this.zoneBanner.t += dt; if (this.zoneBanner.t > 2.6) this.zoneBanner = null; }
    this.focusCam(false, dt);
  }
  focusCam(snap, dt = 1 / 60) {
    const f = this.focus || this.p, tx = f.x - 240, ty = f.y - 135 - 8, W = this.map.W * TS, H = this.map.H * TS;
    const cx = Math.max(0, Math.min(W - 480, tx)), cy = Math.max(0, Math.min(H - 270, ty)), k = snap ? 1 : 1 - Math.pow(0.0008, dt);
    this.cam.x += (cx - this.cam.x) * k; this.cam.y += (cy - this.cam.y) * k;
  }
  dust(x, y) { for (let i = 0; i < 3; i++) this.parts.push({ x: x + (this.rnd() - 0.5) * 6, y: y - 1, vx: (this.rnd() - 0.5) * 14, vy: -6 - this.rnd() * 6, life: 0.35 + this.rnd() * 0.2, t: 0, c: 's1', s: 2 }); }
  burst(x, y, c) { for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; this.parts.push({ x, y, vx: Math.cos(a) * 34, vy: Math.sin(a) * 34 - 10, life: 0.5, t: 0, c, s: 2 }); } }
  particles(dt) {
    for (const q of this.parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g ?? 20) * dt * (q.kind === 'leaf' ? 0 : 1); }
    this.parts = this.parts.filter(q => q.t < q.life);
    // ambient leaves drifting in forest / pollen in meadow / fireflies at dusk
    const p = this.p, z = this.zone ? this.zone.id : '';
    if ((z === 'forest' || z === 'eastwood') && this.rnd() < dt * 3) this.parts.push({ kind: 'leaf', x: p.x + (this.rnd() - 0.5) * 460, y: p.y - 150, vx: 8 + this.rnd() * 6, vy: 14 + this.rnd() * 6, life: 9, t: 0, c: this.rnd() < 0.5 ? 'g4' : 'o1', s: 2, g: 0 });
    if (z === 'meadow' && this.rnd() < dt * 2) this.parts.push({ kind: 'pollen', x: p.x + (this.rnd() - 0.5) * 460, y: p.y + (this.rnd() - 0.5) * 260, vx: 5, vy: -4, life: 5, t: 0, c: 'y1', s: 1, g: 0 });
    if (this.prog.clock > 18 && this.rnd() < dt * 5) this.parts.push({ kind: 'fly', x: p.x + (this.rnd() - 0.5) * 460, y: p.y + (this.rnd() - 0.5) * 260, vx: 0, vy: 0, ph: this.rnd() * 6, life: 7, t: 0, c: 'y1', s: 1, g: 0 });
  }
  // ---------- animal AI ----------
  updAnimal(a, dt) {
    const p = this.p, d = dist(a, p), runNear = this.p.run && this.p.moving, k = a.kind; a.t += dt; a.stT -= dt;
    const wander = (speed, rad, jitter) => { if (a.stT <= 0 || !a.tx) { const an = this.rnd() * 6.28, r = rad * (0.3 + this.rnd() * 0.7); a.tx = a.home.x + Math.cos(an) * r; a.ty = a.home.y + Math.sin(an) * r * 0.7; a.stT = 1 + this.rnd() * jitter; } };
    const goto = (sp, dx0) => { const dx = a.tx - a.x, dy = a.ty - a.y, l = Math.hypot(dx, dy); if (l > 2) { a.vx = dx / l * sp; a.vy = dy / l * sp; if (Math.abs(dx) > 1) a.dir = dx > 0 ? 1 : -1; } else { a.vx = 0; a.vy = 0; } };
    const mv = (box) => { const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt; if (box === 'free') { a.x = nx; a.y = ny; } else if (box === 'water') { if (this.waterAt(nx, ny)) { a.x = nx; a.y = ny; } else { a.stT = 0; a.tx = null; } } else { if (this.boxFree(nx, a.y, 4)) a.x = nx; else a.stT = 0; if (this.boxFree(a.x, ny, 4)) a.y = ny; else a.stT = 0; } };
    if (a.cls === 'ins') {
      const kind = k.slice(4), sp = { painted: 24, blue: 28, brimstone: 24, ladybird: 7, bee: 34, dragonfly: 52 }[kind];
      const fleeing = runNear && d < 70; wander(sp, 50, 2);
      if (fleeing) { a.tx = a.x + (a.x - p.x) * 2; a.ty = a.y + (a.y - p.y) * 2; }
      goto(sp * (fleeing ? 2 : 1), 0); a.x += a.vx * dt; a.y += a.vy * dt;
      if (this.solidAt(a.x, a.y)) { a.x -= a.vx * dt; a.y -= a.vy * dt; a.stT = 0; a.tx = null; }
      a.x = Math.max(24 * TS, Math.min(58 * TS, a.x)); a.y = Math.max(2 * TS, Math.min(16 * TS, a.y));
      if (kind !== 'ladybird') a.z = 8 + Math.sin(a.t * 2.2 + a.id) * 4; return;
    }
    switch (k) {
      case 'deer': {
        if (a.st === 'flee') { for (let i = 0; i < 6 && !this.boxFree(a.x + a.fx * 10, a.y + a.fy * 10, 4); i++) { const c = Math.cos(0.7 * (a.rot || 1)), sn = Math.sin(0.7 * (a.rot || 1)); const nx = a.fx * c - a.fy * sn, ny = a.fx * sn + a.fy * c; a.fx = nx; a.fy = ny; } a.vx = a.fx * 78; a.vy = a.fy * 78; mv('box'); a.dir = a.vx > 0 ? 1 : -1; if (a.stT <= 0) { a.st = 'away'; a.stT = 3 + this.rnd() * 2; a.vx = a.vy = 0; } return; }
        if (a.st === 'away') { if (a.stT <= 0) { if (d > 70) { a.st = 'return'; a.tx = a.home.x + (this.rnd() - 0.5) * 50; a.ty = a.home.y + (this.rnd() - 0.5) * 36; a.stT = 8; } else this.spook(a); } return; }
        if (a.st === 'return') { goto(24, 0); mv('box'); if (Math.hypot(a.tx - a.x, a.ty - a.y) < 4 || a.stT <= 0) { a.st = 'graze'; a.stT = 3; a.vx = a.vy = 0; } }
        if (a.st === 'graze') { a.vx = a.vy = 0; if (a.stT <= 0) { a.stT = 2 + this.rnd() * 3; a.head = !a.head; if (this.rnd() < 0.3) { a.st = 'graze'; a.tx = null; wander(14, 36, 1); a.st = 'walk'; a.stT = 2; } } }
        if (a.st === 'walk') { goto(14, 0); mv('box'); if (a.stT <= 0) { a.st = 'graze'; a.stT = 2; a.vx = a.vy = 0; } }
        // senses
        if ((d < 48 && a.st !== 'return') || (runNear && d < 115) || (d < 70 && a.st === 'return' && false)) this.spook(a); return;
      }
      case 'fox': case 'kit': { if (k === 'kit') { wander(10, 30, 2.5); goto(10, 0); mv('free'); } return; }
      case 'otter': return this.updOtter(a, dt, d, runNear);
      case 'hatchling': return this.updHatch(a, dt, d);
      case 'robin': {
        if (a.st === 'gone') { if (a.stT <= 0 && d > 90) { a.st = 'idle'; a.x = a.home.x; a.y = a.home.y; a.z = 0; } return; }
        if (a.st === 'fly') { a.x += a.vx * dt; a.y += a.vy * dt; a.z = Math.min(40, a.z + 30 * dt); if (a.stT <= 0) { a.st = 'gone'; a.stT = 8; } return; }
        if ((d < 34) || (runNear && d < 70)) { a.st = 'fly'; a.stT = 2.2; const l = d || 1; a.vx = (a.x - p.x) / l * 70; a.vy = (a.y - p.y) / l * 30 - 20; a.dir = a.vx > 0 ? 1 : -1; this.sfx('flap'); return; }
        if (a.st === 'idle' && a.stT <= 0) { a.st = 'hop'; a.stT = 0.28; const an = this.rnd() * 6.28; a.vx = Math.cos(an) * 40; a.vy = Math.sin(an) * 20; a.dir = a.vx > 0 ? 1 : -1; if (Math.hypot(a.x + a.vx * 0.3 - a.home.x, a.y - a.home.y) > 40) { a.vx = -a.vx; a.dir = -a.dir; } }
        else if (a.st === 'hop') { mv('box'); if (a.stT <= 0) { a.st = 'idle'; a.stT = 1 + this.rnd() * 3; a.vx = a.vy = 0; } }
        return;
      }
      case 'frog': {
        if (a.st === 'jump') { a.x += a.vx * dt; a.y += a.vy * dt; if (this.solidAt(a.x, a.y)) { a.x -= a.vx * dt; a.y -= a.vy * dt; } if (a.stT <= 0) { a.st = 'idle'; a.stT = 1 + this.rnd() * 3; } return; }
        if (d < 26 || (a.st === 'idle' && a.stT < -6 && this.rnd() < 0.01)) { a.st = 'jump'; a.stT = 0.5; const an = d < 26 ? Math.atan2(a.y - p.y, a.x - p.x) : this.rnd() * 6.28; a.vx = Math.cos(an) * 44; a.vy = Math.sin(an) * 44; if (Math.hypot(a.x + a.vx * 0.5 - a.home.x, a.y + a.vy * 0.5 - a.home.y) > 50) { a.vx = (a.home.x - a.x); a.vy = (a.home.y - a.y); const l = Math.hypot(a.vx, a.vy) || 1; a.vx = a.vx / l * 40; a.vy = a.vy / l * 40; } a.dir = a.vx > 0 ? 1 : -1; }
        return;
      }
      case 'heron': {
        if (a.st === 'fly') { a.x += a.vx * dt; a.y += a.vy * dt; a.z += 24 * dt; if (a.stT <= 0) { a.st = 'gone'; a.stT = 25; a.hidden = true; } return; }
        if (a.st === 'gone') { if (a.stT <= 0 && d > 120) { a.st = 'idle'; a.hidden = false; a.x = a.home.x; a.y = a.home.y; a.z = 0; } return; }
        if (d < 64 || (runNear && d < 100)) { a.st = 'fly'; a.stT = 3.5; const l = d || 1; a.vx = (a.x - p.x) / l * 55 + 10; a.vy = -30; a.z = 0; a.dir = a.vx > 0 ? 1 : -1; this.sfx('flap'); }
        else if (a.stT <= 0) { a.stT = 3 + this.rnd() * 4; a.st = a.st === 'idle' ? 'idle' : 'idle'; }
        return;
      }
      case 'fish': {
        const sp = a.mode === 'sea' ? 12 : 16, fl = d < 36; if (a.stT <= 0 || !a.tx) { const an = this.rnd() * 6.28; a.tx = a.x + Math.cos(an) * 50; a.ty = a.y + Math.sin(an) * 30; a.stT = 1.5 + this.rnd() * 2.5; }
        if (fl) { a.tx = a.x + (a.x - p.x) * 2; a.ty = a.y + (a.y - p.y) * 2; }
        goto(fl ? 50 : sp, 0); mv('water'); return;
      }
      case 'crab': {
        if (a.st === 'burrow') { a.hidden = true; if (a.stT <= 0 && d > 60) { a.hidden = false; a.st = 'idle'; a.stT = 2; } return; }
        if (d < 38 || (runNear && d < 70)) { a.st = 'flee'; a.stT = 0.8; a.vx = (a.x - p.x) > 0 ? 40 : -40; a.vy = 0; a.dir = a.vx > 0 ? 1 : -1; }
        else if (a.st === 'flee' && a.stT <= 0) { a.st = 'burrow'; a.stT = 5; a.vx = 0; }
        else if (a.st === 'idle' && a.stT <= 0) { a.st = 'walk'; a.stT = 0.8 + this.rnd(); a.vx = (this.rnd() < 0.5 ? -1 : 1) * 10; a.vy = 0; if (Math.abs(a.x - a.home.x) > 30) a.vx = a.x > a.home.x ? -10 : 10; }
        else if (a.st === 'walk' && a.stT <= 0) { a.st = 'idle'; a.stT = 1 + this.rnd() * 2; a.vx = 0; }
        if (a.vx) mv('box'); return;
      }
    }
  }
  spook(a) { const p = this.p, dx = a.x - p.x, dy = a.y - p.y, l = Math.hypot(dx, dy) || 1; a.st = 'flee'; a.stT = 2.2; a.fx = dx / l; a.fy = dy / l * 0.6; if (a.fx === 0 && a.fy === 0) a.fx = 1; this.sfx('flap'); }
  updOtter(a, dt, d, runNear) {
    const p = this.p; const cx = this.map.riverX(Math.floor(a.y / TS)) * TS + 8;
    if (a.st === 'swim') {
      a.y += a.dir * 12 * dt; a.x += (cx - a.x) * Math.min(1, dt * 2); if (a.y > 30 * TS) a.dir = -1; if (a.y < 24.6 * TS) a.dir = 1;
      if (a.stT <= 0 || d < 44 || (runNear && d < 100)) { a.st = 'dive'; a.stT = d < 44 || runNear ? 6 : 2.5 + this.rnd() * 2; a.hidden = true; this.burst(a.x, a.y, 'b4'); this.sfx('splash'); }
    } else if (a.st === 'dive') {
      a.y += a.dir * 20 * dt; if (a.y > 30 * TS) a.dir = -1; if (a.y < 24.6 * TS) a.dir = 1;
      if (a.stT <= 0 && (d > 52)) { a.st = 'swim'; a.stT = 7 + this.rnd() * 3; a.hidden = false; this.burst(a.x, a.y, 'b4'); this.sfx('splash'); }
    }
  }
  updHatch(a, dt, d) {
    const p = this.p, s = this.step();
    if (a.st === 'swim') { a.y += 22 * dt; a.t2 = (a.t2 || 0) + dt; if (a.t2 > 1.6) a.hidden = true; return; }
    if (!s || s.t !== 'carry') { return; }
    const sea = tilePx(this.map.points.sea);
    if (dist(a, sea) < 26 && a.st !== 'arrived') {
      a.st = 'arrived'; this.say(DIALOGUE[s.arrive].map(([w, t, m]) => [w, t, m]), () => { a.st = 'swim'; this.mode = 'play'; this.sfx('splash'); this.after(1.9, () => { this.discover('loggerhead'); this.advance(); }); }); return;
    }
    if (a.st === 'arrived') return;
    a.vx = a.vy = 0;
    const seaNear = dist(p, sea) < 56, goal = seaNear ? sea : p, stop = seaNear ? 6 : 26, dg = dist(a, goal);
    if (this.p.run && d < 90) { a.st = 'scared'; if (this.carryWarn <= 0) { this.toast('It is scared of running. Walk slowly.'); this.carryWarn = 6; } }
    else if (dg > stop) {
      a.st = 'follow'; a.pt = (a.pt ?? 0) - dt;
      if (!a.path || a.pt <= 0) { a.pt = 0.4; const r = bfs(this.map, [Math.floor(a.x / TS), Math.floor(a.y / TS)], [Math.floor(goal.x / TS), Math.floor(goal.y / TS)]); a.path = r ? r.slice(1).map(([x, y]) => ({ x: x * TS + 8, y: y * TS + 12 })) : null; }
      const w = a.path && a.path.length ? a.path[0] : goal, dx = w.x - a.x, dy = w.y - a.y, l = Math.hypot(dx, dy) || 1;
      if (l < 3 && a.path && a.path.length) a.path.shift();
      const sp = 36; a.x += dx / l * sp * dt; a.y += dy / l * sp * dt; if (Math.abs(dx) > 0.5) a.dir = dx > 0 ? 1 : -1;
    }
    else a.st = 'idle';
    if (d > 200) { a.x = p.x + 10; a.y = p.y + 8; }
    this.carryWarn -= dt;
    // keep follower unstuck behind obstacles: after a long wait teleport next to player
    a.lag = d > 60 ? (a.lag || 0) + dt : 0; if (a.lag > 3) { a.x = p.x - (DV[p.dir][0] * 12); a.y = p.y - (DV[p.dir][1] * 12) + 2; if (this.solidAt(a.x, a.y)) { a.x = p.x; a.y = p.y; } a.lag = 0; }
  }
}
