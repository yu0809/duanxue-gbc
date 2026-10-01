'use strict';
// ============================================================
//  第一章 · 青竹 — 翠竹林
// ============================================================
const BAMBOO_LEGEND = {
  '#': 'bamboo_wall',
  '.': ['grass', 'grass', 'grass2', 'grass', 'grass', 'grass3', 'grass', 'grass2'],
  ',': 'grass',
  ':': 'fpath',
  'f': 'grass4',
  'B': { g: 'grass', o: 'bush' },
  'L': { g: 'grass', o: 'log' },
  'S': { g: 'grass', o: 'stele' },
  'm': { g: 'grass', o: 'shroom_deco' },
  '*': { g: 'fpath', o: 'savestone' },
  '~': 'water',
  'b': 'bridge',
};
const HU = 'merchant';
async function huBoss(stock, line) {
  await say('胡老板', line || '哎哟，又见面了！胡记杂货，童叟无欺！');
  await shop(stock);
  await say('胡老板', '慢走慢走！下回见——我总比你们先到。');
}

defMap('bamboo1', {
  title: '翠竹林',
  music: 'forest',
  weather: 'leaves',
  fill: 'grass',
  legend: BAMBOO_LEGEND,
  bg2: 'bamboo',
  enc: { steps: [14, 26], group: 'bamboo', bg: 'bamboo' },
  escapeTo: ['bamboo1', 9, 1],
  ground: [
    '########::##########',
    '######..::...#######',
    '####......:.....####',
    '###..B....:...B..###',
    '###.......::......##',
    '##....##...:..##...#',
    '##...####..:.####..#',
    '#....####..:..##...#',
    '#.....##...:.......#',
    '#..S.......::......#',
    '##..........:...B..#',
    '###...B.....:.....##',
    '####........:...####',
    '####....:::::*..####',
    '###....:..........##',
    '##....::....L......#',
    '##...::.....####...#',
    '#....:.....######..#',
    '#...::......####...#',
    '#..::..............#',
    '#.::.....B.....m...#',
    '#.:........##......#',
    '##:.......####....##',
    '###:......####..####',
    '####::.........#####',
    '######::############',
  ],
  build(m) {
    for (const [x, y] of [[4, 2], [15, 4], [2, 12], [17, 13], [8, 18], [16, 19], [3, 21]]) m.big('bamboo', x, y);
  },
  npcs: [
    { id: 'hu', sprite: HU, x: 15, y: 14, dir: 'left', talk: () => huBoss(['herb', 'salve', 'antidote', 'clearpill', 'lingzhi', 'repel', 'leather', 'charm'],
      '哎哟，这不是铁记的小哥吗？胡记杂货，童叟无欺！|竹林里有毒蛇，解毒草备两把吧。') },
  ],
  chests: [
    { id: 'c1', x: 2, y: 8, item: 'salve' },
    { id: 'c2', x: 18, y: 17, gold: 60 },
  ],
  events: [
    { type: 'warp', x: 8, y: 0, w: 2, to: 'town', tx: 14, ty: 24, face: 'up' },
    { type: 'warp', x: 6, y: 25, w: 2, to: 'lost', tx: 7, ty: 1, face: 'down', cond: () => !flag('lostSolved') },
    { type: 'warp', x: 6, y: 25, w: 2, to: 'bamboo3', tx: 7, ty: 1, face: 'down', cond: () => flag('lostSolved') },
    { type: 'check', x: 3, y: 9, run: () => tell('石碑上刻着：\n“白花引路，莫信回头。”') },
    { type: 'check', x: 5, y: 3, cond: () => !hasItem('carrot') && !flag('carrotDone'), run: async () => {
      await tell('灌木丛里，半截胡萝卜埋在落叶下面。');
      await say('shenmo', '……这年头，连兔子都知道往竹林里藏粮。');
      await getItem('carrot');
    } },
    { type: 'check', x: 13, y: 13, run: () => saveStone() },
    { type: 'touch', x: 8, y: 1, w: 2, h: 2, cond: () => !flag('enterBamboo'), run: async () => {
      setFlag('enterBamboo');
      await say('suli', '这里的竹子……在说话。');
      await say('shenmo', '竹子会说话？那它们欠不欠钱？');
      await say('suli', '它们说，林子深处有东西。|一直在等人迷路。');
      await say('shenmo', '……你能不能别用这么平静的语气说这么吓人的话。');
    } },
  ],
});

