'use strict';
// ============================================================
//  Field — maps, walking, NPCs, events, weather
// ============================================================
const MAPS = {};
function defMap(id, def) { def.id = id; MAPS[id] = def; }
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

// ---------------- runtime map ----------------
class MapInst {
  constructor(def) {
    this.def = def;
    const rows = def.ground;
    this.h = rows.length; this.w = rows[0].length;
    this.ground = new Array(this.w * this.h);
    this.obj = new Array(this.w * this.h).fill(null);
    this.deco = [];   // free-placed images: {img, x, y, over}
    this.signs = [];  // plaques: {text, x, y}
    const leg = Object.assign({}, DEFAULT_LEGEND, def.legend || {});
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const ch = rows[y][x] || ' ';
      let t = leg[ch];
      if (t === undefined) t = def.fill || 'snow';
      if (Array.isArray(t)) t = t[hash2(x, y) % t.length];
      if (typeof t === 'object' && t !== null) { // {g, o}
        this.ground[y * this.w + x] = t.g || def.fill || 'snow';
        if (t.o) this.obj[y * this.w + x] = t.o;
      } else this.ground[y * this.w + x] = t;
    }
    if (def.build) def.build(this);
    for (const c of def.chests || []) this.put(c.x, c.y, State.opened[def.id + ':' + c.id] ? 'chest_open' : 'chest');
  }
  idx(x, y) { return y * this.w + x; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  g(x, y) { return this.inside(x, y) ? this.ground[this.idx(x, y)] : null; }
  o(x, y) { return this.inside(x, y) ? this.obj[this.idx(x, y)] : null; }
  setG(x, y, t) { if (this.inside(x, y)) this.ground[this.idx(x, y)] = t; }
  put(x, y, t) { if (this.inside(x, y)) this.obj[this.idx(x, y)] = t; }
  // place a bigTile (tree, furniture) with its top-left at x,y
  big(name, x, y) {
    const b = BIG[name];
    let k = 0;
    for (let ty = 0; ty < b.h; ty++) for (let tx = 0; tx < b.w; tx++) this.put(x + tx, y + ty, b.parts[k++]);
  }
  // Chinese house: 4 rows (ridge, eave, upper wall, lower wall)
  house(x, y, w, opt = {}) {
    const door = opt.door !== undefined ? opt.door : Math.floor(w / 2);
    const P = opt.style ? opt.style + '_' : '';
    const T = (n) => (TILES[P + n] ? P + n : n);
    for (let i = 0; i < w; i++) {
      const end = i === 0 ? '_l' : i === w - 1 ? '_r' : '_m';
      this.put(x + i, y, T('roofA' + end));
      this.put(x + i, y + 1, T('roofB' + end));
      let up = 'wallU' + end, dn = 'wallD' + end;
      if (end === '_m') {
        if (opt.windows && opt.windows.includes(i)) up = opt.round && opt.round.includes(i) ? 'window_round' : 'window';
        if (i === door && !opt.noDoor) { up = 'doorU'; dn = opt.open ? 'doorD_open' : 'doorD'; }
      }
      this.put(x + i, y + 2, T(up));
      this.put(x + i, y + 3, T(dn));
    }
    if (opt.sign) this.signs.push({ text: opt.sign, cx: (x + door) * 16 + 8, y: (y + 2) * 16 + 2 });
    if (opt.lanterns) for (const lx of opt.lanterns) this.deco.push({ tile: 'lantern_hang', x: (x + lx) * 16, y: (y + 2) * 16 - 3 });
    return { doorX: x + door, doorY: y + 3 };
  }
  solidAt(x, y) {
    if (!this.inside(x, y)) return true;
    const gt = TILES[this.g(x, y)];
    if (gt && gt.solid) return true;
    const o = this.o(x, y);
    if (o) { const ot = TILES[o]; if (ot && ot.solid) return true; }
    if (this.def.solid && this.def.solid(x, y, this)) return true;
    return false;
  }
}
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
}
const DEFAULT_LEGEND = {
  '.': ['snow', 'snow', 'snow', 'snow', 'snow2', 'snow', 'snow3', 'snow'],
  ',': 'snow4',
  '=': 'path',
  '~': 'water',
  'b': 'bridge',
  'B': 'bridge_v',
  'd': 'dirt',
  'w': 'floor_wood',
  's': 'floor_stone',
  't': 'floor_tatami',
  'X': 'void',
};

