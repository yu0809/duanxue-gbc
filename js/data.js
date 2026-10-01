'use strict';
// ============================================================
//  Data — characters, skills, items, enemies, encounters
// ============================================================
// 五灵 cycle: each element overcomes the next.  水克火 火克风 风克雷 雷克土 土克水
const ELEMS = ['风', '雷', '水', '火', '土'];
const BEATS = { 水: '火', 火: '风', 风: '雷', 雷: '土', 土: '水' };
const ELEM_COL = { 风: 'G', 雷: 'Q', 水: 'B', 火: 'r', 土: 'Y' };
function elemMult(atk, def) {
  if (!atk || !def) return 1;
  if (BEATS[atk] === def) return 1.5;
  if (BEATS[def] === atk) return 0.7;
  if (atk === def) return 0.5;
  return 1;
}

// ---------------- characters ----------------
const CHARS = {
  shenmo: {
    name: '沈墨', title: '剑铺学徒', el: null,
    base: { hp: 62, mp: 12, atk: 11, def: 8, spd: 10, mag: 6, luk: 9 },
    grow: { hp: 15, mp: 2.4, atk: 2.4, def: 1.7, spd: 1.0, mag: 1.0, luk: 0.8 },
    skills: [
      { id: 'steal', lv: 1 }, { id: 'coins', lv: 4 }, { id: 'provoke', lv: 8 }, { id: 'allin', lv: 13 },
      { id: 'dx_fire', sword: 'fire' }, { id: 'dx_wind', sword: 'wind' }, { id: 'dx_water', sword: 'water' },
      { id: 'dx_thunder', sword: 'thunder' }, { id: 'dx_earth', sword: 'earth' }, { id: 'dx_final', flag: 'finalArt' },
    ],
    equip: { weapon: 'duanxue', armor: 'cloth', acc: null }, fixedWeapon: true,
  },
  suli: {
    name: '苏璃', title: '雪中剑灵', el: '水',
    base: { hp: 46, mp: 30, atk: 6, def: 6, spd: 11, mag: 14, luk: 10 },
    grow: { hp: 10.5, mp: 5, atk: 1.1, def: 1.25, spd: 1.1, mag: 2.6, luk: 1 },
    skills: [
      { id: 'frost', lv: 1 }, { id: 'heal', lv: 1 }, { id: 'cleanse', lv: 4 }, { id: 'blizzard', lv: 6 },
      { id: 'rain', lv: 9 }, { id: 'icewall', lv: 12 }, { id: 'revive', lv: 14 }, { id: 'silentsnow', lv: 17 },
    ],
    equip: { weapon: 'bell', armor: 'whitedress', acc: null },
  },
  linfeng: {
    name: '叶临风', title: '栖云首徒', el: '风',
    base: { hp: 58, mp: 22, atk: 13, def: 9, spd: 14, mag: 10, luk: 7 },
    grow: { hp: 12.5, mp: 3.5, atk: 2.2, def: 1.5, spd: 1.35, mag: 1.8, luk: 0.8 },
    skills: [
      { id: 'flysword', lv: 1 }, { id: 'swift', lv: 1 }, { id: 'galecut', lv: 8 }, { id: 'thunderbreak', lv: 10 },
      { id: 'sevenstars', lv: 13 }, { id: 'tenthousand', lv: 16 },
    ],
    equip: { weapon: 'qinggang', armor: 'daopao', acc: null },
  },
};
const EXP_TABLE = [0];
for (let L = 1; L <= 40; L++) EXP_TABLE[L] = Math.round(10 * Math.pow(L - 1, 2.15) + 10 * (L - 1));
// sword 断雪: ATK by forge stage
const SWORD_ATK = [4, 10, 18, 27, 37, 48];
const SWORD_NAMES = ['断雪（残）', '断雪·一淬', '断雪·二淬', '断雪·三淬', '断雪·四淬', '断雪'];
const LING_ORDER = ['fire', 'wind', 'water', 'thunder', 'earth'];
const LING_NAME = { fire: '火之灵', wind: '风之灵', water: '水之灵', thunder: '雷之灵', earth: '土之灵' };

