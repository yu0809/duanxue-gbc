// Node checker for map data: row widths, unknown tiles, warp targets,
// actors/chests standing on solid ground. usage: node tools/checkmaps.js
const sandbox = require('./load.js');
const MAPS = sandbox.__M, TILES = sandbox.__T;
let problems = 0;
const bad = (m, msg) => { console.log(`[${m}] ${msg}`); problems++; };
for (const [id, def] of Object.entries(MAPS)) {
  const w = def.ground[0].length;
  def.ground.forEach((r, i) => { if (r.length !== w) bad(id, `row ${i} width ${r.length} != ${w}`); });
  let m;
  try { m = new sandbox.__MI(def); } catch (e) { bad(id, 'build failed: ' + e.message); continue; }
  for (let i = 0; i < m.ground.length; i++) if (!TILES[m.ground[i]]) bad(id, `unknown ground tile ${m.ground[i]} at ${i % m.w},${Math.floor(i / m.w)}`);
  for (let i = 0; i < m.obj.length; i++) if (m.obj[i] && !TILES[m.obj[i]]) bad(id, `unknown object ${m.obj[i]}`);
  for (const n of def.npcs || []) {
    if (n.sprite && !sandbox.__S[n.sprite]) bad(id, `npc ${n.id} unknown sprite ${n.sprite}`);
    if (m.solidAt(n.x, n.y)) bad(id, `npc ${n.id} on solid tile ${n.x},${n.y}`);
  }
  for (const f of def.foes || []) {
    if (!sandbox.__S[f.sprite]) bad(id, `foe ${f.id} unknown sprite ${f.sprite}`);
    for (const e of f.group) if (!sandbox.__E[e]) bad(id, `foe ${f.id} unknown enemy ${e}`);
    if (m.solidAt(f.x, f.y)) bad(id, `foe ${f.id} on solid tile`);
  }
  for (const c of def.chests || []) { if (c.item && !sandbox.__I[c.item]) bad(id, `chest ${c.id} unknown item ${c.item}`); }
  for (const ev of def.events || []) {
    if (ev.type === 'warp') {
      const t = MAPS[ev.to];
      if (!t) { bad(id, `warp to missing map ${ev.to}`); continue; }
      const tm = new sandbox.__MI(t);
      if (tm.solidAt(ev.tx, ev.ty)) bad(id, `warp to ${ev.to} lands on solid ${ev.tx},${ev.ty} (${tm.g(ev.tx, ev.ty)}/${tm.o(ev.tx, ev.ty)})`);
    }
  }
  if (def.enc) for (const g of sandbox.globalThis.GROUPS ? [] : []) {}
}
console.log(problems ? `${problems} problem(s)` : `maps OK (${Object.keys(MAPS).length})`);
