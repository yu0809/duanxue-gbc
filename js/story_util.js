'use strict';
// ============================================================
//  Story helpers — chests, rewards, save stones, 五灵 forging,
//  memory shards, cutscene shorthands
// ============================================================
function P() { return Field.player; }
function A(id) { return id === 'player' ? Field.player : Field.actor(id); }
async function openChest(c) {
  const key = Field.map.def.id + ':' + c.id;
  if (State.opened[key]) { await tell('空的。'); return; }
  State.opened[key] = true;
  Field.map.put(c.x, c.y, 'chest_open');
  Sound.sfx('chest');
  await wait(10);
  if (c.gold) { State.gold += c.gold; Sound.sfx('coin'); await toast(`得到了 ${c.gold} 文钱。`); }
  else await getItem(c.item, c.n || 1);
}
async function getItem(id, n = 1, silent) {
  addItem(id, n);
  Sound.jingle('item');
  await toast(`得到了 {${ITEMS[id].name}}${n > 1 ? ' ×' + n : ''}。`);
  resumeMapMusic();
}
async function getGold(n) { State.gold += n; Sound.sfx('coin'); await toast(`得到了 ${n} 文钱。`); }
function resumeMapMusic() {
  setTimeout(() => {
    if (Game.scene !== Field || !Field.map) return;
    const m = Field.map.def.music;
    const id = typeof m === 'function' ? m() : m;
    if (Music.cur !== id) Music.play(id, true);
  }, 1500);
}
function healParty() {
  for (const id of State.party) { const c = State.chars[id]; const s = stats(c); c.hp = s.mhp; c.mp = s.mmp; c.status = {}; }
}
async function saveStone() {
  Sound.sfx('heal');
  flash('white', 3);
  healParty();
  await tell('灵石泛着温润的光。\n（气血与真气全部恢复了。）');
  const r = await ask(null, '要在这里记录进度吗？', ['记录', '不了'], { cancel: 1 });
  if (r === 0) await saveScreen(true);
}
// The sword drinks one of the five essences
async function absorbLing(kind) {
  const col = { fire: 'red', wind: 'white', water: 'blue', thunder: 'gold', earth: 'gold' }[kind];
  Sound.stopMusic();
  await wait(20);
  Sound.sfx('swordGlow');
  for (let i = 0; i < 4; i++) { flash(col, 4); await wait(10); }
  FX.flashColor = 'white'; FX.flash = 12;
  Sound.jingle('ling');
  State.flags['ling_' + kind] = true;
  State.sword = Math.min(5, State.sword + 1);
  await wait(30);
  const S = SKILLS['dx_' + kind];
  await toast(`断雪 吸收了 {${LING_NAME[kind]}}。`);
  await toast(`剑身又重铸了一分。（攻击 +${SWORD_ATK[State.sword] - SWORD_ATK[State.sword - 1]}）`);
  await toast(`沈墨 领悟了 {${S.name}}！`);
  resumeMapMusic();
}
// 雪忆 — memory shards (5 for the true ending)
const SHARD_TEXT = [
  ['雪下得很大。', '有人把伞往她这边偏了偏。', '“雪也会冷吗？”他问。'],
  ['竹林深处有人吹笛。', '笛声停了，他说：', '“你听，雪落在竹叶上的声音。”'],
  ['“等这一仗打完，我带你下山，', '去看看春天。”', '“春天是什么样子？”', '“雪化了的样子。”'],
  ['她握住了冰冷的剑柄。', '“如果我变成剑，', '就能一直陪着你了吧？”', '他没有回答。'],
  ['剑断的那一刻，', '她听见他说：', '“对不起。……还有，谢谢。”'],
];
async function pickShard(n) {
  if (State.shards.includes(n)) return;
  State.shards.push(n);
  Sound.sfx('swordGlow');
  flash('white', 6);
  await toast(`拾到了一片 {雪忆}。（${State.shards.length}/5）`);
  const prevTint = FX.tint;
  Music.play('memory', true);
  await fadeOut('white', 5);
  FX.tint = 'memory';
  const scene = { draw(g) { rect(g, 0, 0, SW, SH, PAL.x); this.snow.draw(g, 0, 0); }, update() { this.snow.update(); }, snow: new Snow(30) };
  const prev = Game.scene;
  Game.setScene(scene);
  await fadeIn(5);
  await narrate(SHARD_TEXT[n - 1], { clear: true, color: PAL.D });
  await fadeOut('white', 5);
  Game.setScene(prev);
  FX.tint = prevTint;
  await fadeIn(5);
  if (State.party.includes('suli')) await say('suli', pick(['……刚才，好像想起了什么。', '那个声音……很熟悉。', '雪……好像没那么冷了。']));
  resumeMapMusic();
}
// a sparkle you can pick up (drawn by the map)
function shardEvent(n, x, y) {
  return { type: 'touch', shard: n, x, y, cond: () => !State.shards.includes(n) && State.party.includes('suli'), run: () => pickShard(n) };
}
function drawShards(g, cx, cy) {
  for (const ev of Field.map.def.events || []) {
    if (!ev.shard || State.shards.includes(ev.shard) || !State.party.includes('suli')) continue;
    const x = ev.x * 16 - cx + 8, y = ev.y * 16 - cy + 8;
    const t = frameCount / 8;
    rect(g, x, y - 3 + Math.round(Math.sin(t) * 1), 1, 7, PAL.W);
    rect(g, x - 3, y + Math.round(Math.sin(t) * 1), 7, 1, PAL.W);
    if (frameCount % 30 < 15) { rect(g, x - 1, y - 1, 3, 3, PAL.c); rect(g, x, y, 1, 1, PAL.W); }
  }
}
function setChapter(c) { State.chapter = c; }
// shorthand: party member joins with a small fanfare
async function joinMsg(id) {
  joinParty(id);
  Sound.jingle('lvup');
  await toast(`{${CHARS[id].name}} 加入了队伍。`);
}
function removeItem(id, n = 1) { if (!State.items[id]) return; State.items[id] -= n; if (State.items[id] <= 0) delete State.items[id]; }
function hasItem(id) { return (State.items[id] || 0) > 0; }
async function ledger(text) {
  addLedger(text);
  Sound.sfx('blip');
  await toast('（账本上又多了一笔。）', { life: 70 });
}
// pull a follower out of the conga line so a cutscene can move them
function detach(id) {
  const f = Field.actor('f_' + id);
  const p = Field.player;
  const x = f ? f.x : p.x, y = f ? f.y : p.y;
  State.followers = false;
  for (const ff of Field.followers) ff.visible = false;
  removeActor(id);
  return addActor({ id, sprite: PARTY_SPRITE[id], x, y, dir: f ? f.dir : p.dir });
}
function reattach() {
  for (const id of State.party.concat(State.guests || [])) removeActor(id);
  State.followers = true;
  Field.followers = Field.followers.filter((f) => Field.actors.includes(f));
  for (const f of Field.actors.filter((a) => a.follower)) removeActor(f.id);
  Field.makeFollowers();
  Field.resetFollowers();
}
async function flicker(a, n = 6) {
  for (let i = 0; i < n; i++) { a.alpha = i % 2 ? 1 : 0.35; await wait(5); }
  a.alpha = 1;
}
async function hammer(times = 3) {
  for (let i = 0; i < times; i++) { Sound.sfx('hit'); shake(6, 2); flash('white', 2); await wait(18); }
}
