'use strict';
// ============================================================
//  序章 · 雪夜 — 青石镇
// ============================================================
const isNight = () => flag('nightRaid') && !flag('raidDone');
const dayOnly = () => !isNight();

// 10x9 interior shell: back wall on rows 0-1, floor rows 2-7, exit on row 8
function interior(floor, exitX = 4) {
  const rows = ['XXXXXXXXXX', 'XXXXXXXXXX'];
  for (let i = 0; i < 6; i++) rows.push('X' + floor.repeat(8) + 'X');
  rows.push('X'.repeat(exitX) + 'e' + 'X'.repeat(9 - exitX));
  return rows;
}
function backWall(m, extra = {}) {
  for (let x = 1; x < 9; x++) { m.put(x, 0, extra[x] || 'iwall_top'); m.put(x, 1, 'iwall_bot'); }
}

defMap('town', {
  title: '青石镇',
  music: () => (isNight() ? 'night' : 'town'),
  weather: 'snow',
  tint: () => (isNight() ? 'night' : null),
  bg2: 'snow',
  ground: [
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '...,..........,.......,...,...',
    '==============================',
    '==============================',
    '..........,.========..........',
    '............========..........',
    '............========..........',
    '..............==..............',
    '..............==..............',
    '~~~~~~~~~~~~~~BB~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~BB~~~~~~~~~~~~~~',
    '..............==..............',
    '..............==..............',
    '..............==..............',
    '..............==..............',
    '.....,........==.......,......',
    '..............==..............',
    '..............==..............',
    '..............==..............',
    '..............==..............',
  ],
  build(m) {
    for (const x of [0, 7, 17, 24, 28]) m.big('pine', x, 0);
    m.big('plum', 7, 2);
    for (let x = 0; x < 30; x++) if (x !== 7 && x !== 8) m.put(x, 3, 'twall');
    m.house(1, 4, 6, { door: 2, windows: [1, 4], sign: '铁记剑铺' });
    m.house(9, 4, 8, { door: 3, windows: [1, 2, 5, 6], round: [1, 6], sign: '悦来客栈', lanterns: [1, 6] });
    m.house(19, 4, 5, { door: 2, windows: [1, 3], sign: '回春堂', open: true });
    m.house(25, 4, 4, { door: 1, windows: [2], sign: '杂货', open: true });
    m.put(13, 11, 'well');
    m.big('plum', 17, 10);
    m.put(11, 12, 'snowman');
    m.put(8, 10, 'lantern_post');
    m.put(21, 10, 'lantern_post');
    m.put(18, 7, 'barrel'); m.put(8, 7, 'crates');
    m.put(24, 7, 'barrel');
    m.big('willow', 3, 12);
    m.big('willow', 23, 12);
    m.put(13, 14, 'stone_lantern'); m.put(16, 14, 'stone_lantern');
    m.house(3, 17, 5, { door: 2, windows: [1, 3] });
    m.house(20, 17, 6, { door: 3, windows: [1, 2, 4] });
    for (let x = 1; x < 9; x++) m.put(x, 23, 'fence');
    m.put(10, 21, 'haystack'); m.put(9, 19, 'bench');
    m.big('pine', 27, 21); m.big('pine', 0, 21);
    m.put(18, 22, 'sign'); m.put(26, 14, 'rock'); m.put(1, 13, 'stump');
    m.put(19, 10, 'notice');
  },
  npcs: [
    { id: 'candykid', sprite: 'kid', x: 12, y: 10, dir: 'down', cond: dayOnly, talk: async () => {
      if (flag('raidDone')) await say('卖糖葫芦的小孩', '沈墨哥，你昨晚拿剑砍妖怪的样子好帅！……就是腿有点抖。');
      else await say('卖糖葫芦的小孩', '糖葫芦——冰糖葫芦——！一串六文！');
      await shop(['candy']);
      await say('卖糖葫芦的小孩', '沈墨哥，这回可不许赊账了啊。');
    } },
    { id: 'snowkid', sprite: 'kid2', x: 10, y: 12, dir: 'right', cond: dayOnly, talk: async () => {
      if (hasItem('carrot')) {
        await say('shenmo', '喏，你的雪人鼻子。竹林里捡的，不是我偷的。');
        await say('堆雪人的小孩', '真的找回来了！|……沈墨哥，我错怪你了。这个给你，我娘说能保平安。');
        removeItem('carrot');
        setFlag('carrotDone');
        await getItem('jade');
        await ledger('堆雪人的小孩：还了雪人一个鼻子。（他说这笔不算我偷的。）');
        return;
      }
      if (flag('carrotDone')) { await say('堆雪人的小孩', '雪人有鼻子了！|等开春雪化了，我就把胡萝卜种下去。'); return; }
      if (!flag('snowkid')) {
        await say('堆雪人的小孩', '雪人的鼻子不见了！我插了根胡萝卜的！');
        await say('堆雪人的小孩', '……肯定是被你偷吃了吧，沈墨哥。');
        await say('shenmo', '我是那种人吗？');
        await say('堆雪人的小孩', '是。');
        setFlag('snowkid');
      } else await say('堆雪人的小孩', '等雪化了，雪人去哪里呀？');
    } },
    { id: 'teller', sprite: 'teller', x: 10, y: 19, dir: 'left', cond: dayOnly, talk: async () => {
      if (!flag('heardTale')) {
        await say('说书先生', '话说三百年前，栖云山上有位剑仙，名唤{墨尘}。');
        await say('说书先生', '一剑，斩落天上雪；一剑，镇住塔中魔。');
        await say('说书先生', '后来呢？后来剑断了，人也没了。|……这位小哥，听书给钱吗？');
        await say('shenmo', '下回一定。');
        await say('说书先生', '你上回也是这么说的。');
        setFlag('heardTale');
        await ledger('说书先生：我欠他三回听书钱。');
      } else if (flag('raidDone')) {
        await say('说书先生', '昨夜那柄剑一响，老夫就知道——故事又要开场了。');
      } else await say('说书先生', '想听下回？先把上回的钱结了。');
    } },
    { id: 'fisher', sprite: 'fisher', x: 7, y: 14, dir: 'down', cond: dayOnly, talk: async () => {
      await say('渔夫', '冬天的鱼都躲到冰底下去了。|跟人一样，冷了就往暖和的地方钻。');
    } },
    { id: 'auntie', sprite: 'auntie', x: 23, y: 9, dir: 'down', wander: true, cond: dayOnly, talk: async () => {
      if (flag('raidDone')) await say('张大婶', '昨晚可吓死我了！还好有你们俩……那姑娘的手，比雪还凉。');
      else await say('张大婶', '沈墨，你师父昨晚又喝多了吧？隔着两条街都听见他唱戏。');
    } },
    { id: 'maiden', sprite: 'maiden', x: 6, y: 9, dir: 'down', wander: true, cond: dayOnly, talk: async () => {
      await say('镇上的姑娘', '今年的雪下得真早。|镇上的老人说，这是三百年来最冷的一个冬天。');
    } },
    { id: 'villager', sprite: 'villager', x: 19, y: 13, dir: 'left', cond: dayOnly, talk: async () => {
      await say('镇民', '听说南边竹林最近不太平。有人进去砍竹子，转了一天也没转出来。');
    } },
    { id: 'guard', sprite: 'villager', x: 16, y: 24, dir: 'left', cond: dayOnly, talk: async () => {
      if (flag('raidDone')) await say('守镇口的大叔', '昨晚多亏你们了！往南是翠竹林，跟着石碑走，别迷了路。');
      else await say('守镇口的大叔', '镇外不太平，没事别往南走。');
    } },
    { id: 'suli', sprite: 'suli', x: 14, y: 15, dir: 'down', noTurn: true, cond: () => flag('delivered') && !flag('metSuli'), talk: () => evMeetSuli() },
  ],
  foes: [
    { id: 'n1', sprite: 'm_fox', x: 6, y: 9, group: ['foxfire'], bg: 'night', cond: isNight, sight: 5 },
    { id: 'n2', sprite: 'm_wolf', x: 22, y: 8, group: ['wolf'], bg: 'night', cond: () => isNight() && flag('suliSaved') },
    { id: 'n3', sprite: 'm_fox', x: 9, y: 12, group: ['foxfire', 'foxfire'], bg: 'night', cond: () => isNight() && flag('suliSaved') },
  ],
  events: [
    { type: 'warp', x: 3, y: 7, to: 'forge', tx: 4, ty: 7, face: 'up' },
    { type: 'warp', x: 12, y: 7, to: 'inn', tx: 4, ty: 7, face: 'up', cond: dayOnly },
    { type: 'touch', x: 12, y: 7, cond: isNight, run: async () => { await tell('门从里面闩死了。'); await walk('player', 'd'); } },
    { type: 'warp', x: 21, y: 7, to: 'herb', tx: 4, ty: 7, face: 'up', cond: dayOnly },
    { type: 'warp', x: 26, y: 7, to: 'store', tx: 4, ty: 7, face: 'up', cond: dayOnly },
    { type: 'warp', x: 5, y: 20, to: 'home_a', tx: 4, ty: 7, face: 'up', cond: dayOnly },
    { type: 'warp', x: 23, y: 20, to: 'home_b', tx: 4, ty: 7, face: 'up', cond: dayOnly },
    { type: 'touch', x: 21, y: 7, w: 6, h: 1, cond: isNight, run: async () => { await tell('门关得紧紧的。'); await walk('player', 'd'); } },
    { type: 'touch', x: 5, y: 20, cond: isNight, run: async () => { await tell('屋里没有灯。'); await walk('player', 'd'); } },
    { type: 'touch', x: 23, y: 20, cond: isNight, run: async () => { await tell('屋里没有灯。'); await walk('player', 'd'); } },
    // night: Su Li in trouble in front of the inn
    { type: 'touch', x: 9, y: 8, w: 7, h: 2, cond: () => isNight() && !flag('suliSaved'), run: () => evRaidInn() },
    // night: the wolf leader on the bridge
    { type: 'touch', x: 12, y: 12, w: 6, h: 2, cond: () => isNight() && flag('suliSaved') && !flag('wolfking'), run: () => evRaidBridge() },
    { type: 'touch', x: 0, y: 17, w: 30, h: 1, cond: () => isNight(), run: async () => { await say('shenmo', '妖怪都在镇子北边。先顾那头！'); await walk('player', 'u'); } },
    // south gate
    { type: 'touch', x: 14, y: 24, w: 2, h: 1, cond: () => !flag('raidDone'), run: async () => { faceTo('guard', 'left'); await say('守镇口的大叔', '镇外不太平，没事别往南走。'); await walk('player', 'u'); } },
    { type: 'warp', x: 14, y: 25, w: 2, h: 1, to: 'bamboo1', tx: 9, ty: 1, face: 'down', cond: () => flag('raidDone') },
    { type: 'check', x: 18, y: 22, run: () => tell('南 · 翠竹林\n北 · 青石镇') },
    { type: 'check', x: 19, y: 10, run: () => tell('告示：\n入冬以来，镇南竹林屡有怪事。\n夜里莫出门。——镇长') },
    { type: 'check', x: 13, y: 11, run: () => tell('井口结了一圈薄冰。') },
    { type: 'check', x: 11, y: 12, run: () => tell('一个没有鼻子的雪人。') },
    Object.assign(shardEvent(1, 5, 14), {}),
  ],
});

