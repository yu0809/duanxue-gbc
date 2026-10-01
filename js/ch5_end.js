'use strict';
// ============================================================
//  终章 · 归墟 — 剑冢、归墟、结局
// ============================================================
const TOMB_LEGEND = {
  '#': 'tomb_wall',
  '.': ['ash', 'ash', 'ash', 'ash2', 'ash', 'ash3', 'ash'],
  ',': 'ash',
  '1': { g: 'ash', o: 'tsword1' },
  '2': { g: 'ash', o: 'tsword2' },
  '3': { g: 'ash', o: 'tsword3' },
  'b': { g: 'ash', o: 'bones' },
  'v': 'abyss',
  '*': { g: 'ash', o: 'savestone' },
};

defMap('tomb1', {
  title: '剑冢',
  music: 'tomb',
  weather: 'ash',
  legend: TOMB_LEGEND,
  bg: 'K',
  bg2: 'tomb',
  enc: { steps: [16, 28], group: 'tomb', bg: 'tomb' },
  escapeTo: ['tomb1', 9, 2],
  ground: [
    '####################',
    '####,,,,,,,,,,######',
    '###,,,,,,,,,,,,,####',
    '##..1....2....3...##',
    '##.....b..........##',
    '#..2..3.....1..2...#',
    '#.......2.......b..#',
    '#.1..........3.....#',
    '#....3..,,,,..1..2.#',
    '#..b....,,,,.......#',
    '#.2..1..,,,,..3....#',
    '#.......,,,,...b...#',
    '#..3..2......1..3..#',
    '#.........2........#',
    '##.1..b........2..##',
    '##......3..1......##',
    '###..2..........####',
    '####......3..#######',
    '######.,,..#########',
    '#######,,###########',
  ],
  build(m) {
    m.big('shrine', 9, 9);
    for (const [x, y] of [[6, 3], [16, 10], [3, 15], [13, 5], [9, 13]]) m.big('greatsword', x, y);
  },
  foes: [
    { id: 'w1', sprite: 'm_red', x: 4, y: 9, group: ['swordsoul', 'wraith'], bg: 'tomb' },
    { id: 'w2', sprite: 'm_dark', x: 15, y: 8, group: ['bonelord'], bg: 'tomb' },
    { id: 'w3', sprite: 'm_red', x: 12, y: 15, group: ['nightshade', 'swordsoul'], bg: 'tomb' },
  ],
  events: [
    { type: 'check', x: 9, y: 10, w: 2, h: 1, run: () => evShrine() },
    { type: 'touch', x: 7, y: 19, w: 2, cond: () => !flag('earthDone'), run: async () => {
      await say('suli', '等等。');
      await say('suli', '那边……有东西在叫我。');
      await walk('player', 'u');
    } },
    { type: 'warp', x: 7, y: 19, w: 2, to: 'tomb2', tx: 6, ty: 1, face: 'down', cond: () => flag('earthDone') },
  ],
});
async function evTombArrive() {
  await wait(30);
  await say('shenmo', '……都还活着吗？');
  await say('linfeng', '活着。');
  await say('suli', '嗯。');
  await say('shenmo', '那就好。|——这是什么地方？到处都是剑。');
  await say('linfeng', '剑冢。三百年来，死在归墟边上的剑客，|剑都留在这里。');
  await say('linfeng', '栖云派的典籍里，只有一句话：|“剑冢无归人。”');
  await say('shenmo', '……你们栖云派的典籍，能不能写点吉利的。');
}
async function evShrine() {
  if (flag('earthDone')) { await tell('空了的石台。剑已经回家了。'); return; }
  await say('suli', '……这里。');
  await tell('（一截断刃插在石台上。\n断口和断雪的断口，严丝合缝。）');
  await say('shenmo', '断雪的另一半……一直在这儿？');
  await say('suli', '他把剑断成了两截。|一截给我，一截留给自己。');
  await say('linfeng', '墨尘剑仙……就葬在这里？');
  await say('suli', '没有坟。|他说，剑在哪儿，人就在哪儿。');
  await tell('（沈墨握住了那截断刃。）');
  Sound.sfx('swordGlow');
  setFlag('earthDone');
  await absorbLing('earth');
  for (let i = 0; i < 3; i++) { flash('white', 4); Sound.sfx('bell'); await wait(16); }
  await tell('断雪，合而为一。');
  setFlag('finalArt');
  Sound.jingle('lvup');
  await toast('沈墨 领悟了断雪终式 {千山暮雪}！');
  await wait(20);
  await tell('（……谢谢你，带她回来。）');
  await emote('player', '!', 30);
  await say('shenmo', '……谁？');
  await say('suli', '……');
  await say('linfeng', '怎么了？');
  await say('shenmo', '没什么。大概……是风。');
  resumeMapMusic();
}

