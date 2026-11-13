import { buildMap, bfs } from '../src/map.js';
const m = buildMap(); const ch = ['~', ':', '"', ',', '=', '#'];
const ob = new Map(); for (const o of m.objs) ob.set(Math.floor(o.x / 16) + ',' + Math.floor(o.y / 16), o);
let s = '';
for (let y = 0; y < m.H; y++) { for (let x = 0; x < m.W; x++) { const pt = Object.entries(m.points).find(([k, p]) => p.x === x && p.y === y); s += pt ? pt[0][0].toUpperCase() : m.solid[y * m.W + x] ? (m.terr[y * m.W + x] === 0 ? '~' : 'T') : ch[m.terr[y * m.W + x]]; } s += '\n'; }
console.log(s);
const sp = [m.points.spawn.x, m.points.spawn.y];
for (const [k, p] of Object.entries(m.points)) { const r = bfs(m, sp, [p.x, p.y]); console.log(k, r ? r.length : 'UNREACHABLE'); }
