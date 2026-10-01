'use strict';
// ============================================================
//  第二章 · 栖云 — 山道、山门、栖云派
// ============================================================
const MOUNT_LEGEND = {
  '#': 'cliff_wall',
  '.': ['snow', 'snow', 'snow2', 'snow', 'snow3', 'snow'],
  '=': 'path',
  's': 'steps',
  'c': ['court', 'court', 'court', 'court2', 'court', 'court3', 'court', 'court'],
  'R': { g: 'snow', o: 'rock' },
  'S': { g: 'snow', o: 'stele' },
  '*': { g: 'path', o: 'savestone' },
};

defMap('mountain1', {
  title: '栖云山道',
  music: 'sect',
  weather: 'snow',
  legend: MOUNT_LEGEND,
  bg2: 'mountain',
  enc: { steps: [14, 26], group: 'mountain', bg: 'mountain' },
  escapeTo: ['mountain1', 3, 30],
  ground: [
    '#######.==.#########',
    '######..==..########',
    '#####...==...#######',
    '####....==....######',
    '###.....==.....#####',
    '###.....ss.....#####',
    '##......==......####',
    '##..R...==......####',
    '##......====....####',
    '########...==...####',
    '########...ss...####',
    '#......##..==....###',
    '#..=========.....###',
    '#..=.....#.......###',
    '#..=.....#########..',
    '#..s.....#########.#',
    '#..=...*...........#',
    '#..==========.....##',
    '######.......==...##',
    '#######......==...##',
    '########.....ss...##',
    '########.....==...##',
    '##.....###...==...##',
    '##..S..###.===....##',
    '##.....=====......##',
    '##.===.......#######',
    '##.=.........#######',
    '##.ss........#######',
    '##.=..R......#######',
    '##.=.........#######',
    '##.==........#######',
    '###==###############',
  ],
  build(m) {
    for (const [x, y] of [[4, 3], [13, 6], [6, 13], [16, 18], [10, 26], [15, 21]]) m.big('pine', x, y);
    m.put(18, 14, 'rock');
  },
  npcs: [
    { id: 'hu', sprite: HU, x: 8, y: 15, dir: 'down', talk: () => huBoss(['salve', 'lingzhi', 'antidote', 'clearpill', 'incense', 'cotton', 'boots', 'pearl', 'firetalis'],
      '哟！又见面了吧？我就说我总比你们先到。|山上冷，棉袍要不要来一件？') },
    { id: 'pilgrim', sprite: 'granny', x: 5, y: 23, dir: 'right', talk: async () => {
      await say('上山的老婆婆', '年轻人，也是上山求道的？|栖云派的道长们都是好人，就是规矩多了点。');
    } },
  ],
  chests: [
    { id: 'm1', x: 17, y: 17, item: 'lingzhi' },
    { id: 'm2', x: 1, y: 11, item: 'firetalis', n: 2 },
    { id: 'm3', x: 18, y: 15, gold: 120 },
  ],
  async onEnter() {
    if (!flag('ch2card')) {
      setFlag('ch2card');
      setChapter('第二章·栖云');
      await fadeOut('black', 4);
      await chapterCard('第二章', '栖云');
      Field.draw(ctx);
      await fadeIn(6);
    }
  },
  events: [
    { type: 'warp', x: 3, y: 31, w: 2, to: 'bamboo3', tx: 7, ty: 11, face: 'up' },
    { type: 'warp', x: 8, y: 0, w: 2, to: 'gate', tx: 8, ty: 14, face: 'up' },
    { type: 'check', x: 7, y: 16, run: () => saveStone() },
    { type: 'check', x: 4, y: 23, run: () => tell('石碑：\n“栖云山。三百年前，墨尘剑仙于此悟剑。”') },
    { type: 'touch', x: 2, y: 29, w: 4, h: 2, cond: () => !flag('enterMountain'), run: async () => {
      setFlag('enterMountain');
      await say('suli', '这座山……');
      await say('shenmo', '怎么，来过？');
      await say('suli', '不知道。|只是看见山顶的时候，心口这里，冷了一下。');
      await say('shenmo', '那是冻的。来，走快点，暖和。');
    } },
  ],
});

