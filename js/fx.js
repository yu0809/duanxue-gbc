'use strict';
// ============================================================
//  Battle effects — particles and drawn strokes, all on the
//  GBC grid (integer pixels, flat colours, no blending)
// ============================================================
function centerOf(t) {
  if (t.side === 'enemy') return [t.x + t.w / 2, t.y + t.h / 2];
  return [t.x + 8 + (t.ox || 0), t.y + 8];
}
function spark(B, x, y, vx, vy, life, c, s = 1, g = 0) { B.parts.push({ x, y, vx, vy, life, c: PAL[c] || c, s, g }); }
function addFx(B, life, draw) { B.fx.push({ t: 0, life, draw }); }
function line(g, x0, y0, x1, y1, col, w = 1) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= n; i++) rect(g, Math.round(x0 + (dx * i) / n), Math.round(y0 + (dy * i) / n), w, w, col);
}
const FX_IMG = {};
function fxImg(name) {
  if (FX_IMG[name]) return FX_IMG[name];
  const src = {
    leaf: ['..ll', '.lGl', 'lGl.', 'll..'],
    coin: ['.KK.', 'KyyK', 'KyYK', '.KK.'],
    rock: ['.KKK.', 'KhEEK', 'KEEhK', 'KhhhK', '.KKK.'],
    sword: ['..W..', '..W..', '..W..', '..w..', '..w..', '.yyy.', '..b..'],
    shard: ['.c.', 'cWc', '.c.', '.C.'],
    talis: ['KKKKKK', 'KyyyyK', 'KyrryK', 'KyyyyK', 'KyrryK', 'KyyryK', 'KyyyyK', 'KKKKKK'],
    arrow: ['..y..', '.yyy.', 'y.y.y', '..y..', '..y..'],
    flame: ['..r..', '.ror.', '.oyo.', 'royor', '.ryr.'],
    note: ['.KK', '.K.', 'KK.'],
  }[name];
  return (FX_IMG[name] = art(src));
}