function newChar(id, lv = 1) {
  const c = { id, lv, exp: EXP_TABLE[lv], equip: Object.assign({}, CHARS[id].equip), status: {} };
  const s = calcBase(id, lv);
  c.hp = s.hp; c.mp = s.mp;
  return c;
}
function calcBase(id, lv) {
  const C = CHARS[id];
  const o = {};
  for (const k in C.base) o[k] = Math.round(C.base[k] + C.grow[k] * (lv - 1));
  return o;
}
function stats(c) {
  const o = calcBase(c.id, c.lv);
  for (const slot of ['weapon', 'armor', 'acc']) {
    const e = c.equip[slot] && ITEMS[c.equip[slot]];
    if (!e || !e.bonus) continue;
    for (const k in e.bonus) o[k] = (o[k] || 0) + e.bonus[k];
  }
  if (c.id === 'shenmo') o.atk += SWORD_ATK[State.sword] || 4;
  o.mhp = o.hp; o.mmp = o.mp;
  return o;
}
function charSkills(c) {
  const list = [];
  for (const s of CHARS[c.id].skills) {
    if (s.lv && c.lv < s.lv) continue;
    if (s.sword && !State.flags['ling_' + s.sword]) continue;
    if (s.flag && !State.flags[s.flag]) continue;
    list.push(s.id);
  }
  return list;
}
function initParty() {
  State.chars = { shenmo: newChar('shenmo', 1) };
  State.party = ['shenmo'];
  State.items = { herb: 3 };
}
function joinParty(id, lv) {
  if (State.party.includes(id)) return;
  if (!State.chars[id]) {
    const avg = Math.round(State.party.reduce((s, p) => s + State.chars[p].lv, 0) / State.party.length);
    State.chars[id] = newChar(id, lv || avg);
  }
  State.party.push(id);
  if (Game.scene === Field) { Field.makeFollowers(); Field.resetFollowers(); }
}

