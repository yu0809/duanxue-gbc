// Simulate random encounters per area at the expected level.
const S = require('./load.js');
const vm = require('vm');
const ev = (c) => vm.runInContext(c, S);
// reuse the bot and battle harness from sim.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/sim.js', 'utf8');
eval(src.split('const SCEN = [')[0].replace("const S = require('./load.js');", '').replace("const vm = require('vm');", '').replace(/^const runs.*$/m, '').replace(/^const ev = .*$/m, ''));
const AREAS = [
  { name: '雪夜', group: 'raid', party: [['shenmo', 2], ['suli', 2]], gear: {}, sword: 1 },
  { name: '竹林', group: 'bamboo', party: [['shenmo', 4], ['suli', 4]], gear: { shenmo: { armor: 'leather' } }, sword: 1 },
  { name: '迷踪', group: 'bamboo2', party: [['shenmo', 5], ['suli', 5]], gear: { shenmo: { armor: 'leather' } }, sword: 1 },
  { name: '山道', group: 'mountain', party: [['shenmo', 7], ['suli', 7]], gear: { shenmo: { armor: 'cotton' }, suli: { weapon: 'featherfan' } }, sword: 2 },
  { name: '寒潭', group: 'cave', party: [['shenmo', 10], ['suli', 10], ['linfeng', 10]], gear: { shenmo: { armor: 'chain' }, suli: { weapon: 'featherfan' }, linfeng: { weapon: 'songwen' } }, sword: 2 },
  { name: '镇妖塔', group: 'tower', party: [['shenmo', 13], ['suli', 13], ['linfeng', 13]], gear: { shenmo: { armor: 'chain' }, suli: { weapon: 'featherfan', armor: 'cloudrobe' }, linfeng: { weapon: 'songwen', armor: 'chain' } }, sword: 3 },
  { name: '塔上', group: 'tower2', party: [['shenmo', 15], ['suli', 15], ['linfeng', 15]], gear: { shenmo: { armor: 'silk' }, suli: { weapon: 'icebell', armor: 'cloudrobe' }, linfeng: { weapon: 'qiyun', armor: 'chain' } }, sword: 3 },
  { name: '剑冢', group: 'tomb', party: [['shenmo', 17], ['suli', 17], ['linfeng', 17]], gear: { shenmo: { armor: 'silk' }, suli: { weapon: 'icebell', armor: 'silk' }, linfeng: { weapon: 'liuguang', armor: 'silk' } }, sword: 4 },
];
(async () => {
  for (const a of AREAS) {
    const groups = ev(`GROUPS['${a.group}']`);
    let rounds = 0, low = 0, worst = 1, exp = 0, wins = 0, n = 0;
    for (const g of groups) for (let k = 0; k < 4; k++) {
      setup(a.party, a.gear, { herb: 3 }, a.sword, []);
      const res = await fight(g);
      n++;
      if (res.r === 'win') { wins++; rounds += res.turns / (a.party.length + g.length); low += res.hpLeft; worst = Math.min(worst, res.hpLeft); }
      exp += g.reduce((s, e) => s + ev(`ENEMIES['${e}'].exp`), 0);
    }
    const lv = a.party[0][1];
    const need = ev(`EXP_TABLE[${lv + 1}] - EXP_TABLE[${lv}]`);
    console.log(`${a.name.padEnd(4)} win ${Math.round((wins / n) * 100)}%  rounds ${(rounds / wins).toFixed(1)}  lowest hp ${Math.round((low / wins) * 100)}% (worst ${Math.round(worst * 100)}%)  exp/battle ${Math.round(exp / n)}  battles/level ${(need / (exp / n)).toFixed(1)}`);
  }
})();