async function playFx(B, name, targets, user) {
  const T = targets.filter(Boolean);
  const C = T.map(centerOf);
  const U = user ? centerOf(user) : [80, 50];
  switch (name) {
    case 'slash': case 'claw': {
      Sound.sfx('slash');
      const col = name === 'claw' ? PAL.r : PAL.W;
      addFx(B, 12, (g, t) => {
        for (const [x, y] of C) {
          const k = Math.min(1, t / 5);
          for (let j = 0; j < (name === 'claw' ? 3 : 1); j++) {
            const ox = j * 4 - (name === 'claw' ? 4 : 0);
            line(g, x + 10 + ox, y - 10, x + 10 + ox - 20 * k, y - 10 + 20 * k, t > 8 ? PAL.w : col);
          }
        }
      });
      for (const [x, y] of C) for (let i = 0; i < 6; i++) spark(B, x, y, rnd(-1.5, 1.5), rnd(-1.5, 1), 12, 'W');
      await wait(10);
      break;
    }
    case 'bigslash': {
      Sound.sfx('crit'); flash('white', 3);
      addFx(B, 16, (g, t) => {
        for (const [x, y] of C) {
          const k = Math.min(1, t / 6);
          line(g, x + 16, y - 16, x + 16 - 32 * k, y - 16 + 32 * k, PAL.W, 2);
          if (t > 4) line(g, x - 16, y - 16, x - 16 + 32 * Math.min(1, (t - 4) / 6), y - 16 + 32 * Math.min(1, (t - 4) / 6), PAL.y, 2);
        }
      });
      shake(12, 3);
      await wait(14);
      break;
    }
    case 'fire': {
      Sound.sfx('fire'); flash('red', 2);
      for (const [x, y] of C) for (let i = 0; i < 26; i++) spark(B, x + rnd(-12, 12), y + rnd(0, 12), rnd(-0.3, 0.3), rnd(-1.6, -0.4), irnd(14, 30), pick(['y', 'o', 'o', 'r', 'R']), pick([1, 2, 2]));
      addFx(B, 18, (g, t) => { for (const [x, y] of C) { const r = t; g.fillStyle = t % 4 < 2 ? PAL.o : PAL.y; g.fillRect(x - r, y + 10 - 2, r * 2, 2); } });
      await wait(22);
      break;
    }
    case 'ice': {
      Sound.sfx('ice');
      for (const [x, y] of C) for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, d = 26;
        B.parts.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: -Math.cos(a) * d / 12, vy: -Math.sin(a) * d / 12, life: 12, img: fxImg('shard') });
      }
      await wait(12);
      flash('blue', 2);
      for (const [x, y] of C) for (let i = 0; i < 14; i++) spark(B, x, y, rnd(-2, 2), rnd(-2, 2), 14, pick(['W', 'c', 'C']), 2);
      await wait(10);
      break;
    }
    case 'blizzard': case 'water': {
      Sound.sfx(name === 'water' ? 'splash' : 'ice');
      for (let i = 0; i < 70; i++) B.parts.push({ x: rnd(-60, 0), y: rnd(FY, FY + FH), vx: rnd(3, 5), vy: rnd(0.2, 0.8), life: irnd(30, 50), c: pick([PAL.W, PAL.c, PAL.W]), s: pick([1, 2]) });
      await wait(14); flash('blue', 3);
      for (const [x, y] of C) for (let i = 0; i < 10; i++) spark(B, x, y, rnd(-2, 2), rnd(-2, 1), 16, pick(['W', 'c']), 2);
      await wait(16);
      break;
    }
    case 'wind': {
      Sound.sfx('wind');
      addFx(B, 26, (g, t) => {
        for (const [x, y] of C) for (let k = 0; k < 3; k++) {
          const a = t * 0.45 + k * 2.1, r = 16 - t * 0.4;
          for (let s = 0; s < 6; s++) {
            const aa = a - s * 0.12;
            rect(g, Math.round(x + Math.cos(aa) * r), Math.round(y + Math.sin(aa) * r * 0.6), 1, 1, s < 2 ? PAL.W : PAL.l);
          }
        }
      });
      await wait(24);
      for (const [x, y] of C) for (let i = 0; i < 8; i++) spark(B, x, y, rnd(-2.5, 2.5), rnd(-1.5, 1.5), 10, pick(['L', 'l', 'W']));
      break;
    }
    case 'thunder': {
      Sound.sfx('thunder');
      const bolts = C.map(([x, y]) => { const pts = [[x + rnd(-6, 6), FY - 4]]; let cy = FY; while (cy < y) { cy += irnd(5, 9); pts.push([x + rnd(-7, 7), Math.min(y, cy)]); } return pts; });
      addFx(B, 14, (g, t) => {
        if (t % 4 > 1) return;
        for (const pts of bolts) for (let i = 1; i < pts.length; i++) { line(g, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], PAL.W, 2); line(g, pts[i - 1][0] + 1, pts[i - 1][1], pts[i][0] + 1, pts[i][1], PAL.y); }
      });
      flash('white', 3); shake(10, 2);
      await wait(8); flash('gold', 2);
      for (const [x, y] of C) for (let i = 0; i < 10; i++) spark(B, x, y, rnd(-2, 2), rnd(-2, 0.5), 12, pick(['y', 'W']), 1, 0.15);
      await wait(10);
      break;
    }
    case 'earth': {
      Sound.sfx('earth');
      for (const [x, y] of C) for (let i = 0; i < 6; i++) B.parts.push({ x: x + rnd(-14, 10), y: FY - rnd(4, 30), vx: 0, vy: 3.2, life: irnd(10, 16), img: fxImg('rock') });
      await wait(12); shake(14, 3);
      for (const [x, y] of C) for (let i = 0; i < 12; i++) spark(B, x + rnd(-10, 10), y + 10, rnd(-1.5, 1.5), rnd(-2.5, -0.5), 16, pick(['E', 'h', 'e']), 2, 0.2);
      await wait(12);
      break;
    }
    case 'heal': {
      Sound.sfx('heal');
      for (const [x, y] of C) for (let i = 0; i < 16; i++) spark(B, x + rnd(-8, 8), y + rnd(-2, 10), 0, rnd(-1.2, -0.5), irnd(18, 30), pick(['L', 'l', 'W', 'y']));
      addFx(B, 20, (g, t) => { for (const [x, y] of C) { const r = 4 + t; for (let a = 0; a < 16; a++) rect(g, Math.round(x + Math.cos(a / 2.55) * r), Math.round(y + 6 + Math.sin(a / 2.55) * r * 0.3), 1, 1, PAL.L); } });
      await wait(22);
      break;
    }
    case 'buff': {
      for (const [x, y] of C) for (let i = 0; i < 4; i++) B.parts.push({ x: x - 3 + rnd(-6, 6), y: y + 4, vx: 0, vy: -0.8, life: 24, img: fxImg('arrow') });
      await wait(20);
      break;
    }
    case 'leaves': {
      Sound.sfx('wind');
      for (const [x, y] of C) for (let i = 0; i < 8; i++) {
        const sx = U[0] + rnd(-6, 6), sy = U[1] + rnd(-6, 6);
        B.parts.push({ x: sx, y: sy, vx: (x - sx) / 18 + rnd(-0.4, 0.4), vy: (y - sy) / 18 + rnd(-0.4, 0.4), life: 18 + i, img: fxImg('leaf') });
      }
      await wait(22);
      break;
    }
    case 'spore': {
      Sound.sfx('debuff');
      for (const [x, y] of C) for (let i = 0; i < 18; i++) spark(B, x + rnd(-4, 4), y + rnd(-4, 4), rnd(-0.8, 0.8), rnd(-0.8, 0.3), irnd(20, 34), pick(['q', 'Q', 'm']), 2);
      await wait(24);
      break;
    }
    case 'dark': {
      Sound.sfx('debuff'); FX.invert = 2;
      addFx(B, 24, (g, t) => { for (const [x, y] of C) { const r = 24 - t; for (let a = 0; a < 20; a++) { const aa = a * 0.314 + t * 0.2; rect(g, Math.round(x + Math.cos(aa) * r), Math.round(y + Math.sin(aa) * r), 2, 2, a % 2 ? PAL.Q : PAL.Z); } } });
      await wait(24);
      for (const [x, y] of C) for (let i = 0; i < 10; i++) spark(B, x, y, rnd(-2, 2), rnd(-2, 2), 12, pick(['q', 'Z']), 2);
      break;
    }
    case 'swords': {
      Sound.sfx('slash');
      for (const [x, y] of C) for (let i = 0; i < 7; i++) B.parts.push({ x: x + rnd(-14, 10), y: FY - rnd(0, 40), vx: 0, vy: 4, life: irnd(8, 14), img: fxImg('sword') });
      await wait(14); flash('white', 2);
      for (const [x, y] of C) for (let i = 0; i < 8; i++) spark(B, x, y, rnd(-2, 2), rnd(-2, 1), 10, 'W');
      await wait(8);
      break;
    }
    case 'coins': {
      for (let i = 0; i < 6; i++) {
        const [x, y] = C[0];
        const sx = U[0], sy = U[1] - 4, n = 16;
        B.parts.push({ x: sx, y: sy, vx: (x - sx) / n + rnd(-0.3, 0.3), vy: (y - sy) / n - 2.2, g: 0.28, life: n + i, img: fxImg('coin') });
        Sound.sfx('coin');
        await wait(3);
      }
      await wait(16);
      break;
    }
    case 'seal': {
      Sound.sfx('debuff');
      for (const [x, y] of C) B.parts.push({ x: x - 3, y: y - 20, vx: 0, vy: 1, life: 22, img: fxImg('talis') });
      await wait(22);
      break;
    }
    case 'final': {
      Sound.sfx('swordGlow');
      const cols = ['l', 'q', 'C', 'r', 'y'];
      for (let i = 0; i < 5; i++) {
        FX.flashColor = ['white', 'blue', 'gold', 'red', 'white'][i]; FX.flash = 2;
        for (const [x, y] of C) for (let k = 0; k < 10; k++) spark(B, x + rnd(-16, 16), y + rnd(-16, 16), rnd(-1, 1), rnd(-1, 1), 16, cols[i], 2);
        await wait(7);
      }
      Sound.sfx('thunder');
      addFx(B, 30, (g, t) => { if (t < 6) rect(g, 0, FY, SW, FH, t % 2 ? PAL.W : PAL.x); for (const [x, y] of C) line(g, x + 30, y - 30, x - 30 + t, y + 30 - t, PAL.W, 2); });
      for (let i = 0; i < 80; i++) B.parts.push({ x: rnd(0, 160), y: rnd(FY - 20, FY), vx: rnd(-0.3, 0.3), vy: rnd(0.5, 1.4), life: irnd(40, 70), c: PAL.W, s: pick([1, 2]) });
      shake(20, 3);
      await wait(24);
      break;
    }
    default: {
      Sound.sfx('magic');
      for (const [x, y] of C) for (let i = 0; i < 12; i++) spark(B, x, y, rnd(-1.5, 1.5), rnd(-1.5, 1.5), 16, pick(['W', 'y', 'c']));
      await wait(14);
    }
  }
}
