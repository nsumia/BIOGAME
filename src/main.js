// Browser entry: input, loop, audio, save, scaling, touch controls.
import { buildMap } from './map.js';
import { Core } from './core.js';
import { Renderer, VW, VH } from './render.js';
import { Audio } from './audio.js';
import * as L from './logic.js';

const canvas = document.getElementById('game');
const map = buildMap(), core = new Core(map, 7), audio = new Audio();
let renderer;
try { const raw = localStorage.getItem(L.SAVE_KEY); core.saveData = raw ? L.deserialize(raw) : null; } catch { core.saveData = null; }
renderer = new Renderer(canvas, core);

// scaling: integer upscale where possible
function fit() {
  const s = Math.min(innerWidth / VW, innerHeight / VH), k = s >= 1 ? Math.floor(s) : s;
  canvas.style.width = Math.floor(VW * k) + 'px'; canvas.style.height = Math.floor(VH * k) + 'px';
}
addEventListener('resize', fit); fit();

// input
const KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ShiftLeft: 'run', ShiftRight: 'run' };
const PRESS = { KeyE: 'act', Space: 'act', Enter: 'act', KeyJ: 'journal', Escape: 'pause', KeyP: 'pause', Tab: 'tab' };
core.held = {};
function setHeld(k, v) { core.held[k] = v; }
addEventListener('keydown', e => {
  audio.init(); if (e.repeat) { if (KEYS[e.code] || PRESS[e.code]) e.preventDefault(); return; }
  if (e.code === 'KeyM') { toggleMute(); return; }
  const k = KEYS[e.code]; if (k) { setHeld(k, true); if (k !== 'run') core.press(k); e.preventDefault(); }
  const p = PRESS[e.code]; if (p) { core.press(p); e.preventDefault(); }
});
addEventListener('keyup', e => { const k = KEYS[e.code]; if (k) setHeld(k, false); });
addEventListener('blur', () => { core.held = {}; if (core.mode === 'play' && !new URLSearchParams(location.search).has('manual')) core.mode = 'pause'; });
function toggleMute() { audio.setMuted(!audio.muted); core.muted = audio.muted; }
function canvasPos(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * VW / r.width, y: (e.clientY - r.top) * VH / r.height }; }
canvas.addEventListener('pointerdown', e => {
  audio.init(); const p = canvasPos(e);
  for (const h of [...renderer.hits].reverse()) if (p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h) { h.fn(); return; }
  if (core.mode === 'dialogue' || core.mode === 'end') core.press('act');
});
// touch controls (shown on touch devices)
const touch = document.getElementById('touch');
if (touch && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)) {
  touch.style.display = 'block';
  for (const b of touch.querySelectorAll('[data-k]')) {
    const k = b.dataset.k, hold = ['up', 'down', 'left', 'right', 'run'].includes(k);
    b.addEventListener('pointerdown', e => { e.preventDefault(); audio.init(); if (hold) { setHeld(k, true); if (k !== 'run') core.press(k); } else core.press(k); });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => { if (hold) setHeld(k, false); });
  }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && core.mode === 'play' && !new URLSearchParams(location.search).has('manual')) core.mode = 'pause'; });

// loop
function persist() { try { localStorage.setItem(L.SAVE_KEY, core.serialize()); core.saveData = L.deserialize(core.serialize()); } catch { /* storage unavailable */ } }
core.onSave = persist;
function drain() {
  for (const e of core.sfxq.splice(0)) { if (e === 'mute') toggleMute(); else audio.play(e); }
}
const MANUAL = new URLSearchParams(location.search).has('manual'); // tests drive the simulation themselves
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(0.1, (now - last) / 1000); last = now; let n = 0;
  while (acc >= 1 / 60 && n++ < 5) { if (!MANUAL) core.update(1 / 60); acc -= 1 / 60; }
  drain(); renderer.draw(1 / 60); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// test hooks (used by tools/browser_test.mjs)
window.__bio = {
  core, renderer, audio,
  step(n = 1, bot) { for (let i = 0; i < n; i++) { if (bot) bot.tick(1 / 30); core.update(1 / 30); } drain(); renderer.draw(1 / 30); return this.state(); },
  state() { const s = core.step(); return { mode: core.mode, mi: core.prog.mi, si: core.prog.si, step: s && s.t, time: core.prog.time, species: Object.keys(core.prog.journal).length, zone: core.zone && core.zone.id, clock: core.prog.clock, dlg: !!core.dlg, chars: core.dlg ? core.dlg.chars : 0, quiz: core.quiz ? core.quiz.state : null, watch: !!core.watch, wphase: core.watch ? core.watch.phase : null, fade: !!core.fade, px: core.p.x, py: core.p.y }; },
  async makeBot(opts) { const { Bot } = await import('./bot.js'); this.bot = new Bot(core, opts); return true; },
};
window.dispatchEvent(new Event('biogame-ready'));
