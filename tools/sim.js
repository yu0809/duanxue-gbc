// Headless battle simulator: plays boss fights with a sensible bot.
// usage: node tools/sim.js [runs]
const S = require('./load.js');
const vm = require('vm');
const runs = +(process.argv[2] || 30);
const ev = (code) => vm.runInContext(code, S);

ev(`
function botAction(b, B) {
  const live = B.enemies.filter((e) => !e.dead);
  const allies = B.allies;
  const charging = live.some((e) => e.charge);
  const low = allies.filter((a) => !a.dead && a.hp < a.mhp * 0.45);
  const dead = allies.filter((a) => a.dead);
  const sk = charSkills(b.c);
  const can = (id) => sk.includes(id) && b.mp >= (SKILLS[id].mp || 0) && !(SKILLS[id].gold && State.gold < SKILLS[id].gold) && !b.status.seal;
  if (charging && b.hp < b.mhp * 0.9) return { type: 'defend' };
  // healer duties
  if (dead.length && can('revive')) return { type: 'skill', skill: 'revive', target: dead[0] };
  if (dead.length && State.items.incense) return { type: 'item', item: 'incense', target: dead[0] };
  if (low.length >= 2 && can('rain')) return { type: 'skill', skill: 'rain', target: allies };
  if (low.length && can('heal')) return { type: 'skill', skill: 'heal', target: low.sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0] };
  if (low.length && b.hp < b.mhp * 0.35) {
    for (const it of ['pill', 'salve', 'herb', 'shaobing', 'candy']) if (State.items[it]) return { type: 'item', item: it, target: b };
  }
  if (b.mp < 6) for (const it of ['dew', 'lingzhi']) if (State.items[it] && b.mmp > 30) return { type: 'item', item: it, target: b };
  // offence: best expected damage
  const tgt = live.sort((x, y) => x.hp - y.hp)[0];
  let best = { type: 'attack', target: tgt }, bestScore = eff(b, 'atk');
  for (const id of sk) {
    const Sk = SKILLS[id];
    if (!can(id) || !['phys', 'mag'].includes(Sk.kind)) continue;
    const base = Sk.kind === 'phys' ? eff(b, 'atk') : eff(b, 'mag') * 1.1;
    const n = Sk.target === 'enemies' ? live.length : 1;
    const em = Math.max(...live.map((e) => elemMult(Sk.el, e.el)));
    const score = base * Sk.power * (Sk.hits || 1) * n * em;
    if (score > bestScore * 1.15) { bestScore = score; best = { type: 'skill', skill: id, target: Sk.target === 'enemies' ? live : tgt }; }
  }
  if (!B.buffed && can('swift')) { B.buffed = true; return { type: 'skill', skill: 'swift', target: allies }; }
  return best;
}
Battle.playerCommand = async function (b) { return botAction(b, this); };
`);

