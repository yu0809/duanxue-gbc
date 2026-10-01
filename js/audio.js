'use strict';
// ============================================================
//  Chiptune engine — 2 pulse, 1 wave, 1 noise, like the GBC APU
//  Songs are written in a small MML dialect (see music.js)
// ============================================================
const Audio_ = {
  ctx: null, master: null, musicGain: null, sfxGain: null,
  muted: false, waves: {}, noise: {},
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.55;
    // gentle low-pass takes the fizz off the square waves, like the small speaker
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200; lp.Q.value = 0.3;
    this.master.connect(lp); lp.connect(c.destination);
    this.musicGain = c.createGain(); this.musicGain.gain.value = 0.85; this.musicGain.connect(this.master);
    this.sfxGain = c.createGain(); this.sfxGain.gain.value = 0.9; this.sfxGain.connect(this.master);
    for (const [k, duty] of Object.entries({ 0: 0.125, 1: 0.25, 2: 0.5, 3: 0.75 })) this.waves['p' + k] = pulseWave(c, duty);
    for (const [k, s] of Object.entries(WAVE_SHAPES)) this.waves['w' + k] = sampleWave(c, s);
    this.noise.long = noiseBuffer(c, false);
    this.noise.short = noiseBuffer(c, true);
    try { const saved = localStorage.getItem('duanxue.muted'); if (saved === '1') this.setMuted(true); } catch (e) {}
    Music.onUnlock();
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.02);
    try { localStorage.setItem('duanxue.muted', m ? '1' : '0'); } catch (e) {}
  },
};
function pulseWave(c, duty) {
  const n = 64, re = new Float32Array(n), im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * (k < 40 ? 1 : 0.5);
  // use cos terms for a proper pulse: a_k = 2/(k pi) sin(k pi d)
  for (let k = 1; k < n; k++) { re[k] = im[k]; im[k] = 0; }
  return c.createPeriodicWave(re, im, { disableNormalization: false });
}
// 32-step 4-bit wave RAM shapes
const WAVE_SHAPES = {
  0: [8, 10, 12, 13, 14, 15, 15, 15, 14, 13, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0, 0, 1, 2, 3, 4, 6, 7, 8, 8, 8, 8, 8], // soft flute
  1: [0, 2, 4, 6, 8, 10, 12, 14, 15, 15, 14, 12, 10, 8, 6, 4, 2, 0, 1, 3, 5, 7, 9, 11, 13, 15, 13, 11, 9, 7, 5, 3], // bright
  2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0], // triangle bass
  3: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // reedy
};
function sampleWave(c, s) {
  const N = s.length, H = 16;
  const re = new Float32Array(H), im = new Float32Array(H);
  for (let k = 1; k < H; k++) {
    let a = 0, b = 0;
    for (let n = 0; n < N; n++) { const v = s[n] / 7.5 - 1; a += v * Math.cos((2 * Math.PI * k * n) / N); b += v * Math.sin((2 * Math.PI * k * n) / N); }
    re[k] = a / N; im[k] = b / N;
  }
  return c.createPeriodicWave(re, im);
}
function noiseBuffer(c, short) {
  const len = c.sampleRate; // one second
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let lfsr = 0x7fff;
  const rate = short ? 8 : 2; // hold each lfsr value for a few samples
  let v = 0;
  for (let i = 0; i < len; i++) {
    if (i % rate === 0) {
      const bit = (lfsr ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      if (short) lfsr = (lfsr & ~0x40) | (bit << 6);
      v = lfsr & 1 ? 1 : -1;
    }
    d[i] = v;
  }
  return b;
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------- MML ----------------
// t tempo · o octave · < > · l length · v vol(0-15) · @ duty/wave · E env(0 hold,1 pluck,2 soft,3 swell)
// q gate(1-8) · ~ vibrato(0/1) · notes cdefgab +/- · r rest · & tie · [..]n repeat · L loop point
// noise track: k kick, s snare, h hat, H open hat, c crash
function expandLoops(s) {
  let prev;
  do { prev = s; s = s.replace(/\[([^\[\]]*)\](\d*)/g, (m, body, n) => body.repeat(n ? +n : 2)); } while (s !== prev);
  return s;
}
function parseMML(src) {
  const s = expandLoops(src.replace(/\s+/g, ''));
  const ev = [];
  let t = 0, o = 4, l = 48, v = 12, d = 2, e = 1, q = 8, vib = 0, loop = null, tie = false;
  let i = 0;
  const num = () => { let st = i; while (i < s.length && /[0-9]/.test(s[i])) i++; return st === i ? null : +s.slice(st, i); };
  const len = () => {
    const n = num();
    let L = n ? 192 / n : l;
    let dot = L;
    while (s[i] === '.') { dot /= 2; L += dot; i++; }
    return Math.round(L);
  };
  const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  while (i < s.length) {
    const ch = s[i++];
    if (ch in SEMI) {
      let n = SEMI[ch];
      while (s[i] === '+' || s[i] === '#' || s[i] === '-') { n += s[i] === '-' ? -1 : 1; i++; }
      const L = len();
      const midi = 12 * (o + 1) + n;
      if (tie && ev.length && ev[ev.length - 1].n === midi) { ev[ev.length - 1].len += L; ev[ev.length - 1].gate = ev[ev.length - 1].len * q / 8; }
      else ev.push({ t, len: L, gate: L * q / 8, n: midi, v, d, e, vib });
      tie = false; t += L;
    } else if (ch === 'r') { t += len(); tie = false; }
    else if (ch === '&') tie = true;
    else if (ch === 'o') o = num();
    else if (ch === '<') o--;
    else if (ch === '>') o++;
    else if (ch === 'l') { const n = num(); l = 192 / n; while (s[i] === '.') { l *= 1.5; i++; } }
    else if (ch === 'v') v = num();
    else if (ch === '@') d = num();
    else if (ch === 'E') e = num();
    else if (ch === 'q') q = num();
    else if (ch === '~') vib = num();
    else if (ch === 'L') loop = t;
    else if (ch === 't') num();
  }
  return { ev, end: t, loop };
}
function parseNoise(src) {
  const s = expandLoops(src.replace(/\s+/g, ''));
  const ev = []; let t = 0, l = 48, v = 10, loop = null, i = 0;
  const num = () => { let st = i; while (i < s.length && /[0-9]/.test(s[i])) i++; return st === i ? null : +s.slice(st, i); };
  const len = () => { const n = num(); let L = n ? 192 / n : l; let dot = L; while (s[i] === '.') { dot /= 2; L += dot; i++; } return Math.round(L); };
  while (i < s.length) {
    const ch = s[i++];
    if ('kshHc'.includes(ch)) { const L = len(); ev.push({ t, len: L, kind: ch, v }); t += L; }
    else if (ch === 'r') t += len();
    else if (ch === 'l') { const n = num(); l = 192 / n; }
    else if (ch === 'v') v = num();
    else if (ch === 'L') loop = t;
  }
  return { ev, end: t, loop };
}

// ---------------- voices ----------------
function playTone(when, dur, gate, midi, vol, duty, env, vib, kind, dest) {
  const c = Audio_.ctx;
  const osc = c.createOscillator();
  osc.setPeriodicWave(Audio_.waves[(kind === 'w' ? 'w' : 'p') + duty] || Audio_.waves.p2);
  const f = mtof(midi);
  osc.frequency.setValueAtTime(f, when);
  const g = c.createGain();
  const peak = (vol / 15) * (kind === 'w' ? 0.34 : 0.2);
  const end = when + gate;
  g.gain.setValueAtTime(0.0001, when);
  if (env === 3) { g.gain.linearRampToValueAtTime(peak, when + Math.min(gate * 0.5, 0.25)); }
  else g.gain.linearRampToValueAtTime(peak, when + 0.005);
  if (env === 1) g.gain.setTargetAtTime(peak * 0.25, when + 0.01, Math.max(0.05, gate * 0.35));
  else if (env === 2) g.gain.setTargetAtTime(peak * 0.55, when + 0.02, Math.max(0.12, gate * 0.6));
  else if (env === 4) g.gain.setTargetAtTime(0.0001, when + 0.005, 0.06); // short pluck (guzheng)
  g.gain.setTargetAtTime(0.0001, end, 0.015);
  osc.connect(g); g.connect(dest);
  if (vib && gate > 0.22) {
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, when); lg.gain.linearRampToValueAtTime(f * 0.012, when + Math.min(0.35, gate * 0.6));
    lfo.connect(lg); lg.connect(osc.frequency);
    lfo.start(when); lfo.stop(end + 0.1);
  }
  osc.start(when); osc.stop(end + 0.12);
}
function playNoise(when, kind, vol, dest) {
  const c = Audio_.ctx;
  const src = c.createBufferSource();
  const g = c.createGain();
  const peak = (vol / 15) * 0.26;
  let decay = 0.04, rate = 1, short = false, start = Math.random() * 0.5;
  if (kind === 'k') { decay = 0.07; rate = 0.18; }
  else if (kind === 's') { decay = 0.09; rate = 0.6; }
  else if (kind === 'h') { decay = 0.025; rate = 1.4; }
  else if (kind === 'H') { decay = 0.12; rate = 1.4; }
  else if (kind === 'c') { decay = 0.5; rate = 1.1; }
  src.buffer = short ? Audio_.noise.short : Audio_.noise.long;
  src.playbackRate.value = rate;
  g.gain.setValueAtTime(peak, when);
  g.gain.setTargetAtTime(0.0001, when + 0.005, decay);
  src.connect(g); g.connect(dest);
  src.start(when, start); src.stop(when + decay * 6 + 0.05);
}

// ---------------- music player ----------------
const Music = {
  cur: null, song: null, tracks: null, timer: null, want: null, fading: false,
  onUnlock() { if (this.want) { const w = this.want; this.want = null; this.play(w, true); } },
  play(id, force) {
    if (!force && this.cur === id) return;
    this.cur = id;
    if (!Audio_.ctx) { this.want = id; return; }
    this.stop(true);
    const song = SONGS[id];
    if (!song) return;
    const c = Audio_.ctx;
    this.song = song;
    this.gain = c.createGain(); this.gain.gain.value = song.vol || 1; this.gain.connect(Audio_.musicGain);
    const tick = 60 / song.tempo / 48;
    const t0 = c.currentTime + 0.08;
    this.tracks = Object.entries(song.tracks).map(([k, src]) => {
      const p = k === 'n' ? parseNoise(src) : parseMML(src);
      return { kind: k[0], p, idx: 0, base: t0, tick };
    });
    // song length = longest track; all tracks loop together
    this.len = Math.max(...this.tracks.map((t) => t.p.end));
    this.loopAt = song.loop === false ? null : (this.tracks[0].p.loop || 0);
    this.timer = setInterval(() => this.pump(), 30);
    this.pump();
  },
  pump() {
    const c = Audio_.ctx;
    if (!c || !this.tracks) return;
    const ahead = c.currentTime + 0.18;
    for (const tr of this.tracks) {
      for (let guard = 0; guard < 128; guard++) {
        if (tr.idx >= tr.p.ev.length) {
          if (this.loopAt === null) break;
          const ni = tr.p.ev.findIndex((e) => e.t >= this.loopAt);
          if (ni < 0) break;
          tr.base += (this.len - this.loopAt) * tr.tick;
          tr.idx = ni;
        }
        const e = tr.p.ev[tr.idx];
        const when = tr.base + e.t * tr.tick;
        if (when > ahead) break;
        if (when >= c.currentTime - 0.05) {
          if (tr.kind === 'n') playNoise(when, e.kind, e.v, this.gain);
          else playTone(when, e.len * tr.tick, e.gate * tr.tick, e.n, e.v, e.d, e.e, e.vib, tr.kind, this.gain);
        }
        tr.idx++;
      }
    }
    if (this.loopAt === null && this.tracks.every((t) => t.idx >= t.p.ev.length)) {
      const endT = this.tracks[0].base + this.len * this.tracks[0].tick;
      if (c.currentTime > endT + 0.5) { this.stop(true); this.cur = null; if (this.onEnd) { const f = this.onEnd; this.onEnd = null; f(); } }
    }
  },
  stop(hard) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.tracks = null;
    if (this.gain) {
      const g = this.gain, c = Audio_.ctx;
      if (hard) { g.gain.setTargetAtTime(0, c.currentTime, 0.01); setTimeout(() => g.disconnect(), 300); }
      else { g.gain.setTargetAtTime(0, c.currentTime, 0.25); setTimeout(() => g.disconnect(), 1500); }
      this.gain = null;
    }
  },
  fadeOut() { this.cur = null; this.stop(false); },
};

