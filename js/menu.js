'use strict';
// ============================================================
//  Field menus — items, skills, equipment, status, ledger,
//  save/load, settings, shops and inns
// ============================================================
// Generic vertical list window on the UI stack.
class ListWin {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, w: 80, rows: 6, i: 0, top: 0, entries: [], title: null, cancel: true, rowH: 14 }, o);
    this.h = this.h || this.rows * this.rowH + 8 + (this.title ? 14 : 0);
  }
  get cur() { return this.entries[this.i]; }
  update() {
    const n = this.entries.length;
    if (n) {
      if (Input.rep.down) { this.i = (this.i + 1) % n; Sound.sfx('cursor'); }
      if (Input.rep.up) { this.i = (this.i + n - 1) % n; Sound.sfx('cursor'); }
      if (this.i < this.top) this.top = this.i;
      if (this.i >= this.top + this.rows) this.top = this.i - this.rows + 1;
    }
    if (this.onMove) this.onMove(this.cur);
    if (this.side && (Input.rep.left || Input.rep.right)) { this.side(Input.rep.left ? -1 : 1); return; }
    if (Input.ok() && n) {
      if (this.cur.ok === false) { Sound.sfx('bump'); return; }
      Sound.sfx('ok'); this.pick(this.cur, this.i);
    } else if (Input.cancel() && this.cancel) { Sound.sfx('cancel'); this.close(null); }
  }
  pick(e) { this.close(e.value !== undefined ? e.value : e); }
  close(v) { UI.remove(this); this.done && this.done(v); }
  draw(g) {
    drawBox(g, this.x, this.y, this.w, this.h);
    let y = this.y + 4;
    if (this.title) { Font.draw(g, this.title, this.x + 8, y, PAL.R); y += 14; rect(g, this.x + 4, y - 2, this.w - 8, 1, PAL.P); }
    for (let r = 0; r < this.rows; r++) {
      const e = this.entries[this.top + r];
      if (!e) break;
      const col = e.ok === false ? PAL.g : e.col || INK;
      Font.draw(g, e.label, this.x + 14, y + r * this.rowH, col);
      if (e.right !== undefined) { const s = String(e.right); Font.draw(g, s, this.x + this.w - 6 - Font.measure(s), y + r * this.rowH, e.rcol || PAL.B); }
    }
    if (this.entries.length) drawCursor(g, this.x + 5, y + 2 + (this.i - this.top) * this.rowH, UI.stack[UI.stack.length - 1] !== this);
    else Font.draw(g, this.empty || '什么也没有。', this.x + 12, y, PAL.n);
    if (this.top > 0) drawArrow(g, this.x + this.w - 10, this.y + 2, true);
    if (this.top + this.rows < this.entries.length) drawArrow(g, this.x + this.w - 10, this.y + this.h - 6, false);
  }
}
function listWin(o) { return new Promise((res) => { const w = new ListWin(o); w.done = res; UI.push(w); }); }
// passive panel (no input) drawn as part of a menu screen
class Panel {
  constructor(draw) { this.drawFn = draw; }
  draw(g) { this.drawFn(g); }
}
function pushPanel(fn) { const p = new Panel(fn); UI.push(p); return p; }
// description strip at the bottom
let menuDesc = '';
function drawDesc(g) {
  drawBox(g, 0, SH - 30, SW, 30);
  const rows = wrapRich(parseRich(menuDesc || ''), 148);
  rows.slice(0, 2).forEach((r, i) => { let x = 6; for (const c of r) { Font.draw(g, c.ch, x, SH - 26 + i * 12, c.col || INK); x += Font.width(c.ch); } });
}

