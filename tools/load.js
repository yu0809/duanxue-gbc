// Loads the game's scripts into a Node VM with canvas/DOM stand-ins.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const files = [...html.matchAll(/src="js\/([^"?]+)/g)].map((m) => m[1]).filter((f) => !['shell.js', 'main.js'].includes(f));
const fakeCtx = new Proxy({}, { get: (t, k) => (k === 'createImageData' || k === 'getImageData') ? (a, b, w, h) => ({ data: new Uint8ClampedArray((w || a) * (h || b) * 4) }) : k === 'createPeriodicWave' ? () => ({}) : () => ({}) });
const fakeCanvas = () => ({ width: 160, height: 144, getContext: () => fakeCtx, style: {} });
const sandbox = {
  console, Math, Map, Set, Array, Object, JSON, parseInt, String, Number, Promise, Uint8ClampedArray, Error, setTimeout, clearTimeout, setInterval() {}, performance: { now: () => 0 },
  document: { createElement: fakeCanvas, getElementById: fakeCanvas, addEventListener() {}, querySelectorAll: () => [], documentElement: { style: { setProperty() {} } } },
  window: { addEventListener() {}, innerWidth: 800, innerHeight: 600 }, navigator: {}, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} },
  requestAnimationFrame() {}, atob: (s) => Buffer.from(s, 'base64').toString('binary'),
};
sandbox.globalThis = sandbox; sandbox.window = Object.assign(sandbox.window, sandbox);
vm.createContext(sandbox);
let src = files.map((f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')).join('\n;\n');
src += '\n;globalThis.__M = MAPS; globalThis.__T = TILES; globalThis.__S = SPR; buildCharSprites(); globalThis.__I = ITEMS; globalThis.__E = ENEMIES; globalThis.__BIG = BIG; State = freshState(); initParty(); globalThis.__MI = MapInst; globalThis.__SET = (s) => { State = s; }; globalThis.__ST = () => State;';
vm.runInContext(src, sandbox, { filename: 'bundle.js' });
module.exports = sandbox;