// ---------------- entities ----------------
class Actor {
  constructor(o) {
    Object.assign(this, { dir: 'down', visible: true, solid: true, speed: 1, frame: 0, anim: 0 }, o);
    this.px = this.x * 16; this.py = this.y * 16;
    this.moving = false; this.queue = [];
    this.bob = 0;
  }
  get spr() { return SPR[this.sprite]; }
  face(d) { this.dir = d; }
  update(field) {
    if (!this.moving && this.queue.length) {
      const step = this.queue.shift();
      if (step.face) { this.dir = step.face; }
      else if (step.wait) { this.waitT = step.wait; }
      else this.tryMove(field, step.dir, step.force);
    }
    if (this.waitT > 0) { this.waitT--; return; }
    if (this.moving) {
      const [dx, dy] = DIRS[this.dir];
      const sp = this.slide ? 2 : this.speed;
      this.px += dx * sp; this.py += dy * sp;
      this.anim += sp;
      if (this.px === this.x * 16 && this.py === this.y * 16) {
        this.moving = false;
        if (this.onArrive) this.onArrive();
      }
    }
  }
  tryMove(field, dir, force) {
    this.dir = dir;
    const [dx, dy] = DIRS[dir];
    const nx = this.x + dx, ny = this.y + dy;
    field.bumped = null;
    if (!force && field.blocked(nx, ny, this)) { if (field.bumped && field.onBump) field.onBump(this, field.bumped, dir); return false; }
    this.x = nx; this.y = ny; this.moving = true;
    return true;
  }
  walkFrame() {
    if (this.spr && this.spr.mon) return Math.floor((frameCount + this.x * 7) / 14) % 2;
    if (!this.moving && !this.forceAnim) return 0;
    return Math.floor(this.anim / 8) % 4;
  }
  draw(g, cx, cy) {
    if (this.tile && this.visible) { drawTile(g, this.tile, Math.round(this.px - cx), Math.round(this.py - cy)); return; }
    if (!this.visible || !this.spr) return;
    const img = this.spr[this.dir][this.walkFrame()];
    const sx = Math.round(this.px - cx), sy = Math.round(this.py - cy) - 2 - (this.lift || 0);
    if (this.alpha !== undefined && this.alpha < 1) { g.globalAlpha = this.alpha; g.drawImage(img, sx, sy); g.globalAlpha = 1; }
    else g.drawImage(img, sx, sy);
    if (this.emote) drawEmote(g, this.emote, sx, sy - 12, this.emoteT);
  }
}
// speech-bubble emotes: '!', '?', '…', '♪', 'heart', 'anger', 'sweat'
const EMOTE_ART = {};
function drawEmote(g, kind, x, y, t) {
  if (!EMOTE_ART[kind]) {
    const body = {
      '!': ['....K....', '...KrK...', '...KrK...', '...KrK...', '....K....', '...KrK...', '....K....'],
      '?': ['..KKKK...', '.KbbbbK..', '.K...bK..', '....KbK..', '...KbK...', '.........', '...KbK...'],
      '…': ['.........', '.........', '.........', '.........', '.KK.KK.KK', '.........', '.........'],
      '♪': ['....KKK..', '....KbbK.', '....K..K.', '....K....', '..KKK....', '.KbbK....', '..KK.....'],
      'heart': ['.........', '.KK...KK.', 'KrrK.KrrK', 'KrrrKrrrK', '.KrrrrrK.', '..KrrrK..', '...KrK...'],
      'anger': ['.........', '..r...r..', '...r.r...', '.........', '...r.r...', '..r...r..', '.........'],
      'sweat': ['.....K...', '....KC...', '...KCCK..', '...KCcK..', '....KK...', '.........', '.........'],
    }[kind];
    const rows = ['.KKKKKKKKKKK.', 'KWWWWWWWWWWWK'];
    for (const r of body) rows.push('KW' + r.replace(/\./g, 'W') + 'WK');
    rows.push('KWWWWWWWWWWWK', '.KKKWWKKKKKK.', '...KWK.......', '...KK........');
    EMOTE_ART[kind] = art(rows);
  }
  const pop = t !== undefined && t < 6 ? Math.round((6 - t) / 2) : 0;
  g.drawImage(EMOTE_ART[kind], x + 2, y - 2 + pop);
}