// ---------------- skills ----------------
// target: enemy | enemies | ally | allies | self | dead
// kind: phys | mag | heal | buff | debuff | steal | coins | revive | cleanse
const SKILLS = {
  steal: { name: '顺手牵羊', mp: 2, target: 'enemy', kind: 'steal', desc: '从敌人身上摸点东西。', fx: 'slash' },
  coins: { name: '一掷千金', mp: 0, gold: 30, target: 'enemy', kind: 'coins', power: 60, desc: '花三十文钱砸人。很疼，也很心疼。', fx: 'coins' },
  provoke: { name: '激将法', mp: 6, target: 'ally', kind: 'buff', buff: 'atk', desc: '说两句难听的，同伴攻击上升。', fx: 'buff' },
  allin: { name: '孤注一掷', mp: 10, target: 'enemy', kind: 'phys', power: 2.6, recoil: 0.15, desc: '不留退路的一剑，自身也会受伤。', fx: 'bigslash' },
  dx_fire: { name: '断雪·焰', mp: 5, target: 'enemy', kind: 'phys', el: '火', power: 1.6, desc: '剑身燃起火灵，斩单体。', fx: 'fire' },
  dx_wind: { name: '断雪·风', mp: 8, target: 'enemies', kind: 'phys', el: '风', power: 1.0, desc: '回身一旋，风刃扫过全体。', fx: 'wind' },
  dx_water: { name: '断雪·澜', mp: 10, target: 'enemy', kind: 'phys', el: '水', power: 0.75, hits: 3, desc: '三连斩，如水不绝。', fx: 'water' },
  dx_thunder: { name: '断雪·霆', mp: 14, target: 'enemy', kind: 'phys', el: '雷', power: 2.3, stun: 0.35, desc: '雷霆一击，有时令敌人眩晕。', fx: 'thunder' },
  dx_earth: { name: '断雪·岳', mp: 18, target: 'enemies', kind: 'phys', el: '土', power: 1.5, debuff: 'def', desc: '剑落如山崩，全体并降低防御。', fx: 'earth' },
  dx_final: { name: '千山暮雪', mp: 30, target: 'enemies', kind: 'phys', el: null, power: 3.2, desc: '断雪终式。五灵归一，万山落雪。', fx: 'final' },
  frost: { name: '霜华', mp: 4, target: 'enemy', kind: 'mag', el: '水', power: 1.0, desc: '凝霜为刃，水属单体。', fx: 'ice' },
  heal: { name: '回春', mp: 5, target: 'ally', kind: 'heal', power: 30, scale: 1.6, desc: '为一名同伴疗伤。', fx: 'heal' },
  cleanse: { name: '清心', mp: 3, target: 'ally', kind: 'cleanse', desc: '解除一名同伴的异常状态。', fx: 'heal' },
  blizzard: { name: '风雪', mp: 9, target: 'enemies', kind: 'mag', el: '水', power: 0.8, desc: '唤来风雪，水属全体。', fx: 'blizzard' },
  rain: { name: '春风化雨', mp: 16, target: 'allies', kind: 'heal', power: 24, scale: 1.0, desc: '为全体同伴疗伤。', fx: 'heal' },
  icewall: { name: '冰心诀', mp: 8, target: 'allies', kind: 'buff', buff: 'def', desc: '冰心护体，全体防御上升。', fx: 'buff' },
  revive: { name: '还魂', mp: 18, target: 'dead', kind: 'revive', desc: '唤回倒下的同伴。', fx: 'heal' },
  silentsnow: { name: '雪落无声', mp: 22, target: 'enemies', kind: 'mag', el: '水', power: 1.45, desc: '万籁俱寂时，雪已落满山。', fx: 'blizzard' },
  flysword: { name: '御剑术', mp: 5, target: 'enemy', kind: 'mag', el: '风', power: 1.25, desc: '以气驭剑，风属单体。', fx: 'wind' },
  swift: { name: '疾风步', mp: 6, target: 'allies', kind: 'buff', buff: 'spd', desc: '全体速度上升。', fx: 'buff' },
  galecut: { name: '风卷残云', mp: 10, target: 'enemies', kind: 'mag', el: '风', power: 0.95, desc: '狂风过境，风属全体。', fx: 'wind' },
  thunderbreak: { name: '天雷破', mp: 12, target: 'enemy', kind: 'mag', el: '雷', power: 1.9, desc: '引天雷入剑，雷属单体。', fx: 'thunder' },
  sevenstars: { name: '北斗剑阵', mp: 16, target: 'enemies', kind: 'phys', power: 1.15, hits: 2, desc: '七剑成阵，两次攻击全体。', fx: 'swords' },
  tenthousand: { name: '万剑归宗', mp: 26, target: 'enemies', kind: 'mag', el: '风', power: 1.7, desc: '栖云派绝学，万剑齐落。', fx: 'swords' },
  // enemy skills
  e_bite: { name: '撕咬', kind: 'phys', power: 1.25, target: 'enemy' },
  e_fox: { name: '狐火', kind: 'mag', el: '火', power: 1.0, target: 'enemy', fx: 'fire' },
  e_howl: { name: '长嚎', kind: 'buff', buff: 'atk', target: 'self', fx: 'buff' },
  e_frenzy: { name: '狂噬', kind: 'phys', power: 0.8, hits: 2, target: 'enemy' },
  e_poison: { name: '毒牙', kind: 'phys', power: 0.9, status: 'poison', chance: 0.45, target: 'enemy' },
  e_leaf: { name: '竹叶刃', kind: 'mag', el: '风', power: 0.85, target: 'enemies', fx: 'leaves' },
  e_spore: { name: '迷魂孢', kind: 'debuff', status: 'sleep', chance: 0.5, target: 'enemies', fx: 'spore' },
  e_toxin: { name: '毒孢', kind: 'debuff', status: 'poison', chance: 0.6, target: 'enemy', fx: 'spore' },
  e_grab: { name: '抢钱', kind: 'grab', power: 0.7, target: 'enemy' },
  e_peck: { name: '啄击', kind: 'phys', power: 1.0, target: 'enemy' },
  e_bolt: { name: '落雷', kind: 'mag', el: '雷', power: 1.1, target: 'enemy', fx: 'thunder' },
  e_rock: { name: '落石', kind: 'mag', el: '土', power: 0.9, target: 'enemies', fx: 'earth' },
  e_harden: { name: '石肤', kind: 'buff', buff: 'def', target: 'self', fx: 'buff' },
  e_croak: { name: '蟾鸣', kind: 'debuff', status: 'sleep', chance: 0.4, target: 'enemies', fx: 'spore' },
  e_frost: { name: '冰息', kind: 'mag', el: '水', power: 0.95, target: 'enemies', fx: 'blizzard' },
  e_icefang: { name: '冰牙', kind: 'phys', el: '水', power: 1.3, target: 'enemy', fx: 'ice' },
  e_slash: { name: '骨剑', kind: 'phys', power: 1.2, target: 'enemy', fx: 'slash' },
  e_seal: { name: '封咒', kind: 'debuff', status: 'seal', chance: 0.55, target: 'enemy', fx: 'seal' },
  e_burn: { name: '符火', kind: 'mag', el: '火', power: 1.0, target: 'enemy', fx: 'fire' },
  e_drain: { name: '吸血', kind: 'drain', power: 1.0, target: 'enemy' },
  e_shadow: { name: '暗影', kind: 'mag', el: '雷', power: 1.15, target: 'enemy', fx: 'dark' },
  e_vine: { name: '缠绕', kind: 'phys', power: 0.8, stun: 0.5, target: 'enemy', fx: 'leaves' },
  e_regrow: { name: '青竹回春', kind: 'heal', power: 0.12, target: 'self', fx: 'heal' },
  e_charge: { name: '蓄力', kind: 'charge', target: 'self' },
  e_tail: { name: '甩尾', kind: 'phys', power: 1.0, target: 'enemies' },
  e_glacier: { name: '万里冰封', kind: 'mag', el: '水', power: 2.0, target: 'enemies', fx: 'blizzard' },
  e_hellfire: { name: '焚天', kind: 'mag', el: '火', power: 1.25, target: 'enemies', fx: 'fire' },
  e_demonslash: { name: '魔剑斩', kind: 'phys', power: 1.7, target: 'enemy', fx: 'bigslash' },
  e_rage: { name: '怒焰', kind: 'buff', buff: 'atk', target: 'self', fx: 'buff' },
  e_swordrain: { name: '剑雨', kind: 'phys', power: 0.7, hits: 2, target: 'enemies', fx: 'swords' },
  e_nightmare: { name: '梦魇', kind: 'debuff', status: 'sleep', chance: 0.45, target: 'enemies', fx: 'dark' },
  e_void: { name: '归墟', kind: 'mag', el: null, power: 2.2, target: 'enemies', fx: 'dark' },
  e_wail: { name: '哀嚎', kind: 'debuff', status: 'seal', chance: 0.4, target: 'enemies', fx: 'dark' },
  e_lfsword: { name: '御剑术', kind: 'mag', el: '风', power: 1.2, target: 'enemy', fx: 'wind' },
  e_lfgale: { name: '风卷残云', kind: 'mag', el: '风', power: 0.8, target: 'enemies', fx: 'wind' },
};
const BUFF_NAME = { atk: '攻击', def: '防御', spd: '速度' };
const STATUS_NAME = { poison: '毒', sleep: '眠', seal: '封', stun: '晕' };

