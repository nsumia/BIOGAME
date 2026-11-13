// Unit tests: mission data integrity, progress/save logic, quiz logic, collision invariants, save/restore.
import { buildMap, bfs } from '../src/map.js';
import { Core } from '../src/core.js';
import * as L from '../src/logic.js';
import { MISSIONS, SPECIES, DIALOGUE, QUIZZES, NPCS, CHAT, SPEAKERS } from '../src/data.js';

let failed = 0, passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); } };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || 'expected'}: ${a} !== ${b}`); };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const map = buildMap();

t('mission data: >= 8 missions, each with steps, lesson, valid giver', () => {
  ok(MISSIONS.length >= 8, 'missions ' + MISSIONS.length); const ids = new Set();
  for (const m of MISSIONS) { ok(!ids.has(m.id), 'dup id ' + m.id); ids.add(m.id); ok(m.steps.length >= 2 && m.lesson.length > 20 && NPCS[m.giver], m.id); }
});
t('mission data: every referenced dialogue, quiz, npc, point, species exists', () => {
  const kinds = new Set(MISSIONS.flatMap(m => m.steps.map(s => s.t)));
  for (const m of MISSIONS) for (const s of m.steps) {
    for (const k of [s.lines, s.after, s.arrive]) if (k) ok(DIALOGUE[k], `${m.id}: dialogue ${k}`);
    if (s.quiz) { ok(QUIZZES[s.quiz], 'quiz ' + s.quiz); }
    if (s.npc) ok(NPCS[s.npc], 'npc ' + s.npc);
    if (s.at) ok(map.points[s.at], 'point ' + s.at);
    for (const it of s.items || []) { ok(map.points[it.at], 'item point ' + it.at); if (it.sp) ok(SPECIES[it.sp], 'item species ' + it.sp); }
    for (const p of s.pts || []) ok(map.points[p], 'trail point ' + p);
    for (const r of s.rounds || []) { ok(QUIZZES[r.quiz] && SPECIES[r.sp], 'round ' + r.quiz); }
  }
  ok(['talk', 'catch', 'collect', 'photo', 'trail', 'carry', 'watch', 'rest', 'read', 'cutscene'].every(k => kinds.has(k)), 'mission mechanic variety: ' + [...kinds].join(','));
  for (const [k, lines] of Object.entries(DIALOGUE)) for (const l of lines) { if (typeof l === 'string') continue; ok(SPEAKERS[l[0]], `speaker ${l[0]} in ${k}`); ok(l[1].length < 330, `line too long in ${k}`); ok(!l[1].includes('’'), 'plain apostrophes only'); }
  for (const id of Object.keys(NPCS)) ok(CHAT[id] && CHAT[id].length >= 3, 'chatter for ' + id);
});
t('quizzes: answer index in range, hint+fact present, three options', () => {
  for (const [k, list] of Object.entries(QUIZZES)) for (const q of list) { ok(q.a >= 0 && q.a < q.opts.length && q.opts.length === 3 && q.hint && q.fact && q.q.endsWith('?'), 'quiz ' + k); }
});
t('species: >= 20, each with latin name, group, fact >= 40 chars', () => {
  const ids = Object.keys(SPECIES); ok(ids.length >= 20, 'species ' + ids.length);
  for (const id of ids) { const s = SPECIES[id]; ok(s.latin && s.group && s.fact.length >= 40 && s.name && s.sprite, id); }
});
t('progress: discover is idempotent and rejects unknown species', () => {
  const p = L.newProgress(); eq(L.discover(p, 'roe_deer', 5), true); eq(L.discover(p, 'roe_deer', 9), false); eq(p.journal.roe_deer, 5); eq(L.speciesCount(p), 1);
  let threw = false; try { L.discover(p, 'dragon'); } catch { threw = true; } ok(threw, 'unknown species must throw');
});
t('progress: completing every step finishes all missions in order', () => {
  const p = L.newProgress(); let n = 0, md = 0;
  while (!p.finished) { const r = L.completeStep(p); n++; if (r.missionDone) md++; ok(n < 200, 'runaway'); }
  eq(md, MISSIONS.length); eq(p.done.length, MISSIONS.length); eq(n, MISSIONS.reduce((a, m) => a + m.steps.length, 0)); eq(L.currentStep(p), null);
});
t('save: serialize/deserialize round trip keeps progress', () => {
  const p = L.newProgress(); p.mi = 3; p.si = 1; p.n = 2; p.got = ['a']; L.discover(p, 'otter', 12); p.photos = 2; p.time = 321.5;
  const o = L.deserialize(L.serialize(p, { px: 10, py: 20, dir: 'l' })); ok(o, 'parsed'); eq(o.prog.mi, 3); eq(o.prog.journal.otter, 12); eq(o.px, 10); eq(o.dir, 'l'); eq(o.prog.time, 321.5);
});
t('save: corrupt / foreign / out-of-range saves are rejected', () => {
  const good = JSON.parse(L.serialize(L.newProgress()));
  const bad = [ 'not json', '{}', JSON.stringify({ ...good, v: 99 }), JSON.stringify({ ...good, prog: { ...good.prog, mi: 99 } }), JSON.stringify({ ...good, prog: { ...good.prog, si: 50 } }),
    JSON.stringify({ ...good, prog: { ...good.prog, journal: { fake_species: 1 } } }), JSON.stringify({ ...good, prog: { ...good.prog, time: 'x' } }), JSON.stringify({ ...good, prog: { ...good.prog, mi: -1 } }) ];
  for (const b of bad) eq(L.deserialize(b), null, 'should reject ' + b.slice(0, 50));
});
t('clock: monotonic, stays inside the story window, finale reaches dusk', () => {
  const p = L.newProgress(); let prev = p.clock;
  for (let i = 0; i < 20000; i++) { if (i % 1500 === 0 && p.mi < 10) p.mi++; L.advanceClock(p, 1 / 30); ok(p.clock >= prev, 'clock went backwards'); prev = p.clock; }
  ok(p.clock <= 19.4 + 1e-9, 'clock beyond window ' + p.clock); eq(L.fmtClock(8.5), '08:30'); eq(L.fmtTime(125), '2:05');
});
t('map: every named point is reachable from the spawn (water spots via a bank tile)', () => {
  const sp = [map.points.spawn.x, map.points.spawn.y];
  for (const [k, p] of Object.entries(map.points)) {
    if (!map.solid[p.y * map.W + p.x]) { ok(bfs(map, sp, [p.x, p.y]), 'unreachable ' + k); continue; }
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => { const x = p.x + dx, y = p.y + dy; return !map.solid[y * map.W + x] && bfs(map, sp, [x, y]); });
    ok(near, 'no reachable bank tile next to ' + k);
  }
});
t('core: player never enters solid tiles (random walk 6000 steps) and stays in bounds', () => {
  const c = new Core(buildMap(), 3); c.newGame(); let seed = 5; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 6000; i++) { if (i % 20 === 0) c.held = { up: rnd() < 0.4, down: rnd() < 0.4, left: rnd() < 0.4, right: rnd() < 0.4, run: rnd() < 0.5 }; if (c.mode === 'dialogue') c.press('act'); c.update(1 / 30); ok(!c.solidAt(c.p.x, c.p.y), `inside solid at ${c.p.x | 0},${c.p.y | 0}`); ok(c.p.x > 0 && c.p.y > 0 && c.p.x < 960 && c.p.y < 720, 'out of bounds'); }
});
t('core: first mission flow (talk -> read sign -> talk) advances and gives the kit', () => {
  const c = new Core(buildMap(), 3); c.newGame(); eq(c.step().t, 'talk'); const n = c.npcs.find(n => n.id === 'wren'); c.p.x = n.x; c.p.y = n.y + 14; c.press('act'); c.update(1 / 30); eq(c.mode, 'dialogue');
  for (let i = 0; i < 40 && c.mode === 'dialogue'; i++) { c.press('act'); c.update(1 / 30); c.press('act'); c.update(1 / 30); } eq(c.step().t, 'read');
});
t('core: quiz wrong answer costs a mistake, then right answer proceeds', () => {
  const c = new Core(buildMap(), 3); c.newGame(); let done = false; c.startQuiz(QUIZZES.legs, () => { done = true; });
  c.quizChoose(1); eq(c.quiz.state, 'wrong'); eq(c.prog.mistakes, 1); c.quizChoose(0); eq(c.quiz.state, 'ask'); c.quizChoose(0); eq(c.quiz.state, 'right'); c.quizChoose(0); ok(done && c.mode === 'play', 'quiz finished');
});
t('core: save mid-mission then load restores step, counters, journal and player', () => {
  const a = new Core(buildMap(), 3); a.newGame(); a.prog.mi = 5; a.prog.si = 1; a.prog.got = ['w1']; L.discover(a.prog, 'frog', 7); a.enterStep();
  eq(a.items.length, 2, 'one of three samples already collected'); a.p.x = 300; a.p.y = 300; const s = L.deserialize(a.serialize()); ok(s, 'save valid');
  const b = new Core(buildMap(), 3); b.loadGame(s); eq(b.prog.mi, 5); eq(b.prog.si, 1); eq(b.items.length, 2); eq(b.p.x, 300); ok(b.prog.journal.frog !== undefined, 'journal'); eq(b.mode, 'play');
});
t('core: loading a finished save shows the end screen; trail progress restores', () => {
  const a = new Core(buildMap(), 3); a.newGame(); a.prog.mi = 4; a.prog.si = 1; a.prog.n = 3; a.enterStep(); eq(a.prints.length, 4); eq(a.prints.filter(p => p.done).length, 3);
  const f = new Core(buildMap(), 3); const p = L.newProgress(); p.mi = MISSIONS.length; p.finished = true; p.done = MISSIONS.map(m => m.id); f.loadGame({ v: 1, prog: p }); eq(f.mode, 'end');
});
t('core: deer is spooked by running and by approaching closer than 3 tiles; stays calm when walking at range', () => {
  const c = new Core(buildMap(), 3); c.newGame(); c.prog.mi = 3; c.prog.si = 1; c.enterStep(); const d = c.animals.find(a => a.kind === 'deer');
  c.p.x = d.x - 100; c.p.y = d.y; c.held = {}; for (let i = 0; i < 30; i++) c.update(1 / 30); ok(d.st !== 'flee', 'calm at 100px'); c.p.x = d.x - 30; c.update(1 / 30); eq(d.st, 'flee');
});
t('core: autosave callback fires on mission completion', () => {
  const c = new Core(buildMap(), 3); let saves = 0; c.onSave = () => saves++; c.newGame(); c.prog.mi = 0; c.prog.si = 2; c.advance(); ok(saves >= 1, 'saved'); eq(c.prog.mi, 1);
});
console.log(`\nlogic tests: ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
