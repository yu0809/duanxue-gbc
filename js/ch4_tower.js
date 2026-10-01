'use strict';
// ============================================================
//  第四章 · 镇妖 — 镇妖塔
// ============================================================
const TOWER_LEGEND = {
  '#': 'tower_wall',
  '.': 'tfloor',
  'S': 'seal_off',
  'D': { g: 'tfloor', o: 'sealdoor' },
  'F': { g: 'tfloor', o: 'brazier' },
  'u': 'tstairs_up',
  'd': 'tstairs_down',
  '*': { g: 'tfloor', o: 'savestone' },
  'X': 'void',
};
const towerBase = {
  music: 'tower',
  legend: TOWER_LEGEND,
  bg: 'K',
  bg2: 'tower',
  weather: 'embers',
  escapeTo: ['backhill', 18, 6],
};
// light every seal tile you step on; when all are lit, open the sealed door
function sealFloor(id, seals, doors, onOpen) {
  return {
    onLoad(m) {
      for (const [x, y] of seals) if (flag(id + ':' + x + ',' + y)) m.setG(x, y, 'seal_on');
      if (flag(id + ':open')) for (const [x, y] of doors) m.put(x, y, null);
    },
    events: seals.map(([x, y]) => ({ type: 'touch', x, y, cond: () => !flag(id + ':' + x + ',' + y), run: async () => {
      setFlag(id + ':' + x + ',' + y);
      Field.map.setG(x, y, 'seal_on');
      Sound.sfx('buff'); flash('gold', 2);
      const lit = seals.filter(([sx, sy]) => flag(id + ':' + sx + ',' + sy)).length;
      if (lit === seals.length) {
        await wait(20);
        Sound.sfx('earth'); shake(16, 2);
        for (const [dx, dy] of doors) Field.map.put(dx, dy, null);
        setFlag(id + ':open');
        await tell('轰——\n封门上的符纸一张张烧了起来，门开了。');
        if (onOpen) await onOpen();
      } else await toast(`（封印 ${lit}/${seals.length}）`, { life: 50 });
    } })),
  };
}

const T1 = sealFloor('t1', [[3, 4], [10, 4], [3, 9], [10, 9]], [[6, 2], [7, 2]]);
defMap('tower1', Object.assign({}, towerBase, {
  title: '镇妖塔 · 一层',
  ground: [
    '##############',
    '######uu######',
    '######..######',
    '##..........##',
    '##.S......S.##',
    '##..F....F..##',
    '##..........##',
    '##..........##',
    '##..........##',
    '##.S......S.##',
    '##..F....F..##',
    '##..........##',
    '######..######',
    '######..######',
  ],
  build(m) { m.put(6, 2, 'sealdoor'); m.put(7, 2, 'sealdoor'); m.big('pillar', 2, 6); m.big('pillar', 11, 6); },
  onLoad: T1.onLoad,
  foes: [
    { id: 'a', sprite: 'm_dark', x: 5, y: 7, group: ['skeleton'], bg: 'tower' },
    { id: 'b', sprite: 'm_red', x: 9, y: 4, group: ['talisman', 'talisman'], bg: 'tower' },
  ],
  enc: { steps: [20, 34], group: 'tower', bg: 'tower' },
  events: T1.events.concat([
    { type: 'warp', x: 6, y: 13, w: 2, to: 'backhill', tx: 18, ty: 6, face: 'left' },
    { type: 'warp', x: 6, y: 1, w: 2, to: 'tower2', tx: 3, ty: 14, face: 'up', sound: 'step' },
    { type: 'check', x: 6, y: 2, w: 2, cond: () => !flag('t1:open'), run: () => tell('封门上贴满了符纸。\n四角的封印阵，好像和它连着。') },
  ]),
  async onEnter() {
    if (!flag('enterTower')) {
      setFlag('enterTower');
      await say('linfeng', '镇妖塔一共五层。|每一层都有封印阵，要过去，得先把阵点亮。');
      await say('shenmo', '点亮？不是该破掉吗？');
      await say('linfeng', '……点亮了，阵就认得你是自己人。|栖云弟子入塔，都是这个规矩。');
      await say('shenmo', '你们栖云派，连镇妖塔都讲规矩。');
    }
  },
}));

