'use strict';
// ============================================================
//  Boot
// ============================================================
function boot() {
  buildCharSprites();
  buildTiles();
  if (typeof buildPortraits === 'function') buildPortraits();
  if (typeof buildBattleArt === 'function') buildBattleArt();
  const q = new URLSearchParams(location.search);
  if (q.get('battle')) {
    // dev: start a battle directly
    State = freshState();
    initParty();
    State.sword = +(q.get('sword') || 1);
    State.flags.ling_fire = true;
    const lv = +(q.get('lv') || 3);
    State.chars.shenmo = newChar('shenmo', lv);
    if (q.get('party')) for (const id of q.get('party').split(',')) { State.chars[id] = newChar(id, lv); State.party.push(id); }
    State.items = { herb: 5, salve: 2, firetalis: 2, incense: 1 };
    State.gold = 200;
    Game.setScene(Field);
    Field.load('town', 13, 9, 'down');
    startLoop();
    setTimeout(() => startBattle({ enemies: q.get('battle').split(','), bg: q.get('bg') || 'snow', boss: q.has('boss') }), 300);
    return;
  }
  if (q.get('jump') && typeof DEV_JUMPS !== 'undefined' && DEV_JUMPS[q.get('jump')]) {
    State = freshState();
    initParty();
    const j = DEV_JUMPS[q.get('jump')];
    for (const f of j.flags || []) State.flags[f] = true;
    State.sword = j.sword || 0;
    for (const k of LING_ORDER.slice(0, State.sword)) State.flags['ling_' + k] = true;
    for (const [id, lv] of j.party) { State.chars[id] = newChar(id, lv); if (!State.party.includes(id)) State.party.push(id); }
    State.items = Object.assign({ herb: 5, salve: 3, lingzhi: 2 }, j.items || {});
    State.gold = j.gold || 300;
    State.chapter = j.chapter || '';
    Game.setScene(Field);
    Field.load(j.map, j.x, j.y, j.dir || 'down');
    Field.resetFollowers();
    startLoop();
    if (j.run) setTimeout(() => runScript(j.run), 200);
    return;
  }
  if (q.get('map')) {
    // dev: jump straight into a map
    State = freshState();
    if (typeof initParty === 'function') initParty();
    Game.setScene(Field);
    Field.load(q.get('map'), +(q.get('x') || 3), +(q.get('y') || 3), 'down');
  } else if (typeof TitleScene !== 'undefined') {
    // keep a running game across live updates of the published page
    const hot = window.claude && window.claude.hot;
    if (hot && hot.snapshot) {
      hot.snapshot(() => {
        if (Game.scene !== Field || !Field.map || Field.locked || Battle.active) return {};
        const p = Field.player;
        return { state: Object.assign(JSON.parse(JSON.stringify(State)), { map: Field.map.def.id, x: p.x, y: p.y, dir: p.dir }) };
      });
    }
    const start = (data) => {
      if (data && data.state) { try { loadState(data.state); return; } catch (e) { console.error(e); } }
      Game.setScene(TitleScene);
    };
    if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
  } else {
    Game.setScene(Field);
    Field.load('town', 13, 9, 'down');
  }
  startLoop();
}
window.addEventListener('load', boot);
