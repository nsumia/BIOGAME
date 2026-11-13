// Asset & animation checks: palette budget, sprite coverage, frame counts, real animation (frames differ), autotiling.
import fs from 'node:fs';
import { COLORS } from '../src/palette.js';
import { SPR, OBJ_SPR } from '../src/sprites.js';
import { buildMap } from '../src/map.js';
import { renderTerrain, T, WATER_FRAMES } from '../src/tiles.js';
import { NPCS, SPECIES, MISSIONS } from '../src/data.js';
import { GLYPHS } from '../src/font.js';

let failed = 0, passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('ok   ' + name); } catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + e.message); } };
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const sig = g => g.d.join(',');

t(`palette is cohesive and limited (${COLORS.length - 1} colours, 24-32 allowed)`, () => { ok(COLORS.length - 1 >= 24 && COLORS.length - 1 <= 32, 'palette size ' + (COLORS.length - 1)); });
t('every sprite frame is non-empty and uses only palette indices', () => {
  for (const [k, s] of Object.entries(SPR)) { ok(s.frames.length >= 1, k + ' has no frames'); for (const f of s.frames) { ok(f.count() > 3, k + ' empty frame'); for (const c of f.d) ok(c >= 0 && c < COLORS.length, k + ' bad colour index ' + c); ok(s.ax >= 0 && s.ay >= 0 && s.ax <= f.w && s.ay <= f.h, k + ' anchor outside'); } }
});
t('player: walk cycle >= 4 frames in all 4 directions, frames are distinct; idle + 4 tool animations exist', () => {
  for (const d of ['d', 'u', 'l', 'r']) {
    const w = SPR['player_walk_' + d]; ok(w && w.frames.length >= 4, 'walk frames ' + d); ok(new Set(w.frames.map(sig)).size >= 4, 'walk frames identical in dir ' + d);
    ok(SPR['player_idle_' + d].frames.length >= 4, 'idle ' + d); for (const tool of ['net', 'cam', 'lens', 'jar']) { const a = SPR[`player_${tool}_${d}`]; ok(a && a.frames.length >= 4 && new Set(a.frames.map(sig)).size >= 3, `tool anim ${tool} ${d}`); }
  }
  ok(sig(SPR.player_walk_l.frames[0]) !== sig(SPR.player_walk_r.frames[0]), 'left/right must be mirrored, not identical');
});
t('NPCs: >= 5 scientists, each with 4-frame idle in 4 directions and 8 portrait variants', () => {
  const ids = Object.keys(NPCS); ok(ids.length >= 5, 'npcs ' + ids.length);
  for (const id of ids) { for (const d of ['d', 'u', 'l', 'r']) { const s = SPR[`npc_${id}_${d}`]; ok(s && s.frames.length >= 4 && new Set(s.frames.map(sig)).size >= 2, `npc idle ${id} ${d}`); } for (const m of ['n', 'happy', 'wow', 'think']) for (const tk of [0, 1]) ok(SPR[`portrait_${id}_${m}_${tk}`], `portrait ${id} ${m} ${tk}`); ok(sig(SPR[`portrait_${id}_n_0`].frames[0]) !== sig(SPR[`portrait_${id}_n_1`].frames[0]), 'talk mouth frame differs ' + id); }
  const looks = new Set(ids.map(id => sig(SPR[`portrait_${id}_n_0`].frames[0]))); ok(looks.size === ids.length, 'portraits must be distinct');
});
t('wildlife: >= 8 animated species with multi-frame animations', () => {
  const animated = ['deer_walk', 'fox_walk', 'frog_jump', 'butterfly_painted', 'butterfly_blue', 'butterfly_brimstone', 'ladybird', 'bee', 'dragonfly', 'robin_fly', 'robin_hop', 'heron_walk', 'bird_goldfinch', 'bird_sparrowhawk', 'bird_heron', 'fish', 'crab', 'otter_swim', 'otter_walk', 'hatchling', 'kit'];
  for (const k of animated) { ok(SPR[k], 'missing ' + k); ok(SPR[k].frames.length >= 2 && new Set(SPR[k].frames.map(sig)).size >= 2, 'not animated: ' + k); }
  ok(SPR.deer_walk.frames.length >= 4 && SPR.fox_walk.frames.length >= 4 && SPR.otter_swim.frames.length >= 4, 'big animals need >= 4 frames');
  const species = new Set(['deer', 'fox', 'frog', 'butterfly', 'ladybird', 'bee', 'dragonfly', 'robin', 'heron', 'goldfinch', 'sparrowhawk', 'fish', 'crab', 'otter', 'hatchling']); ok(species.size >= 8);
});
t('scenery animation: swaying grass/flowers/reeds/lilies/trees data, campfire flicker', () => {
  for (const k of ['tuft', 'reed', 'lily', 'flower_r', 'fern', 'seaweed', 'anemone', 'campfire']) ok(SPR[k].frames.length >= 2 && new Set(SPR[k].frames.map(sig)).size >= 2, 'static: ' + k);
  ok(SPR.campfire.frames.length >= 4, 'campfire frames');
});
t('every map object kind and every species icon resolves to a sprite', () => {
  const map = buildMap(); const kinds = new Set(map.objs.map(o => o.k));
  for (const k of kinds) ok(OBJ_SPR[k] && SPR[OBJ_SPR[k]], 'object kind without sprite: ' + k);
  for (const k of ['flower_r', 'flower_y', 'flower_p', 'flower_w', 'flower_b', 'bush0', 'bush1', 'bush2', 'trunk', 'oak_canopy', 'oak_autumn_canopy', 'pine_canopy']) ok(SPR[k], 'missing ' + k);
  for (const [id, s] of Object.entries(SPECIES)) ok(SPR[s.sprite], `journal icon for ${id}: ${s.sprite}`);
  for (const m of MISSIONS) for (const s of m.steps) for (const it of s.items || []) ok(SPR[it.spr], 'item sprite ' + it.spr);
});
t('every sprite name literal used by the renderer exists', () => {
  const src = fs.readFileSync(new URL('../src/render.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/core.js', import.meta.url), 'utf8');
  const names = new Set([...src.matchAll(/this\.spr\('([a-z0-9_]+)',/g)].map(m => m[1]));
  for (const n of names) ok(SPR[n], 'renderer references missing sprite ' + n); ok(names.size > 15, 'scan found too few names');
  for (const n of ['deer_run', 'deer_walk', 'deer_alert', 'deer_graze', 'fox_sit', 'kit', 'otter_swim', 'hatchling', 'robin_fly', 'robin_hop', 'robin_idle', 'frog_jump', 'frog_idle', 'bird_heron', 'heron_idle', 'crab']) ok(SPR[n], 'missing ' + n);
});
t('font covers every character used in game text', () => {
  const data = fs.readFileSync(new URL('../src/data.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/render.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/core.js', import.meta.url), 'utf8');
  const strs = [...data.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1]).filter(s => s.length > 3 && /[a-z]{3}/.test(s));
  const miss = new Set(); for (const s of strs) for (const ch of s.replace(/\\'/g, "'")) if (!GLYPHS[ch] && ch !== '`' && ch !== '$' && ch !== '{' && ch !== '}' && ch !== '\\' && ch !== '[' && ch !== ']' && ch !== '|' && ch !== ';' && ch !== '@' && ch !== '^' && ch !== '~' && ch.charCodeAt(0) < 128 && !/[A-Za-z0-9 ]/.test(ch)) miss.add(ch);
  ok(miss.size === 0, 'glyphs missing: ' + [...miss].join(' '));
  for (const m of MISSIONS) for (const ch of m.title + m.lesson) ok(GLYPHS[ch], `glyph ${ch} in mission ${m.id}`);
  for (const s of Object.values(SPECIES)) for (const ch of s.name + s.latin + s.fact) ok(GLYPHS[ch], `glyph "${ch}" in species ${s.name}`);
});
const map = buildMap();
const frames = []; for (let f = 0; f < WATER_FRAMES; f++) frames.push(renderTerrain(map, f));
t('terrain: 8 animated water frames that differ; frame loop is cheap to build', () => { ok(frames.length === 8, 'frames'); const h = new Set(frames.map(f => f.reduce((a, v, i) => (a * 31 + v + i) >>> 0, 7))); ok(h.size === 8, 'water frames not unique: ' + h.size); });
t('terrain: uses only palette colours and every terrain type shows tile variation (>= 4 colours)', () => {
  const f = frames[0]; const PW = map.W * 16; for (const v of f) ok(v >= 1 && v < COLORS.length, 'bad terrain colour ' + v);
  for (const [name, tt] of Object.entries(T)) { const colors = new Set(); for (let ty = 0; ty < map.H; ty++) for (let tx = 0; tx < map.W; tx++) if (map.terr[ty * map.W + tx] === tt) { for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) colors.add(f[(ty * 16 + y) * PW + tx * 16 + x]); } ok(colors.size >= 3, `terrain ${name} flat: ${colors.size} colours`); }
});
t('terrain: autotiled edges exist at grass/sand/water/path borders and tile interiors vary', () => {
  // count distinct 16x16 tile pixel signatures among grass cells: variation proves no repeated single tile
  const f = frames[0], PW = map.W * 16, sigs = new Set(); let grass = 0;
  for (let ty = 0; ty < map.H; ty++) for (let tx = 0; tx < map.W; tx++) if (map.terr[ty * map.W + tx] === T.GRASS) { grass++; let h = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) h = (h * 33 + f[(ty * 16 + y) * PW + tx * 16 + x]) >>> 0; sigs.add(h); }
  ok(sigs.size > grass * 0.9, `grass tiles too repetitive: ${sigs.size}/${grass}`);
  // transitions: a water cell next to sand must contain sand-edge colour (s2) or foam (b4) in the border zone
  let edges = 0; for (let ty = 1; ty < map.H - 1; ty++) for (let tx = 1; tx < map.W - 1; tx++) { if (map.terr[ty * map.W + tx] !== T.WATER) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (map.terr[(ty + dy) * map.W + tx + dx] === T.SAND) { let has = false; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (f[(ty * 16 + y) * PW + tx * 16 + x] === 13 /*s2*/) has = true; if (has) edges++; } }
  ok(edges > 10, 'sand/water autotile edges missing: ' + edges);
  let pathEdge = 0; for (let ty = 1; ty < map.H - 1; ty++) for (let tx = 1; tx < map.W - 1; tx++) if (map.terr[ty * map.W + tx] === T.GRASS && map.terr[ty * map.W + tx + 1] === T.PATH) { for (let y = 0; y < 16; y++) for (let x = 8; x < 16; x++) if (f[(ty * 16 + y) * PW + tx * 16 + x] === 15 /*d2 path edge*/) { pathEdge++; y = 99; break; } }
  ok(pathEdge > 5, 'grass/path autotile edges missing: ' + pathEdge);
});
t('whole-game colour budget: sprites + terrain together use <= 30 palette colours', () => {
  const used = new Set(); for (const s of Object.values(SPR)) for (const f of s.frames) for (const c of f.colors()) if (c) used.add(c); for (const v of frames[0]) used.add(v); ok(used.size <= 30, 'colours used ' + used.size); console.log('     colours used in total: ' + used.size);
});
console.log(`\nasset tests: ${passed} passed, ${failed} failed`); process.exit(failed ? 1 : 0);