defMap('tomb2', {
  title: '归墟之缘',
  music: 'tomb',
  weather: 'ash',
  legend: TOMB_LEGEND,
  bg: 'K',
  bg2: 'tomb',
  enc: { steps: [18, 30], group: 'tomb', bg: 'tomb' },
  escapeTo: ['tomb1', 9, 2],
  ground: [
    '######,,######',
    '#####,..,#####',
    '####......####',
    '###..1..2..###',
    '###........###',
    '##v...b....v##',
    '##vv......vv##',
    '#vvv......vvv#',
    '#vv...*....vv#',
    '#vv........vv#',
    '#vvv......vvv#',
    '##vv..3...vv##',
    '##vvv....vvv##',
    '###vv....vv###',
    '####v,,,,v####',
    '######,,######',
  ],
  npcs: [
    { id: 'hu', sprite: HU, x: 8, y: 8, dir: 'left', talk: async () => {
      if (!flag('huFinal')) {
        setFlag('huFinal');
        await say('shenmo', '……你怎么连这儿都能先到？！');
        await say('胡老板', '做生意嘛，讲究的就是一个“先”字。|这是最后一单了——下回见，就在青石镇喝酒吧。');
        await ledger('胡老板：我欠他一句“你到底是什么人”。（没敢问。）');
      }
      await shop(['salve', 'pill', 'dew', 'incense', 'clearpill', 'lotus', 'firetalis', 'icetalis']);
    } },
  ],
  events: [
    { type: 'warp', x: 6, y: 0, w: 2, to: 'tomb1', tx: 7, ty: 18, face: 'up' },
    { type: 'check', x: 6, y: 8, run: () => saveStone() },
    { type: 'warp', x: 6, y: 15, w: 2, to: 'abyss', tx: 5, ty: 11, face: 'up', cond: () => flag('readyFinal') },
    { type: 'touch', x: 5, y: 14, w: 4, cond: () => !flag('readyFinal'), run: async () => {
      const r = await ask('shenmo', '再往前，就是归墟了。|准备好了吗？', ['走吧', '再等等'], { cancel: 1 });
      if (r !== 0) { await walk('player', 'u'); return; }
      await say('linfeng', '……沈墨。');
      await say('linfeng', '在山门打的那一场，|我其实……用了全力。');
      await say('shenmo', '我知道。');
      await say('linfeng', '……你知道？');
      await say('shenmo', '你剑柄上缠的布都打滑了。|打完了，你偷偷擦了好几回手。');
      await say('linfeng', '……');
      await say('linfeng', '谢谢。');
      await emote('player', '!', 30);
      await say('shenmo', '——你说什么？我没听清，你再说一遍？');
      await say('linfeng', '走了。');
      await ledger('叶临风：那句“谢谢”，还了。（没听清，不算。）');
      setFlag('readyFinal');
    } },
  ],
});