// ---------------- items ----------------
// kind: use | weapon | armor | acc | key
const ITEMS = {
  herb: { name: '止血草', kind: 'use', price: 10, heal: 60, target: 'ally', desc: '止血疗伤，回复六十点气血。' },
  candy: { name: '糖葫芦', kind: 'use', price: 6, heal: 35, target: 'ally', desc: '又酸又甜，回复三十五点气血。' },
  salve: { name: '金创药', kind: 'use', price: 45, heal: 180, target: 'ally', desc: '回复一百八十点气血。' },
  pill: { name: '九转丹', kind: 'use', price: 140, heal: 500, target: 'ally', desc: '回复五百点气血。' },
  lingzhi: { name: '灵芝', kind: 'use', price: 40, mp: 25, target: 'ally', desc: '回复二十五点真气。' },
  dew: { name: '玉露', kind: 'use', price: 120, mp: 70, target: 'ally', desc: '回复七十点真气。' },
  lotus: { name: '天山雪莲', kind: 'use', price: 0, full: true, target: 'ally', desc: '气血与真气全部回复。' },
  incense: { name: '还魂香', kind: 'use', price: 90, revive: 0.35, target: 'dead', desc: '令倒下的同伴苏醒。' },
  antidote: { name: '解毒草', kind: 'use', price: 8, cure: ['poison'], target: 'ally', desc: '解除中毒。' },
  clearpill: { name: '清心丸', kind: 'use', price: 18, cure: ['sleep', 'seal', 'poison', 'stun'], target: 'ally', desc: '解除一切异常状态。' },
  firetalis: { name: '火雷符', kind: 'use', price: 55, battleOnly: true, dmg: 70, el: '火', target: 'enemies', desc: '对全体敌人造成火属伤害。' },
  icetalis: { name: '寒冰符', kind: 'use', price: 80, battleOnly: true, dmg: 160, el: '水', target: 'enemy', desc: '对单体敌人造成水属伤害。' },
  repel: { name: '驱魔香', kind: 'use', price: 35, fieldOnly: true, repel: 150, target: 'none', desc: '点燃后一段路程内妖物不近身。' },
  escape: { name: '土遁符', kind: 'use', price: 45, fieldOnly: true, escape: true, target: 'none', desc: '从迷宫中脱出，回到入口。' },
  shaobing: { name: '老铁的烧饼', kind: 'use', price: 0, heal: 120, mp: 10, target: 'ally', desc: '硬得能当暗器。回复气血与少许真气。' },
  // weapons
  duanxue: { name: '断雪', kind: 'weapon', who: ['shenmo'], price: 0, desc: '断了的古剑。剑脊上结着化不开的霜。' },
  bell: { name: '铜铃', kind: 'weapon', who: ['suli'], price: 60, bonus: { atk: 2, mag: 3 }, desc: '系着红绳的铜铃。' },
  featherfan: { name: '雪羽扇', kind: 'weapon', who: ['suli'], price: 380, bonus: { atk: 4, mag: 9 }, desc: '以雪鹤翎毛制成。' },
  icebell: { name: '冰魄铃', kind: 'weapon', who: ['suli'], price: 900, bonus: { atk: 6, mag: 16 }, desc: '铃声清冷，可安神魂。' },
  hairpin: { name: '霜华簪', kind: 'weapon', who: ['suli'], price: 0, bonus: { atk: 8, mag: 24, spd: 3 }, desc: '似曾相识的旧物。' },
  qinggang: { name: '青钢剑', kind: 'weapon', who: ['linfeng'], price: 120, bonus: { atk: 7 }, desc: '栖云派弟子的佩剑。' },
  songwen: { name: '松纹剑', kind: 'weapon', who: ['linfeng'], price: 520, bonus: { atk: 14, mag: 2 }, desc: '剑身有松针般的纹理。' },
  qiyun: { name: '栖云剑', kind: 'weapon', who: ['linfeng'], price: 1100, bonus: { atk: 22, mag: 5 }, desc: '历代首徒所持之剑。' },
  liuguang: { name: '流光剑', kind: 'weapon', who: ['linfeng'], price: 0, bonus: { atk: 31, mag: 8, spd: 3 }, desc: '剑出如流光。' },
  // armor
  cloth: { name: '粗布衣', kind: 'armor', price: 20, bonus: { def: 2 }, desc: '打了补丁的旧衣服。' },
  whitedress: { name: '素纱衣', kind: 'armor', who: ['suli'], price: 0, bonus: { def: 3, mag: 2 }, desc: '薄如雪，冷如雪。' },
  daopao: { name: '青布道袍', kind: 'armor', price: 90, bonus: { def: 5, mag: 1 }, desc: '栖云派的日常衣袍。' },
  leather: { name: '护心皮甲', kind: 'armor', who: ['shenmo', 'linfeng'], price: 130, bonus: { def: 8 }, desc: '在胸口缝了块铁片。' },
  cotton: { name: '棉袍', kind: 'armor', price: 160, bonus: { def: 7, spd: 1 }, desc: '寒冬里最实在的护甲。' },
  chain: { name: '锁子甲', kind: 'armor', who: ['shenmo', 'linfeng'], price: 480, bonus: { def: 15, spd: -1 }, desc: '沉，但是可靠。' },
  cloudrobe: { name: '云纹袍', kind: 'armor', price: 520, bonus: { def: 12, mag: 5 }, desc: '绣着流云的法袍。' },
  silk: { name: '天蚕衣', kind: 'armor', price: 1200, bonus: { def: 22, mag: 4, spd: 1 }, desc: '天蚕丝织成，刀剑难伤。' },
  // accessories
  charm: { name: '护身符', kind: 'acc', price: 50, bonus: { def: 3 }, desc: '庙里求来的，据说很灵。' },
  boots: { name: '疾风靴', kind: 'acc', price: 260, bonus: { spd: 5 }, desc: '穿上它，跑得比债主快。' },
  jade: { name: '羊脂玉佩', kind: 'acc', price: 300, bonus: { luk: 8, def: 2 }, desc: '温润的玉。运气上升。' },
  pearl: { name: '避毒珠', kind: 'acc', price: 220, bonus: { def: 2 }, immune: ['poison'], desc: '佩戴者不会中毒。' },
  calmbead: { name: '定神珠', kind: 'acc', price: 280, bonus: { mag: 3 }, immune: ['sleep', 'seal'], desc: '不会入眠，也不会被封咒。' },
  fivejade: { name: '五灵玉', kind: 'acc', price: 0, bonus: { def: 6, mag: 6, atk: 6 }, desc: '五色流转的玉石。' },
  tigertooth: { name: '狼牙坠', kind: 'acc', price: 0, bonus: { atk: 5 }, desc: '狼妖头目的獠牙。' },
  // key items (shown in 要物)
  snowflake: { name: '不化的雪花', kind: 'key', desc: '苏璃给的“报酬”。放在手心，怎么也不化。' },
  ledger: { name: '账本', kind: 'key', desc: '沈墨的宝贝账本。谁欠他什么，一笔一笔记得清清楚楚。' },
  delivery: { name: '待送的刀', kind: 'key', desc: '要送去悦来客栈的菜刀。老铁说少一文钱都不行。' },
  token: { name: '栖云令', kind: 'key', desc: '栖云派的通行令牌。' },
  towerkey: { name: '镇妖塔钥', kind: 'key', desc: '可以打开镇妖塔封门的铜钥。' },
  carrot: { name: '胡萝卜', kind: 'key', desc: '冻得硬邦邦的胡萝卜。怎么看都像个鼻子。' },
};