// --- 迷踪竹林: one clearing, re-entered until you follow the white flowers ---
const LOST_SEQ = ['right', 'down', 'left'];
const LOST_MOUTH = { up: [[7, 1], [8, 1], [7, 2]], down: [[7, 12], [8, 12], [8, 11]], left: [[1, 6], [1, 7], [2, 7]], right: [[14, 6], [14, 7], [13, 6]] };
const LOST_ENTRY = { up: [7, 12, 'up'], down: [7, 1, 'down'], left: [14, 7, 'left'], right: [1, 6, 'right'] };
defMap('lost', {
  title: '迷踪竹林',
  music: 'forest',
  weather: 'leaves',
  fill: 'grass',
  legend: BAMBOO_LEGEND,
  bg2: 'bamboo',
  enc: { steps: [16, 28], group: 'bamboo2', bg: 'bamboo' },
  escapeTo: ['bamboo1', 9, 1],
  ground: [
    '#######::#######',
    '#######,,#######',
    '####,,,..,,,####',
    '###,........,###',
    '##,..........,##',
    '##.....S......##',
    ':,............,:',
    ':,............,:',
    '##............##',
    '##,..........,##',
    '###,........,###',
    '####,,,..,,,####',
    '#######,,#######',
    '#######::#######',
  ],
  build(m) {
    const step = State.flags.lostStep || 0;
    const want = LOST_SEQ[step];
    for (const [x, y] of LOST_MOUTH[want]) m.setG(x, y, 'grass4');
    // a different look each time so the clearings feel distinct
    const deco = [[[3, 4], [11, 9]], [[4, 9], [10, 3]], [[3, 8], [11, 4]]][step];
    for (const [x, y] of deco) m.big('bamboo', x, y);
    if (step === 1) m.put(12, 10, 'log');
    if (step === 2) m.put(3, 3, 'shroom_deco');
  },
  events: [
    { type: 'touch', x: 7, y: 0, w: 2, run: () => lostExit('up') },
    { type: 'touch', x: 7, y: 13, w: 2, run: () => lostExit('down') },
    { type: 'touch', x: 0, y: 6, h: 2, run: () => lostExit('left') },
    { type: 'touch', x: 15, y: 6, h: 2, run: () => lostExit('right') },
    { type: 'check', x: 7, y: 5, run: async () => {
      const step = State.flags.lostStep || 0;
      await tell(['石碑：“竹有千枝，路只一条。”', '石碑：“此处已是第二重。”', '石碑：“第三重。回头无岸。”'][step]);
    } },
    Object.assign(shardEvent(2, 13, 9), {}),
  ],
});
async function lostExit(dir) {
  const step = State.flags.lostStep || 0;
  if (dir === 'up' && step === 0) { await Field.warp('bamboo1', 6, 24, 'up'); return; }
  if (dir === LOST_SEQ[step]) {
    if (step === 2) { State.flags.lostStep = 0; setFlag('lostSolved'); await Field.warp('bamboo3', 7, 1, 'down'); return; }
    State.flags.lostStep = step + 1;
    const [x, y, d] = LOST_ENTRY[dir];
    await Field.warp('lost', x, y, d, 'step');
    if (step === 0 && !flag('lostHint')) { setFlag('lostHint'); await say('suli', '……花。刚才的路口，也开着这样的白花。'); }
    return;
  }
  State.flags.lostStep = 0;
  await Field.warp('lost', 7, 1, 'down', 'step');
  await tell('……好像又绕回原地了。');
  if (!flag('lostWarn')) { setFlag('lostWarn'); await say('shenmo', '这林子在耍我们。|石碑上说什么来着——“白花引路”？'); }
}