defMap('gate', {
  title: '栖云山门',
  music: () => (flag('duelDone') ? 'sect' : 'sect'),
  weather: 'snow',
  legend: MOUNT_LEGEND,
  bg2: 'mountain',
  ground: [
    '#######.=.######',
    '######..=..#####',
    '#####...=...####',
    '######..=..#####',
    '######..=..#####',
    '######..=..#####',
    '###.....=....###',
    '###..R..=....###',
    '##......=.....##',
    '##.T....=...T.##',
    '##......=.....##',
    '###.....=....###',
    '###.....=....###',
    '####....=...####',
    '#####...=..#####',
    '#######.=.######',
  ],
  build(m) {
    m.big('gate', 6, 3);
    m.big('pine', 3, 8); m.big('pine', 12, 8);
    m.put(4, 12, 'stone_lantern'); m.put(11, 12, 'stone_lantern');
  },
  npcs: [
    { id: 'gatekeeper', sprite: 'disciple2', x: 10, y: 7, dir: 'left', cond: () => flag('duelDone'), talk: async () => {
      await say('守门弟子', '大师兄说了，二位是栖云派的客人。请！');
    } },
  ],
  events: [
    { type: 'warp', x: 8, y: 15, to: 'mountain1', tx: 8, ty: 1, face: 'down' },
    { type: 'warp', x: 8, y: 0, to: 'sect', tx: 12, ty: 18, face: 'up', cond: () => flag('duelDone') },
    { type: 'touch', x: 6, y: 10, w: 5, h: 1, cond: () => !flag('duelDone'), run: () => evDuel() },
  ],
});
async function evDuel() {
  const lf = addActor({ id: 'lf', sprite: 'linfeng', x: 8, y: 4, dir: 'down' });
  await walk(lf, 'dd');
  await say('linfeng', '站住。');
  await say('linfeng', '山门之内，妖物止步。');
  await say('shenmo', '妖物？说谁呢？我？|我这长相，顶多算个妖孽。');
  await say('linfeng', '……我说她。');
  lookAt('player', 'lf');
  await say('suli', '我不是妖。');
  await say('linfeng', '那你是什么？');
  await wait(30);
  await say('suli', '……我也想知道。');
  await say('linfeng', '身无人气，寒意入骨。|我栖云派弟子，见妖必除。');
  await say('shenmo', '喂喂，讲点道理！我们是来求见掌门的——|铁记剑铺，老铁的徒弟，沈墨！');
  await say('linfeng', '没听说过。');
  await say('shenmo', '……那你现在听说了。');
  await say('linfeng', '要过山门，先过我的剑。');
  await startBattle({ enemies: ['linfeng_duel'], bg: 'mountain', boss: true, music: 'boss',
    intro: async (B) => { await B.say('栖云首徒 叶临风，请赐教。', 60); } });
  await say('linfeng', '……');
  await say('linfeng', '剑法粗陋，章法全无。|但最后那一下……有点意思。');
  await say('shenmo', '那是我在铺子里劈柴劈出来的。');
  await say('linfeng', '……');
  await say('linfeng', '我是叶临风。掌门有令：|若有人持断剑上山，带去见他。');
  await say('shenmo', '那你刚才还打？');
  await say('linfeng', '掌门只说带去见他，没说不能先试试。');
  await say('shenmo', '……你们栖云派的规矩，还真是多。');
  await ledger('叶临风：欠我一句“对不住”。（他说先试试不算错。）');
  setFlag('duelDone');
  await walk(lf, 'uuu');
  removeActor('lf');
  await tell('（穿过山门，就是栖云派。）');
}

