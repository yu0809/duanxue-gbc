'use strict';
// ============================================================
//  UI layer — dialogue, choices, toasts. Windows stack on top
//  of whatever scene is running and own the input while open.
// ============================================================
const UI = {
  stack: [],
  busy() { return this.stack.some((w) => !w.passive); },
  push(w) { this.stack.push(w); return w; },
  remove(w) { const i = this.stack.indexOf(w); if (i >= 0) this.stack.splice(i, 1); },
  update() {
    const active = this.stack.filter((w) => !w.passive);
    const top = active[active.length - 1];
    for (const w of this.stack.slice()) if (w.tick) w.tick(w === top);
    if (top && top.update) top.update();
  },
  draw(g) { for (const w of this.stack) w.draw(g); },
};

// Speakers: name + portrait key
const SPEAKERS = {
  shenmo: { name: '沈墨', face: 'shenmo' },
  suli: { name: '苏璃', face: 'suli' },
  linfeng: { name: '叶临风', face: 'linfeng' },
  laotie: { name: '老铁', face: 'laotie' },
  xuanqing: { name: '玄清真人', face: 'xuanqing' },
  jin: { name: '烬', face: 'jin' },
  mochen: { name: '墨尘', face: 'mochen' },
};

// Rich text: {red text}  [blue text]  — markup chars are not shown
function parseRich(text) {
  const out = [];
  let col = null;
  for (const ch of text) {
    if (ch === '{') { col = PAL.r; continue; }
    if (ch === '[') { col = PAL.B; continue; }
    if (ch === '}' || ch === ']') { col = null; continue; }
    out.push({ ch, col });
  }
  return out;
}
function wrapRich(cells, maxW) {
  const plain = cells.map((c) => c.ch).join('');
  const lines = Font.wrap(plain, maxW);
  // map back to cells (wrap only drops nothing, so walk in order)
  const res = []; let i = 0;
  for (const ln of lines) {
    const row = [];
    for (const ch of ln) {
      while (i < cells.length && cells[i].ch !== ch) i++; // skip newlines
      if (i < cells.length) { row.push(cells[i]); i++; }
    }
    res.push(row);
  }
  return res;
}

class DialogBox {
  constructor(who, text, opt = {}) {
    const sp = SPEAKERS[who];
    this.name = sp ? sp.name : (who || '');
    this.face = opt.face || (sp ? sp.face : null);
    if (opt.expr && this.face) this.face = this.face + '_' + opt.expr;
    this.pages = [];
    const LINES = 3;
    for (const raw of String(text).split('|')) {
      const rows = wrapRich(parseRich(raw), 148);
      for (let i = 0; i < rows.length; i += LINES) this.pages.push(rows.slice(i, i + LINES));
    }
    this.page = 0; this.shown = 0; this.t = 0;
    this.done = null;
    this.y = 96;
    this.auto = opt.auto || 0;
    this.speed = opt.speed || 1;
    this.total = this.countPage();
  }
  countPage() { return this.pages[this.page].reduce((n, r) => n + r.length, 0); }
  update() {
    if (this.shown < this.total) {
      this.t++;
      const fast = Input.held.a || Input.held.b;
      const ts = typeof Settings !== 'undefined' ? Settings.textSpeed : 1;
      const every = fast ? 1 : [3, 2, 1][ts];
      const step = fast ? 4 : ts === 2 ? 2 : 1;
      if (this.t % every === 0) this.shown = Math.min(this.total, this.shown + step);
      if (Input.pressed.a && this.t > 3) this.shown = this.total;
      return;
    }
    if (this.auto) { if (--this.auto <= 0) this.next(); return; }
    if (Input.ok() || Input.pressed.b) { Sound.sfx('text'); this.next(); }
  }
  next() {
    if (this.page < this.pages.length - 1) { this.page++; this.shown = 0; this.t = 0; this.total = this.countPage(); }
    else { UI.remove(this); this.done && this.done(); }
  }
  draw(g) {
    const y = this.y;
    drawBox(g, 0, y, SW, SH - y);
    // portrait plate
    let nx = 3;
    if (this.face && PORTRAIT[this.face]) {
      drawBox(g, 2, y - 38, 38, 38, { plain: true });
      g.drawImage(PORTRAIT[this.face], 5, y - 35);
      nx = 42;
    }
    if (this.name) {
      const w = Font.measure(this.name) + 8;
      drawBox(g, nx, y - 15, w, 16, { plain: true });
      Font.draw(g, this.name, nx + 4, y - 13, PAL.R);
    }
    let n = this.shown;
    const rows = this.pages[this.page];
    for (let r = 0; r < rows.length && n > 0; r++) {
      let x = 6;
      for (const c of rows[r]) {
        if (n-- <= 0) break;
        Font.draw(g, c.ch, x, y + 5 + r * 13, c.col || INK);
        x += Font.width(c.ch);
      }
    }
    if (this.shown >= this.total && !this.auto) drawMore(g, SW - 11, SH - 8);
  }
}
function say(who, text, opt) {
  return new Promise((res) => { const d = new DialogBox(who, text, opt); d.done = res; UI.push(d); });
}
// narration without a speaker
function tell(text, opt) { return say(null, text, opt); }