// ---------------- main menu ----------------
async function openMainMenu() {
  Field.locked++;
  const panel = pushPanel((g) => drawPartySummary(g));
  try {
    for (;;) {
      const entries = [
        { label: '物品', value: 'items' }, { label: '技能', value: 'skills' }, { label: '装备', value: 'equip' },
        { label: '状态', value: 'status' }, { label: '账本', value: 'ledger' }, { label: '存档', value: 'save' }, { label: '设置', value: 'settings' },
      ];
      const v = await listWin({ x: 104, y: 0, w: 56, rows: 7, entries, i: openMainMenu.last || 0 });
      if (!v) break;
      openMainMenu.last = entries.findIndex((e) => e.value === v);
      if (v === 'items') await itemScreen();
      else if (v === 'skills') await skillScreen();
      else if (v === 'equip') await equipScreen();
      else if (v === 'status') await statusScreen();
      else if (v === 'ledger') await ledgerScreen();
      else if (v === 'save') await saveScreen(true);
      else if (v === 'settings') await settingsScreen();
    }
  } finally { UI.remove(panel); Field.locked--; }
}
function drawPartySummary(g) {
  drawBox(g, 0, 0, 104, SH);
  State.party.forEach((id, i) => {
    const c = State.chars[id];
    const s = stats(c);
    const y = 5 + i * 36;
    const spr = SPR[PARTY_SPRITE[id]];
    if (spr) g.drawImage(spr.down[0], 6, y + 4);
    Font.draw(g, CHARS[id].name, 26, y, INK);
    Font.draw(g, 'Lv' + c.lv, 78, y, PAL.R);
    Font.draw(g, '血', 26, y + 12, PAL.n);
    drawNum(g, c.hp, 62, y + 12, c.hp < s.mhp * 0.25 ? PAL.r : INK);
    Font.draw(g, '/' + s.mhp, 62, y + 12, PAL.n);
    drawBar(g, 26, y + 25, 72, c.hp / s.mhp, PAL.G);
    drawBar(g, 26, y + 28, 72, c.mp / Math.max(1, s.mmp), PAL.C);
  });
  rect(g, 4, SH - 32, 96, 1, PAL.P);
  Font.draw(g, '钱', 6, SH - 28, PAL.n);
  const gold = String(State.gold) + '文';
  Font.draw(g, gold, 98 - Font.measure(gold), SH - 28, PAL.Y);
  Font.draw(g, State.chapter || '', 6, SH - 15, PAL.R);
  const t = Math.floor(State.playTime / 60);
  const ts = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  Font.draw(g, ts, 98 - Font.measure(ts), SH - 15, PAL.n);
}
async function pickMember(title, filter) {
  const entries = State.party.map((id) => {
    const c = State.chars[id]; const s = stats(c);
    return { label: CHARS[id].name, right: `${c.hp}/${s.mhp}`, value: id, ok: filter ? filter(id) : true };
  });
  return listWin({ x: 24, y: 24, w: 112, rows: entries.length, entries, title });
}

// ---------------- items ----------------
async function itemScreen() {
  let tab = 0;
  const panel = pushPanel((g) => { drawDesc(g); });
  try {
    for (;;) {
      const keys = Object.keys(State.items).filter((k) => State.items[k] > 0 && ITEMS[k] && (tab === 0 ? ITEMS[k].kind === 'use' : tab === 1 ? ['weapon', 'armor', 'acc'].includes(ITEMS[k].kind) : ITEMS[k].kind === 'key'));
      const entries = keys.map((k) => ({ label: ITEMS[k].name, right: ITEMS[k].kind === 'key' ? '' : '×' + State.items[k], value: k }));
      const w = new ListWin({ x: 0, y: 0, w: SW, h: SH - 30, rows: 6, entries, title: ['道具', '装备品', '要物'][tab] + '  ◀▶', empty: '空空如也。' });
      w.onMove = (e) => { menuDesc = e ? ITEMS[e.value].desc : ''; };
      w.side = (d) => { tab = (tab + 3 + d) % 3; Sound.sfx('cursor'); w.close('__tab'); };
      const v = await new Promise((res) => { w.done = res; UI.push(w); });
      if (v === '__tab') continue;
      if (!v) break;
      const I = ITEMS[v];
      if (I.kind === 'key') { if (v === 'ledger') await ledgerScreen(); continue; }
      if (I.kind !== 'use') continue;
      if (I.battleOnly) { await toast('只能在战斗中使用。'); continue; }
      await useFieldItem(v);
    }
  } finally { UI.remove(panel); menuDesc = ''; }
}
async function useFieldItem(id) {
  const I = ITEMS[id];
  if (I.repel) { State.repel = I.repel; consume(id); Sound.sfx('magic'); await toast('点燃了驱魔香。'); return; }
  if (I.escape) {
    const ent = MAPS[State.map] && MAPS[State.map].escapeTo;
    if (!ent) { await toast('这里用不了。'); return; }
    consume(id);
    while (UI.stack.length) UI.stack.pop();
    Field.locked = Math.max(0, Field.locked - 1);
    await Field.warp(ent[0], ent[1], ent[2], 'down', 'magic');
    Field.locked++;
    return;
  }
  for (;;) {
    const who = await pickMember('给谁用？', (pid) => {
      const c = State.chars[pid];
      if (I.revive) return c.hp <= 0;
      return c.hp > 0;
    });
    if (!who) return;
    const c = State.chars[who]; const s = stats(c);
    if (I.heal) c.hp = Math.min(s.mhp, c.hp + I.heal);
    if (I.mp) c.mp = Math.min(s.mmp, c.mp + I.mp);
    if (I.full) { c.hp = s.mhp; c.mp = s.mmp; }
    if (I.revive) c.hp = Math.max(1, Math.round(s.mhp * I.revive));
    if (I.cure) for (const k of I.cure) delete c.status[k];
    consume(id);
    Sound.sfx('heal');
    if (!State.items[id]) return;
  }
}
function consume(id) { State.items[id]--; if (State.items[id] <= 0) delete State.items[id]; }