// ---------------- 栖云派 ----------------
defMap('sect', {
  title: '栖云派',
  music: () => (flag('sectAttacked') && !flag('towerDone') ? 'night' : 'sect'),
  tint: () => (flag('sectAttacked') && !flag('towerDone') ? 'dusk' : null),
  weather: 'snow',
  legend: MOUNT_LEGEND,
  bg2: 'sect',
  ground: [
    '########################',
    '#......................#',
    '#......................#',
    '#......................#',
    '#......................#',
    '#..........cc..........#',
    '#..........cc..........#',
    '#..........cc..........#',
    '#..........cc..........#',
    '#...cccccccccccccccc...#',
    '#...cccccccccccccccc...#',
    '#...cccccccccccccccc...#',
    '#...cccccccccccccccc....',
    '#...cccccccccccccccc....',
    '#...cccccccccccccccc...#',
    '#..........cc..........#',
    '#..........cc..........#',
    '#..........cc..........#',
    '##.........cc.........##',
    '###########cc###########',
  ],
  build(m) {
    m.house(8, 1, 8, { style: 'sect', door: 4, windows: [1, 2, 5, 6], sign: '栖云殿', lanterns: [1, 6] });
    m.house(2, 4, 5, { style: 'sect', door: 2, windows: [1, 3], sign: '藏宝阁' });
    m.house(17, 4, 5, { style: 'sect', door: 2, windows: [1, 3], sign: '客房' });
    m.big('emblem', 11, 10);
    m.put(11, 8, 'censer');
    m.put(9, 8, 'stone_lantern'); m.put(14, 8, 'stone_lantern');
    m.big('bell', 19, 15);
    m.put(3, 16, 'dummy'); m.put(6, 16, 'dummy');
    m.big('plum', 14, 15);
    m.big('pine', 1, 1); m.big('pine', 21, 1);
  },
  npcs: [
    { id: 'dis1', sprite: 'disciple', x: 4, y: 15, dir: 'down', cond: () => !flag('sectAttacked') || flag('towerDone'), talk: async () => {
      await say('练剑的弟子', '一、二、三——|啊，大师兄带回来的客人？请自便！');
    } },
    { id: 'dis2', sprite: 'disciple2', x: 7, y: 13, dir: 'left', cond: () => !flag('sectAttacked') || flag('towerDone'), talk: async () => {
      if (flag('linfengJoined')) await say('栖云弟子', '大师兄从小在山上长大，下山的次数一只手数得过来。|他……还好吧？');
      else await say('栖云弟子', '大师兄剑法第一，就是脾气冷了点。');
    } },
    { id: 'dis3', sprite: 'disciple', x: 21, y: 12, dir: 'left', cond: () => !flag('xuanqingTalk'), talk: async () => {
      await say('守路弟子', '后山通往寒潭，没有掌门之令，不得通行。');
    } },
    { id: 'dis4', sprite: 'disciple2', x: 18, y: 10, dir: 'down', cond: () => flag('xuanqingTalk') && (!flag('sectAttacked') || flag('towerDone')), talk: async () => {
      await say('栖云弟子', '后山寒潭终年不化，连鸟都不往那边飞。');
    } },
    { id: 'hurt1', sprite: 'disciple', x: 6, y: 12, dir: 'up', cond: () => flag('sectAttacked') && !flag('towerDone'), talk: async () => {
      await say('受伤的弟子', '塔……塔那边冲下来好多影子……|掌门在殿里，快去！');
    } },
    { id: 'hurt2', sprite: 'disciple2', x: 16, y: 13, dir: 'left', cond: () => flag('sectAttacked') && !flag('towerDone'), talk: async () => {
      await say('受伤的弟子', '我没事……只是腿麻了。|镇妖塔的封印……三百年没出过事啊。');
    } },
  ],
  events: [
    { type: 'warp', x: 11, y: 19, w: 2, to: 'gate', tx: 8, ty: 1, face: 'down' },
    { type: 'warp', x: 12, y: 4, to: 'hall', tx: 4, ty: 7, face: 'up' },
    { type: 'warp', x: 4, y: 7, to: 'treasury', tx: 4, ty: 7, face: 'up' },
    { type: 'warp', x: 19, y: 7, to: 'guestroom', tx: 4, ty: 7, face: 'up' },
    { type: 'touch', x: 22, y: 12, w: 1, h: 2, cond: () => !flag('xuanqingTalk'), run: async () => { faceTo('dis3', 'right'); await say('守路弟子', '后山通往寒潭，没有掌门之令，不得通行。'); await walk('player', 'l'); } },
    { type: 'warp', x: 23, y: 12, h: 2, to: 'backhill', tx: 1, ty: 6, face: 'right', cond: () => flag('xuanqingTalk') },
    { type: 'check', x: 11, y: 8, run: () => tell('香炉里插着三炷香，烟往北飘。') },
    { type: 'check', x: 11, y: 10, w: 2, h: 2, run: () => tell('地上刻着一枚云纹圆章。\n边缘被三百年的脚步磨得发亮。') },
    { type: 'check', x: 19, y: 15, w: 2, h: 2, run: async () => { Sound.sfx('bell'); await tell('当——\n钟声在山谷里转了好几圈。'); } },
    { type: 'check', x: 3, y: 16, run: () => tell('木人桩上全是剑痕。') },
    Object.assign(shardEvent(3, 22, 17), {}),
  ],
  async onEnter() {
    if (!flag('enterSect')) {
      setFlag('enterSect');
      await say('shenmo', '好气派……比青石镇的镇长家还大。');
      await say('suli', '……殿前那棵梅树，以前没有。');
      await say('shenmo', '以前？');
      await say('suli', '……我也不知道我为什么这么说。');
    }
  },
});