defMap('bamboo3', {
  title: '竹林深处',
  music: () => (flag('witchDone') ? 'forest' : 'tomb'),
  weather: 'leaves',
  fill: 'grass',
  legend: BAMBOO_LEGEND,
  bg2: 'bamboo',
  ground: [
    '#######::#######',
    '#####,,::,,#####',
    '###,,...,..,,###',
    '##,..........,##',
    '##.....,,.....##',
    '#,...,....,....#',
    '#,..m.......B..#',
    '#,.............#',
    '##.....,,.....##',
    '##,..........,##',
    '###,........,###',
    '#####,....,#####',
    '#######::#######',
    '#######::#######',
  ],
  build(m) {
    for (const [x, y] of [[3, 3], [12, 3], [2, 8], [13, 8]]) m.big('bamboo', x, y);
    if (!flag('witchDone')) { m.setG(7, 12, 'bamboo_wall'); m.setG(8, 12, 'bamboo_wall'); }
  },
  npcs: [
    { id: 'witch', sprite: 'witch', x: 7, y: 5, dir: 'down', cond: () => !flag('witchDone'), noTurn: true },
    { id: 'woodcutter', sprite: 'farmer', x: 11, y: 9, dir: 'down', cond: () => !flag('woodcutterGone'), talk: async () => {
      if (!flag('witchDone')) { await tell('一个樵夫靠着竹子睡着了，怎么叫也叫不醒。'); return; }
      await say('樵夫', '我……我睡了多久？|梦里有个穿绿衣裳的姑娘，一直给我唱曲儿……');
      await say('shenmo', '大概三天。你家里人在镇上找你呢。');
      await say('樵夫', '三天？！哎哟我的柴……|多谢二位！这个给你们，山上采的。');
      await getItem('lingzhi', 2);
      setFlag('woodcutterGone');
      await walk('woodcutter', 'uuuu', { force: true });
      removeActor('woodcutter');
    } },
  ],
  events: [
    { type: 'warp', x: 7, y: 0, w: 2, to: 'bamboo1', tx: 6, ty: 24, face: 'up' },
    { type: 'touch', x: 6, y: 2, w: 4, h: 1, cond: () => !flag('witchDone'), run: () => evWitch() },
    { type: 'warp', x: 7, y: 13, w: 2, to: 'mountain1', tx: 3, ty: 30, face: 'up', cond: () => flag('witchDone') },
  ],
});
async function evWitch() {
  const w = A('witch');
  await say('？？？', '……又有人迷路了。');
  await say('？？？', '别怕，留下来吧。|竹林里没有冬天，没有饥寒，只有好梦。');
  await say('shenmo', '多谢好意。我这人做梦只梦见别人还钱，留下来怕是不太体面。');
  lookAt('witch', 'player');
  await emote('witch', '!', 30);
  await say('竹魅', '……雪的味道。');
  await say('竹魅', '你是山上那个人的剑。|三百年了，你还是这副样子——不哭，不闹，像一捧雪。');
  await say('suli', '……你认识我？');
  await say('竹魅', '我认识你身上那点{风之灵}。三百年前从剑上碎下来，落在我的林子里。|它很甜。我舍不得还。');
  await say('shenmo', '借了东西不还，还说得这么理直气壮？|——苏璃，这个我熟，这叫赖账。');
  await say('竹魅', '那就来拿吧。');
  await startBattle({ enemies: ['bamboowitch'], bg: 'bamboo', boss: true, music: 'boss' });
  await say('竹魅', '……好冷的剑。');
  await say('竹魅', '山上的人把你封进剑里的时候，|你也是这样，一声不吭……');
  await flicker(w, 12);
  removeActor('witch');
  await say('suli', '……封进剑里？');
  await absorbLing('wind');
  setFlag('witchDone');
  Field.map.setG(7, 12, 'grass'); Field.map.setG(8, 12, 'grass');
  await say('shenmo', '苏璃？');
  await say('suli', '我没事。');
  await say('suli', '只是……想不起来。|明明是我自己的事。');
  await say('shenmo', '想不起来就先别想。|栖云山就在前面，到了问个明白。');
  await ledger('竹魅：欠风之灵一份，三百年。（已收回。）');
  Sound.music('forest');
  await tell('（竹墙让开了一条路。南边通往栖云山。）');
}