// ---------------- skills (field healing) ----------------
async function skillScreen() {
  const who = await pickMember('谁的招式？');
  if (!who) return;
  const panel = pushPanel((g) => drawDesc(g));
  try {
    for (;;) {
      const c = State.chars[who];
      const list = charSkills(c);
      const entries = list.map((k) => {
        const S = SKILLS[k];
        const fieldUse = ['heal', 'revive', 'cleanse'].includes(S.kind);
        return { label: S.name, right: S.gold ? S.gold + '文' : S.mp, value: k, ok: fieldUse && c.mp >= S.mp && c.hp > 0 };
      });
      const w = new ListWin({ x: 0, y: 0, w: SW, h: SH - 30, rows: 6, entries, title: CHARS[who].name + '  真气 ' + c.mp });
      w.onMove = (e) => { menuDesc = e ? (SKILLS[e.value].el ? `[${SKILLS[e.value].el}]` : '') + SKILLS[e.value].desc : ''; };
      const v = await new Promise((res) => { w.done = res; UI.push(w); });
      if (!v) break;
      const S = SKILLS[v];
      const targets = S.target === 'allies' ? State.party.filter((p) => State.chars[p].hp > 0)
        : [await pickMember('对谁施展？', (pid) => (S.kind === 'revive' ? State.chars[pid].hp <= 0 : State.chars[pid].hp > 0))];
      if (!targets[0]) continue;
      c.mp -= S.mp;
      const mag = stats(c).mag;
      for (const t of targets) {
        const tc = State.chars[t]; const ts = stats(tc);
        if (S.kind === 'heal') tc.hp = Math.min(ts.mhp, tc.hp + Math.round(S.power + mag * S.scale));
        if (S.kind === 'revive') tc.hp = Math.round(ts.mhp * 0.5);
        if (S.kind === 'cleanse') tc.status = {};
      }
      Sound.sfx('heal');
    }
  } finally { UI.remove(panel); menuDesc = ''; }
}

