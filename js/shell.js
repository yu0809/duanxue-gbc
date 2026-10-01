'use strict';
// ============================================================
//  Handheld shell — sizing and touch controls
// ============================================================
(function () {
  const dev = document.getElementById('device');
  const root = document.documentElement;
  const BIG = new URLSearchParams(location.search).has('big');
  if (BIG) {
    document.querySelector('.stage').style.display = 'none';
    const c = document.createElement('canvas');
    c.id = 'screen'; c.width = 160; c.height = 144;
    c.style.cssText = 'image-rendering:pixelated;width:640px;height:576px;display:block;margin:8px';
    document.body.appendChild(c);
    // rebind the global screen canvas
    window.__bigScreen = c;
    return;
  }
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    // device width: limited by viewport width (minus gutter) and height (device is 1.68x tall + hint)
    const hintH = vw < 520 ? 34 : 46;
    let w = Math.min(vw - 32, (vh - hintH - 24) / 1.68, 470);
    w = Math.max(240, w);
    // screen sits inside: device padding 7% each side, bezel padding 5% each side
    const avail = w * (1 - 0.14 - 0.1 * 0.86);
    const scale = Math.max(1, Math.floor((avail * dpr) / 160)) / dpr;
    root.style.setProperty('--dev-w', w + 'px');
    root.style.setProperty('--scr-w', 160 * scale + 'px');
    root.style.setProperty('--scr-h', 144 * scale + 'px');
    root.style.setProperty('--px', scale + 'px');
    root.style.setProperty('--grid', scale * dpr >= 3 && (typeof Settings === 'undefined' || Settings.grid) ? 1 : 0);
  }
  window.applyLayout = layout;
  window.addEventListener('resize', layout);
  layout();

  // --- buttons ---
  const press = (b, on, el) => { Input.touch[b] = on; if (on) Input.latch[b] = true; if (el) el.classList.toggle('down', on); if (on) Audio_.unlock(); };
  document.querySelectorAll('[data-btn]').forEach((el) => {
    const b = el.dataset.btn;
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); el.setPointerCapture(e.pointerId); press(b, true, el); });
    const up = (e) => { e.preventDefault(); press(b, false, el); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
  });
  // --- d-pad: direction from pointer position, slides between arms ---
  const pad = document.getElementById('dpad');
  let padId = null;
  const setDir = (d) => { for (const k of ['up', 'down', 'left', 'right']) Input.touch[k] = k === d; };
  function padMove(e) {
    const r = pad.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) { setDir(null); return; }
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }
  pad.addEventListener('pointerdown', (e) => { e.preventDefault(); padId = e.pointerId; pad.setPointerCapture(e.pointerId); padMove(e); Audio_.unlock(); });
  pad.addEventListener('pointermove', (e) => { if (e.pointerId === padId) padMove(e); });
  const padUp = () => { padId = null; setDir(null); };
  pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('lostpointercapture', padUp);

  // --- mute toggle ---
  const mute = document.getElementById('mute');
  if (mute) {
    const sync = () => { mute.textContent = Audio_.muted ? '声音：关' : '声音：开'; };
    mute.addEventListener('click', () => { Audio_.unlock(); Audio_.setMuted(!Audio_.muted); sync(); });
    sync();
  }
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // clicking anywhere gives the page keyboard focus (inside an embedded frame)
  document.addEventListener('pointerdown', () => { try { window.focus(); } catch (e) {} Audio_.unlock(); });

  // --- 掌机模式: only the screen, for devices with physical buttons (landscape handhelds, gamepads) ---
  const screenEl = document.getElementById('screen');
  const home = screenEl.parentElement;
  const solo = document.createElement('div');
  solo.className = 'solo';
  solo.hidden = true;
  solo.innerHTML = '<div class="solo-tip">长按 SELECT 切换外壳 · 点一下画面全屏</div>';
  document.body.appendChild(solo);
  let mode = 'shell', padSeen = false;
  const stored = () => { try { return localStorage.getItem('duanxue.mode'); } catch (e) { return null; } };
  function wantSolo() {
    if (/solo|screen/.test(location.search + location.hash)) return true;
    const m = stored();
    if (m) return m === 'solo';
    const landscape = window.innerWidth > window.innerHeight * 1.15;
    return landscape && (window.matchMedia('(pointer: coarse)').matches || padSeen);
  }
  function soloLayout() {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min(window.innerWidth / 160, window.innerHeight / 144);
    // whole device pixels when the screen is big enough, otherwise just fill
    const scale = fit * dpr >= 2 ? Math.floor(fit * dpr) / dpr : fit;
    root.style.setProperty('--solo-w', 160 * scale + 'px');
    root.style.setProperty('--solo-h', 144 * scale + 'px');
  }
  function setMode(m, remember) {
    if (m === mode) return;
    mode = m;
    if (remember) { try { localStorage.setItem('duanxue.mode', m); } catch (e) {} }
    const lcd = home.querySelector('.lcd');
    if (m === 'solo') {
      solo.prepend(screenEl); if (lcd) solo.prepend(lcd);
      solo.hidden = false; document.body.classList.add('solo-mode');
      solo.classList.remove('tip-gone'); setTimeout(() => solo.classList.add('tip-gone'), 4500);
      soloLayout();
    } else {
      home.prepend(screenEl); if (lcd) home.appendChild(lcd);
      solo.hidden = true; document.body.classList.remove('solo-mode');
      layout();
    }
  }
  window.addEventListener('resize', () => { if (mode === 'solo') soloLayout(); else if (!stored() && wantSolo()) setMode('solo'); });
  window.addEventListener('gamepadconnected', () => { padSeen = true; if (!stored() && wantSolo()) setMode('solo'); });
  solo.addEventListener('pointerdown', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  });
  // long-press SELECT (keyboard Shift/Backspace or the pad's Select) toggles the shell
  let selT = 0;
  setInterval(() => {
    selT = Input.held.select ? selT + 1 : 0;
    if (selT === 12) setMode(mode === 'solo' ? 'shell' : 'solo', true);
  }, 100);
  const toggle = document.getElementById('modeToggle');
  if (toggle) toggle.addEventListener('click', () => setMode(mode === 'solo' ? 'shell' : 'solo', true));
  if (wantSolo()) setMode('solo');
})();
