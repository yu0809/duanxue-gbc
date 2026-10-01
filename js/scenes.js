'use strict';
// ============================================================
//  Title, prologue, chapter cards, game over, ending
// ============================================================
const ABORT = { abort: true };
const SWORD_IN_SNOW = [
  '....KKK....',
  '...KyOyK...',
  '...KyyyK...',
  '....KbK....',
  '....KRK....',
  '....KbK....',
  '....KRK....',
  '....KbK....',
  '....KRK....',
  '.KKKKyKKKK.',
  'KyyYyOyYyyK',
  '.KKKKyKKKK.',
  '....KWK....',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
  '...KWWiK...',
];
let swordArt = null;
function drawNightSky(g, t, opt = {}) {
  const bands = opt.bands || ['N', 'N', '%', '%', '&', '&', '=', 'U'];
  bands.forEach((c, i) => rect(g, 0, Math.floor((i * 104) / bands.length), SW, Math.ceil(104 / bands.length) + 1, PAL[c]));
  // dithered seams between bands
  for (let i = 1; i < bands.length; i++) {
    const y = Math.floor((i * 104) / bands.length);
    for (let x = 0; x < SW; x += 2) rect(g, x + (i % 2), y - 1, 1, 1, PAL[bands[i]]);
  }
  const R = mulberry(7);
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(R() * SW), y = Math.floor(R() * 70), ph = R() * 6;
    if (Math.sin(t / 30 + ph) > -0.4) rect(g, x, y, 1, 1, Math.sin(t / 20 + ph) > 0.6 ? PAL.W : PAL.i);
  }
}
function drawRidges(g, layers) {
  for (const [base, amp, freq, col, seed, snow] of layers) {
    const r = mulberry(seed);
    const ph = r() * 10, ph2 = r() * 10;
    for (let x = 0; x < SW; x++) {
      const top = Math.round(base - (Math.sin(x * freq + ph) * amp + Math.sin(x * freq * 2.3 + ph2) * amp * 0.45 + amp * 0.3));
      rect(g, x, top, 1, SH - top, PAL[col]);
      if (snow) rect(g, x, top, 1, 1, PAL[snow]);
    }
  }
}