// ---------------- sound effects ----------------
const SFX = {
  cursor: [['p', 1, 84, 0.03, 8]],
  ok: [['p', 1, 79, 0.04, 9], ['p', 1, 86, 0.06, 9, 0.04]],
  cancel: [['p', 1, 74, 0.04, 8], ['p', 1, 67, 0.06, 8, 0.04]],
  text: [['p', 0, 91, 0.015, 4]],
  menu: [['p', 2, 72, 0.04, 8], ['p', 2, 79, 0.05, 8, 0.04]],
  bump: [['n', 'k', 7]],
  door: [['n', 's', 6], ['n', 'h', 5, 0.06]],
  blip: [['p', 1, 88, 0.05, 8]],
  surprise: [['p', 1, 84, 0.04, 10], ['p', 1, 91, 0.08, 10, 0.05]],
  hit: [['n', 's', 13], ['sweep', 0, 60, 30, 0.12, 10]],
  crit: [['n', 'c', 14], ['sweep', 0, 72, 30, 0.2, 12]],
  slash: [['n', 'H', 11], ['sweep', 2, 96, 72, 0.08, 6]],
  miss: [['sweep', 1, 70, 90, 0.1, 6]],
  fire: [['n', 'c', 12], ['sweep', 2, 50, 38, 0.3, 9]],
  ice: [['sweep', 0, 96, 108, 0.12, 8], ['sweep', 0, 100, 112, 0.12, 7, 0.07], ['n', 'h', 8, 0.1]],
  wind: [['n', 'H', 9], ['n', 'H', 7, 0.1], ['sweep', 2, 70, 84, 0.3, 5]],
  thunder: [['n', 'c', 15], ['n', 'k', 14, 0.05], ['sweep', 3, 40, 28, 0.35, 10]],
  earth: [['n', 'k', 15], ['n', 'k', 13, 0.09], ['n', 'c', 10, 0.12]],
  heal: [['arp', 1, [72, 76, 79, 84, 88], 0.05, 8]],
  buff: [['arp', 2, [67, 71, 74, 79], 0.05, 8]],
  debuff: [['arp', 2, [79, 74, 71, 67], 0.05, 8]],
  magic: [['arp', 0, [60, 67, 72, 79, 84], 0.035, 7]],
  die: [['n', 'c', 10], ['sweep', 1, 64, 36, 0.4, 9]],
  hurt: [['n', 's', 12], ['sweep', 1, 52, 40, 0.1, 9]],
  coin: [['p', 1, 88, 0.05, 9], ['p', 1, 95, 0.12, 9, 0.05]],
  save: [['arp', 2, [72, 79, 84, 91], 0.07, 8]],
  escape: [['n', 'h', 8], ['n', 'h', 8, 0.08], ['n', 'h', 8, 0.16], ['n', 'h', 7, 0.24]],
  encounter: [['sweep', 1, 84, 60, 0.25, 10], ['n', 'c', 9, 0.05]],
  step: [['n', 'h', 3]],
  swordGlow: [['arp', 0, [76, 83, 88, 95, 100], 0.06, 8], ['sweep', 0, 88, 100, 0.6, 5, 0.3]],
  bell: [['p', 3, 76, 0.9, 9], ['p', 3, 88, 0.6, 5, 0.01]],
  push: [['n', 'k', 9], ['sweep', 2, 40, 36, 0.12, 6]],
  splash: [['n', 'H', 9], ['n', 's', 6, 0.05]],
  chest: [['arp', 1, [67, 72, 76], 0.04, 8]],
  guard: [['p', 2, 60, 0.05, 9], ['n', 'h', 8, 0.01]],
};
const Sound = {
  music(id) { Music.play(id); },
  stopMusic() { Music.fadeOut(); },
  sfx(name) {
    const c = Audio_.ctx;
    if (!c) return;
    const parts = SFX[name];
    if (!parts) return;
    const now = c.currentTime + 0.01;
    for (const p of parts) {
      const [type] = p;
      if (type === 'p') { const [, duty, midi, dur, vol, delay = 0] = p; playTone(now + delay, dur, dur, midi, vol, duty, 0, 0, 'p', Audio_.sfxGain); }
      else if (type === 'n') { const [, kind, vol, delay = 0] = p; playNoise(now + delay, kind, vol, Audio_.sfxGain); }
      else if (type === 'arp') { const [, duty, notes, step, vol] = p; notes.forEach((m, i) => playTone(now + i * step, step * 1.6, step * 1.6, m, vol, duty, 1, 0, 'p', Audio_.sfxGain)); }
      else if (type === 'sweep') {
        const [, duty, m0, m1, dur, vol, delay = 0] = p;
        const osc = c.createOscillator(), g = c.createGain();
        osc.setPeriodicWave(Audio_.waves['p' + duty]);
        const w = now + delay;
        osc.frequency.setValueAtTime(mtof(m0), w);
        osc.frequency.exponentialRampToValueAtTime(mtof(m1), w + dur);
        g.gain.setValueAtTime((vol / 15) * 0.22, w);
        g.gain.setTargetAtTime(0.0001, w + dur * 0.5, dur * 0.25);
        osc.connect(g); g.connect(Audio_.sfxGain);
        osc.start(w); osc.stop(w + dur + 0.1);
      }
    }
  },
  jingle(id) { Music.play(id, true); },
};
const SONGS = {};