// ---------------- weather ----------------
class Snow {
  constructor(n = 34, heavy = false) {
    this.f = [];
    for (let i = 0; i < n; i++) this.f.push({ x: rnd(0, 200), y: rnd(0, 160), s: Math.random() < 0.25 ? 2 : 1, v: rnd(0.25, 0.6) * (heavy ? 1.8 : 1), ph: rnd(0, 6.28) });
    this.wind = heavy ? 0.6 : 0.15;
  }
  update() {
    for (const p of this.f) {
      p.y += p.v; p.x += Math.sin(p.ph += 0.03) * 0.25 + this.wind;
      if (p.y > 150) { p.y = -4; p.x = rnd(-20, 180); }
      if (p.x > 175) p.x -= 190;
    }
  }
  draw(g, cx, cy) {
    for (const p of this.f) {
      const x = Math.round(p.x - (cx * 0.25) % 190 + 190) % 190 - 15, y = Math.round(p.y);
      rect(g, x, y, p.s, p.s, PAL.W);
      if (p.s === 2) rect(g, x, y + 2, 2, 1, PAL.w);
    }
  }
}
class Embers {
  constructor(n = 18, col = 'o') { this.f = []; this.col = col; for (let i = 0; i < n; i++) this.f.push({ x: rnd(0, 160), y: rnd(0, 150), v: rnd(0.2, 0.5), ph: rnd(0, 6) }); }
  update() { for (const p of this.f) { p.y -= p.v; p.x += Math.sin(p.ph += 0.05) * 0.3; if (p.y < -4) { p.y = 148; p.x = rnd(0, 160); } } }
  draw(g) { for (const p of this.f) rect(g, Math.round(p.x), Math.round(p.y), 1, 1, frameCount % 20 < 10 ? PAL[this.col] : PAL.y); }
}
class Leaves {
  constructor(n = 12) { this.f = []; for (let i = 0; i < n; i++) this.f.push({ x: rnd(0, 180), y: rnd(0, 150), v: rnd(0.3, 0.7), ph: rnd(0, 6) }); }
  update() { for (const p of this.f) { p.y += p.v; p.x += Math.sin(p.ph += 0.04) * 0.6 - 0.2; if (p.y > 148) { p.y = -4; p.x = rnd(0, 180); } } }
  draw(g) { for (const p of this.f) { rect(g, Math.round(p.x), Math.round(p.y), 2, 1, PAL.j); rect(g, Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1, PAL.J); } }
}
class Motes { // drifting sparkles (ice cave, tomb)
  constructor(n = 14, a = 'c', b = 'W') { this.f = []; this.a = a; this.b = b; for (let i = 0; i < n; i++) this.f.push({ x: rnd(0, 160), y: rnd(0, 144), ph: rnd(0, 6), v: rnd(0.05, 0.2) }); }
  update() { for (const p of this.f) { p.ph += 0.05; p.y -= p.v; p.x += Math.sin(p.ph) * 0.2; if (p.y < -2) { p.y = 146; p.x = rnd(0, 160); } } }
  draw(g) { for (const p of this.f) if (Math.sin(p.ph * 2) > -0.3) rect(g, Math.round(p.x), Math.round(p.y), 1, 1, Math.sin(p.ph) > 0 ? PAL[this.a] : PAL[this.b]); }
}

