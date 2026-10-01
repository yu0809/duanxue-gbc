'use strict';
// ============================================================
//  第三章 · 寒潭 — 冰洞、冰蛟、往昔
// ============================================================
const CAVE_LEGEND = {
  '#': 'cave_wall',
  '.': ['cavefloor', 'cavefloor', 'cavefloor2', 'cavefloor'],
  ',': 'cavefloor2',
  'i': 'ice',
  'o': { g: 'ice', o: 'crystal' },
  'O': { g: 'cavefloor', o: 'crystal' },
  'h': 'lake',
  '*': { g: 'cavefloor', o: 'savestone' },
};

defMap('cave1', {
  title: '寒潭冰洞',
  music: 'cave',
  weather: 'motes',
  legend: CAVE_LEGEND,
  bg2: 'cave',
  enc: { steps: [16, 28], group: 'cave', bg: 'cave', zone: (x, y) => y < 4 || y > 13 },
  escapeTo: ['backhill', 8, 14],
  ground: [
    '########..##########',
    '#######....#########',
    '######.....,.#######',
    '##.......,......####',
    '##iiiiiiiiiiiiio####',
    '##iiiiiiiiiioiii####',
    '##ioiiiiiiiiiiio####',
    '##iiiiiiohiiiiii####',
    '##iiiiiiiiiiiiii####',
    '##iiiiiiiiiiiiii####',
    '##iioiiiiiiiioii####',
    '##iiiiiiiiiiiiii####',
    '##iiiiiiiiiiiiii####',
    '##iiiiioiiiiiiii####',
    '##########...#######',
    '#########.....######',
    '#########..O..######',
    '##########..########',
  ],
  async onEnter() {
    if (!flag('ch3card')) {
      setFlag('ch3card');
      setChapter('第三章·寒潭');
      await fadeOut('black', 4);
      await chapterCard('第三章', '寒潭');
      Field.draw(ctx);
      await fadeIn(6);
    }
  },
  events: [
    { type: 'warp', x: 8, y: 0, w: 2, to: 'backhill', tx: 8, ty: 14, face: 'up' },
    { type: 'warp', x: 10, y: 17, w: 2, to: 'cave2', tx: 9, ty: 1, face: 'down' },
    { type: 'touch', x: 6, y: 3, w: 6, h: 1, cond: () => !flag('iceHint'), run: async () => {
      setFlag('iceHint');
      await say('shenmo', '整片都是冰……一脚踩上去，非得滑到撞墙不可。');
      await say('linfeng', '那就算好再踩。|冰晶撞得停人，往哪儿滑、在哪儿停，先看清楚。');
      await say('shenmo', '你这话说得，跟我师父教打铁一模一样。');
    } },
  ],
});

defMap('cave2', {
  title: '寒潭冰洞·深处',
  music: 'cave',
  weather: 'motes',
  legend: CAVE_LEGEND,
  bg2: 'cave',
  enc: { steps: [16, 28], group: 'cave', bg: 'cave', zone: (x, y) => !TILES[Field.map.g(x, y)].ice },
  escapeTo: ['backhill', 8, 14],
  ground: [
    '########..##########',
    '########..##########',
    '#####.........######',
    '###..,.....,....####',
    '###iiiiiiiiiiiiii###',
    '###iiiiiioiiiiiii###',
    '###iiiiiiiiiiioii###',
    '###ioiiiiiiiiiiii###',
    '###iiiiiiiiiiiiio###',
    '###iiiiiiii.iiiii###',
    '###iiiiiioiiiiiii###',
    '###iiiiiiiiiiiiii###',
    '###oiiiiiiiiiiiii###',
    '###iiiiiiiiiioiii###',
    '#######...##########',
    '######.....#..*..###',
    '######.....#.....###',
    '######..............',
    '########....########',
    '########....########',
  ],
  chests: [
    { id: 'k1', x: 7, y: 16, item: 'icetalis', n: 2 },
    { id: 'k2', x: 16, y: 15, item: 'dew' },
  ],
  events: [
    { type: 'warp', x: 8, y: 0, w: 2, to: 'cave1', tx: 10, ty: 16, face: 'up' },
    { type: 'warp', x: 8, y: 19, w: 4, to: 'cave3', tx: 7, ty: 12, face: 'up' },
    { type: 'check', x: 14, y: 15, run: () => saveStone() },
    Object.assign(shardEvent(4, 11, 9), {}),
  ],
});

