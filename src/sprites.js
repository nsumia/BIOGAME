// Sprite registry: name -> { frames:[Grid], ax, ay (anchor), fps }. Everything is generated at load.
import { Grid } from './pixel.js';
import * as P from './people.js';
import * as A from './animals.js';
import * as S from './props.js';
import { PLAYER_LOOK, NPCS } from './data.js';

export const SPR = {};
function reg(name, frames, ax, ay, fps = 8) { const f = Array.isArray(frames) ? frames : [frames]; SPR[name] = { frames: f, ax: ax ?? (f[0].w >> 1), ay: ay ?? f[0].h - 2, fps }; }
const rep = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

// people
for (const d of P.DIRS) {
  reg(`player_walk_${d}`, rep(6, i => P.peopleSprite(PLAYER_LOOK, d, 'walk', i)), 16, 28, 9);
  reg(`player_idle_${d}`, rep(4, i => P.peopleSprite(PLAYER_LOOK, d, 'idle', i)), 16, 28, 2.5);
  for (const tool of ['net', 'cam', 'lens', 'jar']) reg(`player_${tool}_${d}`, rep(4, i => P.actFrame(PLAYER_LOOK, d, i, tool)), 20, 30, 10);
  for (const [id, n] of Object.entries(NPCS)) reg(`npc_${id}_${d}`, rep(4, i => P.peopleSprite(n.look, d, 'idle', i)), 16, 28, 2.2);
}
for (const [id, n] of Object.entries({ ...NPCS, me: { look: PLAYER_LOOK } })) {
  for (const mood of ['n', 'happy', 'wow', 'think']) for (const talk of [0, 1]) reg(`portrait_${id}_${mood}_${talk}`, P.portrait(n.look, mood, !!talk), 24, 47);
}
// animals
for (const m of ['walk', 'graze', 'alert', 'run']) reg(`deer_${m}`, rep(m === 'graze' ? 2 : m === 'alert' ? 1 : 4, i => A.deer(m, i)), 18, 31, m === 'graze' ? 1.5 : m === 'run' ? 12 : 7);
for (const m of ['walk', 'sit', 'run']) reg(`fox_${m}`, rep(m === 'sit' ? 2 : 4, i => A.fox(m, i)), 17, 16, m === 'run' ? 12 : m === 'sit' ? 2 : 8);
reg('kit', rep(2, A.kit), 9, 12, 3);
reg('frog_idle', rep(2, i => A.frog('idle', i)), 9, 12, 2); reg('frog_jump', rep(3, i => A.frog('jump', i)), 9, 12, 10);
for (const k of ['painted', 'blue', 'brimstone']) reg(`butterfly_${k}`, rep(4, i => A.butterfly(k, i)), 8, 7, 10);
reg('ladybird', rep(2, A.ladybird), 5, 5, 6); reg('bee', rep(2, A.bee), 7, 7, 14); reg('dragonfly', rep(4, A.dragonfly), 11, 8, 16);
for (const m of ['idle', 'hop', 'fly']) reg(`robin_${m}`, rep(m === 'fly' ? 4 : 2, i => A.robin(m, i)), 9, 14, m === 'fly' ? 12 : m === 'hop' ? 6 : 2);
reg('tit', A.tit(0), 9, 14); reg('nestbox', S.nestbox(), 7, 19);
reg('heron_idle', rep(2, i => A.heron('idle', i)), 15, 44, 1); reg('heron_walk', rep(2, i => A.heron('walk', i)), 15, 44, 2);
for (const k of ['goldfinch', 'sparrowhawk', 'heron']) reg(`bird_${k}`, rep(4, i => A.birdFly(k, i)), null, null, 8);
reg('fish', rep(4, A.fish), 9, 5, 6); reg('crab', rep(4, A.crab), 10, 12, 8); reg('starfish_o', A.starfish('o')); reg('starfish_p', A.starfish('p')); reg('anemone', rep(2, A.anemone), 7, 12, 2);
reg('otter_swim', rep(4, i => A.otter('swim', i)), 20, 14, 5); reg('otter_walk', rep(4, i => A.otter('walk', i)), 20, 16, 8); reg('hatchling', rep(2, A.hatchling), 9, 12, 7); reg('mayfly', A.mayfly()); reg('firefly', A.fireflyIcon());
// props
reg('oak_canopy', S.oakCanopy(false)); reg('oak_autumn_canopy', S.oakCanopy(true)); reg('trunk', S.trunk()); reg('pine_canopy', S.pineCanopy());
reg('bush0', S.bush(0), null, 16); reg('bush1', S.bush(1), null, 16); reg('bush2', S.bush(2), null, 16);
for (const c of 'rypwb') reg(`flower_${c}`, rep(2, i => S.flower(c, i)), 5, 11, 2);
reg('tuft', rep(3, S.tuft), 6, 9, 2); reg('reed', rep(4, S.reed), 7, 27, 2); reg('lily', rep(2, S.lily), 8, 5, 1);
reg('rock', S.rock(0), null, 16); reg('rock2', S.rock(1), null, 24); reg('sign', S.sign()); reg('fence', S.fenceH()); reg('lamp', S.lamp(), 6, 32);
reg('campfire', rep(4, S.campfire), 10, 20, 8); reg('crate', S.crate(), null, 14); reg('bench', S.bench(), null, 16); reg('barrel', S.barrel(), null, 14);
reg('lab', S.lab(), 52, 74); reg('cabin', S.cabin(), 35, 58); reg('hide', S.hide(), 32, 50); reg('tent', S.tent(), 22, 32); reg('boat', S.boat(), 22, 20);
reg('mushroom', S.mushroom(), 7, 12); reg('mushroom_d', S.mushroom(), 7, 12); reg('fern', rep(2, S.fern), 10, 16, 2); reg('leafpile', S.leafPile(), 8, 10); reg('oakleaf', S.oakLeaf());
reg('pawprint', rep(2, S.pawprint), 6, 6, 2); reg('sparkle', rep(4, S.sparkle), 5, 5, 6); reg('ripple', rep(4, S.ripple), 10, 6, 4);
reg('shell', [S.shell(0), S.shell(1)], 5, 6, 0); reg('driftwood', S.driftwood(), 13, 8); reg('seaweed', rep(2, S.seaweed), 5, 12, 2); reg('heart', S.heartIcon());

// object kind -> sprite name(s) (static map objects)
export const OBJ_SPR = {
  lab: 'lab', cabin: 'cabin', hide: 'hide', tent: 'tent', boat: 'boat', campfire: 'campfire', crate: 'crate', barrel: 'barrel', lamp: 'lamp', bench: 'bench',
  sign: 'sign', rock: 'rock', rock2: 'rock2', bush: 'bush0', reed: 'reed', lily: 'lily', tuft: 'tuft', fern: 'fern', mushroom_d: 'mushroom_d', seaweed: 'seaweed',
  shell: 'shell', driftwood: 'driftwood', flower: 'flower_r', oak: 'oak_canopy', oak_autumn: 'oak_autumn_canopy', pine: 'pine_canopy',
};