// ---------------- field scene ----------------
const Field = {
  map: null, player: null, actors: [], cx: 0, cy: 0,
  locked: 0, weather: null, stepCount: 0, encT: 20,
  darkness: 0,
  enter() {},
  load(mapId, x, y, dir) {
    const def = MAPS[mapId];
    this.map = new MapInst(def);
    State.map = mapId;
    this.actors = [];
    if (!this.player) this.player = new Actor({ id: 'player', sprite: 'shenmo', x, y, dir, isPlayer: true });
    const p = this.player;
    p.x = x; p.y = y; p.px = x * 16; p.py = y * 16; p.dir = dir || p.dir; p.moving = false; p.queue = []; p.visible = true;
    p.sprite = State.leaderSprite || 'shenmo';
    this.actors.push(p);
    for (const n of def.npcs || []) {
      if (n.cond && !n.cond()) continue;
      this.actors.push(new Actor(Object.assign({}, n)));
    }
    for (const f of def.foes || []) {
      if (State.flags['foe:' + mapId + ':' + f.id]) continue;
      if (f.cond && !f.cond()) continue;
      this.actors.push(new Actor(Object.assign({ wander: false, speed: 1 }, f, { id: 'foe_' + f.id, foe: f })));
    }
    for (const b of def.blocks || []) {
      const key = 'blk:' + mapId + ':' + b.id;
      const pos = State.flags[key] || [b.x, b.y];
      this.actors.push(new Actor({ id: 'blk_' + b.id, sprite: null, tile: b.tile || 'boulder', x: pos[0], y: pos[1], push: true, key }));
    }
    // followers (party members walk behind the leader)
    this.followers = [];
    this.makeFollowers();
    this.weather = def.weather === 'snow' ? new Snow() : def.weather === 'blizzard' ? new Snow(60, true)
      : def.weather === 'embers' ? new Embers() : def.weather === 'leaves' ? new Leaves()
      : def.weather === 'motes' ? new Motes() : def.weather === 'ash' ? new Embers(16, 'g') : null;
    FX.tint = (typeof def.tint === 'function' ? def.tint() : def.tint) || null;
    this.darkness = def.dark ? (typeof def.dark === 'function' ? def.dark() : def.dark) : 0;
    this.encT = this.newEnc();
    this.snapCamera();
    if (def.music) Sound.music(typeof def.music === 'function' ? def.music() : def.music);
    if (def.onLoad) def.onLoad(this.map);
  },
  makeFollowers() {
    const p = this.player;
    const party = State.party.slice(1).concat(State.guests || []);
    this.followers = [];
    if (!State.followers) return;
    let prev = p;
    for (const id of party) {
      const f = new Actor({ id: 'f_' + id, sprite: PARTY_SPRITE[id], x: p.x, y: p.y, dir: p.dir, solid: false, follower: true });
      f.trail = [];
      this.followers.push(f);
      this.actors.push(f);
      prev = f;
    }
  },
  newEnc() { const e = this.map && this.map.def.enc; return e ? irnd(e.steps[0], e.steps[1]) : 999; },
  actor(id) { return this.actors.find((a) => a.id === id); },
  blocked(x, y, who) {
    if (this.map.solidAt(x, y)) return true;
    for (const a of this.actors) {
      if (a === who || !a.visible || !a.solid || a.follower) continue;
      if (a.x === x && a.y === y) { this.bumped = a; return true; }
      // tile an actor is walking out of stays reserved for one step
      if (a.moving) { const [dx, dy] = DIRS[a.dir]; if (a.x - dx === x && a.y - dy === y && a !== this.player) return true; }
    }
    return false;
  },
  snapCamera() {
    const p = this.player;
    const mw = this.map.w * 16, mh = this.map.h * 16;
    let cx = p.px + 8 - SW / 2, cy = p.py + 8 - SH / 2;
    cx = mw <= SW ? (mw - SW) / 2 : clamp(cx, 0, mw - SW);
    cy = mh <= SH ? (mh - SH) / 2 : clamp(cy, 0, mh - SH);
    this.cx = Math.round(cx); this.cy = Math.round(cy);
  },
  canControl() { return !this.locked && !UI.busy() && !Game.transition; },
  update() {
    if (!this.map) return;
    const p = this.player;
    if (this.canControl()) this.controlPlayer();
    for (const a of this.actors) {
      if (a.follower) continue;
      a.update(this);
      if (a.emoteT !== undefined) a.emoteT++;
      // idle NPCs glance around now and then
      if (a.talk && !a.wander && !a.noTurn && !a.counter && !a.moving && this.canControl() && Math.random() < 0.003) {
        a.baseDir = a.baseDir || a.dir;
        a.dir = Math.random() < 0.5 ? a.baseDir : pick(['up', 'down', 'left', 'right']);
      }
      if (a.wander && !a.moving && !a.queue.length && this.canControl() && Math.random() < 0.008) {
        const d = pick(['up', 'down', 'left', 'right']);
        const [dx, dy] = DIRS[d];
        const hx = a.home ? a.home[0] : a.x, hy = a.home ? a.home[1] : a.y;
        if (!a.home) a.home = [a.x, a.y];
        if (Math.abs(a.x + dx - hx) <= 2 && Math.abs(a.y + dy - hy) <= 2) a.queue.push({ dir: d });
        else a.dir = d;
      }
    }
    this.updateFollowers();
    this.updateFoes();
    if (this.weather) this.weather.update();
    this.snapCamera();
  },
  updateFoes() {
    const p = this.player;
    for (const a of this.actors) {
      if (!a.foe || a.moving || a.queue.length || !this.canControl()) continue;
      if (a.stunT > 0) { a.stunT--; continue; }
      a.thinkT = (a.thinkT || 0) - 1;
      if (a.thinkT > 0) continue;
      a.thinkT = a.foe.slow ? 26 : 14;
      const dx = p.x - a.x, dy = p.y - a.y, d = Math.abs(dx) + Math.abs(dy);
      if (d <= (a.foe.sight || 4)) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        a.tryMove(this, dir);
      } else if (Math.random() < 0.35) {
        const dir = pick(['up', 'down', 'left', 'right']);
        const [ddx, ddy] = DIRS[dir];
        const h = a.home || (a.home = [a.x, a.y]);
        if (Math.abs(a.x + ddx - h[0]) <= 2 && Math.abs(a.y + ddy - h[1]) <= 2) a.tryMove(this, dir);
      }
    }
  },
  onBump(mover, other, dir) {
    const p = this.player;
    // walking into a boulder pushes it
    if (mover === p && other.push && !this.locked) {
      const [dx, dy] = DIRS[dir];
      const bx = other.x + dx, by = other.y + dy;
      const gt = TILES[this.map.g(bx, by)];
      if (!this.blocked(bx, by, other) && !(gt && gt.noBlock)) {
        other.speed = 1; other.tryMove(this, dir, true);
        Sound.sfx('push');
        other.onArrive = () => { State.flags[other.key] = [other.x, other.y]; if (this.map.def.onPush) this.map.def.onPush(other, this.map); };
      }
      return;
    }
    const foe = mover.foe ? mover : other.foe ? other : null;
    const hitsPlayer = (mover === p && other.foe) || (mover.foe && other === p);
    if (foe && hitsPlayer && !this.fighting && !this.locked) this.foeBattle(foe);
  },
  async foeBattle(a) {
    this.fighting = true;
    await runScript(async () => {
      a.emote = '!'; a.emoteT = 0;
      await wait(16); a.emote = null;
      const r = await startBattle({ enemies: a.foe.group, bg: a.foe.bg || this.map.def.bg2 || 'snow', boss: a.foe.boss, music: a.foe.music });
      if (r === 'win') {
        State.flags['foe:' + this.map.def.id + ':' + a.foe.id] = true;
        removeActor(a.id);
        if (a.foe.after) await a.foe.after();
      } else { a.stunT = 120; }
    });
    this.fighting = false;
  },
  updateFollowers() {
    const p = this.player;
    let lead = p;
    for (const f of this.followers) {
      // keep a breadcrumb of the leader's pixel positions; trail 16px behind
      lead.crumbs = lead.crumbs || [];
      const last = lead.crumbs[lead.crumbs.length - 1];
      if (!last || last.x !== lead.px || last.y !== lead.py) lead.crumbs.push({ x: lead.px, y: lead.py, d: lead.dir });
      if (lead.crumbs.length > 40) lead.crumbs.shift();
      const target = lead.crumbs.length > 16 ? lead.crumbs[lead.crumbs.length - 17] : null;
      if (target && (f.px !== target.x || f.py !== target.y)) {
        if (target.x !== f.px || target.y !== f.py) {
          const dx = Math.sign(target.x - f.px), dy = Math.sign(target.y - f.py);
          f.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : f.dir;
        }
        f.px = target.x; f.py = target.y; f.forceAnim = true; f.anim++;
      } else { f.forceAnim = lead.moving; if (lead.moving) f.anim++; }
      f.x = Math.round(f.px / 16); f.y = Math.round(f.py / 16);
      f.visible = State.followers && p.visible;
      lead = f;
    }
  },
  resetFollowers() {
    const p = this.player;
    p.crumbs = [];
    for (const f of this.followers) { f.px = p.px; f.py = p.py; f.x = p.x; f.y = p.y; f.dir = p.dir; f.crumbs = []; }
  },
  controlPlayer() {
    const p = this.player;
    if (p.moving || p.queue.length) return;
    if (Input.pressed.start) { Sound.sfx('menu'); openMainMenu(); return; }
    if (Input.pressed.a) { this.interact(); return; }
    let d = null;
    for (const k of ['up', 'down', 'left', 'right']) if (Input.held[k]) { d = k; if (Input.pressed[k]) break; }
    if (!d) { p.turnT = 0; return; }
    if (d !== p.dir && Input.pressed[d] && !p.justMoved) { p.dir = d; p.turnT = 5; return; }
    if (p.turnT > 0) { p.turnT--; return; }
    p.speed = Input.held.b ? 2 : 1;
    p.controlled = true;
    if (p.tryMove(this, d)) {
      p.justMoved = true;
      p.onArrive = () => this.arrived();
    } else {
      p.justMoved = false;
      if (Input.pressed[d] || frameCount % 18 === 0) Sound.sfx('bump');
    }
  },
  async arrived() {
    const p = this.player;
    const m = this.map;
    if (!p.controlled) return; // scripted walks never fire step events
    // ice: keep sliding
    const gt = TILES[m.g(p.x, p.y)];
    if (gt && gt.ice) {
      const [dx, dy] = DIRS[p.dir];
      if (!this.blocked(p.x + dx, p.y + dy, p)) { p.slide = true; p.tryMove(this, p.dir); return; }
    }
    p.slide = false;
    // events under foot
    for (const ev of m.def.events || []) {
      if (ev.type === 'check') continue;
      if (!hit(ev, p.x, p.y)) continue;
      if (ev.cond && !ev.cond()) continue;
      if (ev.dir && ev.dir !== p.dir) continue;
      if (ev.type === 'warp') { await this.warp(ev.to, ev.tx, ev.ty, ev.face || p.dir, ev.sound); return; }
      if (ev.run) { await runScript(ev.run); return; }
    }
    // random encounters
    if (m.def.enc && !State.flags.noEnc && !(State.repel > 0 && (State.repel--, true))) {
      if (!m.def.enc.zone || m.def.enc.zone(p.x, p.y)) {
        if (--this.encT <= 0) {
          this.encT = this.newEnc();
          const grp = pickEncounter(m.def.enc);
          if (grp) await runScript(() => fieldBattle(grp));
        }
      }
    }
    if (!Input.held.up && !Input.held.down && !Input.held.left && !Input.held.right) p.justMoved = false;
  },
  async interact() {
    const p = this.player;
    const [dx, dy] = DIRS[p.dir];
    const tx = p.x + dx, ty = p.y + dy;
    const a = this.actors.find((n) => n !== p && !n.follower && n.visible && n.x === tx && n.y === ty);
    if (a && a.talk) {
      if (!a.noTurn) a.dir = OPP[p.dir];
      await runScript(a.talk, a);
      return;
    }
    for (const c of this.map.def.chests || []) {
      if (c.x === tx && c.y === ty) { await runScript(() => openChest(c)); return; }
    }
    // check events (also reach across counters)
    for (const ev of this.map.def.events || []) {
      if (ev.type !== 'check') continue;
      if (ev.cond && !ev.cond()) continue;
      if (hit(ev, tx, ty) || (ev.far && hit(ev, tx + dx, ty + dy))) { await runScript(ev.run); return; }
    }
    // talk across a counter
    const b = this.actors.find((n) => n !== p && n.visible && n.x === tx + dx && n.y === ty + dy && n.counter);
    if (b && b.talk) { b.dir = OPP[p.dir]; await runScript(b.talk, b); }
  },
  async warp(to, x, y, dir, sound = 'door') {
    Sound.sfx(sound);
    this.locked++;
    await fadeOut('black', 3);
    this.load(to, x, y, dir);
    this.resetFollowers();
    this.draw(ctx);
    await fadeIn(3);
    this.locked--;
    const def = MAPS[to];
    if (def.title && State.lastTitle !== def.title) { State.lastTitle = def.title; areaCard(def.title); }
    if (def.onEnter) await runScript(def.onEnter);
  },
  draw(g) {
    const m = this.map;
    if (!m) return;
    const cx = this.cx, cy = this.cy;
    const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
    const fr = Math.floor(frameCount / 32) % 2;
    if (m.def.bg) rect(g, 0, 0, SW, SH, PAL[m.def.bg]);
    // ground
    for (let ty = y0; ty <= y0 + 9; ty++) for (let tx = x0; tx <= x0 + 10; tx++) {
      const name = m.g(tx, ty);
      if (!name) continue;
      const t = TILES[name];
      let img;
      if (t && t.water) {
        const mask = waterMask(m, tx, ty, name);
        img = autoTile(name, mask)[t.anim ? fr : 0];
      } else if (t && t.wall) {
        const below = TILES[m.g(tx, ty + 1)];
        const face = !below || !below.wall ? (below ? 1 : 0) : 0;
        img = TILE_FR[t.wall + (face ? '_face' : '_top')][0];
        g.drawImage(img, tx * 16 - cx, ty * 16 - cy);
        if (!face) { // light rim where the wall top meets open floor
          const open = (xx, yy) => { const n = TILES[m.g(xx, yy)]; return n && !n.wall; };
          const rim = PAL[t.rim || 'n'];
          if (open(tx, ty - 1)) rect(g, tx * 16 - cx, ty * 16 - cy, 16, 1, rim);
          if (open(tx - 1, ty)) rect(g, tx * 16 - cx, ty * 16 - cy, 1, 16, rim);
          if (open(tx + 1, ty)) rect(g, tx * 16 - cx + 15, ty * 16 - cy, 1, 16, rim);
        }
        continue;
      } else img = (TILE_FR[name] || TILE_FR.void)[TILE_FR[name] && TILE_FR[name].length > 1 ? fr : 0];
      g.drawImage(img, tx * 16 - cx, ty * 16 - cy);
      if (t && t.edge) {
        const imgs = edgeImgs(t.edge);
        const same = (xx, yy) => { const n = m.g(xx, yy); if (!n) return true; const tt = TILES[n]; return !tt || tt.edge || !tt.soft; };
        if (!same(tx, ty - 1)) g.drawImage(imgs[0], tx * 16 - cx, ty * 16 - cy);
        if (!same(tx + 1, ty)) g.drawImage(imgs[1], tx * 16 - cx, ty * 16 - cy);
        if (!same(tx, ty + 1)) g.drawImage(imgs[2], tx * 16 - cx, ty * 16 - cy);
        if (!same(tx - 1, ty)) g.drawImage(imgs[3], tx * 16 - cx, ty * 16 - cy);
      }
    }
    // under-objects
    const overs = [];
    for (let ty = y0; ty <= y0 + 9; ty++) for (let tx = x0; tx <= x0 + 10; tx++) {
      const o = m.o(tx, ty);
      if (!o) continue;
      if (TILES[o] && TILES[o].over) { overs.push([o, tx, ty]); continue; }
      drawTile(g, o, tx * 16 - cx, ty * 16 - cy);
    }
    for (const d of m.deco) if (!d.over) drawTile(g, d.tile, d.x - cx, d.y - cy, d.img);
    for (const s of m.signs) drawPlaque(g, s.text, s.cx - cx, s.y - cy);
    if (m.def.drawUnder) m.def.drawUnder(g, cx, cy, m);
    // actors sorted by y
    const list = this.actors.filter((a) => a.visible).sort((a, b) => a.py - b.py || (a.follower ? -1 : 1));
    for (const a of list) a.draw(g, cx, cy);
    for (const [o, tx, ty] of overs) drawTile(g, o, tx * 16 - cx, ty * 16 - cy);
    for (const d of m.deco) if (d.over) drawTile(g, d.tile, d.x - cx, d.y - cy, d.img);
    if (m.def.drawOver) m.def.drawOver(g, cx, cy, m);
    drawShards(g, cx, cy);
    if (this.darkness) drawDarkness(g, this.player.px - cx + 8, this.player.py - cy + 6, this.darkness);
    if (this.weather) this.weather.draw(g, cx, cy);
  },
};
function hit(ev, x, y) {
  const w = ev.w || 1, h = ev.h || 1;
  return x >= ev.x && x < ev.x + w && y >= ev.y && y < ev.y + h;
}
function waterMask(m, x, y, name) {
  const isW = (xx, yy) => { const t = TILES[m.g(xx, yy)]; return !m.inside(xx, yy) || (t && t.water) || (t && t.bridgeOver); };
  let mask = 0;
  if (!isW(x, y - 1)) mask |= 1;
  if (!isW(x + 1, y)) mask |= 2;
  if (!isW(x, y + 1)) mask |= 4;
  if (!isW(x - 1, y)) mask |= 8;
  return mask;
}
function drawTile(g, name, x, y, img) {
  if (img) { g.drawImage(img, x, y); return; }
  const fr = TILE_FR[name];
  if (!fr) return;
  const f = fr.length > 1 ? Math.floor(frameCount / (TILES[name].animSpeed || 16)) % fr.length : 0;
  g.drawImage(fr[f], x, y);
}
// carved wooden plaque with gilt characters
function drawPlaque(g, text, cx, y) {
  const w = Font.measure(text) + 8;
  const x = Math.round(cx - w / 2);
  rect(g, x, y, w, 14, PAL.K);
  rect(g, x + 1, y + 1, w - 2, 12, PAL.b);
  rect(g, x + 1, y + 1, w - 2, 1, PAL.T);
  Font.draw(g, text, x + 4, y + 1, PAL.y);
}
// light radius for dark floors: dithered GBC-style
function drawDarkness(g, px, py, r) {
  const img = g.getImageData(0, 0, SW, SH);
  const d = img.data;
  const r2 = r * r, r3 = (r + 10) * (r + 10);
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const dx = x - px, dy = y - py, dd = dx * dx + dy * dy;
    if (dd < r2) continue;
    const i = (y * SW + x) * 4;
    if (dd < r3 && ((x + y) & 1)) { d[i] >>= 2; d[i + 1] >>= 2; d[i + 2] = (d[i + 2] >> 2) + 16; continue; }
    d[i] = 8; d[i + 1] = 8; d[i + 2] = 16;
  }
  g.putImageData(img, 0, 0);
}