// ---------------- enemies ----------------
// art: sprite key in BART; pal: palette swap; ai: list of [skillId|'attack', weight, condition?]
const ENEMIES = {
  foxfire: { name: '狐火', art: 'wisp', pal: 'fire', lv: 1, hp: 47, atk: 10, def: 5, spd: 9, mag: 9, el: '火', exp: 9, gold: 6, drops: [['herb', 0.25]], steal: 'candy', ai: [['attack', 2], ['e_fox', 2]] },
  wolf: { name: '灰狼妖', art: 'wolf', pal: 'gray', lv: 2, hp: 68, atk: 13, def: 7, spd: 10, mag: 4, el: '土', exp: 13, gold: 8, drops: [['herb', 0.3]], steal: 'herb', ai: [['attack', 3], ['e_bite', 1]] },
  wolfking: { name: '狼妖头目', art: 'wolfbig', pal: 'boss', huge: true, boss: true, lv: 4, hp: 180, atk: 24, def: 8, spd: 11, mag: 8, el: '土', exp: 60, gold: 80, drops: [['tigertooth', 1]], steal: 'salve', ai: [['attack', 3], ['e_bite', 2], ['e_howl', 1, (e) => !e.buff.atk], ['e_frenzy', 2, (e) => e.hp < e.mhp * 0.5]] },
  snake: { name: '竹叶青', art: 'snake', pal: 'green', lv: 3, hp: 79, atk: 18, def: 8, spd: 13, mag: 7, el: '风', exp: 15, gold: 10, drops: [['antidote', 0.3]], steal: 'antidote', ai: [['attack', 2], ['e_poison', 2]] },
  sprite: { name: '竹灵', art: 'sprite', pal: 'bamboo', lv: 4, hp: 90, atk: 12, def: 9, spd: 12, mag: 16, el: '风', exp: 18, gold: 12, drops: [['lingzhi', 0.15]], steal: 'herb', ai: [['attack', 1], ['e_leaf', 2]] },
  shroom: { name: '迷魂菇', art: 'shroom', pal: 'purple', lv: 4, hp: 104, atk: 16, def: 10, spd: 6, mag: 16, el: '土', exp: 17, gold: 11, drops: [['clearpill', 0.2]], steal: 'clearpill', ai: [['attack', 2], ['e_spore', 1], ['e_toxin', 1]] },
  imp: { name: '山魈', art: 'imp', pal: 'brown', lv: 5, hp: 126, atk: 25, def: 10, spd: 15, mag: 7, el: '土', exp: 24, gold: 25, drops: [['salve', 0.15]], steal: 'jade', ai: [['attack', 3], ['e_grab', 2]] },
  bamboowitch: { name: '竹魅', art: 'witch', pal: 'bamboo', big: true, boss: true, lv: 7, hp: 450, atk: 34, def: 11, spd: 13, mag: 38, el: '风', exp: 180, gold: 200, drops: [['featherfan', 1]], steal: 'lingzhi', ai: [['e_leaf', 3], ['e_vine', 2], ['attack', 2], ['e_regrow', 2, (e) => e.hp < e.mhp * 0.45]] },
  crow: { name: '鸦妖', art: 'crow', pal: 'black', lv: 6, hp: 119, atk: 28, def: 10, spd: 18, mag: 20, el: '雷', exp: 28, gold: 16, drops: [['herb', 0.3]], steal: 'charm', ai: [['e_peck', 3], ['e_bolt', 1]] },
  golem: { name: '石精', art: 'golem', pal: 'stone', lv: 7, hp: 216, atk: 34, def: 23, spd: 5, mag: 11, el: '土', exp: 36, gold: 24, drops: [['salve', 0.2]], steal: 'salve', ai: [['attack', 3], ['e_rock', 1], ['e_harden', 1, (e) => !e.buff.def]] },
  ghostimp: { name: '山鬼', art: 'imp', pal: 'ghost', lv: 8, hp: 173, atk: 35, def: 13, spd: 17, mag: 20, el: '雷', exp: 40, gold: 40, drops: [['lingzhi', 0.2]], steal: 'boots', ai: [['attack', 3], ['e_grab', 1], ['e_bolt', 1]] },
  linfeng_duel: { name: '叶临风', art: 'linfeng_b', pal: null, boss: true, lv: 8, hp: 560, atk: 42, def: 13, spd: 18, mag: 36, el: '风', exp: 140, gold: 0, drops: [], steal: 'lingzhi', ai: [['attack', 3], ['e_lfsword', 3], ['e_lfgale', 2]] },
  icewisp: { name: '冰魄', art: 'wisp', pal: 'ice', lv: 9, hp: 148, atk: 27, def: 14, spd: 15, mag: 38, el: '水', exp: 44, gold: 22, drops: [['lingzhi', 0.2]], steal: 'lingzhi', ai: [['attack', 1], ['e_frost', 2]] },
  snowfox: { name: '雪狐', art: 'wolf', pal: 'snow', lv: 10, hp: 216, atk: 45, def: 15, spd: 19, mag: 18, el: '水', exp: 52, gold: 30, drops: [['salve', 0.25]], steal: 'cotton', ai: [['attack', 2], ['e_icefang', 2], ['e_frenzy', 1]] },
  toad: { name: '寒蟾', art: 'frog', pal: 'ice', lv: 10, hp: 252, atk: 40, def: 17, spd: 9, mag: 34, el: '水', exp: 55, gold: 28, drops: [['clearpill', 0.3]], steal: 'calmbead', ai: [['attack', 2], ['e_croak', 1], ['e_frost', 1]] },
  icegolem: { name: '冰傀', art: 'golem', pal: 'ice', lv: 11, hp: 378, atk: 52, def: 30, spd: 7, mag: 18, el: '水', exp: 68, gold: 40, drops: [['salve', 0.3]], steal: 'chain', ai: [['attack', 3], ['e_icefang', 1], ['e_harden', 1, (e) => !e.buff.def]] },
  icedragon: { name: '冰蛟', art: 'dragon', pal: 'ice', huge: true, boss: true, lv: 13, hp: 950, atk: 70, def: 18, spd: 14, mag: 64, el: '水', exp: 600, gold: 500, drops: [['icebell', 1]], steal: 'dew', ai: 'dragon' },
  skeleton: { name: '骷髅剑客', art: 'skeleton', pal: 'bone', lv: 12, hp: 459, atk: 58, def: 21, spd: 14, mag: 14, el: '土', exp: 80, gold: 45, drops: [['salve', 0.3]], steal: 'songwen', ai: [['attack', 2], ['e_slash', 2]] },
  talisman: { name: '符纸怪', art: 'talisman', pal: 'paper', lv: 12, hp: 324, atk: 37, def: 16, spd: 16, mag: 53, el: '火', exp: 78, gold: 50, drops: [['firetalis', 0.35]], steal: 'firetalis', ai: [['e_burn', 2], ['e_seal', 1]] },
  bat: { name: '赤眼蝠', art: 'bat', pal: 'red', lv: 13, hp: 378, atk: 56, def: 16, spd: 24, mag: 19, el: '风', exp: 84, gold: 40, drops: [['herb', 0.4]], steal: 'pearl', ai: [['attack', 2], ['e_drain', 2]] },
  shade: { name: '影魔', art: 'shade', pal: 'purple', lv: 14, hp: 540, atk: 53, def: 18, spd: 18, mag: 60, el: '雷', exp: 100, gold: 60, drops: [['dew', 0.15]], steal: 'cloudrobe', ai: [['attack', 2], ['e_shadow', 2], ['e_nightmare', 1]] },
  jin: { name: '烬', art: 'jin_b', pal: null, big: true, boss: true, lv: 17, hp: 2400, atk: 92, def: 24, spd: 22, mag: 80, el: '火', exp: 1400, gold: 1000, drops: [['liuguang', 1]], steal: 'pill', ai: 'jin' },
  swordsoul: { name: '剑魂', art: 'sword', pal: 'steel', lv: 16, hp: 621, atk: 75, def: 25, spd: 20, mag: 29, el: '雷', exp: 130, gold: 70, drops: [['salve', 0.3]], steal: 'silk', ai: [['attack', 2], ['e_swordrain', 1], ['e_slash', 2]] },
  wraith: { name: '怨灵', art: 'wisp', pal: 'wraith', lv: 16, hp: 567, atk: 49, def: 21, spd: 20, mag: 72, el: '水', exp: 125, gold: 60, drops: [['dew', 0.2]], steal: 'dew', ai: [['e_frost', 2], ['e_wail', 1], ['e_drain', 1]] },
  bonelord: { name: '骨将', art: 'skeleton', pal: 'dark', lv: 17, hp: 810, atk: 82, def: 30, spd: 16, mag: 24, el: '土', exp: 150, gold: 90, drops: [['pill', 0.2]], steal: 'pill', ai: [['attack', 2], ['e_slash', 2], ['e_rock', 1]] },
  nightshade: { name: '魇魔', art: 'shade', pal: 'nightmare', lv: 18, hp: 756, atk: 68, def: 25, spd: 22, mag: 80, el: '雷', exp: 160, gold: 80, drops: [['dew', 0.25]], steal: 'lotus', ai: [['e_shadow', 2], ['e_nightmare', 1], ['attack', 1]] },
  yan1: { name: '魇', art: 'yan', pal: 'p1', huge: true, boss: true, lv: 20, hp: 3600, atk: 90, def: 26, spd: 20, mag: 92, el: null, exp: 0, gold: 0, drops: [], ai: 'yan1' },
  yan2: { name: '魇·归墟', art: 'yan', pal: 'p2', huge: true, boss: true, lv: 22, hp: 3000, atk: 96, def: 28, spd: 24, mag: 98, el: null, exp: 0, gold: 0, drops: [], ai: 'yan2' },
};