defMap('hall', {
  title: '栖云殿',
  music: 'sect',
  bg: 'K',
  ground: interior('s'),
  legend: { s: 'court', e: 'exit' },
  build(m) {
    backWall(m, { 3: 'iwall_scroll', 6: 'iwall_scroll' });
    m.big('pillar', 1, 1); m.big('pillar', 8, 1);
    m.put(4, 2, 'censer');
    m.put(2, 5, 'stone_lantern'); m.put(7, 5, 'stone_lantern');
  },
  npcs: [
    { id: 'xq', sprite: 'elder', x: 5, y: 2, dir: 'down', talk: () => evXuanqingTalk() },
    { id: 'hd1', sprite: 'disciple', x: 3, y: 4, dir: 'right', cond: () => !flag('sectAttacked') || flag('towerDone') },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'sect', tx: 12, ty: 5, face: 'down' }],
  async onEnter() {
    if (flag('duelDone') && !flag('xuanqingTalk')) await evXuanqing();
    else if (flag('caveDone') && !flag('towerOpen')) await evSectAttacked();
  },
});
async function evXuanqing() {
  const lf = addActor({ id: 'lf', sprite: 'linfeng', x: 6, y: 4, dir: 'up' });
  await walk('player', 'u');
  await say('linfeng', '师父，人带到了。');
  await say('xuanqing', '辛苦了，临风。');
  await say('xuanqing', '老道玄清。二位远道而来，|想必是为了那柄剑。');
  await say('shenmo', '道长认得断雪？');
  await say('xuanqing', '栖云派上下，没有人不认得。');
  await say('xuanqing', '三百年前，本派出了一位剑仙，名叫{墨尘}。|他与魔将{烬}，在后山{镇妖塔}顶决战七日。');
  await say('xuanqing', '最后一剑，墨尘以断雪为锁，将烬封进了塔里。|剑断了。墨尘……再也没有下山。');
  await say('xuanqing', '剑中的灵，碎作五灵——风、雷、水、火、土，|散落天地各处。');
  lookAt('xq', 'suli');
  await say('xuanqing', '姑娘。你便是那剑中之灵。|断雪的{剑灵}。');
  await say('suli', '……');
  await say('xuanqing', '你的记忆，大约也随五灵散了。|五灵归位之时，或许都能想起来。');
  await say('shenmo', '那剩下的几样，上哪儿找？');
  await say('xuanqing', '火与风，你们已经得了。|后山{寒潭}之下，冰封着{水之灵}。');
  await say('xuanqing', '至于雷与土……');
  await wait(30);
  await say('xuanqing', '{雷之灵}在镇妖塔顶，与烬一同封着。|{土之灵}……在剑冢。那是墨尘最后倒下的地方。');
  await say('xuanqing', '先去寒潭吧。|临风，你随他们去。');
  await say('linfeng', '师父！他们来历不明，那姑娘又——');
  await say('xuanqing', '临风。');
  await say('linfeng', '……');
  await say('linfeng', '弟子遵命。');
  await say('xuanqing', '另外，客房尽管歇息。藏宝阁里的东西，报老道的名字便是。');
  removeActor('lf');
  await joinMsg('linfeng');
  setFlag('xuanqingTalk'); setFlag('linfengJoined');
  setChapter('第二章·栖云');
  await ledger('玄清真人：说藏宝阁报他的名字。（报了，还是要钱。）');
  await tell('（后山的路已经可以通行了。\n寒潭在栖云派的东边。）');
}
async function evXuanqingTalk() {
  if (flag('sectAttacked') && !flag('towerDone')) { await say('xuanqing', '塔顶……雷之灵与烬，都在那里。|去吧。栖云派的事，交给老道。'); return; }
  if (flag('towerDone')) { await say('xuanqing', '剑冢之下，便是归墟。|你们要去的地方，三百年前也有人去过。'); return; }
  if (!flag('caveDone')) { await say('xuanqing', '寒潭在后山东边。|那里的冰，三百年没化过。小心。'); return; }
  await say('xuanqing', '……');
}

