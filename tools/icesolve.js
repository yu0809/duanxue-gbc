// BFS over an ice map: node tools/icesolve.js mapId sx sy ex ey
// Prints the shortest list of inputs and how many cells are reachable.
const sandbox = require('./load.js');
const [id, sx, sy, ex, ey] = [process.argv[2], ...process.argv.slice(3).map(Number)];
const def = sandbox.__M[id];
const m = new sandbox.__MI(def);
const T = sandbox.__T;
const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const solid = (x, y) => m.solidAt(x, y);
const ice = (x, y) => { const t = T[m.g(x, y)]; return t && t.ice; };
function move(x, y, d) {
  const [dx, dy] = D[d];
  if (solid(x + dx, y + dy)) return null;
  x += dx; y += dy;
  while (ice(x, y) && !solid(x + dx, y + dy)) { x += dx; y += dy; }
  return [x, y];
}
const seen = new Map([[sx + ',' + sy, []]]);
const q = [[sx, sy]];
while (q.length) {
  const [x, y] = q.shift();
  for (const d of Object.keys(D)) {
    const r = move(x, y, d);
    if (!r) continue;
    const k = r.join(',');
    if (seen.has(k)) continue;
    seen.set(k, seen.get(x + ',' + y).concat(d));
    q.push(r);
  }
}
const goal = seen.get(ex + ',' + ey);
console.log(goal ? `solvable in ${goal.length} moves: ${goal.join(' ')}` : 'NOT solvable');
console.log('reachable cells:', seen.size);
if (process.argv[7]) for (const k of process.argv.slice(7)) console.log(k, seen.has(k) ? 'reachable: ' + seen.get(k).join(' ') : 'unreachable');
