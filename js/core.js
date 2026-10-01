'use strict';
// ============================================================
//  断雪 · core — screen, loop, input, timing, post effects
// ============================================================
const SW = 160, SH = 144;

const screenCanvas = document.getElementById('screen');
const sctx = screenCanvas.getContext('2d', { alpha: false });
sctx.imageSmoothingEnabled = false;

// The game draws into a back buffer; post effects run when we copy it out.
const buf = document.createElement('canvas');
buf.width = SW; buf.height = SH;
const ctx = buf.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = false;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return c;
}

// ---------- small utils ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---------- input ----------
const BTN = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
const Input = {
  raw: {}, latch: {}, held: {}, prev: {}, pressed: {}, rep: {}, repT: {},
  touch: {}, pad: {},
  keymap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', KeyJ: 'a', Space: 'a', KeyX: 'b', KeyK: 'b', Escape: 'b',
    Enter: 'start', NumpadEnter: 'start', ShiftLeft: 'select', ShiftRight: 'select', Backspace: 'select',
  },
  any: false,
  update() {
    this.pollPad();
    this.any = false;
    if (!Audio_.ctx || (Audio_.ctx && Audio_.ctx.state === 'suspended')) for (const b of BTN) if (this.pad[b]) { Audio_.unlock(); break; }
    for (const b of BTN) {
      // a latched press counts for one frame even if the key was already released
      const h = !!(this.raw[b] || this.touch[b] || this.pad[b] || (this.latch[b] && !this.prev[b]));
      this.latch[b] = false;
      this.pressed[b] = h && !this.prev[b];
      if (this.pressed[b]) this.any = true;
      // key repeat for menus: fire on press, then every 5 frames after 18
      if (h) {
        this.repT[b] = (this.repT[b] || 0) + 1;
        const t = this.repT[b];
        this.rep[b] = t === 1 || (t > 18 && (t - 18) % 5 === 0);
      } else { this.repT[b] = 0; this.rep[b] = false; }
      this.prev[b] = h;
      this.held[b] = h;
    }
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    const P = this.pad;
    for (const b of BTN) P[b] = false;
    if (!p) return;
    const bt = (i) => p.buttons[i] && p.buttons[i].pressed;
    P.a = bt(0); P.b = bt(1) || bt(2); P.start = bt(9); P.select = bt(8);
    P.up = bt(12) || p.axes[1] < -0.5; P.down = bt(13) || p.axes[1] > 0.5;
    P.left = bt(14) || p.axes[0] < -0.5; P.right = bt(15) || p.axes[0] > 0.5;
  },
  // confirm/cancel helpers for UI
  ok() { return this.pressed.a || this.pressed.start; },
  cancel() { return this.pressed.b; },
  clear() { for (const b of BTN) { this.pressed[b] = false; this.rep[b] = false; } },
};
window.addEventListener('keydown', (e) => {
  const b = Input.keymap[e.code];
  if (b) { if (!e.repeat) Input.latch[b] = true; Input.raw[b] = true; e.preventDefault(); Audio_.unlock(); }
});
window.addEventListener('keyup', (e) => {
  const b = Input.keymap[e.code];
  if (b) { Input.raw[b] = false; e.preventDefault(); }
});
window.addEventListener('blur', () => { for (const b of BTN) Input.raw[b] = false; });

// ---------- tasks: frame-based awaitables ----------
const Tasks = [];
function wait(n) { return new Promise((r) => Tasks.push({ n, r })); }
function waitUntil(fn) { return new Promise((r) => Tasks.push({ fn, r })); }
function runTasks() {
  for (let i = Tasks.length - 1; i >= 0; i--) {
    const t = Tasks[i];
    if (t.fn ? t.fn() : --t.n <= 0) { Tasks.splice(i, 1); t.r(); }
  }
}
// Frame-driven coroutines (for animations that tick each frame)
const Anims = [];
function anim(fn) { // fn(frame) returns true when done
  return new Promise((r) => Anims.push({ fn, r, f: 0 }));
}
function runAnims() {
  for (let i = Anims.length - 1; i >= 0; i--) {
    const a = Anims[i];
    if (a.fn(a.f++)) { Anims.splice(i, 1); a.r(); }
  }
}