defMap('cave3', {
  title: '寒潭',
  music: () => (flag('dragonDone') ? 'cave' : 'tomb'),
  weather: 'motes',
  legend: CAVE_LEGEND,
  bg2: 'cave',
  ground: [
    '##############',
    '###........###',
    '##..........##',
    '#....hhhh....#',
    '#...hhhhhh...#',
    '#...hhhhhh...#',
    '#...hhhhhh...#',
    '#....hhhh....#',
    '##..........##',
    '###........###',
    '####......####',
    '#####....#####',
    '######..######',
    '######..######',
  ],
  build(m) {
    m.put(2, 2, 'crystal'); m.put(11, 2, 'crystal'); m.put(1, 8, 'crystal'); m.put(12, 8, 'crystal');
    if (!flag('dragonDone')) m.deco.push({ img: BART.enemy_dragon || enemyImage({ art: 'dragon', pal: 'ice' }), x: 3 * 16 - 8, y: 2 * 16 - 4, over: true, dragon: true });
  },
  events: [
    { type: 'warp', x: 6, y: 13, w: 2, to: 'cave2', tx: 9, ty: 18, face: 'down' },
    { type: 'touch', x: 4, y: 9, w: 6, h: 1, cond: () => !flag('dragonDone'), run: () => evDragon() },
  ],
  drawOver(g, cx, cy, m) {
    // the dragon breathes: a slow bob
    for (const d of m.deco) if (d.dragon) d.y = 2 * 16 - 4 + Math.round(Math.sin(frameCount / 30) * 2);
  },
});
async function evDragon() {
  await say('shenmo', '……这潭水，冻得跟镜子似的。');
  Sound.sfx('thunder');
  shake(20, 2);
  await wait(30);
  await say('？？？', '……雪中之灵。');
  await say('？？？', '你回来了。');
  await say('suli', '……你知道我？');
  await say('冰蛟', '三百年前，你从剑上碎下一片，落进我的潭里。|我守着它，守到潭水结了冰，冰结了三百层。');
  await say('linfeng', '冰蛟……竟是真的。');
  await say('冰蛟', '我守它，是因为它冷。|我也冷。冷的东西，凑在一起，就不那么冷了。');
  await say('冰蛟', '你要拿走它？');
  await say('suli', '……要。');
  await say('冰蛟', '那就让我看看，|这三百年，你学会了什么。');
  await startBattle({ enemies: ['icedragon'], bg: 'cave', boss: true, music: 'boss',
    intro: async (B) => { await B.say('冰蛟从冰面下升起！', 50); await B.say('（它蓄力时，记得防御。）', 60); } });
  Field.map.deco = Field.map.deco.filter((d) => !d.dragon);
  await say('冰蛟', '……原来如此。');
  await say('冰蛟', '你身边，有暖的东西了。');
  await say('冰蛟', '拿去吧。|我要睡了……这一回，能睡个暖觉。');
  setFlag('dragonDone');
  await absorbLing('water');
  await evMemoryPeak();
}

// ---------------- 往昔 · 栖云山顶（回忆） ----------------
defMap('memory', {
  title: null,
  music: 'memory',
  weather: 'snow',
  tint: 'memory',
  legend: { '.': ['snow', 'snow', 'snow2', 'snow'], '#': 'cliff_wall', '=': 'path' },
  ground: [
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '#........#',
    '##########',
  ],
  build(m) { m.big('plum', 6, 1); m.put(2, 2, 'stone_lantern'); },
  npcs: [
    { id: 'mc', sprite: 'mochen', x: 3, y: 5, dir: 'right' },
    { id: 'sl', sprite: 'suli', x: 6, y: 5, dir: 'left' },
  ],
});
async function evMemoryPeak() {
  Music.fadeOut();
  await fadeOut('white', 8);
  const party = State.party.slice();
  Field.load('memory', 4, 7, 'up');
  const p = P(); p.visible = false;
  for (const f of Field.followers) f.visible = false;
  Field.followers = [];
  Field.draw(ctx);
  await fadeIn(8);
  await tell('（三百年前。栖云山顶。）');
  await say('mochen', '你又来了。');
  await say('suli', '这里的雪，最干净。');
  await say('mochen', '你是雪里生出来的？');
  await say('suli', '大概是。');
  await say('mochen', '名字也是“大概”的？');
  await say('suli', '没有名字。');
  await emote('mc', '…', 40);
  await say('mochen', '……那我给你起一个。');
  await say('mochen', '苏璃。|苏醒的苏，琉璃的璃。');
  await say('mochen', '雪化了就没了。|琉璃不会。');
  await walk('mc', 'r');
  await wait(40);
  await say('suli', '……苏璃。');
  await wait(30);
  await fadeOut('white', 8);
  Field.load('cave3', 7, 9, 'up');
  Field.resetFollowers();
  Field.draw(ctx);
  await fadeIn(8);
  const s = detach('suli');
  lookAt('player', 'suli');
  await say('shenmo', '苏璃？');
  await say('shenmo', '你……哭了？');
  await tell('（洞里，无端下起了细细的雪。）');
  await say('suli', '……他也问过。');
  await say('shenmo', '问什么？');
  await say('suli', '“名字也是‘大概’的吗？”');
  await emote('player', '…', 40);
  await say('shenmo', '……谁问的？');
  await say('suli', '一个很久以前的人。');
  await say('linfeng', '……');
  reattach();
  setFlag('caveDone'); setFlag('sectAttacked');
  await ledger('冰蛟：守了三百年的东西，还给了苏璃。（谁也不欠谁了。）');
  await tell('（回栖云派，把寒潭的事告诉玄清真人。）');
}

// back at the sect, the tower seal has broken
async function evSectAttacked() {
  await walk('player', 'u');
  await say('xuanqing', '……你们回来了。');
  await say('linfeng', '师父！您受伤了？！');
  await say('xuanqing', '不碍事。');
  await say('xuanqing', '寒潭的水之灵一动，塔里的东西就醒了。|镇妖塔的封印……裂了。');
  await say('xuanqing', '冲下山的，只是些影子。|烬本人，没有出来。');
  await say('shenmo', '他为什么不出来？');
  await say('xuanqing', '他在等。|三百年来，他一直在等那柄剑。');
  await say('xuanqing', '雷之灵在塔顶。断雪要重铸，这一趟，躲不过去。');
  await getItem('towerkey');
  await say('linfeng', '弟子叶临风，请命上塔。');
  await say('xuanqing', '去吧。');
  await say('shenmo', '道长，我能问一句吗？|他等的，到底是剑，还是人？');
  await say('xuanqing', '……你去了，就知道了。');
  setFlag('towerOpen');
  setChapter('第四章·镇妖');
  Music.fadeOut();
  await fadeOut('black', 6);
  await chapterCard('第四章', '镇妖');
  Field.draw(ctx);
  await fadeIn(6);
  await tell('（镇妖塔在后山东边。）');
}