// ---------------- equipment ----------------
const SLOT_NAME = { weapon: '武器', armor: '衣服', acc: '饰品' };
async function equipScreen() {
  const who = await pickMember('给谁换装备？');
  if (!who) return;
  const c = State.chars[who];
  let preview = null;
  const panel = pushPanel((g) => drawEquipStats(g, c, preview));
  try {
    for (;;) {
      const entries = ['weapon', 'armor', 'acc'].map((k) => ({
        label: SLOT_NAME[k], right: c.equip[k] ? (k === 'weapon' && who === 'shenmo' ? SWORD_NAMES[State.sword] : ITEMS[c.equip[k]].name) : '——', value: k, rcol: INK,
        ok: !(k === 'weapon' && CHARS[who].fixedWeapon),
      }));
      const slot = await listWin({ x: 0, y: 0, w: SW, rows: 3, entries, title: CHARS[who].name + ' 的装备' });
      if (!slot) break;
      const opts = Object.keys(State.items).filter((k) => State.items[k] > 0 && ITEMS[k] && ITEMS[k].kind === slot && (!ITEMS[k].who || ITEMS[k].who.includes(who)));
      const entries2 = [{ label: '（卸下）', value: '__none' }].concat(opts.map((k) => ({ label: ITEMS[k].name, right: '×' + State.items[k], value: k })));
      const w = new ListWin({ x: 0, y: 62, w: SW, rows: 3, entries: entries2, title: '换上什么？' });
      w.onMove = (e) => { preview = e ? { slot, item: e.value === '__none' ? null : e.value } : null; };
      const pickV = await new Promise((res) => { w.done = res; UI.push(w); });
      preview = null;
      if (!pickV) continue;
      const old = c.equip[slot];
      const nu = pickV === '__none' ? null : pickV;
      if (old) addItem(old, 1);
      if (nu) consume(nu);
      c.equip[slot] = nu;
      const s = stats(c);
      c.hp = Math.min(c.hp, s.mhp); c.mp = Math.min(c.mp, s.mmp);
      Sound.sfx('chest');
    }
  } finally { UI.remove(panel); }
}
function drawEquipStats(g, c, preview) {
  drawBox(g, 0, 104, SW, 40);
  const now = stats(c);
  let next = null;
  if (preview) {
    const saved = c.equip[preview.slot];
    c.equip[preview.slot] = preview.item;
    next = stats(c);
    c.equip[preview.slot] = saved;
  }
  const keys = [['atk', '攻'], ['def', '防'], ['mag', '灵'], ['spd', '速']];
  keys.forEach(([k, n], i) => {
    const x = 6 + i * 38, y = 108;
    Font.draw(g, n, x, y, PAL.n);
    drawNum(g, now[k], x + 30, y, INK);
    if (next && next[k] !== now[k]) {
      const up = next[k] > now[k];
      Font.draw(g, (up ? '↑' : '↓'), x, y + 14, up ? PAL.G : PAL.r);
      drawNum(g, next[k], x + 30, y + 14, up ? PAL.G : PAL.r);
    }
  });
}

// ---------------- status ----------------
async function statusScreen() {
  let idx = 0;
  const p = pushPanel((g) => {
    const id = State.party[idx]; const c = State.chars[id]; const s = stats(c);
    drawBox(g, 0, 0, SW, SH);
    drawBox(g, 4, 4, 38, 38, { plain: true });
    if (PORTRAIT[id]) g.drawImage(PORTRAIT[id], 7, 7);
    Font.draw(g, CHARS[id].name, 48, 6, INK);
    Font.draw(g, CHARS[id].title, 48, 20, PAL.n);
    Font.draw(g, 'Lv ' + c.lv, 118, 6, PAL.R);
    const el = id === 'shenmo' ? '无' : CHARS[id].el;
    Font.draw(g, '灵性 ' + el, 112, 20, ELEM_COL[el] ? PAL[ELEM_COL[el]] : PAL.n);
    const rows = [['气血', `${c.hp}/${s.mhp}`], ['真气', `${c.mp}/${s.mmp}`], ['经验', String(c.exp)], ['下一级', String(Math.max(0, EXP_TABLE[c.lv + 1] - c.exp))]];
    rows.forEach(([a, b], i) => { Font.draw(g, a, 8, 46 + i * 13, PAL.n); Font.draw(g, b, 82 - Font.measure(b), 46 + i * 13, INK); });
    const st = [['攻击', s.atk], ['防御', s.def], ['灵力', s.mag], ['速度', s.spd], ['运势', s.luk]];
    st.forEach(([a, b], i) => { Font.draw(g, a, 92, 46 + i * 13, PAL.n); drawNum(g, b, 152, 46 + i * 13, INK); });
    rect(g, 6, 112, SW - 12, 1, PAL.P);
    const eq = ['weapon', 'armor', 'acc'].map((k) => (c.equip[k] ? (k === 'weapon' && id === 'shenmo' ? SWORD_NAMES[State.sword] : ITEMS[c.equip[k]].name) : '——'));
    Font.draw(g, eq[0], 8, 116, INK);
    Font.draw(g, eq[1] + ' · ' + eq[2], 8, 129, PAL.n);
    if (State.party.length > 1) { drawArrow(g, SW - 10, 3, true); }
  });
  try {
    for (;;) {
      await waitUntil(() => Input.ok() || Input.cancel() || Input.pressed.left || Input.pressed.right || Input.pressed.up || Input.pressed.down);
      if (Input.ok() || Input.cancel()) { Sound.sfx('cancel'); break; }
      idx = (idx + (Input.pressed.left || Input.pressed.up ? State.party.length - 1 : 1)) % State.party.length;
      Sound.sfx('cursor');
      await wait(1);
    }
  } finally { UI.remove(p); await wait(1); }
}