// ---------------- interiors ----------------
defMap('forge', {
  title: '铁记剑铺',
  music: () => (isNight() ? 'night' : 'town'),
  tint: () => (isNight() ? 'night' : null),
  bg: 'K',
  ground: interior('s'),
  legend: { s: 'floor_stone', e: 'exit' },
  build(m) {
    backWall(m, { 4: 'iwall_win', 6: 'iwall_scroll' });
    m.big(flag('fireLit') ? 'furnace' : 'furnacec', 1, 1);
    m.put(4, 4, 'anvil');
    m.big('rack', 7, 1);
    m.put(6, 2, 'barrel');
    m.big('bed', 8, 4);
    m.put(1, 7, 'jar');
  },
  npcs: [
    { id: 'laotie', sprite: 'laotie', x: 3, y: 5, dir: 'right', cond: () => !isNight() || !flag('nightRaid'), talk: async () => {
      if (!flag('fireLit')) await say('laotie', '还愣着？炉子！');
      else if (!flag('delivered')) await say('laotie', '五十文。悦来客栈，周掌柜。去！');
      else if (!flag('metSuli')) await say('laotie', '钱呢？……先去转一圈也行，别给我惹事。');
      else if (flag('raidDone')) await say('laotie', '还不走？门口的雪扫了没有？');
      else await say('laotie', '……');
    } },
  ],
  events: [
    { type: 'warp', x: 4, y: 8, to: 'town', tx: 3, ty: 8, face: 'down', cond: () => flag('fireLit') },
    { type: 'touch', x: 4, y: 8, cond: () => !flag('fireLit'), run: async () => { await say('laotie', '火还没生呢，往哪儿跑？'); await walk('player', 'u'); } },
    { type: 'check', x: 1, y: 1, w: 2, h: 2, run: () => evFurnace() },
    { type: 'check', x: 4, y: 4, run: async () => {
      if (flag('forged1') && !flag('nightRaid')) await tell('断雪静静躺在铁砧上，剑脊的霜一直没化。');
      else await tell('一块用了几十年的铁砧，被敲得发亮。');
    } },
    { type: 'check', x: 7, y: 1, h: 2, run: () => tell('架子上挂着几把刚打好的剑。\n都是卖给镇上护院的，没什么名堂。') },
    { type: 'check', x: 8, y: 4, h: 2, run: () => tell('沈墨的床。被子里还有余温。') },
  ],
  async onEnter() {
    if (flag('metSuli') && !flag('forged1')) await evForge();
  },
});