defMap('tower2', Object.assign({}, towerBase, {
  title: '镇妖塔 · 二层',
  dark: 30,
  weather: null,
  ground: [
    '################',
    '#..#.....#....u#',
    '#..#.###.#.##..#',
    '#....#...#.....#',
    '####.#.#####.###',
    '#....#.....#...#',
    '#.####.###.###.#',
    '#......#.#.....#',
    '###.####.#.#####',
    '#...#....#.....#',
    '#.#.#.####.###.#',
    '#.#...#....#...#',
    '#.#####.##.#.#.#',
    '#.....#.#..#.#.#',
    '###.#...#.##...#',
    '###d############',
  ],
  build(m) { m.put(1, 1, 'brazier'); m.put(14, 13, 'brazier'); },
  enc: { steps: [18, 30], group: 'tower', bg: 'tower' },
  chests: [{ id: 'd1', x: 7, y: 9, item: 'pill' }, { id: 'd2', x: 8, y: 7, item: 'clearpill', n: 2 }],
  events: [
    { type: 'warp', x: 3, y: 15, to: 'tower1', tx: 6, ty: 3, face: 'down', sound: 'step' },
    { type: 'warp', x: 14, y: 1, to: 'tower3', tx: 6, ty: 12, face: 'up', sound: 'step' },
    Object.assign(shardEvent(5, 1, 13), {}),
  ],
  async onEnter() {
    if (!flag('darkFloor')) {
      setFlag('darkFloor');
      await say('shenmo', '好黑……');
      await say('suli', '我在你后面。');
      await say('linfeng', '我也在。');
      await say('shenmo', '……谢谢二位，现在更吓人了。');
    }
  },
}));

const T3_SEALS = [[3, 5], [10, 5]];
defMap('tower3', Object.assign({}, towerBase, {
  title: '镇妖塔 · 三层',
  ground: [
    '##############',
    '######uu######',
    '######..######',
    '##..........##',
    '##..........##',
    '##.S......S.##',
    '##..........##',
    '##...#..#...##',
    '##..........##',
    '##..........##',
    '##..........##',
    '##.F......F.##',
    '######..######',
    '######dd######',
  ],
  build(m) { if (!flag('t3:open')) { m.put(6, 2, 'sealdoor'); m.put(7, 2, 'sealdoor'); } },
  blocks: [{ id: 'a', x: 4, y: 8 }, { id: 'b', x: 9, y: 8 }],
  onLoad(m) { for (const [x, y] of T3_SEALS) if (State.flags['t3seal:' + x + ',' + y]) m.setG(x, y, 'seal_on'); },
  async onPush(b, m) {
    const on = T3_SEALS.some(([x, y]) => b.x === x && b.y === y);
    if (on) { m.setG(b.x, b.y, 'seal_on'); State.flags['t3seal:' + b.x + ',' + b.y] = true; Sound.sfx('buff'); flash('gold', 2); }
    const done = T3_SEALS.every(([x, y]) => Field.actors.some((a) => a.push && a.x === x && a.y === y));
    if (done && !flag('t3:open')) {
      setFlag('t3:open');
      await wait(20);
      Sound.sfx('earth'); shake(16, 2);
      m.put(6, 2, null); m.put(7, 2, null);
      await runScript(() => tell('两块镇石落进了阵眼。\n封门开了。'));
    }
  },
  events: [
    { type: 'warp', x: 6, y: 13, w: 2, to: 'tower2', tx: 14, ty: 2, face: 'down', sound: 'step' },
    { type: 'warp', x: 6, y: 1, w: 2, to: 'tower4', tx: 6, ty: 16, face: 'up', sound: 'step' },
    { type: 'check', x: 3, y: 11, run: () => tell('火盆旁边刻着字：\n“镇石归位，封门自开。”') },
    { type: 'check', x: 10, y: 11, run: async () => {
      const r = await ask(null, '火盆底下有个机关。\n要把镇石复位吗？', ['复位', '算了'], { cancel: 1 });
      if (r !== 0 || flag('t3:open')) return;
      for (const b of [['a', 4, 8], ['b', 9, 8]]) { delete State.flags['blk:tower3:' + b[0]]; }
      for (const [x, y] of T3_SEALS) { delete State.flags['t3seal:' + x + ',' + y]; }
      Sound.sfx('earth');
      await Field.warp('tower3', 6, 12, 'up');
    } },
  ],
}));

defMap('tower4', Object.assign({}, towerBase, {
  title: '镇妖塔 · 四层',
  music: 'tower',
  ground: [
    '##############',
    '######uu######',
    '#####....#####',
    '####......####',
    '###........###',
    '###.F....F.###',
    '#####....#####',
    '######..######',
    '######..######',
    '####......####',
    '###........###',
    '###........###',
    '####......####',
    '######..######',
    '######..######',
    '#####....#####',
    '#####....#####',
    '######dd######',
  ],
  build(m) { m.big('pillar', 3, 9); m.big('pillar', 10, 9); },
  npcs: [
    { id: 'hu', sprite: HU, x: 4, y: 3, dir: 'down', talk: () => huBoss(['salve', 'pill', 'dew', 'incense', 'clearpill', 'silk', 'qiyun', 'icebell', 'calmbead', 'firetalis', 'icetalis'],
      '嘿！我就说我总比你们先到！|塔里妖气重，生意反倒好做。最后几样好货，都在这儿了。') },
  ],
  foes: [
    { id: 'g1', sprite: 'm_dark', x: 6, y: 11, group: ['shade', 'bat'], bg: 'tower' },
    { id: 'g2', sprite: 'm_red', x: 7, y: 8, group: ['skeleton', 'skeleton'], bg: 'tower' },
  ],
  events: [
    { type: 'warp', x: 6, y: 17, w: 2, to: 'tower3', tx: 6, ty: 3, face: 'down', sound: 'step' },
    { type: 'warp', x: 6, y: 1, w: 2, to: 'tower_top', tx: 5, ty: 10, face: 'up', sound: 'step' },
    { type: 'check', x: 9, y: 3, run: () => saveStone() },
  ],
  onLoad(m) { m.put(9, 3, 'savestone'); },
}));