defMap('abyss', {
  title: '归墟',
  music: 'tomb',
  weather: 'motes',
  legend: TOMB_LEGEND,
  bg: 'K',
  bg2: 'abyss',
  ground: [
    'vvvvvvvvvvvv',
    'vvvvvvvvvvvv',
    'vvvvvvvvvvvv',
    'vvvvvvvvvvvv',
    'vvv......vvv',
    'vv........vv',
    'vv........vv',
    'vv........vv',
    'vvv......vvv',
    'vvvv....vvvv',
    'vvvvv..vvvvv',
    'vvvvv..vvvvv',
    'vvvvv..vvvvv',
  ],
  build(m) {
    if (!flag('ending')) m.deco.push({ img: enemyImage({ art: 'yan', pal: 'p1' }), x: 2 * 16, y: 2, over: true, yan: true });
  },
  drawUnder(g, cx, cy, m) {
    for (const d of m.deco) if (d.yan) d.y = 2 + Math.round(Math.sin(frameCount / 40) * 3);
  },
  events: [
    { type: 'touch', x: 3, y: 8, w: 6, cond: () => !flag('ending'), run: () => evFinal() },
  ],
});

async function evFinal() {
  await say('魇', '……又是你们。');
  await say('魇', '三百年前，你们用一柄剑、一个灵，|堵住了我。');
  await say('魇', '这一回，拿什么来堵？');
  await say('shenmo', '还是一柄剑，一个灵。');
  await say('shenmo', '外加一个记账的，|一个守规矩的。');
  await say('linfeng', '……这种时候，就别贫了。');
  await startBattle({ enemies: ['yan1'], bg: 'abyss', boss: true, music: 'final',
    intro: async (B) => { await B.say('归墟之主 魇，睁开了眼睛。', 60); } });
  Sound.sfx('thunder'); shake(30, 3);
  await say('魇', '不够……不够……|三百年的怨，三百年的冷……');
  await say('suli', '沈墨。');
  await say('shenmo', '嗯？');
  await say('suli', '等打完了……');
  await say('shenmo', '打完了再说。');
  await startBattle({ enemies: ['yan2'], bg: 'abyss', boss: true, music: 'final', keepMusic: true,
    intro: async (B) => { await B.say('魇·归墟，张开了深渊。', 60); await B.say('（千山暮雪……就是现在。）', 60); } });
  await evSeal();
}

async function evSeal() {
  setFlag('ending');
  Field.map.deco = Field.map.deco.filter((d) => !d.yan);
  Music.fadeOut();
  await wait(40);
  Sound.sfx('earth'); shake(30, 2);
  await say('linfeng', '……结束了？');
  const s = detach('suli');
  await walk(s, 'uu');
  faceTo('suli', 'down');
  await say('suli', '没有。');
  await say('suli', '归墟不会死。|它只是……又睡着了。');
  await say('suli', '得有人守着这道缝。');
  await say('shenmo', '……你什么意思。');
  await say('suli', '断雪是锁。我是锁芯。|三百年前是这样，现在也是。');
  await say('shenmo', '不行。');
  await say('suli', '沈墨。');
  await say('suli', '我欠你的路费，还没还。');
  await say('shenmo', '那你就别走！|留下来，慢慢还！');
  await wait(40);
  Music.play('memory', true);
  await say('suli', '……用这个还，行吗？', { expr: 'smile' });
  await tell('（她笑了。\n那是沈墨第一次看见她笑。）');
  if (State.shards.length >= 5) await trueEnding(s);
  else await normalEnding(s);
}

async function normalEnding(s) {
  await walk(s, 'u');
  for (let i = 0; i < 3; i++) { Sound.sfx('swordGlow'); flash('white', 6); await wait(30); }
  await fadeOut('white', 10);
  removeActor('suli');
  State.party = State.party.filter((p) => p !== 'suli');
  await wait(60);
  Game.setScene({ draw(g) { rect(g, 0, 0, SW, SH, PAL.W); }, update() {} });
  FX.fade = 0;
  await narrate(['断雪落回了沈墨手里。', '剑身微凉，', '再没有出声。'], { clear: true, color: PAL.D });
  await fadeOut('black', 10);
  await epilogueSnow();
}