defMap('inn', {
  title: '悦来客栈',
  music: 'town',
  bg: 'K',
  ground: interior('w'),
  legend: { w: 'floor_wood', e: 'exit' },
  build(m) {
    backWall(m, { 3: 'iwall_win', 6: 'iwall_win', 8: 'iwall_scroll' });
    m.put(1, 3, 'counter_l'); m.put(2, 3, 'counter_m'); m.put(3, 3, 'counter_r');
    m.big('shelf', 1, 1);
    m.big('table', 5, 4); m.put(7, 4, 'stool');
    m.big('table', 5, 6); m.put(7, 6, 'stool');
    m.put(8, 2, 'jar');
  },
  npcs: [
    { id: 'zhou', sprite: 'innkeep', x: 2, y: 2, dir: 'down', counter: true, talk: () => evInnkeeper() },
    { id: 'guest1', sprite: 'merchant', x: 4, y: 4, dir: 'right', talk: async () => {
      await say('行商', '我从北边来，路上那叫一个冷。|山都白了，连栖云山的山门都埋了半截。');
    } },
    { id: 'guest2', sprite: 'maiden', x: 4, y: 6, dir: 'right', talk: async () => {
      if (flag('raidDone')) await say('客人', '昨晚外头吵得厉害，我一宿没敢合眼。');
      else await say('客人', '周掌柜做的阳春面，是镇上一绝。');
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'town', tx: 12, ty: 8, face: 'down' }],
});

defMap('herb', {
  title: '回春堂',
  music: 'town',
  bg: 'K',
  ground: interior('w'),
  legend: { w: 'floor_wood', e: 'exit' },
  build(m) {
    backWall(m, { 7: 'iwall_scroll' });
    m.big('herbcab', 2, 1);
    m.put(2, 4, 'counter_l'); m.put(3, 4, 'counter_m'); m.put(4, 4, 'counter_m'); m.put(5, 4, 'counter_r');
    m.put(8, 2, 'jar'); m.put(8, 3, 'jar'); m.put(1, 6, 'screen');
  },
  npcs: [
    { id: 'doc', sprite: 'doctor', x: 4, y: 3, dir: 'down', counter: true, talk: async () => {
      await say('孙郎中', '受了伤就来找我。诊金嘛，另算。');
      await shop(['herb', 'salve', 'antidote', 'clearpill', 'lingzhi', 'incense', 'repel']);
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'town', tx: 21, ty: 8, face: 'down' }],
});

defMap('store', {
  title: '杂货铺',
  music: 'town',
  bg: 'K',
  ground: interior('w'),
  legend: { w: 'floor_wood', e: 'exit' },
  build(m) {
    backWall(m, { 5: 'iwall_win' });
    m.big('shelf', 1, 1); m.big('shelf', 2, 1); m.big('rack', 7, 1);
    m.put(2, 4, 'counter_l'); m.put(3, 4, 'counter_m'); m.put(4, 4, 'counter_r');
    m.put(8, 6, 'barrel'); m.put(7, 7, 'crates');
  },
  npcs: [
    { id: 'shopgirl', sprite: 'auntie', x: 3, y: 3, dir: 'down', counter: true, talk: async () => {
      await say('杂货铺老板娘', '小墨来啦？要什么自己挑，价钱公道。');
      await shop(['cloth', 'cotton', 'leather', 'bell', 'charm', 'repel', 'escape', 'candy']);
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'town', tx: 26, ty: 8, face: 'down' }],
});

defMap('home_a', {
  title: '王家',
  music: 'town',
  bg: 'K',
  ground: interior('t'),
  legend: { t: 'floor_tatami', e: 'exit' },
  build(m) {
    backWall(m, { 3: 'iwall_win' });
    m.big('bed', 1, 2);
    m.big('table', 5, 4); m.put(4, 4, 'stool');
    m.put(8, 2, 'jar');
  },
  npcs: [
    { id: 'granny', sprite: 'granny', x: 6, y: 3, dir: 'down', talk: async () => {
      if (flag('metSuli') && !flag('grannyGift')) {
        await say('王大娘', '小墨啊，你那个白头发的朋友，脸色可真白。|拿两串糖葫芦给她，补补气色。');
        setFlag('grannyGift');
        await getItem('candy', 2);
      } else await say('王大娘', '外头冷，进来烤烤火。');
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'town', tx: 5, ty: 21, face: 'down' }],
});

defMap('home_b', {
  title: '镇长家',
  music: 'town',
  bg: 'K',
  ground: interior('w'),
  legend: { w: 'floor_wood', e: 'exit' },
  build(m) {
    backWall(m, { 2: 'iwall_scroll', 6: 'iwall_win' });
    m.big('shelf', 8, 1);
    m.put(1, 2, 'screen');
    m.big('table', 4, 4); m.put(3, 4, 'stool'); m.put(6, 4, 'stool');
  },
  npcs: [
    { id: 'chief', sprite: 'chief', x: 5, y: 3, dir: 'down', talk: async () => {
      if (flag('raidDone') && !flag('chiefGift')) {
        await say('镇长', '昨晚的事，我都听说了。|小墨，你要出远门？这两样东西，路上用得着。');
        setFlag('chiefGift');
        await getItem('repel', 2);
        await getItem('escape', 1);
      } else if (flag('raidDone')) await say('镇长', '路上小心。青石镇的门，永远给你留着。');
      else await say('镇长', '三百年前也有过这么一场大雪。|镇志上写，那年冬天，栖云山顶亮了一整夜。');
    } },
  ],
  events: [{ type: 'warp', x: 4, y: 8, to: 'town', tx: 23, ty: 21, face: 'down' }],
});

// ---------------- prologue scripts ----------------
async function startChapterPrologue() {
  State.chapter = '序章·雪夜';
  Game.setScene(Field);
  Field.player = null;
  Field.load('forge', 7, 5, 'up');
  Field.resetFollowers();
  Field.draw(ctx);
  await fadeIn(8);
  await runScript(evIntro);
}
async function evIntro() {
  await wait(30);
  await emote('player', '…', 50);
  await say('laotie', '沈墨！日头都照到你脚底板了！');
  faceTo('player', 'left');
  await say('shenmo', '……再睡一刻。就一刻。|梦里有人正要还我三两银子呢。');
  await walk('laotie', 'rr');
  faceTo('laotie', 'right');
  await say('laotie', '梦里的银子，留着梦里花。');
  await say('laotie', '炉子都凉透了！先把火生起来，再想你的三两银子。');
  await emote('player', 'sweat', 30);
  await say('shenmo', '是是是……');
  await walk('laotie', 'll');
  faceTo('laotie', 'right');
  await tell('（走到炉子前，面朝它按 [A] 键调查。\n按 [START] 打开菜单。）');
}
async function evFurnace() {
  if (flag('fireLit')) { await tell(flag('forged1') ? '炉火烧得正旺。炉心里那点火之灵，已经给了断雪。' : '炉火烧得正旺。'); return; }
  await tell('炉膛里只剩一点暗红的余烬。');
  const r = await ask(null, '要生火吗？', ['生火', '再等等'], { cancel: 1 });
  if (r !== 0) return;
  Sound.sfx('fire');
  for (let i = 0; i < 3; i++) { flash('red', 2); await wait(10); }
  setFlag('fireLit');
  Field.map.big('furnace', 1, 1);
  await say('shenmo', '起来吧，祖宗……|——起来了！', { expr: 'smile' });
  lookAt('laotie', 'player');
  await say('laotie', '嗯，像点样子了。');
  await say('laotie', '这把刀，给悦来客栈的周掌柜送去，把钱收回来。');
  await getItem('delivery');
  await say('laotie', '一共五十文。少一文，你这个月别想吃肉。');
  await say('shenmo', '师父，我这个月本来也没吃上肉啊。');
  await say('laotie', '那就下个月。');
  await ledger('老铁：欠我三年工钱。（他说管饭就算抵了。）');
}
async function evInnkeeper() {
  if (hasItem('delivery')) {
    await say('周掌柜', '哟，小墨来啦！这刀……啧，好刀！');
    await say('周掌柜', '四十五文，咱们老交情了。');
    await say('shenmo', '五十。少一文，我师父扒我的皮。');
    await say('周掌柜', '……你师父那个人，确实干得出来。|行行行，五十就五十！');
    removeItem('delivery');
    await getGold(50);
    await say('周掌柜', '对了，今早有个白头发的姑娘，在镇南桥上站了大半天，也不怕冻着。');
    await say('周掌柜', '我叫她进来喝口热汤，她说她在等“修剑的人”。|怪得很。');
    await say('shenmo', '修剑的人？……那不就是我家？');
    setFlag('delivered');
    return;
  }
  if (!flag('delivered')) { await say('周掌柜', '小墨，你师父那把刀打好了没有？'); return; }
  await inn(20, '周掌柜');
}
async function evMeetSuli() {
  const s = A('suli');
  await say('shenmo', '姑娘，大冷天站桥上，是看鱼还是想不开？');
  await say('shenmo', '想不开的话我劝你别跳——这河冬天就半尺深，|摔一身泥，还得自己爬上来。');
  await wait(20);
  lookAt('suli', 'player');
  await say('suli', '……');
  await say('suli', '这里，有铸剑的地方吗？');
  await say('shenmo', '巧了！青石镇最好的剑铺——|好吧，唯一的剑铺——就是我家。');
  await tell('（她解开怀里的布包。\n里面是一柄断剑，剑脊上结着一层薄霜。）');
  await say('shenmo', '……好冷。隔着布都冻手。');
  await say('suli', '修剑。');
  await say('shenmo', '行，修剑得问我师父。跟我来。|对了，我叫沈墨。姑娘怎么称呼？');
  await say('suli', '……苏璃。');
  await say('suli', '大概是。');
  await say('shenmo', '名字还有“大概”的？');
  removeActor('suli');
  State.guests = ['suli'];
  Field.makeFollowers(); Field.resetFollowers();
  setFlag('metSuli');
  await toast('苏璃 跟在了后面。', { life: 80 });
}
async function evForge() {
  const p = P();
  const s = detach('suli');
  State.guests = [];
  s.x = 4; s.y = 8; s.px = 64; s.py = 128; s.dir = 'up';
  await walk('player', 'u');
  await walk('suli', 'u');
  lookAt('laotie', 'player');
  await say('laotie', '回来了？钱呢？');
  await say('shenmo', '五十文，一文不少。');
  State.gold = Math.max(0, State.gold - 50);
  Sound.sfx('coin');
  await toast('（五十文，上交了。）', { life: 60 });
  await say('laotie', '嗯。——哟，还领回来个姑娘？');
  await say('shenmo', '人家是来修剑的！');
  await walk('suli', 'ruuu');
  faceTo('suli', 'left');
  Sound.sfx('guard');
  await tell('（苏璃把断剑放在了铁砧上。）');
  lookAt('laotie', 'suli');
  await emote('laotie', '!', 40);
  await say('laotie', '这剑……');
  await say('laotie', '断口上结着霜。挨着炉子，居然捂不化。');
  await say('laotie', '姑娘，这剑叫什么名字？');
  await say('suli', '断雪。');
  await emote('laotie', '…', 40);
  await say('suli', '请把它修好。');
  await say('laotie', '修不了。');
  await say('shenmo', '师父！生意上门，你往外推？');
  await say('laotie', '不是推。这不是凡铁——是拿灵物淬过的剑。');
  await say('laotie', '要重铸它，得有{五灵之精}：|风、雷、水、火、土，一样都不能少。');
  await say('laotie', '我这炉子是祖上传下来的，炉心里养着一点{火之灵}。|顶多……能替你补上这一样。');
  await say('suli', '那就先补这一样。');
  await say('shenmo', '（这姑娘说话，怎么跟算账似的。）');
  await say('laotie', '……好！老铁我打了一辈子铁，还没碰过这样的东西。|今天就拼一把！');
  await fadeOut('white', 3);
  await wait(20);
  await fadeIn(3);
  await hammer(3);
  await absorbLing('fire');
  await flicker(s, 8);
  await say('suli', '……暖的。');
  await say('shenmo', '嗯？');
  await say('suli', '没什么。');
  await say('laotie', '剑先放我这儿，我再看看成色。|天快黑了，姑娘先去客栈住下。');
  await say('laotie', '沈墨，带人家去。住店的钱，从你工钱里扣。');
  await say('shenmo', '我哪来的工钱？！');
  await ledger('苏璃：住店钱二十文。（我垫的。）');
  setFlag('forged1');
  // nightfall
  Music.fadeOut();
  await fadeOut('black', 8);
  removeActor('suli');
  State.followers = true;
  Game.setScene({ draw(g) { rect(g, 0, 0, SW, SH, PAL.K); }, update() {} });
  FX.fade = 0;
  await narrate(['那天夜里，', '雪下得很大。'], {});
  FX.fade = 4;
  setFlag('nightRaid');
  Game.setScene(Field);
  Field.load('forge', 7, 5, 'up');
  Field.resetFollowers();
  Sound.music('night');
  Field.draw(ctx);
  await fadeIn(8);
  await evNight();
}
async function evNight() {
  await wait(30);
  Sound.sfx('encounter');
  shake(10, 2);
  await emote('player', '!', 40);
  await say('shenmo', '……什么动静？');
  const lt = addActor({ id: 'laotie2', sprite: 'laotie', x: 4, y: 8, dir: 'up' });
  await walk(lt, 'uu', { speed: 2 });
  await say('laotie', '沈墨！外头闹妖怪了！|快，跟我躲进地窖——');
  Sound.sfx('swordGlow');
  flash('blue', 6);
  await wait(20);
  await say('shenmo', '剑……在发光？');
  await walk('player', 'lul');
  faceTo('player', 'left');
  await tell('（断雪在铁砧上轻轻鸣响，\n像是在叫谁的名字。）');
  Sound.sfx('swordGlow'); flash('white', 4);
  await tell('（沈墨握住了剑柄。\n冰冷，却不刺骨。）');
  lookAt('laotie2', 'player');
  await say('laotie', '你干什么？！');
  await say('shenmo', '苏璃还在客栈！我去看看就回来！');
  await say('laotie', '臭小子——');
  await say('laotie', '……拿着！');
  await getItem('herb', 3);
  await say('laotie', '活着回来！');
  await walk(lt, 'r');
  faceTo('laotie2', 'left');
  await tell('（出门后，碰到妖怪就会进入战斗。\n选“剑技”可以施展断雪·焰。）');
}
async function evRaidInn() {
  const sx = Math.min(15, P().x + 3);
  const s = addActor({ id: 'suli', sprite: 'suli', x: sx, y: 8, dir: 'left' });
  addActor({ id: 'rw', sprite: 'm_wolf', x: sx + 1, y: 8, dir: 'left' });
  addActor({ id: 'rf', sprite: 'm_fox', x: sx, y: 9, dir: 'up' });
  faceTo('player', 'right');
  await say('shenmo', '苏璃！');
  lookAt('suli', 'player');
  await say('suli', '断雪……你拿着它？');
  await emote('rw', 'anger', 30);
  await say('shenmo', '小心——！');
  joinParty('suli');
  State.guests = [];
  const r = await startBattle({
    enemies: ['wolf', 'foxfire', 'foxfire'], bg: 'night', music: 'battle',
    intro: async (B) => { await B.say('妖怪围了上来！', 40); await B.say('苏璃：……我好像，会用这个。', 70); },
  });
  removeActor('rw'); removeActor('rf');
  await say('shenmo', '你……会仙术？');
  await say('suli', '我不知道。手自己动的。');
  await say('shenmo', '这种事也能“自己动”？');
  Sound.sfx('encounter');
  await emote('suli', '!', 30);
  await say('suli', '还有。在桥那边。');
  removeActor('suli');
  Field.makeFollowers(); Field.resetFollowers();
  setFlag('suliSaved');
  Sound.jingle('lvup');
  await toast('{苏璃} 加入了队伍。');
  resumeMapMusic();
}
async function evRaidBridge() {
  const k = addActor({ id: 'wk', sprite: 'm_wolfking', x: 14, y: 16, dir: 'up' });
  await walk(k, 'u', { speed: 2 });
  await emote('wk', 'anger', 40);
  await say('狼妖头目', '嗅……是那柄剑的味道。|三百年了……终于醒了……');
  await say('shenmo', '会说话的狼？！');
  await say('suli', '它要的是剑。');
  await say('shenmo', '那更不能给了——这剑还没付修理费呢！');
  await startBattle({ enemies: ['wolfking'], bg: 'night', boss: true, music: 'boss' });
  await say('狼妖头目', '……剑……醒了……|它们……都会来的……');
  Sound.sfx('die');
  await flicker(k, 10);
  removeActor('wk');
  await say('shenmo', '什么都会来？喂，把话说清楚——');
  setFlag('wolfking');
  await evBond();
}
async function evBond() {
  await say('shenmo', '算了。先回去告诉师父。');
  const s = detach('suli');
  await walk('player', 'uuu', { force: false });
  await wait(20);
  await flicker(s, 12);
  s.alpha = 0.5;
  await emote('suli', '…', 40);
  await say('suli', '别……走太远……');
  faceTo('player', 'down');
  await emote('player', '!', 30);
  await walk('player', 'dd', { speed: 2, force: false });
  s.alpha = 1;
  await say('shenmo', '怎么了？！');
  await say('suli', '离剑……远了，我就会……散。');
  await say('shenmo', '散？什么叫“散”？');
  await say('suli', '……像雪一样。');
  const lt = addActor({ id: 'laotie3', sprite: 'laotie', x: P().x, y: P().y - 3, dir: 'down' });
  await walk(lt, 'd', { speed: 2 });
  await say('laotie', '你们俩没事吧！');
  await emote('laotie3', '…', 40);
  await say('laotie', '……我年轻时，听栖云山的道长说过。');
  await say('laotie', '剑里若是养着{剑灵}——|剑离不得灵，灵也离不得剑。');
  await say('shenmo', '剑灵？她？');
  await say('suli', '……我不记得了。|我只记得，要把剑修好。');
  await say('laotie', '想弄明白，得上{栖云山}。山上的道士懂这些。|剩下四样五灵之精，兴许也能问出个下落。');
  await say('laotie', '往南出镇，穿过{翠竹林}，就是山脚。');
  await say('shenmo', '出远门？那可得加钱。');
  await say('suli', '我付钱。');
  await say('shenmo', '你有钱？');
  await say('suli', '没有。');
  await wait(20);
  await say('suli', '……这个给你。');
  await getItem('snowflake');
  await say('shenmo', '……一片雪？');
  await say('suli', '它不会化。');
  await emote('player', '…', 40);
  await say('shenmo', '行吧。算你欠我的——我记账上了。');
  await ledger('苏璃：欠路费若干。（暂押雪花一片。）');
  await say('laotie', '臭小子。……天亮了再走。|门口的雪，记得扫了。');
  await say('shenmo', '师父！');
  setFlag('raidDone');
  removeActor('suli'); removeActor('laotie3');
  reattach();
  Music.fadeOut();
  await fadeOut('black', 8);
  healParty();
  await chapterCard('第一章', '青竹');
  setChapter('第一章·青竹');
  Field.load('town', 3, 8, 'down');
  Field.resetFollowers();
  const lt2 = addActor({ id: 'laotie4', sprite: 'laotie', x: 4, y: 8, dir: 'left' });
  Field.draw(ctx);
  await fadeIn(8);
  await say('laotie', '拿着。路上饿了啃两口——|硬得能当暗器使。');
  await getItem('shaobing', 3);
  await say('laotie', '还有这个。');
  await getGold(100);
  await say('laotie', '……别看了，不是工钱。是盘缠。', { expr: 'smile' });
  await say('shenmo', '师父……');
  faceTo('laotie4', 'up');
  await say('laotie', '滚吧。');
  await ledger('老铁：给了盘缠一百文。（这笔不用还。）');
  await walk(lt2, 'u');
  removeActor('laotie4');
  Sound.sfx('door');
  await tell('（往南出镇，穿过翠竹林，前往栖云山。）');
}