class ChoiceBox {
  constructor(opts, opt = {}) {
    this.opts = opts; this.i = opt.def || 0; this.cancel = opt.cancel;
    this.w = Math.max(...opts.map((o) => Font.measure(o))) + 22;
    this.h = opts.length * 14 + 8;
    this.x = opt.x !== undefined ? opt.x : SW - this.w - 2;
    this.y = opt.y !== undefined ? opt.y : 94 - this.h;
  }
  update() {
    if (Input.rep.up) { this.i = (this.i + this.opts.length - 1) % this.opts.length; Sound.sfx('cursor'); }
    if (Input.rep.down) { this.i = (this.i + 1) % this.opts.length; Sound.sfx('cursor'); }
    if (Input.ok()) { Sound.sfx('ok'); UI.remove(this); this.done(this.i); }
    else if (Input.cancel() && this.cancel !== undefined) { Sound.sfx('cancel'); UI.remove(this); this.done(this.cancel); }
  }
  draw(g) {
    drawBox(g, this.x, this.y, this.w, this.h);
    this.opts.forEach((o, k) => Font.draw(g, o, this.x + 14, this.y + 4 + k * 14, INK));
    drawCursor(g, this.x + 5, this.y + 6 + this.i * 14);
  }
}
function choose(opts, opt) {
  return new Promise((res) => { const c = new ChoiceBox(opts, opt); c.done = res; UI.push(c); });
}
// ask a question in the dialog box and keep it visible while choosing
async function ask(who, text, opts, opt = {}) {
  const d = new DialogBox(who, text, opt);
  UI.push(d);
  await waitUntil(() => d.shown >= d.total && d.page === d.pages.length - 1);
  d.auto = 0;
  const keep = d.update; d.update = () => {}; // freeze the box under the choice
  const r = await choose(opts, opt);
  d.update = keep;
  UI.remove(d);
  return r;
}

// Centered banner (item get, area name)
class Toast {
  constructor(text, opt = {}) {
    this.text = text; this.t = 0; this.life = opt.life || 0; this.wait = opt.wait !== false;
    this.icon = opt.icon || null; this.sound = opt.sound;
    this.y = opt.y !== undefined ? opt.y : 52;
  }
  update() {
    this.t++;
    if (this.life ? this.t >= this.life : (this.t > 10 && Input.ok())) { UI.remove(this); this.done && this.done(); }
  }
  draw(g) {
    const rows = parseRich(this.text);
    const w = Math.min(156, rows.reduce((s, c) => s + Font.width(c.ch), 0) + 16);
    const x = Math.round((SW - w) / 2);
    drawBox(g, x, this.y, w, 22);
    let cx = x + 8;
    for (const c of rows) { Font.draw(g, c.ch, cx, this.y + 5, c.col || INK); cx += Font.width(c.ch); }
  }
}
function toast(text, opt) {
  return new Promise((res) => { const t = new Toast(text, opt); t.done = res; UI.push(t); });
}

// Area title card that slides in at top-left (does not block)
class AreaCard {
  constructor(text) { this.text = text; this.t = 0; this.passive = true; }
  tick() { this.t++; if (this.t > 150) UI.remove(this); }
  draw(g) {
    const w = Font.measure(this.text) + 20;
    let x = 4;
    if (this.t < 12) x = -w + (w + 4) * (this.t / 12);
    if (this.t > 138) x = 4 - (w + 4) * ((this.t - 138) / 12);
    x = Math.round(x);
    drawBox(g, x, 4, w, 20, { plain: true });
    rect(g, x + 4, 9, 2, 10, PAL.r);
    Font.draw(g, this.text, x + 10, 8, INK);
  }
}
function areaCard(text) { UI.stack.unshift(new AreaCard(text)); }

// Full-screen narration over black, centered lines
async function narrate(lines, opt = {}) {
  const box = {
    lines, shown: 0, t: 0, alpha: 0,
    update() {
      this.t++;
      if (this.t % 3 === 0 && this.shown < this.total) this.shown++;
      if (Input.pressed.a && this.shown < this.total) this.shown = this.total;
      else if (this.shown >= this.total && Input.ok()) { UI.remove(this); this.done(); }
    },
    draw(g) {
      if (!opt.clear) rect(g, 0, 0, SW, SH, opt.bg || PAL.K);
      const n = lines.length;
      let left = this.shown;
      const y0 = Math.round(SH / 2 - (n * 16) / 2);
      lines.forEach((ln, i) => {
        if (left <= 0) return;
        const s = Array.from(ln).slice(0, left).join('');
        left -= Array.from(ln).length;
        const w = Font.measure(ln);
        Font.draw(g, s, Math.round((SW - w) / 2), y0 + i * 16, opt.color || PAL.x);
      });
    },
  };
  box.total = lines.reduce((s, l) => s + Array.from(l).length, 0);
  return new Promise((res) => { box.done = res; UI.push(box); });
}