async function trueEnding(s) {
  await walk(s, 'u');
  await wait(30);
  Sound.sfx('bell');
  await tell('（五片雪忆，同时亮了起来。）');
  for (let i = 0; i < 5; i++) { Sound.sfx('blip'); flash('blue', 3); await wait(12); }
  const mc = addActor({ id: 'mc', sprite: 'mochen', x: 5, y: 3, dir: 'down', alpha: 0.2 });
  for (let i = 0; i < 10; i++) { mc.alpha = 0.2 + i * 0.08; await wait(6); }
  mc.alpha = 1;
  await say('mochen', '……够了。');
  faceTo('suli', 'up');
  await say('suli', '……墨尘。');
  await say('mochen', '三百年前，是我让你替我守着。|这一回，该换我了。');
  await say('suli', '可是你——');
  await say('mochen', '我早就只剩这点念头了。|留在剑里，守着这道缝，正好。');
  lookAt('mc', 'player');
  await say('mochen', '她欠你的路费……|我替她付。');
  await say('shenmo', '……你就是那个，|问她名字是不是“大概”的人。');
  await say('mochen', '你也问了，不是吗？');
  await emote('player', '…', 40);
  faceTo('mc', 'up');
  await say('mochen', '对不起。|……还有，谢谢。');
  await walk(mc, 'u');
  for (let i = 0; i < 3; i++) { Sound.sfx('swordGlow'); flash('white', 6); await wait(30); }
  for (let i = 0; i < 10; i++) { mc.alpha = 1 - i * 0.1; await wait(6); }
  removeActor('mc');
  await fadeOut('white', 10);
  await wait(40);
  Game.setScene({ draw(g) { rect(g, 0, 0, SW, SH, PAL.W); }, update() {} });
  FX.fade = 0;
  await narrate(['归墟合上了。', '断雪留在了剑冢，', '替他守着。'], { clear: true, color: PAL.D });
  await fadeOut('black', 10);
  await epilogueSpring();
}

