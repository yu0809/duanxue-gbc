'use strict';
// ============================================================
//  Soundtrack — original pieces in Chinese pentatonic modes.
//  Voices: p1/p2 pulse, w wave (flute / bass), n noise.
// ============================================================
// Melody tokens: "E5:2. D5:4 R:4 C#5:8 A4:1~ A4:1"  (~ = tie into next)
function S(str) {
  return str.trim().split(/\s+/).map((tok) => {
    if (tok === '|') return '';
    const tie = tok.endsWith('~');
    if (tie) tok = tok.slice(0, -1);
    let [n, l] = tok.split(':');
    l = l || '4';
    if (n === 'R' || n === 'r') return 'r' + l;
    const m = n.match(/^([A-Ga-g])([#b]?)(\d)$/);
    if (!m) throw new Error('bad note ' + tok);
    return 'o' + m[3] + m[1].toLowerCase() + (m[2] === '#' ? '+' : m[2] === 'b' ? '-' : '') + l + (tie ? '&' : '');
  }).join('');
}
// chord voicings, low to high
const CH = {
  Am: ['A2', 'E3', 'A3', 'C4', 'E4', 'A4'], G: ['G2', 'D3', 'G3', 'A3', 'D4', 'G4'], Gsus: ['G2', 'D3', 'G3', 'A3', 'D4', 'G4'],
  Em: ['E2', 'B2', 'E3', 'G3', 'B3', 'E4'], C: ['C3', 'G3', 'C4', 'E4', 'G4', 'C5'], F: ['F2', 'C3', 'F3', 'A3', 'C4', 'F4'],
  Dm: ['D3', 'A3', 'D4', 'F4', 'A4', 'D5'], D: ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'], Bm: ['B2', 'F#3', 'B3', 'D4', 'F#4', 'B4'],
  A: ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4'], E: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], Esus: ['E2', 'B2', 'E3', 'A3', 'B3', 'E4'],
  Cm: ['C3', 'G3', 'C4', 'Eb4', 'G4', 'C5'], Bb: ['Bb2', 'F3', 'Bb3', 'D4', 'F4', 'Bb4'], Ab: ['Ab2', 'Eb3', 'Ab3', 'C4', 'Eb4', 'Ab4'],
  Gm: ['G2', 'D3', 'G3', 'Bb3', 'D4', 'G4'], Fm: ['F2', 'C3', 'F3', 'Ab3', 'C4', 'F4'], Eb: ['Eb3', 'Bb3', 'Eb4', 'G4', 'Bb4', 'Eb5'],
  Dsus: ['D3', 'A3', 'D4', 'E4', 'A4', 'D5'], Asus: ['A2', 'E3', 'A3', 'B3', 'E4', 'A4'],
};
// arpeggiate a list of chords; pattern = indices into the voicing, len = note length
function ARP(chords, pattern, len = '8') {
  return chords.map((c) => S(pattern.map((i) => (i === null ? 'R:' + len : CH[c][i] + ':' + len)).join(' '))).join('');
}
// shift every note token in a chord-voicing by octaves (for bass lines)
function oct(note, d) { return note.replace(/\d/, (n) => String(+n + d)); }
function BASS(chords, pattern, len = '8', shift = 0) {
  return chords.map((c) => S(pattern.map((i) => (i === null ? 'R:' + len : oct(CH[c][i], shift) + ':' + len)).join(' '))).join('');
}
const X = (s, n) => s.repeat(n);

// ---------------- 断雪 (title) ----------------
const TITLE_MEL = S(`E5:2. D5:4 C5:2 D5:4 E5:4 A4:1 R:2 G4:4 A4:4
  C5:2. D5:4 E5:2 G5:4 E5:4 D5:1 R:1
  E5:2 G5:4 A5:4 G5:2 E5:4 D5:4 E5:2. C5:4 D5:1
  C5:2 A4:4 G4:4 A4:2 C5:4 D5:4 A4:1~ A4:1`);
const TITLE_CH = ['Am', 'Gsus', 'Am', 'Em', 'C', 'C', 'G', 'G', 'Am', 'Em', 'C', 'G', 'Am', 'Gsus', 'Am', 'Am'];
SONGS.title = {
  tempo: 66,
  tracks: {
    w: '@0E2~1v13' + TITLE_MEL,
    p1: '@1E4v8' + ARP(TITLE_CH, [0, 1, 2, 3, 4, 3, 2, 1]),
    p2: '@2E3v4' + TITLE_CH.map((c) => S(CH[c][4] + ':1')).join(''),
  },
};
// ---------------- 青石镇 (town) ----------------
const TOWN_MEL = S(`A4:8 B4:8 D5:4 E5:4 D5:8 B4:8 A4:4 F#4:4 E4:2
  D4:8 E4:8 F#4:4 A4:4 B4:8 A4:8 F#4:2. R:4
  A4:8 B4:8 D5:4 E5:4 F#5:8 E5:8 D5:4 B4:4 A4:2
  B4:8 D5:8 E5:8 D5:8 B4:4 A4:8 F#4:8 D4:2. R:4
  F#5:4 E5:8 D5:8 E5:4 A4:4 B4:4 D5:8 B4:8 A4:2
  F#4:8 A4:8 B4:8 D5:8 E5:4 D5:8 E5:8 F#5:2. R:4
  A5:4 F#5:8 E5:8 D5:4 B4:4 D5:8 E5:8 F#5:8 E5:8 D5:4 B4:4
  A4:8 B4:8 D5:8 E5:8 D5:4 B4:8 A4:8 D5:2. R:4`);
const TOWN_CH = ['D', 'D', 'G', 'D', 'D', 'Bm', 'G', 'D', 'D', 'G', 'Bm', 'A', 'D', 'G', 'A', 'D'];
SONGS.town = {
  tempo: 100,
  tracks: {
    p1: '@2E2v10~1' + TOWN_MEL,
    w: '@2E0q6v12' + BASS(TOWN_CH, [0, 1, 2, 1], '4', -1),
    p2: '@1E1v5' + TOWN_CH.map((c) => S(X(`R:8 ${CH[c][3]}:8 `, 4))).join(''),
    n: 'v4' + X('k4h4s4h4', 16),
  },
};
// ---------------- night raid ----------------
const NIGHT_CH = ['Am', 'Am', 'F', 'E', 'Am', 'Am', 'F', 'E'];
SONGS.night = {
  tempo: 92,
  tracks: {
    p1: '@0E1v7' + ARP(NIGHT_CH, [2, null, 3, 2, 4, null, 3, 2]),
    w: '@2E0q7v12' + BASS(NIGHT_CH, [0, null, 0, null, 0, 0, null, 0], '8', -1),
    p2: '@2E3~1v8' + S(`R:1 R:1 C5:2. B4:4 G#4:1 E5:2. D5:4 C5:2 A4:2 F4:2. E4:4 E4:1`),
    n: 'v5' + X('k4r8h8k8k8h4', 8),
  },
};
// ---------------- battle ----------------
const BAT_MEL = S(`A4:8 C5:8 D5:8 E5:8 G5:8 E5:8 D5:8 C5:8 D5:8 E5:8 A4:4 R:8 G4:8 A4:8 C5:8
  A4:8 C5:8 D5:8 E5:8 G5:8 A5:8 G5:8 E5:8 D5:2 R:4 E5:8 G5:8
  A5:4 G5:8 E5:8 G5:4 E5:8 D5:8 E5:4 D5:8 C5:8 D5:4 C5:8 A4:8
  C5:8 D5:8 E5:8 G5:8 A5:8 G5:8 E5:8 D5:8 E5:2. R:4
  F5:4. E5:8 D5:4 C5:4 D5:4. E5:8 G5:2
  E5:4. D5:8 C5:4 A4:4 B4:4 C5:4 D5:4 E5:4
  F5:4. G5:8 A5:4 G5:4 E5:4. D5:8 E5:4 G5:4
  A5:8 G5:8 E5:8 D5:8 E5:8 D5:8 C5:8 B4:8 A4:2 R:2`);
const BAT_CH = ['Am', 'Am', 'Am', 'G', 'Am', 'G', 'F', 'E', 'F', 'G', 'Am', 'E', 'F', 'G', 'Am', 'Am'];
SONGS.battle = {
  tempo: 152,
  tracks: {
    p1: '@1E1v11' + S('E5:16 D5:16 C5:16 A4:16 G4:16 E4:16 D4:16 C4:16 A3:2') + 'L' + BAT_MEL,
    w: '@2E0q6v13' + S('A2:2 A2:2') + BASS(BAT_CH, [0, 2, 0, 2, 0, 2, 0, 2], '8', 0),
    p2: '@2E1v6' + S('R:1') + BAT_CH.map((c) => S(X(`R:8 ${CH[c][3]}:8 `, 4))).join(''),
    n: 'v8' + 'k8h8k8h8s4s4' + X('k8h8s8h8k8k8s8h8', 16),
  },
};
// ---------------- boss ----------------
const BOSS_CH = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Bb', 'A', 'Gm', 'Dm', 'Bb', 'A', 'Gm', 'Dm', 'Eb', 'A'];
CH.Dm2 = ['D2', 'A2', 'D3', 'F3', 'A3', 'D4'];
SONGS.boss = {
  tempo: 144,
  tracks: {
    p1: '@1E1v11' + S(`D5:4. E5:8 F5:4 A5:4 G5:4. F5:8 E5:4 D5:4 F5:4. E5:8 D5:4 Bb4:4 A4:2. R:4
      D5:4. E5:8 F5:4 A5:4 C6:4. A5:8 G5:4 F5:4 G5:4 F5:8 E5:8 D5:4 E5:4 C#5:2. R:4
      G5:4. A5:8 Bb5:4 A5:4 F5:4. E5:8 D5:4 A4:4 Bb4:4 D5:4 F5:4 Bb5:4 A5:2. R:4
      G5:4 Bb5:4 A5:4 G5:4 F5:4 D5:4 A5:4 F5:4 G5:4 F5:4 Eb5:4 D5:4 C#5:2 E5:2`),
    w: '@2E0q6v13' + BASS(BOSS_CH, [0, 0, 2, 0, 0, 2, 0, 2], '8', -1),
    p2: '@0E4v7' + ARP(BOSS_CH, [2, 3, 4, 3, 2, 3, 4, 5]),
    n: 'v8' + X('k8h8s8k8k8h8s8h8', 16),
  },
};
// ---------------- 翠竹林 (forest) ----------------
const FOREST_CH = ['Dsus', 'Am', 'C', 'Dsus', 'Dsus', 'Am', 'G', 'Asus'];
SONGS.forest = {
  tempo: 84,
  tracks: {
    w: '@0E2~1v12' + S(`A4:4. B4:8 D5:2 E5:4 D5:8 B4:8 A4:2 G4:4. A4:8 B4:4 D5:4 A4:1
      D5:4. E5:8 G5:2 A5:4 G5:8 E5:8 D5:2 B4:4 D5:4 E5:4 G5:8 E5:8 D5:1`),
    p1: '@0E4v7' + ARP(FOREST_CH, [1, 2, 4, 2, 3, 2, 4, 5]),
    p2: '@0E4v4' + ARP(FOREST_CH, [5, 1, 2, 4, 2, 3, 2, 4]),
    n: 'v2' + X('h4r4h8h8r4', 8),
  },
};
// ---------------- 栖云派 (sect) ----------------
const SECT_CH = ['G', 'Em', 'C', 'D', 'G', 'Em', 'C', 'G'];
CH.G2 = ['G2', 'D3', 'G3', 'B3', 'D4', 'G4'];
SONGS.sect = {
  tempo: 76,
  tracks: {
    p1: '@0E2~1v11' + S(`D5:2 E5:4 G5:4 A5:2. G5:4 E5:4 D5:4 B4:4 D5:4 A4:1
      G4:2 A4:4 B4:4 D5:2. E5:4 D5:4 B4:4 A4:4 B4:4 G4:1`),
    p2: '@3E4v7' + SECT_CH.map((c) => S(`${CH[c][4]}:2 ${CH[c][3]}:4 ${CH[c][2]}:4`)).join(''),
    w: '@2E0q7v11' + BASS(SECT_CH, [0, 1], '2', -1),
    n: 'v3' + X('c1', 8),
  },
};
// ---------------- 寒潭 (ice cave) ----------------
const CAVE_CH = ['Em', 'C', 'Am', 'Bm', 'Em', 'C', 'Am', 'Esus'];
SONGS.cave = {
  tempo: 70,
  tracks: {
    p1: '@0E4v8' + ARP(CAVE_CH, [5, null, 3, 4, null, 2, 3, null]),
    p2: '@0E4v4' + ARP(CAVE_CH, [null, 5, null, 3, 4, null, 2, 3]),
    w: '@0E3~1v9' + S(`R:1 B4:2. G4:4 A4:1 R:2 F#4:4 G4:4 E4:1 R:1 B4:2 D5:4 E5:4 B4:1`),
  },
};
// ---------------- 镇妖塔 (tower) ----------------
const TOWER_CH = ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Cm', 'Fm', 'G'];
CH.Cm = ['C3', 'G3', 'C4', 'Eb4', 'G4', 'C5'];
SONGS.tower = {
  tempo: 108,
  tracks: {
    p1: '@1E4v8' + ARP(TOWER_CH, [2, 3, 4, 3, 2, 3, 4, 3]),
    w: '@2E0q7v12' + BASS(TOWER_CH, [0, null, 0, 0, null, 0, 1, 0], '8', -1),
    p2: '@2E2~1v9' + S(`G4:2. Ab4:4 G4:1 R:2 Eb4:4 F4:4 G4:1 R:1 C5:2. Bb4:4 Ab4:2 G4:2 F4:1`),
    n: 'v5' + X('k4r4s4r8k8', 8),
  },
};
// ---------------- 剑冢 (sword tomb) ----------------
const TOMB_CH = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'A'];
SONGS.tomb = {
  tempo: 72,
  tracks: {
    w: '@0E2~1v11' + S(`A4:2. G4:4 F4:2 E4:2 D4:1 R:2 E4:4 F4:4 G4:2. F4:4 E4:2 C#4:2 D4:1 R:1`),
    p1: '@0E4v6' + ARP(TOMB_CH, [0, 2, 3, 4, 3, 2, null, null]),
    p2: '@2E3v5' + TOMB_CH.map((c) => S(CH[c][3] + ':1')).join(''),
    n: 'v3' + X('k2r2', 8),
  },
};
// ---------------- 回忆 (memory) ----------------
SONGS.memory = {
  tempo: 60,
  tracks: {
    p1: '@0E2~1v10' + TITLE_MEL,
    p2: '@0E4v6' + ARP(TITLE_CH, [2, 3, 4, 5, 4, 3, 2, null]),
    w: '@2E0v8' + TITLE_CH.map((c) => S(oct(CH[c][0], 0) + ':1')).join(''),
  },
};
// ---------------- 魇 (final boss) ----------------
const FINAL_CH = ['Am', 'F', 'G', 'Em', 'Am', 'F', 'G', 'E', 'F', 'G', 'Am', 'C', 'F', 'G', 'E', 'E'];
SONGS.final = {
  tempo: 160,
  tracks: {
    p1: '@1E1v12' + S(`E5:4. D5:8 C5:4 D5:4 E5:4 G5:4 A5:2 G5:4. E5:8 D5:4 E5:4 B4:2. R:4
      E5:4. D5:8 C5:4 D5:4 E5:4 G5:4 A5:4 C6:4 B5:4. G5:8 E5:4 D5:4 E5:1
      F5:4. G5:8 A5:4 C6:4 B5:4. A5:8 G5:4 E5:4 A5:4 G5:8 E5:8 D5:4 C5:4 E5:2 G5:2
      A5:4. G5:8 F5:4 E5:4 D5:4. E5:8 G5:4 B5:4 G#5:1 B5:1`),
    w: '@2E0q6v13' + BASS(FINAL_CH, [0, 2, 0, 2, 0, 2, 0, 2], '8', 0),
    p2: '@0E4v7' + ARP(FINAL_CH, [2, 3, 4, 5, 4, 3, 2, 3]),
    n: 'v8' + X('k8h8s8h8k8k8s8s16s16', 16),
  },
};
// ---------------- ending ----------------
SONGS.ending = {
  tempo: 62,
  tracks: {
    w: '@0E2~1v13' + TITLE_MEL + TITLE_MEL,
    p1: '@1E4v7' + ARP(TITLE_CH, [0, 1, 2, 3, 4, 3, 2, 1]) + ARP(TITLE_CH, [2, 3, 4, 5, 4, 3, 2, 3]),
    p2: '@2E3v5' + TITLE_CH.map((c) => S(CH[c][4] + ':1')).join('') + TITLE_CH.map((c) => S(CH[c][3] + ':2 ' + CH[c][4] + ':2')).join(''),
    n: 'v2' + X('r1', 16) + X('h2h2', 16),
  },
};
// ---------------- spring (true ending epilogue) ----------------
SONGS.spring = {
  tempo: 96,
  tracks: {
    p1: '@2E2~1v10' + TOWN_MEL,
    w: '@2E0q6v11' + BASS(TOWN_CH, [0, 1, 2, 1], '4', -1),
    p2: '@0E4v6' + ARP(TOWN_CH, [2, 3, 4, 5, 4, 3, 2, 3]),
  },
};
// ---------------- jingles (no loop) ----------------
SONGS.victory = { tempo: 140, loop: false, tracks: {
  p1: '@1E1v11' + S('C5:8 C5:8 C5:8 C5:4. G4:4 A4:4 C5:8 R:8 A4:8 C5:2.'),
  p2: '@2E1v7' + S('E4:8 E4:8 E4:8 E4:4. D4:4 E4:4 E4:8 R:8 F4:8 E4:2.'),
  w: '@2E0v11' + S('C3:4. C3:8 C3:4 G2:4 A2:4 F2:4 C3:2.'),
} };
SONGS.lvup = { tempo: 150, loop: false, tracks: { p1: '@1E1v11' + S('G4:16 C5:16 E5:16 G5:4'), p2: '@2E1v7' + S('E4:16 G4:16 C5:16 E5:4') } };
SONGS.item = { tempo: 130, loop: false, tracks: {
  p1: '@1E1v11' + S('A4:8 D5:8 F#5:8 A5:4. F#5:8 A5:2'),
  w: '@2E0v10' + S('D3:4. D3:8 D3:4 A2:4 D3:2'),
} };
SONGS.rest = { tempo: 90, loop: false, tracks: {
  p1: '@0E2v10' + S('E5:4 D5:8 C5:8 A4:4 C5:4 D5:2 G4:2 A4:1'),
  w: '@2E0v9' + S('A2:2 E3:2 G2:2 D3:2 A2:1'),
} };
SONGS.gameover = { tempo: 70, loop: false, tracks: {
  w: '@0E2~1v12' + S('E5:2 D5:4 C5:4 A4:2. G4:4 A4:1'),
  p1: '@0E4v6' + ARP(['Am', 'F', 'Am'], [0, 2, 3, 4, 3, 2, 1, 0]),
} };
SONGS.ling = { tempo: 100, loop: false, tracks: {
  p1: '@0E4v10' + S('A4:16 C5:16 E5:16 A5:16 G5:16 E5:16 D5:16 E5:16 A5:2'),
  p2: '@0E4v6' + S('R:16 A4:16 C5:16 E5:16 A5:16 G5:16 E5:16 D5:16 E5:2'),
  w: '@0E2~1v10' + S('A4:4 E5:4 A5:2'),
} };