// ---------------- scripting ----------------
let scriptDepth = 0;
async function runScript(fn, arg) {
  Field.locked++;
  scriptDepth++;
  try { await fn(arg); }
  catch (e) { if (e !== ABORT) console.error(e); }
  finally { Field.locked--; scriptDepth--; }
}
// move an actor along a path string like 'uull' or array of dirs
function walk(id, path, opt = {}) {
  const a = typeof id === 'string' ? (id === 'player' ? Field.player : Field.actor(id)) : id;
  if (!a) return Promise.resolve();
  const map = { u: 'up', d: 'down', l: 'left', r: 'right' };
  if (a.isPlayer) a.controlled = false;
  for (const ch of path) {
    if (map[ch]) a.queue.push({ dir: map[ch], force: opt.force !== false });
    else if (ch === '.') a.queue.push({ wait: 8 });
    else if (ch === 'U' || ch === 'D' || ch === 'L' || ch === 'R') a.queue.push({ face: map[ch.toLowerCase()] });
  }
  if (opt.speed) a.speed = opt.speed;
  if (opt.nowait) return Promise.resolve();
  return waitUntil(() => !a.moving && !a.queue.length).then(() => { if (opt.speed) a.speed = 1; });
}
function faceTo(id, dir) { const a = id === 'player' ? Field.player : Field.actor(id); if (a) a.dir = dir; }
function lookAt(id, otherId) {
  const a = id === 'player' ? Field.player : Field.actor(id);
  const b = otherId === 'player' ? Field.player : Field.actor(otherId);
  if (!a || !b) return;
  const dx = b.x - a.x, dy = b.y - a.y;
  a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
}
async function emote(id, kind, t = 40) {
  const a = id === 'player' ? Field.player : Field.actor(id);
  if (!a) return;
  a.emote = kind; a.emoteT = 0;
  Sound.sfx(kind === '!' ? 'surprise' : 'blip');
  await wait(t);
  a.emote = null;
}
function addActor(o) { const a = new Actor(o); Field.actors.push(a); return a; }
function removeActor(id) { const i = Field.actors.findIndex((a) => a.id === id); if (i >= 0) Field.actors.splice(i, 1); }
async function camPan(tx, ty, frames = 40) {
  // temporarily detach camera from the player
  const sx = Field.cx, sy = Field.cy;
  const snap = Field.snapCamera;
  const ex = clamp(tx * 16 + 8 - SW / 2, 0, Field.map.w * 16 - SW), ey = clamp(ty * 16 + 8 - SH / 2, 0, Field.map.h * 16 - SH);
  Field.snapCamera = () => {};
  for (let i = 1; i <= frames; i++) {
    const t = i / frames, e = t * t * (3 - 2 * t);
    Field.cx = Math.round(lerp(sx, ex, e)); Field.cy = Math.round(lerp(sy, ey, e));
    await wait(1);
  }
  return () => { Field.snapCamera = snap; };
}
