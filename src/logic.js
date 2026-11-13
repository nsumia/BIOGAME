// Pure progress/mission/journal/save logic (no DOM, no rendering). Unit-tested in tools/test_logic.mjs.
import { MISSIONS, SPECIES } from './data.js';
export const SAVE_KEY = 'biogame.save.v1', SAVE_VERSION = 1;
export function newProgress() { return { mi: 0, si: 0, n: 0, got: [], done: [], journal: {}, lessons: [], photos: 0, mistakes: 0, time: 0, clock: 8, finished: false }; }
export const currentMission = p => MISSIONS[p.mi] || null;
export const currentStep = p => { const m = currentMission(p); return m ? m.steps[p.si] || null : null; };
export function discover(p, id, at = 0) { if (!SPECIES[id]) throw new Error('unknown species ' + id); if (p.journal[id] !== undefined) return false; p.journal[id] = Math.round(at); return true; }
// advance one step; returns { missionDone, finished }
export function completeStep(p) {
  const m = currentMission(p); if (!m) return { missionDone: false, finished: true };
  p.si++; p.n = 0; p.got = [];
  if (p.si >= m.steps.length) {
    p.done.push(m.id); p.lessons.push(m.id); p.mi++; p.si = 0;
    if (p.mi >= MISSIONS.length) { p.finished = true; return { missionDone: true, finished: true }; }
    return { missionDone: true, finished: false };
  }
  return { missionDone: false, finished: false };
}
export function speciesCount(p) { return Object.keys(p.journal).length; }
export function serialize(p, extra = {}) { return JSON.stringify({ v: SAVE_VERSION, prog: p, ...extra }); }
export function deserialize(str) {
  let o; try { o = JSON.parse(str); } catch { return null; }
  if (!o || o.v !== SAVE_VERSION || !o.prog) return null;
  const p = o.prog, base = newProgress();
  for (const k of Object.keys(base)) if (typeof p[k] !== typeof base[k]) return null;
  if (!Number.isInteger(p.mi) || p.mi < 0 || p.mi > MISSIONS.length || !Number.isInteger(p.si) || p.si < 0) return null;
  if (p.mi < MISSIONS.length && p.si >= MISSIONS[p.mi].steps.length) return null;
  for (const id of Object.keys(p.journal)) if (!SPECIES[id]) return null;
  return o;
}
export function fmtTime(s) { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
export function fmtClock(h) { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10; return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
// in-game clock: advances with play time but is kept within the story window of the current mission
export function clockWindow(mi) { const lo = 8 + Math.min(mi, 9) * 0.9; return [lo, mi >= 9 ? 19.4 : lo + 1.1]; }
export function advanceClock(p, dt) {
  const [lo, hi] = clockWindow(p.mi); let rate = 1 / 66;
  if (p.clock < lo) rate *= 4; if (p.clock >= hi) rate = 0;
  p.clock = Math.max(p.clock, Math.min(p.clock + dt * rate, Math.max(hi, p.clock)));
}
