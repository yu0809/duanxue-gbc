'use strict';
// ============================================================
//  Graphics — master palette, pixel-string art, windows
// ============================================================
// Every colour sits on the GBC's 15-bit grid (multiples of 8).
const PAL = {
  K: '#181820', k: '#383848', n: '#686878', g: '#a0a0b0', w: '#d0d8e8', W: '#f8f8f8', x: '#e8f0f8',
  p: '#f8f0d8', P: '#d8c8a0', a: '#a89068',
  s: '#f8d0a8', S: '#d89870',
  t: '#c88850', T: '#885028', b: '#503020', h: '#786048',
  y: '#f8e060', o: '#f89838', r: '#d83830', R: '#902020', f: '#601818',
  m: '#f8b0c0', M: '#d86888',
  L: '#d0f0a0', l: '#98d070', G: '#489058', v: '#205040', F: '#103028',
  j: '#c8d060', J: '#789030',
  c: '#b8e8f8', C: '#70b8e8', B: '#3870c0', D: '#203878', N: '#101830',
  i: '#98a8d0', u: '#586888', U: '#303850',
  q: '#b890e0', Q: '#704898', Z: '#381850',
  e: '#e0c090', E: '#a87850', z: '#f0e0b0',
  d: '#50a0a0', A: '#286868', H: '#c0f0e8',
  O: '#f8f8b8', V: '#e85048', X: '#78a8f8', Y: '#b8a020', I: '#608038',
  '%': '#141c38', '&': '#1c2850', '=': '#283460', '+': '#8a2a20', '*': '#e0e8c0',
};
const INK = PAL.K, PAPER = PAL.p;

const ART = {};          // name -> canvas
const ART_SRC = {};      // name -> { rows, over }

// rows: array of strings, one char per pixel. '.' is transparent.
function art(rows, over) {
  const h = rows.length;
  let w = 0;
  for (const r of rows) w = Math.max(w, r.length);
  const c = makeCanvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const rgbCache = {};
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      let col = (over && over[ch]) || PAL[ch];
      if (!col) continue;
      let rgb = rgbCache[col];
      if (!rgb) rgb = rgbCache[col] = hexToRgb(col);
      const p = (y * w + x) * 4;
      img.data[p] = rgb[0]; img.data[p + 1] = rgb[1]; img.data[p + 2] = rgb[2]; img.data[p + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}
function defArt(name, rows, over) {
  ART_SRC[name] = { rows, over };
  ART[name] = art(rows, over);
  return ART[name];
}
// Re-colour an existing source with letter remaps, e.g. {G:'r'} turns green into red
function recolor(rows, map) {
  return rows.map((r) => r.replace(/./g, (ch) => (map[ch] !== undefined ? map[ch] : ch)));
}
function flipH(c) {
  const o = makeCanvas(c.width, c.height);
  const g = o.getContext('2d');
  g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return o;
}
function flipRows(rows) { return rows.map((r) => Array.from(r).reverse().join('')); }
// Silhouette in one colour (hit flashes, shadows)
const silCache = new Map();
function silhouette(c, color) {
  const key = c;
  let m = silCache.get(key);
  if (!m) { m = {}; silCache.set(key, m); }
  if (m[color]) return m[color];
  const o = makeCanvas(c.width, c.height);
  const g = o.getContext('2d');
  g.drawImage(c, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  m[color] = o;
  return o;
}

// ---------- windows ----------
// Paper-and-ink frame: outer ink rule, rounded corners, a parchment inner rule,
// and tiny vermilion corner seals.
function drawBox(g, x, y, w, h, opt = {}) {
  const fill = opt.fill || PAL.p;
  const edge = opt.edge || PAL.K;
  const inner = opt.inner || PAL.P;
  g.fillStyle = fill; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = edge;
  g.fillRect(x + 2, y, w - 4, 1); g.fillRect(x + 2, y + h - 1, w - 4, 1);
  g.fillRect(x, y + 2, 1, h - 4); g.fillRect(x + w - 1, y + 2, 1, h - 4);
  g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + w - 2, y + 1, 1, 1);
  g.fillRect(x + 1, y + h - 2, 1, 1); g.fillRect(x + w - 2, y + h - 2, 1, 1);
  if (!opt.plain) {
    g.fillStyle = inner;
    g.fillRect(x + 3, y + 2, w - 6, 1); g.fillRect(x + 3, y + h - 3, w - 6, 1);
    g.fillRect(x + 2, y + 3, 1, h - 6); g.fillRect(x + w - 3, y + 3, 1, h - 6);
    g.fillStyle = opt.seal || PAL.r;
    // corner seals (2x2 notches)
    g.fillRect(x + 2, y + 2, 2, 1); g.fillRect(x + 2, y + 2, 1, 2);
    g.fillRect(x + w - 4, y + 2, 2, 1); g.fillRect(x + w - 3, y + 2, 1, 2);
    g.fillRect(x + 2, y + h - 3, 2, 1); g.fillRect(x + 2, y + h - 4, 1, 2);
    g.fillRect(x + w - 4, y + h - 3, 2, 1); g.fillRect(x + w - 3, y + h - 4, 1, 2);
  }
}
function drawDarkBox(g, x, y, w, h) {
  drawBox(g, x, y, w, h, { fill: PAL.N, edge: PAL.K, inner: PAL.D, seal: PAL.C });
}
// Menu cursor: a small vermilion brush-tip arrow that bobs
const CURSOR = [
  'K....',
  'KrK..',
  'KrrK.',
  'KrrrK',
  'KrrK.',
  'KrK..',
  'K....',
];
let cursorArt = null;
function drawCursor(g, x, y, still) {
  if (!cursorArt) cursorArt = art(CURSOR);
  const bob = still ? 0 : (Math.floor(frameCount / 16) % 2);
  g.drawImage(cursorArt, x + bob, y);
}
// little down-arrow shown when a text page is complete
const MORE = ['KKKKK', '.KrK.', '..K..'];
let moreArt = null;
function drawMore(g, x, y) {
  if (!moreArt) moreArt = art(MORE);
  if (Math.floor(frameCount / 20) % 2) g.drawImage(moreArt, x, y + 1);
  else g.drawImage(moreArt, x, y);
}
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function drawBar(g, x, y, w, frac, col, back = PAL.P) {
  rect(g, x, y, w, 2, back);
  const fw = Math.round(clamp(frac, 0, 1) * w);
  if (fw > 0) rect(g, x, y, fw, 2, col);
}
