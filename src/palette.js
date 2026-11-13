// BIOGAME master palette: 30 colours + transparent (index 0). Every sprite/tile uses only these.
export const COLORS = [
  ['_', null],
  ['k', '#1a1423'], // ink / outline
  ['w', '#f6f2e7'], // white
  ['g1', '#21463a'], // deep green
  ['g2', '#37753f'],
  ['g3', '#5da64d'],
  ['g4', '#98cb5b'],
  ['g5', '#cde37e'], // light grass
  ['b1', '#1c3868'], // deep water
  ['b2', '#2d68ae'],
  ['b3', '#4aa5d8'],
  ['b4', '#a3e0ee'], // foam / sparkle
  ['s1', '#ecd292'], // sand light
  ['s2', '#c9a066'], // sand dark
  ['d1', '#6c4429'], // dark wood / soil
  ['d2', '#a2693a'],
  ['d3', '#d39b5d'],
  ['r1', '#86282f'],
  ['r2', '#d6463d'],
  ['o1', '#f28b30'],
  ['y1', '#f8d64c'],
  ['p1', '#6f4784'],
  ['p2', '#cf80c4'],
  ['n1', '#3b384c'], // stone dark
  ['n2', '#6c6a7c'],
  ['n3', '#aeacb8'],
  ['f1', '#f2bb8c'], // skin light
  ['f2', '#c58760'], // skin mid
  ['f3', '#7b4b33'], // skin deep
  ['h1', '#4a2b1b'], // hair dark
];
export const C = {};
COLORS.forEach(([n], i) => { C[n] = i; });
export const HEX = COLORS.map(([, h]) => h);
export function rgba(i) {
  const h = HEX[i]; if (!h) return [0, 0, 0, 0];
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
}