// ---------------- epilogues ----------------
async function epilogueSnow() {
  setFlag('cleared'); setFlag('normalEnd');
  await chapterCard('一年后', '雪夜');
  Field.player = null;
  State.party = ['shenmo']; State.guests = []; State.followers = true;
  Game.setScene(Field);
  Field.load('forge', 5, 5, 'up');
  Field.resetFollowers();
  const lt = addActor({ id: 'oldtie', sprite: 'laotie', x: 2, y: 5, dir: 'right' });
  Music.play('ending', true);
  Field.draw(ctx);
  await fadeIn(10);
  await tell('（一年后。青石镇。铁记剑铺。）');
  await say('laotie', '沈墨，周掌柜的刀，打好了没有？');
  await say('shenmo', '打好了。五十文，少一文不卖。');
  await say('laotie', '……这话听着耳熟。');
  await tell('（墙上挂着一柄剑。\n剑脊上的霜，一年四季都没化过。）');
  await say('laotie', '叶家那小子来信了。说栖云派新收了一批弟子，|规矩比以前更多了。');
  await say('shenmo', '他也就这点出息。');
  await wait(40);
  Sound.sfx('swordGlow');
  await tell('（窗外，下起了今年的第一场雪。）');
  await tell('（墙上的剑，轻轻地响了一声。）');
  await emote('player', '…', 50);
  await say('shenmo', '……嗯。|我知道。');
  await say('shenmo', '今年的，也收到了。');
  addLedger('苏璃：欠我一场雪。（每年冬天，都还。）');
  await ledgerFinal('苏璃：欠我一场雪。', '（每年冬天，都还。）');
  await credits(false);
}
async function epilogueSpring() {
  setFlag('cleared'); setFlag('trueEnd');
  await chapterCard('第二年', '青竹');
  Field.player = null;
  State.party = ['shenmo']; State.guests = ['suli']; State.followers = true;
  Game.setScene(Field);
  State.flags.spring = true;
  Field.load('town', 14, 13, 'down');
  Field.weather = new Petals();
  FX.tint = 'warm';
  Field.resetFollowers();
  removeActor('f_suli');
  Field.followers = [];
  const s = addActor({ id: 'suli', sprite: 'suli', x: 14, y: 15, dir: 'down' });
  Music.play('spring', true);
  Field.draw(ctx);
  await fadeIn(10);
  await tell('（第二年，开春。青石镇。）');
  await tell('（河上的冰化了。桥边的梅花，开得正好。）');
  await walk('player', 'd');
  faceTo('suli', 'up');
  await say('suli', '沈墨。');
  await say('suli', '雪……在化。');
  await say('shenmo', '开春了嘛。');
  await say('suli', '我以前以为，雪化了，就什么都没了。');
  await say('shenmo', '那现在呢？');
  await say('suli', '……现在知道了。');
  await say('suli', '雪化了，是春天。', { expr: 'smile' });
  await tell('（沈墨摊开手心。\n那片怎么也不化的雪花，化成了一滴水。）');
  await say('shenmo', '……押金化了。');
  await say('shenmo', '这下，路费你得拿别的还了。');
  await say('suli', '拿什么还？');
  await say('shenmo', '拿一辈子还吧。');
  await say('shenmo', '慢慢还。我记着账呢。');
  await say('suli', '……嗯。', { expr: 'smile' });
  await emote('suli', '♪', 60);
  addLedger('苏璃：欠我一辈子。（慢慢还。）');
  await ledgerFinal('苏璃：欠我一辈子。', '（慢慢还。）');
  await credits(true);
}
// a slow close-up of the last ledger page
async function ledgerFinal(a, b) {
  const page = {
    t: 0,
    update() { this.t++; },
    draw(g) {
      drawBox(g, 0, 0, SW, SH, { fill: PAL.z, inner: PAL.a });
      Font.drawCenter(g, '账本 · 最后一页', 80, 10, PAL.R);
      rect(g, 16, 26, SW - 32, 1, PAL.a);
      const n = Math.min(Array.from(a).length, Math.floor(this.t / 6));
      Font.drawCenter(g, Array.from(a).slice(0, n).join(''), 80, 58, INK);
      if (this.t > 120) Font.drawCenter(g, b, 80, 78, PAL.n);
      if (this.t > 170) { rect(g, 118, 104, 22, 22, PAL.r); Font.draw(g, '墨', 123, 109, PAL.p); }
    },
  };
  await fadeOut('black', 6);
  const prev = Game.scene;
  Game.setScene(page);
  FX.tint = null;
  await fadeIn(6);
  await waitUntil(() => page.t > 230 && Input.ok());
  await fadeOut('black', 8);
}
class Petals {
  constructor(n = 22) { this.f = []; for (let i = 0; i < n; i++) this.f.push({ x: rnd(0, 180), y: rnd(0, 150), v: rnd(0.25, 0.55), ph: rnd(0, 6) }); }
  update() { for (const p of this.f) { p.y += p.v; p.x += Math.sin(p.ph += 0.035) * 0.5 + 0.15; if (p.y > 148) { p.y = -4; p.x = rnd(-20, 170); } } }
  draw(g) { for (const p of this.f) { rect(g, Math.round(p.x), Math.round(p.y), 2, 1, PAL.m); rect(g, Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1, PAL.M); } }
}
TINTS.warm = (r, g, b) => [clamp(r * 1.02 + 10, 0, 255), clamp(g * 1.0 + 6, 0, 255), clamp(b * 0.9, 0, 255)];

