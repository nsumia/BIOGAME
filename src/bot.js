// Autoplay bot: plays the real game through Core's public input API with human-like pacing (walks, reads, thinks).
import { QUIZZES } from './data.js';
const TS = 16, DV = { d: [0, 1], u: [0, -1], l: [-1, 0], r: [1, 0] };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export class Bot {
  // opts: readCps (reading speed, chars/s), thinkS (seconds to answer a quiz), wrongEvery (every nth quiz first answer is wrong), run (use Shift when far)
  constructor(core, opts = {}) {
    this.core = core; this.o = { readCps: 16, readPad: 0.4, thinkS: 6, wrongEvery: 3, run: false, ...opts };
    this.path = null; this.pathKey = ''; this.pathT = 0; this.wait = 0; this.dlgKey = ''; this.dlgT = 0; this.qCount = 0; this.qKey = ''; this.qT = 0;
    this.stepClock = 0; this.lastStep = ''; this.by = { walk: 0, dialogue: 0, quiz: 0, act: 0, wait: 0 }; this.log = []; this.stepTimes = {};
    this.faceT = 0;
  }
  key() { const p = this.core.prog; return `${p.mi}.${p.si}`; }
  tick(dt) {
    const c = this.core, h = c.held = {}; const k = this.key();
    if (k !== this.lastStep) { this.lastStep = k; this.stepClock = 0; this.path = null; this.faceT = 0; } this.stepClock += dt;
    this.stepTimes[k] = this.stepClock;
    switch (c.mode) {
      case 'title': c.press('act'); return;
      case 'dialogue': return this.reading(dt);
      case 'quiz': return this.quizzing(dt);
      case 'watch': case 'fade': case 'end': this.by.wait += dt; return;
    }
    if (c.p.act) { this.by.act += dt; return; }
    this.play(dt);
  }
  reading(dt) {
    const c = this.core, d = c.dlg, key = c.t > 0 ? d.i + ':' + d.lines.length + ':' + d.lines[d.i][1].slice(0, 12) : ''; this.by.dialogue += dt;
    if (key !== this.dlgKey) { this.dlgKey = key; this.dlgT = 0; } this.dlgT += dt;
    const need = d.lines[d.i][1].length / this.o.readCps + this.o.readPad;
    if (this.dlgT >= need) { c.press('act'); this.dlgT = 0; this.dlgKey = ''; }
  }
  quizzing(dt) {
    const c = this.core, q = c.quiz; this.by.quiz += dt; const key = q.qi + q.state + q.wrong.length + q.list[0].q.slice(0, 10);
    if (key !== this.qKey) { this.qKey = key; this.qT = 0; if (q.state === 'ask' && q.wrong.length === 0) this.qCount++; } this.qT += dt;
    const cur = q.list[q.qi];
    if (q.state === 'ask') {
      const wantWrong = q.wrong.length === 0 && this.o.wrongEvery && this.qCount % this.o.wrongEvery === 0;
      if (this.qT >= (q.wrong.length ? 2 : this.o.thinkS)) c.quizChoose(wantWrong ? [0, 1, 2].find(i => i !== cur.a) : cur.a);
    } else if (this.qT >= 3) c.quizChoose(q.sel);
  }
  // --- navigation ---
  tilePath(pred, maxLen = 4000) {
    const c = this.core, m = c.map, W = m.W, H = m.H, sx = Math.floor(c.p.x / TS), sy = Math.floor(c.p.y / TS);
    const prev = new Int32Array(W * H).fill(-1), q = [sy * W + sx]; prev[q[0]] = q[0]; let found = -1;
    for (let i = 0; i < q.length; i++) {
      const cur = q[i], x = cur % W, y = (cur / W) | 0;
      if (pred(x, y)) { found = cur; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (prev[n] >= 0 || m.solid[n]) continue; prev[n] = cur; q.push(n); }
    }
    if (found < 0) return null; const out = []; let cur = found; while (cur !== q[0]) { out.push({ x: (cur % W) * TS + 8, y: ((cur / W) | 0) * TS + 12 }); cur = prev[cur]; } return out.reverse();
  }
  // walk until within tol px of target; returns true if arrived
  goNear(t, tol, ring) {
    const c = this.core, p = c.p; const d = dist(p, t);
    if (!ring && d <= tol) return true;
    if (ring && d >= ring[0] && d <= ring[1]) return true;
    this.pathT -= 1 / 30;
    const key = Math.round(t.x / 8) + ',' + Math.round(t.y / 8);
    if (!this.path || key !== this.pathKey || this.pathT <= 0) {
      this.pathKey = key; this.pathT = 0.6;
      this.path = this.tilePath((x, y) => { const q = { x: x * TS + 8, y: y * TS + 12 }, dd = dist(q, t); return ring ? dd >= ring[0] && dd <= ring[1] : dd <= tol * 0.85; });
    }
    if (!this.path) { this.by.wait += 1 / 30; return false; }
    const w = this.path.length ? this.path[0] : t; const dx = w.x - p.x, dy = w.y - p.y;
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) { this.path.shift(); }
    const h = c.held; if (dx > 2) h.right = true; if (dx < -2) h.left = true; if (dy > 2) h.down = true; if (dy < -2) h.up = true;
    if (this.o.run && this.path.length > 6) h.run = true;
    this.by.walk += 1 / 30; return false;
  }
  face(t) { const c = this.core, h = c.held, dx = t.x - c.p.x, dy = t.y - c.p.y; if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) h.right = true; else h.left = true; } else if (dy > 0) h.down = true; else h.up = true; }
  facing(t, minDot = 0.5) { const c = this.core, v = DV[c.p.dir], d = dist(t, c.p) || 1; return ((t.x - c.p.x) * v[0] + (t.y - c.p.y) * v[1]) / d >= minDot; }
  play(dt) {
    const c = this.core, s = c.step(); if (!s) return; const obj = c.objective(); if (!obj) { this.by.wait += dt; return; }
    const p = c.p;
    switch (s.t) {
      case 'talk': case 'read': case 'rest': case 'watch': case 'collect': case 'trail': {
        const tol = (s.t === 'collect' && obj.ref && obj.ref.water) || s.t === 'read' || s.t === 'rest' ? 24 : 16;
        if (this.goNear(obj, tol)) { this.settle(); c.press('act'); }
        return;
      }
      case 'catch': {
        const ins = obj.ref; if (!ins) { this.goNear(obj, 10); return; }
        const v = DV[p.dir], net = { x: p.x + v[0] * 15, y: p.y - 4 + v[1] * 11 };
        if (dist(ins, net) < 14 && !c.p.run) { c.press('act'); return; }
        this.pathT = 0; this.path = null; // chase directly
        const dx = ins.x - net.x, dy = ins.y - 4 - net.y, h = c.held;
        if (dist(p, ins) > 90 || Math.abs(dx) + Math.abs(dy) > 60) { this.goNear(ins, 12); return; }
        if (dx > 2) h.right = true; if (dx < -2) h.left = true; if (dy > 2) h.down = true; if (dy < -2) h.up = true; this.by.walk += dt; return;
      }
      case 'photo': {
        const a = obj.ref; if (!a) return;
        const ring = s.target === 'deer' ? [62, 95] : [50, 105];
        if (a.hidden || a.st === 'flee' || a.st === 'away' || a.st === 'dive') { this.by.wait += dt; return; }
        const d = dist(a, p);
        if (d < ring[0] - 8) { // too near: back off
          this.goNear(a, 0, ring); return; }
        if (!this.goNear(a, 0, ring)) return;
        if (!this.facing(a, 0.6)) { this.face(a); this.by.wait += dt; return; }
        c.press('act'); return;
      }
      case 'carry': {
        const h = c.animals.find(a => a.kind === 'hatchling'); if (!h) return;
        const sea = c.map.points.sea, st = { x: sea.x * TS + 8, y: sea.y * TS + 13 };
        if (dist(h, p) > 34 && dist(h, st) > 26) { this.by.wait += dt; return; }
        this.goNear(st, 8); return;
      }
    }
  }
  settle() { this.core.held = {}; }
}