// ---------- post effects ----------
// fade: 0..4 steps toward fadeTo; tint: null | 'sepia' | 'night' | 'gray' | 'blue'
const FX = {
  fade: 0, fadeTo: 'black', tint: null, flash: 0, flashColor: 'white', invert: 0,
  shake: 0, shakeMag: 0, sig: '', cache: new Map(),
};
function fxSignature() {
  return FX.fade + FX.fadeTo + (FX.tint || '') + (FX.flash > 0 ? FX.flashColor : '') + (FX.invert > 0 ? 'i' : '');
}
const TINTS = {
  // GBC-feeling color remaps
  sepia(r, g, b) {
    const y = 0.3 * r + 0.59 * g + 0.11 * b;
    return [clamp(y * 1.07 + 18, 0, 255), clamp(y * 0.93 + 8, 0, 255), clamp(y * 0.72, 0, 255)];
  },
  memory(r, g, b) { // cold blue-white flashback
    const y = 0.3 * r + 0.59 * g + 0.11 * b;
    return [clamp(y * 0.82 + 10, 0, 255), clamp(y * 0.92 + 14, 0, 255), clamp(y * 1.02 + 34, 0, 255)];
  },
  night(r, g, b) {
    // keep warm lights bright; push everything else to deep blue
    const warm = r > 200 && g > 120 && b < 140;
    if (warm) return [r, g, b];
    const y = 0.3 * r + 0.59 * g + 0.11 * b;
    return [clamp(y * 0.38 + r * 0.08, 0, 255), clamp(y * 0.45 + g * 0.08, 0, 255), clamp(y * 0.62 + 40, 0, 255)];
  },
  dusk(r, g, b) {
    return [clamp(r * 0.95 + 20, 0, 255), clamp(g * 0.78 + 6, 0, 255), clamp(b * 0.7 + 12, 0, 255)];
  },
  gray(r, g, b) { const y = 0.3 * r + 0.59 * g + 0.11 * b; return [y, y, y]; },
  red(r, g, b) { const y = 0.3 * r + 0.59 * g + 0.11 * b; return [clamp(y * 1.2 + 30, 0, 255), y * 0.45, y * 0.45]; },
};
function fxColor(r, g, b) {
  if (FX.tint && TINTS[FX.tint]) [r, g, b] = TINTS[FX.tint](r, g, b);
  if (FX.fade > 0) {
    const t = FX.fade / 4;
    const tgt = FX.fadeTo === 'white' ? 248 : 0;
    // GBC-ish stepped fade: quantize
    r = lerp(r, tgt, t); g = lerp(g, tgt, t); b = lerp(b, tgt, t);
  }
  if (FX.flash > 0) {
    if (FX.flashColor === 'white') { r = 248 - (248 - r) * 0.25; g = 248 - (248 - g) * 0.25; b = 248 - (248 - b) * 0.25; }
    else if (FX.flashColor === 'red') { r = 248; g *= 0.4; b *= 0.4; }
    else if (FX.flashColor === 'black') { r *= 0.25; g *= 0.25; b *= 0.25; }
    else if (FX.flashColor === 'blue') { r *= 0.5; g = g * 0.6 + 60; b = 248; }
    else if (FX.flashColor === 'gold') { r = 248; g = g * 0.6 + 90; b *= 0.4; }
  }
  if (FX.invert > 0) { r = 255 - r; g = 255 - g; b = 255 - b; }
  return (r & 248) << 16 | (g & 248) << 8 | (b & 248);
}
function present() {
  const sig = fxSignature();
  const needs = FX.fade > 0 || FX.tint || FX.flash > 0 || FX.invert > 0;
  let ox = 0, oy = 0;
  if (FX.shake > 0) {
    FX.shake--;
    ox = Math.round(rnd(-FX.shakeMag, FX.shakeMag));
    oy = Math.round(rnd(-FX.shakeMag, FX.shakeMag) * 0.6);
  }
  if (needs) {
    if (sig !== FX.sig) { FX.sig = sig; FX.cache.clear(); }
    const img = ctx.getImageData(0, 0, SW, SH);
    const d = img.data;
    const cache = FX.cache;
    for (let i = 0; i < d.length; i += 4) {
      const k = d[i] << 16 | d[i + 1] << 8 | d[i + 2];
      let v = cache.get(k);
      if (v === undefined) { v = fxColor(d[i], d[i + 1], d[i + 2]); cache.set(k, v); }
      d[i] = v >> 16; d[i + 1] = (v >> 8) & 255; d[i + 2] = v & 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  if (FX.flash > 0) FX.flash--;
  if (FX.invert > 0) FX.invert--;
  const out = window.__bigScreen ? (window.__bigCtx || (window.__bigCtx = window.__bigScreen.getContext('2d'))) : sctx;
  if (ox || oy) { out.fillStyle = '#000'; out.fillRect(0, 0, SW, SH); }
  out.drawImage(buf, ox, oy);
}
function shake(frames = 12, mag = 2) { FX.shake = frames; FX.shakeMag = mag; }
function flash(color = 'white', frames = 4) { FX.flashColor = color; FX.flash = frames; }
async function fadeOut(to = 'black', speed = 4) {
  FX.fadeTo = to;
  for (let i = FX.fade + 1; i <= 4; i++) { FX.fade = i; await wait(speed); }
}
async function fadeIn(speed = 4) {
  for (let i = FX.fade - 1; i >= 0; i--) { FX.fade = i; await wait(speed); }
}

// ---------- main loop ----------
let frameCount = 0;
const Game = {
  scene: null,
  paused: false,
  setScene(s) {
    if (this.scene && this.scene.exit) this.scene.exit();
    this.scene = s;
    if (s.enter) s.enter();
  },
};
let lastT = 0, accT = 0;
const STEP = 1000 / 60;
function step() {
  Input.update();
  runTasks();
  runAnims();
  if (Game.scene && Game.scene.update) Game.scene.update();
  UI.update();
  frameCount++;
}
function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SW, SH);
  if (Game.scene && Game.scene.draw) Game.scene.draw(ctx);
  UI.draw(ctx);
  if (Game.wipe > 0) {
    // horizontal blinds closing (battle transition)
    ctx.fillStyle = '#000';
    const h = Math.ceil(Game.wipe * 8);
    for (let y = 0; y < SH; y += 8) ctx.fillRect(0, y, SW, h);
  }
  present();
}
function loop(t) {
  requestAnimationFrame(loop);
  lastRafT = performance.now();
  if (!lastT) lastT = t;
  accT += Math.min(100, t - lastT);
  lastT = t;
  let n = 0;
  while (accT >= STEP && n < 4) { step(); accT -= STEP; n++; }
  if (n) render();
}
let lastRafT = 0;
function startLoop() {
  requestAnimationFrame(loop);
  // dev builds keep ticking when the tab isn't painting (automation, hidden panes)
  if (/[?&](big|dev)/.test(location.search)) {
    setInterval(() => { if (performance.now() - lastRafT > 120) { step(); render(); } }, 16);
  }
}
