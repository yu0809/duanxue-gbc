// Static reachability: from each map entrance, which exits/chests/NPCs/triggers can be reached?
const S = require('./load.js');
const MAPS = S.__M, T = S.__T;
const D = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const entries = {};
for (const [id, def] of Object.entries(MAPS)) for (const ev of def.events || []) if (ev.type === 'warp') (entries[ev.to] = entries[ev.to] || []).push([ev.tx, ev.ty, id]);
let issues = 0;
for (const [id, def] of Object.entries(MAPS)) {
  const m = new S.__MI(def);
  const blockers = new Set((def.npcs || []).map((n) => n.x + ',' + n.y).concat((def.blocks || []).map((b) => b.x + ',' + b.y)));
  const solid = (x, y) => m.solidAt(x, y) || blockers.has(x + ',' + y);
  const ice = (x, y) => { const t = T[m.g(x, y)]; return t && t.ice; };
  const starts = entries[id] || [];
  if (!starts.length) { if (!['memory', 'forge'].includes(id)) console.log(`[${id}] no entrances`); continue; }
  const seen = new Set();
  const q = [];
  for (const [x, y] of starts) { seen.add(x + ',' + y); q.push([x, y]); }
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D) {
      let nx = x + dx, ny = y + dy;
      if (solid(nx, ny)) continue;
      while (ice(nx, ny) && !solid(nx + dx, ny + dy)) { nx += dx; ny += dy; }
      const k = nx + ',' + ny;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  const touches = (ev) => { for (let yy = ev.y; yy < ev.y + (ev.h || 1); yy++) for (let xx = ev.x; xx < ev.x + (ev.w || 1); xx++) if (seen.has(xx + ',' + yy)) return true; return false; };
  const adjacent = (x, y) => D.some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy))) || D.some(([dx, dy]) => seen.has((x + 2 * dx) + ',' + (y + 2 * dy)));
  for (const ev of def.events || []) {
    if (ev.type === 'check') { if (!(touches(ev) ? true : (() => { for (let yy = ev.y; yy < ev.y + (ev.h || 1); yy++) for (let xx = ev.x; xx < ev.x + (ev.w || 1); xx++) if (adjacent(xx, yy)) return true; return false; })())) { console.log(`[${id}] check at ${ev.x},${ev.y} unreachable`); issues++; } continue; }
    if (!touches(ev)) { console.log(`[${id}] ${ev.type}${ev.to ? '→' + ev.to : ''}${ev.shard ? ' shard' + ev.shard : ''} at ${ev.x},${ev.y} unreachable`); issues++; }
  }
  for (const c of def.chests || []) if (!adjacent(c.x, c.y)) { console.log(`[${id}] chest ${c.id} unreachable`); issues++; }
  for (const n of def.npcs || []) if (n.talk && !adjacent(n.x, n.y)) { console.log(`[${id}] npc ${n.id} unreachable`); issues++; }
}
console.log(issues ? `${issues} reachability warning(s)` : 'all reachable');