defMap('treasury', {
  title: '藏宝阁',
  music: 'sect',
  bg: 'K',
  ground: interior('w'),
  legend: { w: 'floor_wood', e: 'exit' },
  build(m) {
    backWall(m, { 4: 'iwall_scroll' });
    m.big('shelf', 1, 1); m.big('shelf', 2, 1); m.big('rack', 7, 1); m.big('rack', 8, 1);
    m.put(3, 4, 'counter_l'); m.put(4, 4, 'counter_m'); m.put(5, 4, 'counter_r');
  },
  npcs: [
    { id: 'keeper', sprite: 'disciple2', x: 4, y: 3, dir: 'down', counter: true, talk: async () => {
      await say('藏宝阁弟子', '掌门交代过了，二位随意挑。|——当然，钱还是要付的。');
      await shop(['salve', 'lingzhi', 'dew', 'incense', 'clearpill', 'songwen', 'featherfan', 'daopao', 'chain', 'cloudrobe', 'boots', 'jade', 'pearl', 'calmbead', 'icetalis']);
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'sect', tx: 4, ty: 8, face: 'down' }],
});

defMap('guestroom', {
  title: '客房',
  music: 'sect',
  bg: 'K',
  ground: interior('t'),
  legend: { t: 'floor_tatami', e: 'exit' },
  build(m) {
    backWall(m, { 2: 'iwall_win', 6: 'iwall_win' });
    m.big('bed', 1, 2); m.big('bed', 3, 2); m.big('bed', 8, 2);
    m.put(6, 4, 'screen');
  },
  npcs: [
    { id: 'roomdis', sprite: 'disciple', x: 6, y: 6, dir: 'left', talk: async () => {
      const r = await ask('客房弟子', '要歇一会儿吗？', ['歇一会儿', '不用了'], { cancel: 1 });
      if (r === 0) { await restParty(); await say('客房弟子', '山上的茶，提神。'); }
    } },
  ],
  events: [
    { type: 'warp', x: 4, y: 8, to: 'sect', tx: 19, ty: 8, face: 'down' },
    { type: 'check', x: 8, y: 2, h: 2, cond: () => flag('linfengJoined'), run: async () => {
      if (!flag('lfBed')) { setFlag('lfBed'); await say('linfeng', '……那是我的床。|我从小住这间。别乱翻。'); await say('shenmo', '你堂堂大师兄，住客房？'); await say('linfeng', '……清净。'); }
      else await tell('收拾得一丝不苟的床铺。');
    } },
  ],
});

// back hill: the path to the cold pool, and (later) the sealed tower
defMap('backhill', {
  title: '后山',
  music: () => (flag('sectAttacked') && !flag('towerDone') ? 'night' : 'sect'),
  tint: () => (flag('sectAttacked') && !flag('towerDone') ? 'dusk' : null),
  weather: 'snow',
  legend: MOUNT_LEGEND,
  bg2: 'mountain',
  enc: { steps: [16, 28], group: 'mountain', bg: 'mountain' },
  ground: [
    '####################',
    '##....###########..#',
    '#......#########...#',
    '#..R....=======....#',
    '#.......=.....=....#',
    '#.......=.....=..R.#',
    '=========.....======',
    '#.......=..........#',
    '#..T....=....T.....#',
    '#.......=..........#',
    '#.......ss.........#',
    '###.....==.....#####',
    '####....==....######',
    '#####...==...#######',
    '######..==..########',
    '######..==..########',
  ],
  build(m) {
    m.big('pine', 3, 7); m.big('pine', 13, 7); m.big('pine', 17, 1);
  },
  events: [
    { type: 'warp', x: 0, y: 6, to: 'sect', tx: 22, ty: 12, face: 'left' },
    { type: 'warp', x: 19, y: 6, to: 'tower1', tx: 7, ty: 12, face: 'up', cond: () => flag('towerOpen') },
    { type: 'touch', x: 19, y: 6, cond: () => !flag('towerOpen'), run: async () => { await tell('前面是镇妖塔。\n塔门上贴着层层符纸，纹丝不动。'); await walk('player', 'l'); } },
    { type: 'warp', x: 8, y: 15, w: 2, to: 'cave1', tx: 9, ty: 1, face: 'down' },
    { type: 'check', x: 3, y: 3, run: () => tell('岩石背后，隐约能看见一座黑沉沉的塔。') },
  ],
  async onEnter() {
    if (!flag('seeTower')) {
      setFlag('seeTower');
      await say('linfeng', '往东，是镇妖塔。往南，是寒潭。|塔那边，任何人不得靠近。');
      await say('shenmo', '规矩？');
      await say('linfeng', '规矩。');
    }
  },
});