// encounter groups per area
const GROUPS = {
  raid: [['foxfire'], ['foxfire', 'foxfire'], ['wolf'], ['wolf', 'foxfire']],
  bamboo: [['snake'], ['snake', 'snake'], ['sprite'], ['sprite', 'snake'], ['shroom'], ['shroom', 'sprite'], ['imp']],
  bamboo2: [['snake', 'sprite'], ['imp', 'snake'], ['shroom', 'shroom'], ['imp'], ['sprite', 'sprite', 'snake']],
  mountain: [['crow'], ['crow', 'crow'], ['golem'], ['ghostimp'], ['crow', 'imp'], ['golem', 'crow']],
  cave: [['icewisp'], ['icewisp', 'icewisp'], ['snowfox'], ['toad'], ['snowfox', 'icewisp'], ['icegolem'], ['toad', 'icewisp']],
  tower: [['skeleton'], ['talisman', 'talisman'], ['bat', 'bat'], ['skeleton', 'talisman'], ['shade'], ['bat', 'skeleton']],
  tower2: [['shade', 'bat'], ['skeleton', 'skeleton'], ['talisman', 'shade'], ['bat', 'bat', 'talisman']],
  tomb: [['swordsoul'], ['wraith', 'wraith'], ['bonelord'], ['nightshade'], ['swordsoul', 'wraith'], ['bonelord', 'swordsoul']],
};
function pickEncounter(enc) {
  const g = GROUPS[enc.group];
  if (!g) return null;
  return { enemies: pick(g), bg: enc.bg, music: enc.music };
}
