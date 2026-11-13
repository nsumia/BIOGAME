// World map generator (deterministic, pure). 60x45 tiles of 16px: Lanternfen Reserve.
import { T } from './tiles.js';
import { hash2 } from './pixel.js';
export const W = 60, H = 45;
const riverX = y => 22 + Math.round(2.2 * Math.sin(y * 0.2));
const shoreY = x => 39 + Math.round(1.3 * Math.sin(x * 0.3) + 0.8 * Math.sin(x * 0.13 + 1));
const beachY = x => 34 + Math.round(1.2 * Math.sin(x * 0.25 + 2));

export function buildMap() {
  const terr = new Uint8Array(W * H).fill(T.GRASS), solid = new Uint8Array(W * H), objs = [], points = {};
  const idx = (x, y) => y * W + x, inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const set = (x, y, t) => { if (inb(x, y)) terr[idx(x, y)] = t; };
  const get = (x, y) => inb(x, y) ? terr[idx(x, y)] : T.WATER;
  const ell = (cx, cy, rx, ry, t, noise = 0) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d < 1 + (hash2(x, y, 3) - 0.5) * noise) set(x, y, t); } };
  // zones of ground
  ell(10, 8, 11, 9.5, T.MOSS, 0.5);            // NW forest
  ell(53, 24, 7.5, 9, T.MOSS, 0.5);            // east wood
  ell(9, 28, 10.5, 7.5, T.MOSS, 0.4);          // wetland
  for (let x = 0; x < W; x++) { for (let y = beachY(x); y < H; y++) set(x, y, T.SAND); for (let y = shoreY(x); y < H; y++) set(x, y, T.WATER); }
  for (let y = 0; y < H; y++) { const cx = riverX(y); for (let x = cx - 1; x <= cx + 1; x++) if (get(x, y) !== T.WATER || y < 39) set(x, y, T.WATER); }
  ell(9, 27, 6.5, 4.2, T.WATER, 0.25);        // pond
  ell(9, 8, 3.2, 3, T.GRASS); ell(54, 23, 2.6, 2.6, T.GRASS); // clearings
  // sand banks beside river bends and pond
  for (let y = 20; y < 34; y++) { const cx = riverX(y); if (y % 5 < 3) { set(cx + 2, y, T.SAND); set(cx - 2, y, T.SAND); } }
  ell(17.5, 27.5, 1.6, 2.4, T.SAND);
  // tidepools
  for (const [x, y] of [[46, 36], [47, 36], [47, 37], [52, 35], [53, 35], [53, 36], [40, 37]]) set(x, y, T.WATER);
  // station plaza
  for (let y = 21; y <= 24; y++) for (let x = 29; x <= 41; x++) set(x, y, T.DECK);
  // paths (2 wide)
  const path = (x0, y0, x1, y1) => { let x = x0, y = y0; const st = () => { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const t = get(x + dx, y + dy); if (t !== T.WATER && t !== T.DECK) set(x + dx, y + dy, T.PATH); } }; st(); while (x !== x1 || y !== y1) { if (x !== x1 && (y === y1 || hash2(x, y, 1) < 0.5 || Math.abs(x1 - x) > Math.abs(y1 - y))) x += Math.sign(x1 - x); else y += Math.sign(y1 - y); st(); } };
  const bA = [riverX(22) - 3, riverX(22) + 3]; // bridge A
  for (let x = bA[0] + 1; x <= bA[1] - 1; x++) for (const y of [22, 23]) set(x, y, T.DECK);
  const bB = [riverX(31) - 3, riverX(31) + 3];
  for (let x = bB[0] + 1; x <= bB[1] - 1; x++) for (const y of [31, 32]) set(x, y, T.DECK);
  path(28, 22, bB[1], 22); path(bA[0], 22, 16, 22); path(16, 22, 16, 11); path(16, 11, 12, 9);
  path(42, 22, 44, 22); path(44, 22, 44, 5); path(44, 6, 33, 8);
  path(35, 25, 35, 33); path(35, 31, bB[1], 31); path(bB[0], 31, 17, 33); path(42, 23, 48, 23);
  path(29, 33, 42, 33);
  // bridges re-apply deck (paths skip deck/water)
  for (let x = 12; x <= 16; x++) for (const y of [26, 27]) set(x, y, T.DECK); // pier
  const solidT = (x, y) => { if (inb(x, y)) solid[idx(x, y)] = 1; };
  const add = (k, tx, ty, o = {}) => { const ob = { k, x: (tx + 0.5) * 16, y: (ty + 1) * 16 - 2, ...o }; objs.push(ob); return ob; };
  const addPx = (k, x, y, o = {}) => { const ob = { k, x, y, ...o }; objs.push(ob); return ob; };
  // named points (tile coords)
  const P = {
    spawn: [37, 22], wren: [35, 21], quill: [38, 9], sato: [16, 13], adeyemi: [17, 7], marsh: [17, 25], raman: [19, 34], hidedoor: [16, 34], costa: [33, 35],
    deer: [8, 7], den: [55, 23], leaf: [6, 12], fern: [4, 6], mushroom: [13, 3], hatch: [42, 35], bench: [25, 27], hillbench: [50, 6],
    waterA: [11, 27], waterB: [9, 23], waterC: [21, 26], pool1: [45, 36], pool2: [48, 37], pool3: [51, 35], bridgeA: [riverX(22), 22],
    nb1: [11, 14], nb2: [30, 12], nb3: [47, 14], t1: [47, 23], t2: [49, 25], t3: [51, 21], t4: [52, 24], t5: [54, 25],
  };
  // find sea edge near x=28 (last sand cell above water)
  { let y = 34; while (get(28, y + 1) !== T.WATER) y++; P.sea = [28, y]; }
  // walkable stand cells for water spots (stand cell next to the water spot)
  for (const [k, [x, y]] of Object.entries(P)) points[k] = { x, y };
  const keep = Object.values(P).map(([x, y]) => [x, y]);
  const nearKeep = (x, y, r = 2.2) => keep.some(([kx, ky]) => Math.hypot(kx - x, ky - y) < r);
  const isPath = (x, y) => get(x, y) === T.PATH || get(x, y) === T.DECK;
  const nearT = (x, y, t) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => get(x + dx, y + dy) === t);
  // buildings (footprints)
  const lab = addPx('lab', 34 * 16 + 8, 20 * 16, { door: [34, 20] }); for (let y = 17; y <= 19; y++) for (let x = 31; x <= 37; x++) solidT(x, y);
  addPx('cabin', 42 * 16, 20 * 16); for (let y = 18; y <= 19; y++) for (let x = 40; x <= 43; x++) solidT(x, y);
  addPx('tent', 28 * 16 + 8, 21 * 16); solidT(27, 20); solidT(28, 20); solidT(28, 19);
  addPx('hide', 16 * 16 + 8, 34 * 16 - 2); for (let y = 32; y <= 33; y++) for (let x = 14; x <= 17; x++) solidT(x, y);
  add('campfire', 35, 24); solidT(35, 24);
  add('crate', 30, 22); solidT(30, 22); add('crate', 31, 22); solidT(31, 22); add('barrel', 40, 22); solidT(40, 22);
  add('lamp', 29, 24); solidT(29, 24); add('lamp', 41, 24); solidT(41, 24);
  add('bench', 24, 26, { w: 2 }); solidT(24, 26);
  add('bench', 49, 6); solidT(49, 6); add('lamp', 51, 6); solidT(51, 6);
  add('sign', 36, 23, { id: 'station' }); solidT(36, 23);
  add('sign', 33, 33, { id: 'beach' }); solidT(33, 33);
  addPx('boat', 40 * 16, 37 * 16 + 4); solidT(39, 36); solidT(40, 36);
  // den rocks
  add('rock2', 56, 21); solidT(56, 21); add('rock2', 57, 23); solidT(57, 23); add('rock', 56, 25); solidT(56, 25);
  // keep clear of paths for decorations & trees
  const free = (x, y) => inb(x, y) && !solid[idx(x, y)];
  // border trees
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const border = x <= 0 || x >= W - 1 || y <= 0;
    if (border && get(x, y) !== T.WATER && free(x, y)) { solidT(x, y); add(hash2(x, y, 4) < 0.5 ? 'oak' : 'pine', x, y, { ph: hash2(x, y, 6) * 6.28 }); }
  }
  // trees & scenery
  for (let y = 1; y < H; y++) for (let x = 1; x < W - 1; x++) {
    const t = get(x, y), r = hash2(x, y, 11), r2 = hash2(x, y, 12);
    if (!free(x, y) || isPath(x, y) || nearKeep(x, y)) continue;
    const zone = t === T.MOSS ? 'moss' : t === T.GRASS ? 'grass' : t === T.SAND ? 'sand' : 'x';
    const nearPath = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].some(([dx, dy]) => isPath(x + dx, y + dy));
    if (zone === 'moss') {
      if (nearT(x, y, T.WATER) && r < 0.5) { add('reed', x, y, { ph: r2 * 6 }); continue; }
      if (r < 0.2 && !nearPath) { solidT(x, y); add(r2 < 0.55 ? 'oak' : r2 < 0.9 ? 'pine' : 'oak_autumn', x, y, { ph: r2 * 6.28 }); }
      else if (r < 0.26) add(r2 < 0.5 ? 'fern' : 'mushroom_d', x, y, { ph: r2 * 6, layer: 0 });
      else if (r < 0.3 && !nearPath) { solidT(x, y); add('bush', x, y, { v: 0 }); }
    } else if (zone === 'grass') {
      const meadow = y < 17 && x > 25;
      const near = Math.hypot(x - 22, y - 20) < 4;
      if (nearT(x, y, T.WATER) && r < 0.4) { add('reed', x, y, { ph: r2 * 6 }); continue; }
      if (meadow) {
        if (r < 0.2) add('flower', x, y, { c: 'rypwb'[Math.floor(r2 * 5)], ph: r2 * 6, layer: 0 });
        else if (r < 0.3) add('tuft', x, y, { ph: r2 * 6, layer: 0 });
        else if (r < 0.325 && !nearPath) { solidT(x, y); add('bush', x, y, { v: r2 < 0.5 ? 1 : 2 }); }
        else if (r > 0.985 && !nearPath) { solidT(x, y); add('oak', x, y, { ph: r2 * 6 }); }
      } else {
        if (r < 0.09) add('tuft', x, y, { ph: r2 * 6, layer: 0 });
        else if (r < 0.12) add('flower', x, y, { c: 'rypwb'[Math.floor(r2 * 5)], ph: r2 * 6, layer: 0 });
        else if (r < 0.14 && !nearPath && !near && (y > 26 || x < 28 || x > 44)) { solidT(x, y); add(r2 < 0.5 ? 'bush' : 'rock', x, y, { v: 0 }); }
        else if (r > 0.97 && !nearPath && (y > 26 || y < 15 || x < 27 || x > 43) && (x < 27 || x > 43 || y > 26 || y < 15)) { solidT(x, y); add('oak', x, y, { ph: r2 * 6 }); }
      }
    } else if (zone === 'sand') {
      if (nearT(x, y, T.WATER) && r < 0.2) add('seaweed', x, y, { ph: r2 * 6, layer: 0 });
      else if (r < 0.04) add('shell', x, y, { v: r2 < 0.5 ? 0 : 1, layer: 0 });
      else if (r > 0.99 && !nearPath) { add('driftwood', x, y, { layer: 0 }); }
      else if (r > 0.96 && x < 30 && y > 34 && !nearPath) { solidT(x, y); add('rock', x, y, { v: 0 }); }
    }
  }
  // tidepool rocks ring
  for (const [x, y] of [[44, 36], [45, 37], [46, 38], [48, 36], [48, 38], [50, 35], [51, 34], [52, 36], [54, 36], [53, 34], [54, 35], [39, 37], [41, 37]]) if (!solid[idx(x, y)] && get(x, y) !== T.WATER) { solidT(x, y); add(hash2(x, y, 2) < 0.5 ? 'rock' : 'rock2', x, y); }
  // lily pads on pond
  for (let y = 22; y < 33; y++) for (let x = 2; x < 16; x++) if (get(x, y) === T.WATER && hash2(x, y, 31) < 0.12 && !nearKeep(x, y, 2)) add('lily', x, y, { ph: hash2(x, y, 5) * 6, layer: 0 });
  // water & deck solidity
  for (let i = 0; i < W * H; i++) if (terr[i] === T.WATER) solid[i] = 1;
  // re-assert building/props solids on deck plaza
  solid[idx(35, 24)] = 1; solid[idx(30, 22)] = 1; solid[idx(31, 22)] = 1; solid[idx(40, 22)] = 1; solid[idx(29, 24)] = 1; solid[idx(41, 24)] = 1; solid[idx(36, 23)] = 1;
  // carve guaranteed clearance around points (remove trees/solids from keep cells)
  for (const [kx, ky] of keep) { solid[idx(kx, ky)] = terr[idx(kx, ky)] === T.WATER ? 1 : 0; }
  for (let i = objs.length - 1; i >= 0; i--) { const o = objs[i]; if (o.k === 'tree') continue; }
  objs.sort((a, b) => a.y - b.y);
  const zones = [
    { id: 'station', name: 'Field Station', x0: 26, y0: 15, x1: 45, y1: 27 }, { id: 'meadow', name: 'Wildflower Meadow', x0: 24, y0: 0, x1: 60, y1: 15 },
    { id: 'forest', name: 'Hushwood Forest', x0: 0, y0: 0, x1: 21, y1: 17 }, { id: 'wetland', name: 'Reedmere Wetland', x0: 0, y0: 20, x1: 20, y1: 34 },
    { id: 'eastwood', name: 'Foxhollow Wood', x0: 45, y0: 16, x1: 60, y1: 32 }, { id: 'beach', name: 'Saltglass Beach', x0: 0, y0: 34, x1: 60, y1: 45 },
    { id: 'river', name: 'Lantern River', x0: 17, y0: 0, x1: 26, y1: 40 },
  ];
  return { W, H, terr, solid, objs, points, zones, riverX, shoreY };
}
export function zoneAt(map, tx, ty) {
  const order = ['beach', 'wetland', 'station', 'eastwood', 'forest', 'meadow', 'river'];
  for (const id of order) { const z = map.zones.find(z => z.id === id); if (tx >= z.x0 && tx < z.x1 && ty >= z.y0 && ty < z.y1) return z; }
  return map.zones[0];
}
export function bfs(map, from, to) {
  const { W, H, solid } = map, key = (x, y) => y * W + x, prev = new Int32Array(W * H).fill(-1), q = [from]; prev[key(...from)] = key(...from);
  if (solid[key(...to)]) return null;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i]; if (x === to[0] && y === to[1]) break;
    for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || solid[key(nx, ny)] || prev[key(nx, ny)] >= 0) continue; prev[key(nx, ny)] = key(x, y); q.push([nx, ny]); }
  }
  if (prev[key(...to)] < 0) return null;
  const out = []; let c = key(...to); while (c !== key(...from)) { out.push([c % W, Math.floor(c / W)]); c = prev[c]; } out.push(from); return out.reverse();
}