function setup(party, gear, items, sword, flags) {
  ev(`State = freshState(); initParty();`);
  S.__setup = { party, gear, items, sword, flags };
  ev(`{
    const su = globalThis.__setup;
    State.party = [];
    for (const [id, lv] of su.party) { State.chars[id] = newChar(id, lv); State.party.push(id); }
    for (const [id, eq] of Object.entries(su.gear)) Object.assign(State.chars[id].equip, eq);
    for (const id of State.party) { const c = State.chars[id]; const s = stats(c); c.hp = s.mhp; c.mp = s.mmp; }
    State.items = Object.assign({}, su.items);
    State.sword = su.sword; State.gold = 500;
    for (const k of LING_ORDER.slice(0, su.sword)) State.flags['ling_' + k] = true;
    for (const f of su.flags || []) State.flags[f] = true;
  }`);
}
async function fight(enemies, bg = 'snow') {
  S.__res = null; S.__turns = 0;
  ev(`Game.scene = { update() {}, draw() {} };`);
  ev(`Battle.start({ enemies: ${JSON.stringify(enemies)}, bg: '${bg}', boss: true }).then((r) => { globalThis.__res = r; globalThis.__turns = Battle.turn; });`);
  let guard = 0;
  const stepFn = S.step;
  const inp = ev('Input');
  const B = ev('Battle');
  let low = 1, deaths = 0;
  while (S.__res === null && guard++ < 400000) {
    inp.latch.a = true;
    stepFn();
    await null; await null; await null;
    if (B.allies && !B.over) {
      const f = B.allies.reduce((s, a) => s + Math.max(0, a.hp), 0) / B.allies.reduce((s, a) => s + a.mhp, 0);
      if (f < low) low = f;
      const d = B.allies.filter((a) => a.dead).length; if (d > deaths) deaths = d;
    }
  }
  return { r: S.__res, turns: S.__turns, hpLeft: low, deaths };
}
const SCEN = [
  { name: '雪夜群妖L1', enemies: ['wolf', 'foxfire', 'foxfire'], party: [['shenmo', 1], ['suli', 1]], gear: {}, items: { herb: 6 }, sword: 1 },
  { name: '雪夜群妖L2', enemies: ['wolf', 'foxfire', 'foxfire'], party: [['shenmo', 2], ['suli', 2]], gear: {}, items: { herb: 6 }, sword: 1 },
  { name: '狼妖头目', enemies: ['wolfking'], party: [['shenmo', 3], ['suli', 3]], gear: {}, items: { herb: 5 }, sword: 1 },
  { name: '竹魅', enemies: ['bamboowitch'], party: [['shenmo', 6], ['suli', 6]], gear: { shenmo: { armor: 'leather' }, suli: { acc: 'charm' } }, items: { herb: 4, salve: 2, antidote: 2 }, sword: 1 },
  { name: '叶临风', enemies: ['linfeng_duel'], party: [['shenmo', 8], ['suli', 8]], gear: { shenmo: { armor: 'cotton' }, suli: { weapon: 'featherfan', armor: 'cotton' } }, items: { salve: 4, lingzhi: 2 }, sword: 2 },
  { name: '冰蛟', enemies: ['icedragon'], party: [['shenmo', 12], ['suli', 12], ['linfeng', 12]], gear: { shenmo: { armor: 'chain', acc: 'boots' }, suli: { weapon: 'featherfan', armor: 'cloudrobe' }, linfeng: { weapon: 'songwen', armor: 'chain' } }, items: { salve: 5, lingzhi: 3, incense: 1 }, sword: 2 },
  { name: '烬', enemies: ['jin'], party: [['shenmo', 16], ['suli', 16], ['linfeng', 16]], gear: { shenmo: { armor: 'silk', acc: 'boots' }, suli: { weapon: 'icebell', armor: 'cloudrobe', acc: 'calmbead' }, linfeng: { weapon: 'qiyun', armor: 'chain' } }, items: { salve: 4, pill: 2, dew: 2, incense: 2 }, sword: 3 },
  { name: '魇', enemies: ['yan1'], party: [['shenmo', 19], ['suli', 19], ['linfeng', 19]], gear: { shenmo: { armor: 'silk', acc: 'fivejade' }, suli: { weapon: 'icebell', armor: 'silk', acc: 'calmbead' }, linfeng: { weapon: 'liuguang', armor: 'silk', acc: 'boots' } }, items: { pill: 4, dew: 3, incense: 2 }, sword: 5, flags: ['finalArt'] },
  { name: '魇·归墟', enemies: ['yan2'], party: [['shenmo', 19], ['suli', 19], ['linfeng', 19]], gear: { shenmo: { armor: 'silk', acc: 'fivejade' }, suli: { weapon: 'icebell', armor: 'silk', acc: 'calmbead' }, linfeng: { weapon: 'liuguang', armor: 'silk', acc: 'boots' } }, items: { pill: 3, dew: 2, incense: 2 }, sword: 5, flags: ['finalArt'] },
];
const only = process.argv[3];
(async () => {
for (const sc of SCEN) {
  if (only && !sc.name.includes(only)) continue;
  let wins = 0, turns = 0, hp = 0, minhp = 1, ko = 0;
  for (let i = 0; i < runs; i++) {
    setup(sc.party, sc.gear, sc.items, sc.sword, sc.flags);
    const res = await fight(sc.enemies);
    if (process.env.DEBUG) console.log(res);
    if (res.r === 'win') { wins++; turns += res.turns; hp += res.hpLeft; minhp = Math.min(minhp, res.hpLeft); ko += res.deaths ? 1 : 0; }
  }
  const actors = sc.party.length + sc.enemies.length;
  console.log(`${sc.name.padEnd(6)} win ${String(Math.round((wins / runs) * 100)).padStart(3)}%  rounds ${wins ? (turns / wins / actors).toFixed(1) : '-'}  lowest hp avg ${wins ? Math.round((hp / wins) * 100) + '%' : '-'} (worst ${Math.round(minhp * 100)}%)  someone KO'd in ${Math.round((ko / runs) * 100)}%`);
}
})();