// ---------------- 账本 ----------------
function addLedger(text) { if (!State.ledger.includes(text)) State.ledger.push(text); }
async function ledgerScreen() {
  const lines = State.ledger.length ? State.ledger : ['（空白的一页。）'];
  let top = Math.max(0, lines.length - 8);
  const p = pushPanel((g) => {
    drawBox(g, 0, 0, SW, SH, { fill: PAL.z, inner: PAL.a });
    Font.draw(g, '账本', 64, 4, PAL.R);
    rect(g, 8, 18, SW - 16, 1, PAL.a);
    let y = 22;
    for (let i = top; i < lines.length && y < SH - 14; i++) {
      const rows = Font.wrap(lines[i], 140);
      rows.forEach((r, k) => { Font.draw(g, (k === 0 ? '·' : ' ') + r, 6, y, INK); y += 13; });
    }
    if (top > 0) drawArrow(g, SW - 10, 4, true);
  });
  try {
    for (;;) {
      await waitUntil(() => Input.ok() || Input.cancel() || Input.rep.up || Input.rep.down);
      if (Input.ok() || Input.cancel()) { Sound.sfx('cancel'); break; }
      if (Input.rep.up) top = Math.max(0, top - 1);
      if (Input.rep.down) top = Math.min(Math.max(0, lines.length - 1), top + 1);
      await wait(1);
    }
  } finally { UI.remove(p); await wait(1); }
}