// ---------------- credits ----------------
const CREDITS = [
  ['断雪', 'big'],
  ['— 剑与雪的轮回 —', 'sub'],
  ['', ''],
  ['剧本 · 程序', 'head'], ['Claude', ''],
  ['', ''],
  ['像素美术 · 音乐', 'head'], ['Claude', ''],
  ['', ''],
  ['像素字体', 'head'], ['Fusion Pixel Font', ''], ['SIL OFL 1.1', 'note'],
  ['', ''],
  ['标题书法', 'head'], ['马善政', ''], ['SIL OFL 1.1', 'note'],
  ['', ''],
  ['致敬', 'head'], ['《仙剑奇侠传三》', ''],
  ['', ''],
  ['沈墨 · 苏璃 · 叶临风', ''],
  ['老铁 · 玄清 · 烬', ''],
  ['胡老板 · 周掌柜', ''],
  ['还有青石镇的大家', ''],
  ['', ''],
  ['', ''],
  ['感谢游玩', 'head'],
];
async function credits(trueEnd) {
  Music.play('ending', true);
  const snow = new Snow(36);
  const sc = {
    t: 0,
    update() { this.t++; snow.update(); },
    draw(g) {
      drawNightSky(g, this.t);
      drawRidges(g, [[96, 12, 0.035, 'u', 5, 'g'], [110, 9, 0.06, 'U', 9, 'n'], [124, 6, 0.09, 'N', 13, null]]);
      snow.draw(g, 0, 0);
      const y0 = SH - this.t * 0.35;
      CREDITS.forEach(([text, kind], i) => {
        const y = Math.round(y0 + i * 18);
        if (y < -40 || y > SH + 4) return;
        if (kind === 'big') { const img = brushImg('title', 'W', 'K', 'D'); g.drawImage(img, Math.round(80 - img.width / 2), y - 20); return; }
        const col = kind === 'head' ? PAL.y : kind === 'note' ? PAL.i : kind === 'sub' ? PAL.i : PAL.W;
        if (text) Font.drawCenter(g, text, 80, y, col, PAL.N);
      });
    },
  };
  Game.setScene(sc);
  FX.tint = null;
  await fadeIn(8);
  const endT = (SH + CREDITS.length * 18 + 40) / 0.35;
  await waitUntil(() => sc.t > endT || (sc.t > 200 && Input.pressed.start));
  await fadeOut('black', 10);
  await postCredits(trueEnd);
}
async function postCredits(trueEnd) {
  Field.player = null;
  State.party = ['shenmo'];
  State.guests = [];
  delete State.flags.spring;
  Game.setScene(Field);
  setFlag('postcredits');
  Field.load('town', 3, 2, 'down');
  Field.player.visible = false;
  for (const f of Field.followers) f.visible = false;
  Field.followers = [];
  FX.tint = 'night';
  const j = addActor({ id: 'jin2', sprite: 'jin', x: 4, y: 2, dir: 'down' });
  Music.play('night', true);
  Field.draw(ctx);
  await fadeIn(10);
  await wait(40);
  await say('jin', '……青石镇。|那小子说的，就是这儿？');
  await say('jin', '欠我一场架。');
  await wait(30);
  await say('jin', '三百年都等了。|不差这几年。');
  await fadeOut('black', 12);
  FX.tint = null;
  const end = { t: 0, update() { this.t++; }, draw(g) { rect(g, 0, 0, SW, SH, PAL.K); const img = brushImg('终', 'W', null, null); g.drawImage(img, Math.round(80 - img.width / 2), 44); if (this.t > 90) Font.drawCenter(g, trueEnd ? '— 春 —' : '— 雪 —', 80, 96, PAL.i); } };
  Game.setScene(end);
  Music.fadeOut();
  await fadeIn(10);
  await waitUntil(() => end.t > 180 && Input.ok());
  await fadeOut('black', 10);
  try { localStorage.setItem('duanxue.cleared', trueEnd ? 'true' : 'normal'); } catch (e) {}
  Game.setScene(TitleScene);
  TitleScene.enter();
  throw ABORT;
}
