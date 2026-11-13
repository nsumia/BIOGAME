// Headless autoplay in node: plays the full game with the Bot, reports softlocks and playtime.
import { buildMap } from '../src/map.js';
import { Core } from '../src/core.js';
import { Bot } from '../src/bot.js';
import { MISSIONS } from '../src/data.js';
export function autoplay(opts = {}) {
  const core = new Core(buildMap(), opts.seed || 7), bot = new Bot(core, opts.bot || {});
  const dt = 1 / 30, limit = (opts.limitS || 1800) / dt, events = [];
  let prevM = -1;
  for (let i = 0; i < limit && core.mode !== 'end'; i++) {
    bot.tick(dt); core.update(dt);
    if (core.prog.mi !== prevM) { prevM = core.prog.mi; events.push({ mission: core.prog.mi, t: core.prog.time }); }
    if (bot.stepClock > (opts.stepLimit || 240)) return { ok: false, reason: `softlock: step ${bot.key()} (${core.step() && core.step().t}) exceeded ${opts.stepLimit || 240}s at (${Math.round(core.p.x)},${Math.round(core.p.y)}) mode=${core.mode}`, core, bot, events };
  }
  const ok = core.mode === 'end' && core.prog.finished && core.prog.done.length === MISSIONS.length;
  return { ok, reason: ok ? '' : `did not finish: mode=${core.mode} mission=${core.prog.mi}`, core, bot, events };
}
if (process.argv[1] && process.argv[1].split('/').pop() === 'autoplay.mjs') {
  const r = autoplay({ stepLimit: 240 }); const p = r.core.prog;
  console.log(r.ok ? 'OK' : 'FAIL ' + r.reason, 'playtime(s)=', Math.round(p.time), 'species=', Object.keys(p.journal).length, 'missions=', p.done.length, 'mistakes=', p.mistakes);
  console.log('by', JSON.stringify(Object.fromEntries(Object.entries(r.bot.by).map(([k, v]) => [k, Math.round(v)]))));
  console.log(r.events.map(e => `m${e.mission}@${Math.round(e.t)}s`).join(' '));
  process.exit(r.ok ? 0 : 1);
}
