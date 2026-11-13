// Scripted autoplay: the Bot plays the real game start to finish (several pacing profiles and seeds); fails on softlock.
import { autoplay } from './autoplay.mjs';
import { MISSIONS, SPECIES } from '../src/data.js';
let failed = 0;
const check = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) failed++; };
const mm = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const profiles = {
  'human (reads 16 chars/s, 6 s per quiz, walks, 1 in 3 quizzes answered wrong first)': { bot: { readCps: 16, thinkS: 6, wrongEvery: 3 }, seed: 7 },
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 8, 9].map(n => ['seed ' + n, { bot: {}, seed: n }])),
  'fast player (30 chars/s, 2.5 s quizzes, always runs, no mistakes)': { bot: { readCps: 30, thinkS: 2.5, wrongEvery: 0, run: true }, seed: 11 },
  'slow player (10 chars/s, 10 s quizzes)': { bot: { readCps: 10, thinkS: 10, wrongEvery: 2 }, seed: 5 },
};
const res = {};
for (const [name, o] of Object.entries(profiles)) {
  const r = autoplay({ ...o, stepLimit: 240 }); const p = r.core.prog; res[name] = { ok: r.ok, t: p.time };
  check(r.ok && p.done.length === MISSIONS.length, `autoplay completes all ${MISSIONS.length} missions without softlock: ${name} -> ${r.ok ? mm(p.time) : r.reason}`);
  if (r.ok) { check(Object.keys(p.journal).length >= 21, `  journal has ${Object.keys(p.journal).length}/${Object.keys(SPECIES).length} species`); const worst = Math.max(...Object.values(r.bot.stepTimes)); check(worst < 200, `  longest single step ${Math.round(worst)}s (< 200s)`); }
}
const base = res[Object.keys(profiles)[0]];
check(base.t >= 12 * 60 && base.t <= 18 * 60, `playtime estimate for the human profile ${mm(base.t)} is inside the 12-18 minute target`);
check(res['fast player (30 chars/s, 2.5 s quizzes, always runs, no mistakes)'].t > 6 * 60, 'even a fast run takes > 6 minutes (no skipped content)');
// determinism
const a = autoplay({ seed: 7 }), b = autoplay({ seed: 7 });
check(Math.abs(a.core.prog.time - b.core.prog.time) < 1e-6 && Object.keys(a.core.prog.journal).join() === Object.keys(b.core.prog.journal).join(), 'simulation is deterministic for a fixed seed');
const r = autoplay({ seed: 7 }); const by = r.bot.by;
console.log(`playtime method: Bot plays the real Core at 30 Hz, walking (no running), reading dialogue at 16 chars/s (+0.4 s per line), 6 s thinking per quiz question, with 1/3 of quizzes answered wrong first. Time split (s): ${JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v)])))}`);
console.log(`PLAYTIME_ESTIMATE ${mm(base.t)} (${Math.round(base.t)} s)`);
console.log(failed ? `\nautoplay tests: ${failed} FAILED` : '\nautoplay tests: all passed'); process.exit(failed ? 1 : 0);