const TitleScene = {
  t: 0, phase: 'press', menuI: 0, snow: null,
  enter() {
    this.t = 0; this.phase = 'press'; this.menuI = hasAnySave() ? 1 : 0;
    this.snow = new Snow(40);
    FX.tint = null; FX.fade = 4; FX.fadeTo = 'black';
    Sound.music('title');
    fadeIn(8);
  },
  update() {
    this.t++;
    this.snow.update();
    if (UI.busy() || this.busy) return;
    if (this.phase === 'press') {
      if (this.t > 30 && (Input.ok() || Input.pressed.start)) { Sound.sfx('ok'); this.phase = 'menu'; }
      return;
    }
    if (this.phase === 'menu') {
      const n = 2;
      if (Input.rep.up || Input.rep.down) { this.menuI = (this.menuI + 1) % n; Sound.sfx('cursor'); }
      if (Input.ok()) {
        if (this.menuI === 0) { Sound.sfx('ok'); this.newGame(); }
        else if (!hasAnySave()) Sound.sfx('bump');
        else { Sound.sfx('ok'); this.continueGame(); }
      }
      if (Input.cancel()) { this.phase = 'press'; Sound.sfx('cancel'); }
    }
  },
  async newGame() {
    this.busy = true;
    Music.fadeOut();
    await fadeOut('black', 8);
    State = freshState();
    initParty();
    Field.player = null;
    this.busy = false;
    await playPrologue();
  },
  async continueGame() {
    this.busy = true;
    const d = await saveScreen(false);
    if (!d) { this.busy = false; return; }
    Music.fadeOut();
    await fadeOut('black', 6);
    loadState(d);
    this.busy = false;
    await fadeIn(6);
  },
  draw(g) {
    const t = this.t;
    drawNightSky(g, t);
    // moon behind thin cloud
    const mx = 126, my = 22;
    g.fillStyle = PAL.O; g.beginPath(); g.arc(mx, my, 9, 0, Math.PI * 2); g.fill();
    rect(g, mx - 4, my - 5, 3, 2, PAL.W); rect(g, mx - 6, my - 2, 2, 3, PAL.W);
    rect(g, mx - 18, my + 3, 30, 2, PAL.u); rect(g, mx - 8, my + 5, 26, 1, PAL.u);
    drawRidges(g, [[92, 12, 0.035, 'u', 5, 'g'], [104, 9, 0.06, 'U', 9, 'n'], [114, 6, 0.09, 'N', 13, null]]);
    // snowfield
    rect(g, 0, 114, SW, 30, PAL.w);
    for (let y = 114; y < 118; y++) for (let x = (y % 2); x < SW; x += 2) rect(g, x, y, 1, 1, PAL.i);
    rect(g, 0, 118, SW, 26, PAL.x);
    // snow mound + sword
    g.fillStyle = PAL.W; g.beginPath(); g.ellipse(80, 122, 22, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = PAL.w; g.fillRect(60, 122, 40, 2);
    if (!swordArt) swordArt = art(SWORD_IN_SNOW);
    const glow = Math.sin(t / 24) * 0.5 + 0.5;
    if (glow > 0.55) for (let i = 0; i < 6; i++) rect(g, 80 + Math.round(Math.sin(t / 10 + i) * 8), 100 + i * 3, 1, 1, PAL.c);
    g.drawImage(swordArt, 75, 98);
    g.fillStyle = PAL.W; g.beginPath(); g.ellipse(80, 120, 9, 2, 0, 0, Math.PI * 2); g.fill();
    // title
    const title = brushImg('title', 'W', 'K', 'D');
    const tx = Math.round(SW / 2 - title.width / 2) - 6, ty = 14;
    g.drawImage(title, tx, ty);
    // vermilion seal 「剑灵」
    const sx = tx + title.width + 2, sy = ty + 12;
    rect(g, sx, sy, 16, 30, PAL.r); rect(g, sx + 1, sy + 1, 14, 28, PAL.R); rect(g, sx + 2, sy + 2, 12, 26, PAL.r);
    Font.draw(g, '剑', sx + 2, sy + 3, PAL.p); Font.draw(g, '灵', sx + 2, sy + 15, PAL.p);
    // subtitle
    Font.drawCenter(g, '— 剑与雪的轮回 —', 80, 56, PAL.i, null);
    let cleared = null;
    try { cleared = localStorage.getItem('duanxue.cleared'); } catch (e) {}
    if (cleared) {
      // a small plum sprig once the story has been finished (a pink one for the spring ending)
      const pink = cleared === 'true';
      for (const [px, py] of [[16, 70], [20, 66], [24, 69], [14, 74], [27, 64]]) { rect(g, px, py, 2, 2, PAL[pink ? 'm' : 'W']); rect(g, px + 1, py + 1, 1, 1, PAL[pink ? 'M' : 'w']); }
      rect(g, 12, 72, 16, 1, PAL.b); rect(g, 18, 67, 1, 6, PAL.b);
    }
    this.snow.draw(g, 0, 0);
    // prompt / menu
    if (this.phase === 'press') {
      if (Math.floor(t / 30) % 2 === 0) Font.drawOutlined(g, '按 START 开始', 41, 126, PAL.W, PAL.D);
    } else {
      const items = ['新的旅程', hasAnySave() ? '继续旅程' : '继续旅程'];
      items.forEach((s, i) => {
        const col = i === 1 && !hasAnySave() ? PAL.g : PAL.W;
        Font.drawOutlined(g, s, 56, 112 + i * 15, col, PAL.D);
      });
      drawCursor(g, 46, 114 + this.menuI * 15);
    }
  },
};

async function playPrologue() {
  Game.setScene({ draw(g) { rect(g, 0, 0, SW, SH, PAL.K); }, update() {} });
  FX.fade = 0;
  const snow = new Snow(26);
  const bg = { t: 0, update() { this.t++; snow.update(); }, draw(g) { rect(g, 0, 0, SW, SH, PAL.K); snow.draw(g, 0, 0); } };
  Game.setScene(bg);
  Sound.music('memory');
  await wait(40);
  await narrate(['三百年前，', '有一位剑仙，', '以一柄剑，镇住了魔。'], { clear: true });
  await narrate(['后来，剑断了。'], { clear: true });
  await narrate(['再后来，', '就没有人记得了。'], { clear: true });
  await wait(30);
  Music.fadeOut();
  await chapterCard('序章', '雪夜');
  await startChapterPrologue();
}

// Paper card with a brush title
async function chapterCard(label, brushKey, sub) {
  State.chapter = label + '·' + (brushKey === '雪夜' ? '雪夜' : brushKey);
  const card = {
    t: 0,
    update() { this.t++; },
    draw(g) {
      rect(g, 0, 0, SW, SH, PAL.p);
      // faint paper fibres
      const R = mulberry(3);
      for (let i = 0; i < 70; i++) rect(g, Math.floor(R() * SW), Math.floor(R() * SH), 2, 1, PAL.z);
      const img = brushImg(brushKey, 'K', null, null);
      const x = Math.round(SW / 2 - img.width / 2), y = 54;
      Font.drawCenter(g, label, 80, 34, PAL.R);
      rect(g, 50, 48, 60, 1, PAL.P);
      g.drawImage(img, x, y);
      rect(g, 50, y + img.height + 6, 60, 1, PAL.P);
      // small seal
      rect(g, x + img.width + 3, y + img.height - 12, 10, 10, PAL.r);
      Font.draw(g, '·', x + img.width + 3, y + img.height - 13, PAL.p);
      if (sub) Font.drawCenter(g, sub, 80, y + img.height + 12, PAL.n);
    },
  };
  const prev = Game.scene;
  Game.setScene(card);
  await fadeIn(6);
  await waitUntil(() => card.t > 150 || (card.t > 30 && Input.ok()));
  await fadeOut('black', 6);
  Game.setScene(prev);
}

// ---------------- game over ----------------
async function gameOver() {
  Sound.jingle('gameover');
  const scene = {
    t: 0, i: 0, done: null,
    update() {
      this.t++;
      if (this.t < 60) return;
      if (Input.rep.up) { this.i = (this.i + 2) % 3; Sound.sfx('cursor'); }
      if (Input.rep.down) { this.i = (this.i + 1) % 3; Sound.sfx('cursor'); }
      if (Input.ok()) { Sound.sfx('ok'); this.done(this.i); }
    },
    draw(g) {
      rect(g, 0, 0, SW, SH, PAL.K);
      const snow = this.snow || (this.snow = new Snow(20));
      snow.update(); snow.draw(g, 0, 0);
      Font.drawCenter(g, '胜败乃兵家常事', 80, 40, PAL.w);
      Font.drawCenter(g, '少侠请重新来过。', 80, 56, PAL.n);
      if (this.t >= 60) {
        ['重新挑战', '读取存档', '回到标题'].forEach((s, k) => Font.draw(g, s, 58, 86 + k * 15, PAL.W));
        drawCursor(g, 48, 88 + this.i * 15);
      }
    },
  };
  FX.tint = null;
  Game.setScene(scene);
  await fadeIn(8);
  return new Promise((res) => { scene.done = res; });
}

// ---------------- battle wrapper with retry ----------------
startBattle = async function (cfg) {
  for (;;) {
    const snap = JSON.parse(JSON.stringify(State));
    const fieldTint = FX.tint;
    const r = await battleOnce(cfg);
    if (r !== 'lose' || cfg.loseOk) return r;
    const choice = await gameOver();
    await fadeOut('black', 4);
    if (choice === 0) { // retry the same battle from the moment before it began
      State = snap;
      healParty();
      Game.setScene(Field);
      FX.tint = fieldTint;
      continue;
    }
    if (choice === 1) {
      Game.setScene(TitleScene);
      const d = await saveScreen(false);
      if (d) { loadState(d); await fadeIn(6); throw ABORT; }
      Game.setScene(TitleScene); TitleScene.enter(); throw ABORT;
    }
    Game.setScene(TitleScene); TitleScene.enter();
    throw ABORT;
  }
};
async function battleOnce(cfg) {
  Sound.sfx('encounter');
  for (let i = 0; i < 3; i++) { FX.invert = 3; await wait(8); }
  await anim((f) => { Game.wipe = f / 20; return f >= 20; });
  const tint = FX.tint;
  FX.tint = null;
  FX.fade = 4; FX.fadeTo = 'black';
  Game.wipe = 0;
  const r = await Battle.start(cfg);
  FX.tint = tint;
  if (r === 'lose' && !cfg.loseOk) return 'lose';
  if (Game.scene === Field && Field.map) {
    Field.draw(ctx);
    const m = Field.map.def.music;
    if (!cfg.keepMusic) Sound.music(typeof m === 'function' ? m() : m);
  }
  if (!cfg.noFadeIn) await fadeIn(3);
  return r;
}
