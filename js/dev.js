'use strict';
// Dev jump points (?jump=name) — only used while building/testing
const BASE_FLAGS = ['fireLit', 'delivered', 'metSuli', 'forged1'];
const DEV_JUMPS = {
  night: { map: 'town', x: 3, y: 8, flags: BASE_FLAGS.concat(['nightRaid']), sword: 1, party: [['shenmo', 1]] },
  bridge: { map: 'town', x: 14, y: 11, dir: 'down', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved']), sword: 1, party: [['shenmo', 3], ['suli', 3]] },
  ch2: { map: 'mountain1', x: 3, y: 30, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'enterBamboo']), sword: 2, party: [['shenmo', 7], ['suli', 7]], chapter: '第一章·青竹' },
  gate: { map: 'gate', x: 8, y: 14, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'enterMountain']), sword: 2, party: [['shenmo', 8], ['suli', 8]] },
  ch3: { map: 'sect', x: 12, y: 10, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'enterMountain', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'enterSect']), sword: 2, party: [['shenmo', 10], ['suli', 10], ['linfeng', 10]], chapter: '第二章·栖云' },
  cave3: { map: 'cave3', x: 7, y: 12, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'enterMountain', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'enterSect', 'seeTower', 'iceHint']), sword: 2, party: [['shenmo', 13], ['suli', 13], ['linfeng', 13]] },
  ch4: { map: 'sect', x: 12, y: 6, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'enterMountain', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'enterSect', 'seeTower', 'iceHint', 'dragonDone', 'caveDone', 'sectAttacked']), sword: 3, party: [['shenmo', 14], ['suli', 14], ['linfeng', 14]] },
  top: { map: 'tower4', x: 6, y: 3, dir: 'up', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'dragonDone', 'caveDone', 'sectAttacked', 'towerOpen', 'enterTower', 'darkFloor', 't1:open', 't3:open']), sword: 3, party: [['shenmo', 17], ['suli', 17], ['linfeng', 17]] },
  ch5: { map: 'tomb1', x: 9, y: 2, dir: 'down', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'dragonDone', 'caveDone', 'sectAttacked', 'towerOpen', 'jinDone', 'towerDone']), sword: 4, party: [['shenmo', 18], ['suli', 18], ['linfeng', 18]] },
  final: { map: 'tomb2', x: 6, y: 12, dir: 'down', flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone', 'lostSolved', 'witchDone', 'duelDone', 'xuanqingTalk', 'linfengJoined', 'dragonDone', 'caveDone', 'sectAttacked', 'towerOpen', 'jinDone', 'towerDone', 'earthDone', 'finalArt', 'readyFinal', 'huFinal']), sword: 5, party: [['shenmo', 20], ['suli', 20], ['linfeng', 20]] },
  ch1: { map: 'town', x: 14, y: 23, flags: BASE_FLAGS.concat(['nightRaid', 'suliSaved', 'wolfking', 'raidDone']), sword: 1, party: [['shenmo', 4], ['suli', 4]], chapter: '第一章·青竹' },
};
// Test helpers for automated playthroughs (debug view only)
if (/[?&](big|dev)/.test(location.search)) {
  window.go = (x, y, d) => { const p = Field.player; p.x = x; p.y = y; p.px = x * 16; p.py = y * 16; p.dir = d || p.dir; Field.resetFollowers(); };
  window.act = () => { Input.latch.a = true; };
  window.press = (d) => { Input.latch[d] = true; };
  window.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.errs = [];
  window.addEventListener('error', (e) => errs.push(e.message));
  window.addEventListener('unhandledrejection', (e) => errs.push(String((e.reason && e.reason.stack) || e.reason)));
  const _err = console.error;
  console.error = (...a) => { errs.push(a.map((x) => (x && x.stack) || String(x)).join(' ')); _err.apply(console, a); };
  // auto-advance text and pick the first battle command
  window.autoOn = () => {
    clearInterval(window.__auto);
    window.__auto = setInterval(() => {
      const top = UI.stack[UI.stack.length - 1];
      if (Battle.active && Battle.menu) { Input.latch.a = true; return; }
      if (top && !top.passive && !(top instanceof ChoiceBox) && !(top instanceof ListWin) && top.constructor.name !== 'Panel') Input.latch.a = true;
    }, 120);
  };
  if (/[?&]auto/.test(location.search)) setTimeout(() => window.autoOn(), 500);
  window.walkTo = async (path) => { for (const d of path) { press({ u: 'up', d: 'down', l: 'left', r: 'right' }[d]); await sleep(320); } };
}
// Render a whole map (or the current screen) to a PNG on disk via the dev server.
if (/[?&](big|dev)/.test(location.search)) {
  window.snapMap = async (id, scale = 2, opt = {}) => {
    const def = MAPS[id];
    Field.load(id, opt.x || 1, opt.y || 1, 'down');
    Field.player.visible = !!opt.player;
    for (const f of Field.followers) f.visible = false;
    Field.weather = null; Field.darkness = 0;
    if (opt.tint !== undefined) FX.tint = opt.tint;
    const W = Field.map.w * 16, H = Field.map.h * 16;
    const big = document.createElement('canvas'); big.width = W * scale; big.height = H * scale;
    const bg = big.getContext('2d'); bg.imageSmoothingEnabled = false;
    const snap = Field.snapCamera; Field.snapCamera = () => {};
    for (let cy = 0; cy < H; cy += 144) for (let cx = 0; cx < W; cx += 160) {
      Field.cx = Math.min(cx, Math.max(0, W - 160)); Field.cy = Math.min(cy, Math.max(0, H - 144));
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 160, 144);
      Field.draw(ctx);
      if (FX.tint) present();
      bg.drawImage(buf, 0, 0, 160, 144, Field.cx * scale, Field.cy * scale, 160 * scale, 144 * scale);
    }
    Field.snapCamera = snap;
    await fetch('/shot?name=map_' + id, { method: 'POST', body: big.toDataURL('image/png') });
    return id + ' ' + W + 'x' + H;
  };
  window.snapScreen = async (name, scale = 3) => {
    const c = document.createElement('canvas'); c.width = 160 * scale; c.height = 144 * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    render();
    g.drawImage(window.__bigScreen || screenCanvas, 0, 0, 160 * scale, 144 * scale);
    await fetch('/shot?name=' + name, { method: 'POST', body: c.toDataURL('image/png') });
    return name;
  };
}