// ---------------- save / load ----------------
const SAVE_KEY = 'duanxue.save.';
function readSlot(n) { try { const s = localStorage.getItem(SAVE_KEY + n); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function writeSlot(n, data) { try { localStorage.setItem(SAVE_KEY + n, JSON.stringify(data)); return true; } catch (e) { return false; } }
function slotLabel(d) {
  if (!d) return '—— 空 ——';
  const t = Math.floor(d.playTime / 60);
  const lv = d.chars && d.chars.shenmo ? d.chars.shenmo.lv : 1;
  return `${d.chapter || ''} Lv${lv} ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
async function saveScreen(saving) {
  const entries = [1, 2, 3].map((n) => { const d = readSlot(n); return { label: `${n}  ${slotLabel(d)}`, value: n, ok: saving || !!d }; });
  const n = await listWin({ x: 0, y: 30, w: SW, rows: 3, entries, title: saving ? '存档到哪一栏？' : '读取哪一栏？' });
  if (!n) return null;
  if (saving) {
    const p = Field.player;
    State.x = p.x; State.y = p.y; State.dir = p.dir; State.map = Field.map.def.id;
    const ok = writeSlot(n, State);
    Sound.sfx(ok ? 'save' : 'bump');
    await toast(ok ? '记录完毕。' : '这里写不进存档（浏览器禁止了存储）。');
    return n;
  }
  return readSlot(n);
}
function hasAnySave() { return [1, 2, 3].some((n) => readSlot(n)); }
function loadState(d) {
  State = Object.assign(freshState(), JSON.parse(JSON.stringify(d)));
  Game.setScene(Field);
  Field.player = null;
  Field.load(State.map, State.x, State.y, State.dir);
  Field.resetFollowers();
}

// ---------------- settings ----------------
const Settings = { textSpeed: 1, grid: true };
try { Object.assign(Settings, JSON.parse(localStorage.getItem('duanxue.settings') || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem('duanxue.settings', JSON.stringify(Settings)); } catch (e) {} }
async function settingsScreen() {
  for (;;) {
    const entries = [
      { label: '文字速度', right: ['慢', '中', '快'][Settings.textSpeed], value: 'speed', rcol: INK },
      { label: '声音', right: Audio_.muted ? '关' : '开', value: 'sound', rcol: INK },
      { label: '屏幕网格', right: Settings.grid ? '开' : '关', value: 'grid', rcol: INK },
    ];
    const v = await listWin({ x: 10, y: 30, w: 140, rows: 3, entries, title: '设置' });
    if (!v) break;
    if (v === 'speed') Settings.textSpeed = (Settings.textSpeed + 1) % 3;
    if (v === 'sound') { Audio_.unlock(); Audio_.setMuted(!Audio_.muted); const m = document.getElementById('mute'); if (m) m.textContent = Audio_.muted ? '声音：关' : '声音：开'; }
    if (v === 'grid') { Settings.grid = !Settings.grid; if (window.applyLayout) window.applyLayout(); }
    saveSettings();
  }
}

// ---------------- shops ----------------
async function shop(stock, greet = '要点什么？') {
  Field.locked++;
  const goldPanel = pushPanel((g) => {
    drawBox(g, 100, 0, 60, 18, { plain: true });
    const s = State.gold + '文';
    Font.draw(g, s, 154 - Font.measure(s), 3, PAL.Y);
  });
  try {
    for (;;) {
      const mode = await listWin({ x: 0, y: 0, w: 60, rows: 3, entries: [{ label: '买', value: 'buy' }, { label: '卖', value: 'sell' }, { label: '走了', value: 'bye' }], title: null });
      if (!mode || mode === 'bye') break;
      const panel = pushPanel((g) => drawDesc(g));
      try {
        for (;;) {
          let entries;
          if (mode === 'buy') entries = stock.map((k) => ({ label: ITEMS[k].name, right: ITEMS[k].price, value: k, ok: State.gold >= ITEMS[k].price, rcol: PAL.Y }));
          else entries = Object.keys(State.items).filter((k) => State.items[k] > 0 && ITEMS[k].kind !== 'key' && ITEMS[k].price > 0)
            .map((k) => ({ label: ITEMS[k].name + ' ×' + State.items[k], right: Math.floor(ITEMS[k].price / 2), value: k, rcol: PAL.Y }));
          const w = new ListWin({ x: 0, y: 20, w: SW, h: SH - 50, rows: 5, entries, title: mode === 'buy' ? '买什么？' : '卖什么？', empty: '没有能卖的。' });
          w.onMove = (e) => { menuDesc = e ? ITEMS[e.value].desc + equipHint(e.value) : ''; };
          const k = await new Promise((res) => { w.done = res; UI.push(w); });
          if (!k) break;
          if (mode === 'buy') { State.gold -= ITEMS[k].price; addItem(k, 1); Sound.sfx('coin'); }
          else { State.gold += Math.floor(ITEMS[k].price / 2); consume(k); Sound.sfx('coin'); }
        }
      } finally { UI.remove(panel); menuDesc = ''; }
    }
  } finally { UI.remove(goldPanel); Field.locked--; }
}
function equipHint(k) {
  const I = ITEMS[k];
  if (!I.bonus) return '';
  const parts = Object.entries(I.bonus).map(([s, v]) => ({ atk: '攻', def: '防', mag: '灵', spd: '速', luk: '运' }[s] + (v > 0 ? '+' : '') + v));
  const who = I.who ? '（' + I.who.map((w) => CHARS[w].name).join('、') + '）' : '';
  return ' [' + parts.join(' ') + ']' + who;
}
async function inn(price, who = '掌柜') {
  const r = await ask(who, `住一晚 ${price} 文，热水热饭都有。歇歇脚吗？`, ['住一晚', '不了'], { cancel: 1 });
  if (r !== 0) return false;
  if (State.gold < price) { await say(who, '这位客官……钱好像不太够啊。'); return false; }
  State.gold -= price;
  await restParty();
  await say(who, '客官早！精神头不错嘛。');
  return true;
}
async function restParty() {
  await fadeOut('black', 6);
  Sound.jingle('rest');
  for (const id of State.party) { const c = State.chars[id]; const s = stats(c); c.hp = s.mhp; c.mp = s.mmp; c.status = {}; }
  await wait(150);
  const mus = Field.map && Field.map.def.music;
  if (mus) Music.play(typeof mus === 'function' ? mus() : mus, true);
  await fadeIn(6);
}