defMap('tower_top', Object.assign({}, towerBase, {
  title: '镇妖塔 · 塔顶',
  music: () => (flag('jinDone') ? 'tower' : 'tomb'),
  weather: 'snow',
  tint: null,
  ground: [
    '############',
    '#XXXXXXXXXX#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#X........X#',
    '#XXXX..XXXX#',
    '#XXXX..XXXX#',
  ].map((r) => r.replace(/X/g, '.')),
  legend: Object.assign({}, TOWER_LEGEND),
  build(m) {
    for (const [x, y] of [[2, 2], [9, 2], [2, 9], [9, 9]]) m.put(x, y, 'brazier');
    m.setG(5, 2, 'seal_on'); m.setG(6, 2, 'seal_on');
  },
  npcs: [
    { id: 'jin', sprite: 'jin', x: 5, y: 3, dir: 'up', cond: () => !flag('jinDone'), noTurn: true },
  ],
  events: [
    { type: 'warp', x: 5, y: 11, w: 2, to: 'tower4', tx: 6, ty: 2, face: 'down', sound: 'step' },
    { type: 'touch', x: 2, y: 7, w: 8, h: 1, cond: () => !flag('jinDone'), run: () => evJin() },
  ],
}));

async function evJin() {
  await say('jin', '……三百年。');
  await say('jin', '我数过这塔里的每一块砖。|一千二百九十六块。');
  faceTo('jin', 'down');
  await wait(30);
  await say('jin', '你来了，墨尘。');
  await say('shenmo', '……认错人了吧。|我叫沈墨。欠我钱的，都管我叫沈爷。');
  await say('jin', '哈。');
  await say('jin', '脸换了，口气倒是没换。');
  lookAt('jin', 'player');
  await say('jin', '还有你，雪丫头。|三百年了，还是这副样子。');
  await say('suli', '你认识我？');
  await say('jin', '认识。三百年前，你把自己封进那柄剑里，|替他挡了我最后一刀。');
  await say('suli', '……');
  await say('linfeng', '魔头！休要胡言乱语！');
  await say('jin', '栖云的小崽子。|你师父没教过你？大人说话，别插嘴。');
  await say('shenmo', '你在这儿等了三百年，|就为了打一架？');
  await say('jin', '不然呢？');
  await say('jin', '他欠我一场。');
  await wait(20);
  await say('shenmo', '……巧了。|我这人，最见不得别人欠账不还。');
  await say('shenmo', '这一场，我替他还。');
  await startBattle({ enemies: ['jin'], bg: 'tower', boss: true, music: 'boss',
    intro: async (B) => { await B.say('魔将 烬，拔刀了。', 60); } });
  await evJinAfter();
}
async function evJinAfter() {
  await say('jin', '……');
  await say('jin', '你不是他。');
  await say('jin', '他从来不留手。|你刚才那一剑，明明砍得下来。');
  await say('shenmo', '砍下来，你欠的那场谁来还？');
  await wait(30);
  await say('jin', '哈……哈哈哈哈！');
  await say('jin', '好！拿去——');
  setFlag('jinDone');
  await absorbLing('thunder');
  await say('jin', '听好了。这塔底下压着的，不是我。');
  await say('jin', '是{归墟}——天地间一切怨气的尽头。|三百年前，墨尘用断雪镇住了它，');
  await say('jin', '顺手把我锁在上面，当了块压盖子的石头。');
  await say('linfeng', '什么……？');
  await say('jin', '封印裂了，不是因为我醒了。|是因为下面那东西，醒了。');
  await say('jin', '最后一样土之灵，在{剑冢}——|就在这塔底下。墨尘倒下的地方。');
  Sound.sfx('thunder'); shake(30, 3);
  await wait(30);
  await say('jin', '塔要塌了。我替你们撑一会儿。');
  await say('shenmo', '你……');
  await say('jin', '别误会。|我要的对手，不能死在这种地方。');
  await say('jin', '下去吧。');
  await ledger('烬：欠我一场架。（他说，等我活着回来再打。）');
  // the floor gives way
  for (let i = 0; i < 4; i++) { Sound.sfx('earth'); shake(20, 3); flash('white', 3); await wait(18); }
  Music.fadeOut();
  await fadeOut('white', 4);
  await fadeOut('black', 8);
  setFlag('towerDone');
  setChapter('终章·归墟');
  await chapterCard('终章', '归墟');
  Field.load('tomb1', 9, 2, 'down');
  Field.resetFollowers();
  Field.draw(ctx);
  await fadeIn(8);
  await evTombArrive();
}
