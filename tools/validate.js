// Node checker: tile sizes and the GBC colour budget per 8x8 cell.
// usage: node tools/validate.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const fakeCtx = new Proxy({}, { get: (t, k) => k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : k === 'getImageData' ? (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) : () => {} });
const fakeCanvas = () => ({ width: 0, height: 0, getContext: () => fakeCtx, style: {} });
const sandbox = {
  console, Math, Map, Set, Array, Object, JSON, parseInt, String, Number, Promise, Uint8ClampedArray,
  document: { createElement: fakeCanvas, getElementById: fakeCanvas, addEventListener() {} },
  window: { addEventListener() {} }, navigator: {}, requestAnimationFrame() {}, atob: (s) => Buffer.from(s, 'base64').toString('binary'),
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const files = ['core.js', 'gfx.js', 'art_chars.js', 'art_tiles.js', 'art_tiles2.js', 'art_battle.js', 'art_ui.js'];
let src = '';
for (const f of files) {
  const p = path.join(ROOT, 'js', f);
  if (fs.existsSync(p)) src += fs.readFileSync(p, 'utf8') + '\n';
}
src += '\n;globalThis.__T = typeof TILES!=="undefined"?TILES:{}; globalThis.__C = typeof CHAR_TPL!=="undefined"?CHAR_TPL:{}; globalThis.__B = typeof BATTLE_SRC!=="undefined"?BATTLE_SRC:{}; globalThis.__P = typeof PAL!=="undefined"?PAL:{}; globalThis.__CP = typeof CHAR_PAL!=="undefined"?CHAR_PAL:{};';
vm.runInContext(src, sandbox, { filename: 'art-bundle.js' });
const PAL = sandbox.__P;
let problems = 0;
const SHOW_COLORS = process.env.COLORS === '1';
function check(name, rows, opts = {}) {
  const w = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) { console.log(`${name}: row ${i} length ${r.length} != ${w}`); problems++; }
    for (const ch of r) if (ch !== '.' && ch !== ' ' && !PAL[ch] && !opts.tpl) { console.log(`${name}: unknown colour '${ch}' row ${i}`); problems++; break; }
  });
  if (opts.size && (rows.length !== opts.size || w !== opts.size)) { console.log(`${name}: size ${w}x${rows.length}`); problems++; }
  const limit = opts.limit || 6;
  for (let cy = 0; cy < rows.length; cy += 8) for (let cx = 0; cx < w; cx += 8) {
    const set = new Set();
    for (let y = cy; y < Math.min(cy + 8, rows.length); y++) for (let x = cx; x < Math.min(cx + 8, w); x++) {
      const ch = rows[y][x]; if (ch && ch !== '.') set.add(ch);
    }
    if (set.size > limit && SHOW_COLORS) console.log(`(colours) ${name}: cell ${cx / 8},${cy / 8} uses ${set.size} [${[...set].join('')}]`);
  }
}
for (const [n, t] of Object.entries(sandbox.__T)) {
  const frames = t.frames || [t.rows];
  frames.forEach((f, i) => check(`tile ${n}${frames.length > 1 ? '#' + i : ''}`, f, { size: 16, limit: t.colors || 6 }));
}
for (const [n, t] of Object.entries(sandbox.__CP)) {
  const T = sandbox.__C[t.tpl];
  for (const dir of ['down', 'up', 'left']) (T[dir] || []).forEach((rows, i) => {
    const mapped = rows.map((r) => r.replace(/./g, (c) => (t.map[c] !== undefined ? t.map[c] : c)));
    check(`char ${n}.${dir}${i}`, mapped, { size: 16, limit: 4 });
  });
}
for (const [n, b] of Object.entries(sandbox.__B)) check(`battle ${n}`, b.rows, { limit: b.limit || 4 });
console.log(problems ? `${problems} problem(s)` : 'all art OK');
