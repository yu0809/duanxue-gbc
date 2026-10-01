'use strict';
// ============================================================
//  Region tilesets: 翠竹林 · 栖云山 · 寒潭 · 镇妖塔 · 剑冢
// ============================================================
// speckled texture: base colour plus scattered specks / tufts
function noiseRows(base, specks, seed, tuft) {
  const r = mulberry(seed);
  const g = Array.from({ length: 16 }, () => Array(16).fill(base));
  for (const [col, n] of specks) for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * 16), y = Math.floor(r() * 16);
    g[y][x] = col;
    if (tuft && col === tuft && y > 0 && x > 0 && x < 15) { g[y - 1][x] = col; g[y][x - 1] = col; g[y][x + 1] = col; }
  }
  return g.map((row) => row.join(''));
}

// ---------------- 翠竹林 ----------------
tile('grass', noiseRows('G', [['v', 7], ['l', 4]], 11), { soft: true });
tile('grass2', noiseRows('G', [['v', 5], ['l', 3], ['v', 3]], 23, 'v'), { soft: true });
tile('grass3', (() => { const r = noiseRows('G', [['v', 4], ['l', 3]], 31); return patch16(r, 5, 6, ['.m.', 'mym', '.m.']); })(), { soft: true });
tile('grass4', (() => { const r = noiseRows('G', [['v', 4]], 47); return patch16(r, 9, 9, ['.W.', 'WyW', '.W.']); })(), { soft: true });
tile('fpath', noiseRows('e', [['E', 9], ['z', 5]], 57), { edge: 'moss' });
function patch16(rows, x, y, lines) {
  const out = rows.slice();
  lines.forEach((ln, i) => { const r = out[y + i]; out[y + i] = r.slice(0, x) + Array.from(ln).map((c, j) => (c === '.' ? r[x + j] : c)).join('') + r.slice(x + ln.length); });
  return out;
}
// bamboo thicket used as walls
tile('bamboo_wall', Array(16).fill('v'.repeat(16)), { wall: 'bamboo', solid: true, rim: 'G' });
tile('bamboo_top', [
  'vGGvvFvGGvvvGvFv',
  'GGvvGvvGGGvvGGvv',
  'vvFvGGvvvFvGGvvG',
  'vGGvvvGvvGGvvFvv',
  'GGvvFvGGvvvGvvGG',
  'vvGGvvvGGvFvvGGv',
  'FvvGGvFvvGGvvvGG',
  'vGvvvGGvFvvGGvvv',
  'GGvFvvGGvvvGvvFv',
  'vvGGvvvFvGGvvGGv',
  'vFvvGGvvGGvvFvvG',
  'GvvGGvFvvvGGvvGG',
  'vGGvvvvGGvFvvGGv',
  'vvFvGGvvvGGvvvFv',
  'GvvGGvFvGGvvGvvG',
  'vGGvvGGvvvFvGGvv',
]);
tile('bamboo_face', [
  'GvjJIvvjJIvvjJIG',
  'vvjJIvGjJIvvjJIv',
  'vvjJIvvjJIGvjJIv',
  'vvLLLvvjJIvvjJIv',
  'vvjJIvvjJIvvLLLv',
  'GvjJIvvLLLvvjJIv',
  'vvjJIvvjJIvvjJIG',
  'vvjJIvGjJIvvjJIv',
  'vvjJIvvjJIvvjJIv',
  'vvLLLvvjJIvvjJIv',
  'vvjJIvvjJIvGjJIv',
  'vvjJIvvLLLvvLLLv',
  'GvjJIvvjJIvvjJIv',
  'vvjJIvvjJIvvjJIv',
  'FFjJIFFjJIFFjJIF',
  'FFFFFFFFFFFFFFFF',
]);
// a lone bamboo clump (object, 1x2)
bigTile('bamboo', [
  '...G..GG...G....',
  '..GGG.GjJ.GGG...',
  '...GGGjJIGG.....',
  '..G.GjJI.jJ.G...',
  '....jJI..jJIGG..',
  '...GjJI.GjJI....',
  '..GGLLL..LLLG...',
  '....jJI..jJI....',
  '....jJIG.jJI....',
  '...GjJI..jJIG...',
  '....jJI..jJI....',
  '....LLL..jJI....',
  '....jJI..LLL....',
  '....jJI..jJI....',
  '....jJI..jJI....',
  '....jJI..jJI....',
  '....jJI..jJI....',
  '....LLL..jJI....',
  '....jJI..jJI....',
  '....jJI..LLL....',
  '....jJI..jJI....',
  '...vjJIv.jJI....',
  '..vvvvvvvvvvv...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
], (tx, ty) => (ty === 0 ? { over: true } : { solid: true }));
tile('bush', [
  '................',
  '................',
  '................',
  '.....GGGG.......',
  '...GGlLlGGGG....',
  '..GlLllllGlGG...',
  '.GlllGllllllGG..',
  '.GllGGGlllGllG..',
  'GGlllllGlllllGG.',
  'GlllGlllllGlllG.',
  'GGlllllllllllGG.',
  '.GGvlllGlllvGG..',
  '..GvvGGGGGvvG...',
  '...vvvvvvvvv....',
  '................',
  '................',
], { solid: true });
tile('log', [
  '................',
  '................',
  '................',
  '................',
  '..KKKKKKKKKKKK..',
  '.KtTTTTTTTTTTbK.',
  'KeEtTttTTtTTTTbK'.slice(0, 16),
  'KEeEtTTTTTtTTTbK'.slice(0, 16),
  'KeEtTTtTTTTTtTbK'.slice(0, 16),
  '.KbbbbbbbbbbbbK.',
  '..KKKKKKKKKKKK..',
  '...GGG....GG....',
  '................',
  '................',
  '................',
  '................',
], { solid: true });
tile('stele', [
  '................',
  '.....KKKKKK.....',
  '....KggggggK....',
  '...KgwwwwwwgK...',
  '...KgwKwKwwnK...',
  '...KgwwwwwwnK...',
  '...KgwKKwKwnK...',
  '...KgwwwwwwnK...',
  '...KgwKwKKwnK...',
  '...KgwwwwwwnK...',
  '...KgnnnnnnnK...',
  '..KKKKKKKKKKKK..',
  '..KggggggggggK..',
  '..KnnnnnnnnnnK..',
  '...KKKKKKKKKK...',
  '...GG......GG...',
], { solid: true });
tile('shroom_deco', [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......KKK......',
  '......KqWqK.....',
  '.....KqqqWqK....',
  '.....KKKKKKK....',
  '..KKK..KpK......',
  '.KmWmK.KpK......',
  '.KKKKK.KpK......',
  '...Kp..KKK......',
  '...KK...........',
  '................',
  '................',
]);

// ---------------- 栖云山 ----------------
tile('court', [
  'xxxxxxxgxxxxxxxg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'gggggggggggggggg',
  'xxxxxxxgxxxxxxxg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'xwwwwwwgxwwwwwwg',
  'gggggggggggggggg',
], { edge: 'snow' });
tile('steps', [
  'xxxxxxxxxxxxxxxx',
  'wwwwwwwwwwwwwwww',
  'gggggggggggggggg',
  'nnnnnnnnnnnnnnnn',
  'xxxxxxxxxxxxxxxx',
  'wwwwwwwwwwwwwwww',
  'gggggggggggggggg',
  'nnnnnnnnnnnnnnnn',
  'xxxxxxxxxxxxxxxx',
  'wwwwwwwwwwwwwwww',
  'gggggggggggggggg',
  'nnnnnnnnnnnnnnnn',
  'xxxxxxxxxxxxxxxx',
  'wwwwwwwwwwwwwwww',
  'gggggggggggggggg',
  'nnnnnnnnnnnnnnnn',
]);
tile('cliff_wall', Array(16).fill('n'.repeat(16)), { wall: 'cliff', solid: true, rim: 'x' });
tile('cliff_top', noiseRows('n', [['g', 30], ['k', 10], ['w', 8], ['W', 5]], 71));
tile('cliff_face', [
  'wwwWwwwwwWwwwwww',
  'gwgggwgnggwggggn',
  'ggnggggnggggnggn',
  'gnggnggkggngggnk',
  'ggnggnggkgngnggk',
  'nggkggngkggnggnk',
  'gggkgnggkgnggkgn',
  'ggnkggggnggngkgn',
  'gngnggnggkggnkgk',
  'gnggkgnggkgngggk',
  'nggnkggngkgnggnk',
  'ggknggnggkggngkn',
  'gnggkgnggnggkgnk',
  'ngggknggnggnkggk',
  'kkgknkkgkkngkkkk',
  'kkkkkkkkkkkkkkkk',
]);
// sect architecture: glazed teal roofs, vermilion pillars, gilt
const SECT_MAP = { U: 'A', u: 'd', b: 'R', T: 'r', t: 'o', P: 'P', p: 'p' };
for (const n of ['roofA_l', 'roofA_m', 'roofA_r', 'roofB_l', 'roofB_m', 'roofB_r', 'wallU_l', 'wallU_m', 'wallU_r', 'wallD_l', 'wallD_m', 'wallD_r', 'window', 'window_round', 'doorU', 'doorD']) {
  const o = Object.assign({}, TILES[n]); delete o.rows;
  tile('sect_' + n, recolor(TILES[n].rows, SECT_MAP), o);
}
// 山门 archway (5 wide x 4 tall), the middle bay is walkable
bigTile('gate', [
  '................................................................................',
  '.........KKKK.....................................................KKKK..........',
  '........KAAAAK...................................................KAAAAK.........',
  '.......KAdAdAAKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKAAdAdAK.......',
  '......KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK......',
  '.....KAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAdAAK.....',
  '....KWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWK...',
  '...KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
  '...KdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdKKdK..',
  '....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...',
  '........KrrK................KKKKKKKKKKKKKKKKKKKKKKK.................KrrK........',
  '........KrRK................KyyyyyyyyyyyyyyyyyyyyyK................KrRK.........',
  '........KrRK................KyKKKKKKKKKKKKKKKKKKKyK................KrRK.........',
  '........KrRK................KyKbbbbbbbbbbbbbbbbbKyK................KrRK.........',
  '........KrRK................KyKbbbbbbbbbbbbbbbbbKyK................KrRK.........',
  '........KrRK................KyKbbbbbbbbbbbbbbbbbKyK................KrRK.........',
  '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKyKbbbbbbbbbbbbbbbbbKyKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.',
  '.KAdAdAdAdAdAdAdAdAdAdAdAdAKKKKKKKKKKKKKKKKKKKKKKKKAdAdAdAdAdAdAdAdAdAdAdAdAdK..',
  '.KWWWWWWWWWWWWWWWWWWWWWWWWWWKKrK.................KrKKWWWWWWWWWWWWWWWWWWWWWWWWWK.',
  '..KKKKKKKKKKKKKKKKKKKKKKKKKKKKrK.................KrKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '........KrRK.................KrRK...............KrRK................KrRK........',
  '.......KgggnK...............KgggnK.............KgggnK..............KgggnK.......',
  '.......KKKKKK...............KKKKKK.............KKKKKK..............KKKKKK.......',
], (tx, ty) => (ty <= 1 ? { over: true } : tx === 2 ? {} : { solid: true }));
bigTile('bell', [
  '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.',
  'KAdAdAdAdAdAdAdAdAdAdAdAdAdAdAAK',
  '.KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK.',
  '..KrK.........KKKK.........KrK..',
  '..KrK........KyyyyK........KrK..',
  '..KrK.......KYyyyyyK.......KrK..',
  '..KrK......KYyOyyyyyK......KrK..',
  '..KrK......KYyyyyyyyK......KrK..',
  '..KrK......KYKKKKKKyK......KrK..',
  '..KrK......KYyyyyyyyK......KrK..',
  '..KrK.....KYYyyyyyyyyK.....KrK..',
  '..KrK.....KYyyyyyyyyyK.....KrK..',
  '..KrK....KKKKKKKKKKKKKK....KrK..',
  '..KrK.....................KrK...',
  '.KgggnK..................KgggnK.',
  '.KKKKKK..................KKKKKK.',
  '................................', '................................', '................................', '................................',
  '................................', '................................', '................................', '................................',
  '................................', '................................', '................................', '................................',
  '................................', '................................', '................................', '................................',
], { solid: true });
tile('dummy', [
  '................',
  '......KKKK......',
  '.....KzzzzK.....',
  '.....KzKzzK.....',
  '.....KzzzzK.....',
  '......KKKK......',
  '...KKKKbbKKKK...',
  '..KzzzzbbzzzzK..',
  '...KKKKbbKKKK...',
  '......KbbK......',
  '.....KzzzzK.....',
  '.....KzzazK.....',
  '......KbbK......',
  '......KbbK......',
  '.....KKbbKK.....',
  '....wwwwwwww....',
], { solid: true });
tile('censer', [
  '................',
  '......g..g......',
  '.......g..g.....',
  '......g..g......',
  '...KKKKKKKKKK...',
  '..KyYyyyyyyYyK..',
  '..KKKKKKKKKKKK..',
  '...KYyyyyyyYK...',
  '...KYyyRRyyYK...',
  '...KYyyyyyyYK...',
  '....KYYYYYYK....',
  '....KK....KK....',
  '...KYK....KYK...',
  '...KKK....KKK...',
  '..wwwwwwwwwwww..',
  '................',
], { solid: true });

// ---------------- 寒潭 ----------------
tile('cavefloor', noiseRows('w', [['i', 9], ['x', 6]], 83), {});
tile('cavefloor2', noiseRows('w', [['i', 6], ['x', 4], ['c', 3]], 89), {});
tile('ice', [
  'cccccccccccccccc',
  'cWWcccccccccccWc',
  'cWccccccccccccWc',
  'ccccccCccccccccc',
  'cccccCcccccccccc',
  'ccccCcccccWccccc',
  'cccccccccWcccccc',
  'cccccccccccccccc',
  'ccWcccccccccccCc',
  'cWccccccccccCCcc',
  'cccccccCcccccccc',
  'cccccccCCccccccc',
  'cccccccccCcccccc',
  'cccccccccccccWcc',
  'ccccccccccccWccc',
  'cccccccccccccccc',
], { ice: true });
tile('ice_hole', [
  'cccccccccccccccc',
  'ccccccccccccccWc',
  'ccccKKKKKKKKcccc',
  'cccKDDDDDDDDKccc',
  'ccKDBBBBBBBBDKcc',
  'cKDBBBBBCBBBBDKc',
  'cKDBBBCBBBBBBDKc',
  'cKDBBBBBBBBBBDKc',
  'cKDBBBBBBBCBBDKc',
  'cKDBBCBBBBBBBDKc',
  'ccKDBBBBBBBBDKcc',
  'cccKDDDDDDDDKccc',
  'ccccKKKKKKKKcccc',
  'cccccccccccccccc',
  'cWcccccccccccccc',
  'cccccccccccccccc',
], { solid: true });
tile('cave_wall', Array(16).fill('D'.repeat(16)), { wall: 'cave', solid: true, rim: 'B' });
tile('cave_top', noiseRows('N', [['D', 18], ['U', 6]], 97));
tile('cave_face', [
  'DDDDBDDDDDBDDDDD',
  'DBBDBBDDBBBDBBDD',
  'BBCBBBBDBCBBBBDB',
  'BCcCBBBBCcCBBBBB',
  'BCcCBDBBCcCBBDBB',
  'BBCBBBBBBCBBBBBC',
  'BBBBBCBBBBBBCBBC',
  'DBBBCcCBBDBCcCBB',
  'BBBBCcCBBBBCcCBB',
  'BBDBBCBBBBBBCBBB',
  'BBBBBBBBDBBBBBDB',
  'DBBBBBDBBBBBBBBB',
  'cBcBBcBcBcBBcBcB',
  'WcWcWWcWcWcWWcWc',
  '.c.W.c..c.W..c.W',
  '.W..W...W....W..',
].map((r) => r.replace(/\./g, 'w')));
tile('crystal', [
  '................',
  '........K.......',
  '.......KWK......',
  '.......KWcK.....',
  '...K...KWcK.....',
  '..KWK..KWcCK..K.',
  '..KWcK.KWcCK.KWK',
  '..KWcK.KWcCKKWcK',
  '..KWcCKKWcCKKWcK',
  '..KWcCKKWcCKKWcK',
  '...KcCKKWcCKKcCK',
  '...KcCKKWcCKKcK.',
  '...KKKKKcCCKKKK.',
  '..KKKKKKKKKKKKK.',
  '..iiiiiiiiiiiii.',
  '................',
], { solid: true, glow: true });
tile('boulder', [
  '................',
  '.....KKKKKK.....',
  '...KKwWWWwwKK...',
  '..KwWWWWWwwgnK..',
  '.KwWWwwwwwggnnK.',
  '.KwWwwwwwggggnK.',
  'KwwwwwwwgggggnnK',
  'KwwwwwgggggggnnK',
  'KgwwwggggggggnnK',
  'KggggggggggggnnK',
  'KgggggggggggnnnK',
  '.KgggggggggnnnK.',
  '.KnngggggnnnnnK.',
  '..KKnnnnnnnnKK..',
  '....KKKKKKKK....',
  '................',
]);
tile('icicle_deco', [
  'KKKKKKKKKKKKKKKK',
  'KcWKcWcKKcWKKcWK',
  '.KcK.KcK.KWK.KcK',
  '.KcK..KK.KcK..K.',
  '..K.......KK....',
  '................', '................', '................', '................', '................',
  '................', '................', '................', '................', '................', '................',
], { decal: true });

// ---------------- 镇妖塔 ----------------
tile('tfloor', [
  'kkkkkkkKkkkkkkkK',
  'knnnnnnKknnnnnnK',
  'knkkkkkKknkkkkkK',
  'knkkkkkKknkkkkkK',
  'knkkkkkKknkkkkkK',
  'knkkkkkKknkkfkkK',
  'knkkkkkKknkkkkkK',
  'KKKKKKKKKKKKKKKK',
  'kkkKkkkkkkkKkkkk',
  'nnnKknnnnnnKknnn',
  'kkkKknkkkkkKknkk',
  'kkkKknkkkkkKknkk',
  'kfkKknkkkkkKknkk',
  'kkkKknkkkkkKknkk',
  'kkkKknkkkkkKknkk',
  'KKKKKKKKKKKKKKKK',
]);
const SEAL_ROWS = [
  'kkkkkKKKKKKkkkkk',
  'kkkKKRRRRRRKKkkk',
  'kkKRRkkkkkkRRKkk',
  'kKRkkkkYYkkkkRKk',
  'kKRkkYkkkkYkkRKk',
  'KRkkYkkYYkkYkkRK',
  'KRkkkkYYYYkkkkRK',
  'KRkYkYYRRYYkYkRK',
  'KRkYkYYRRYYkYkRK',
  'KRkkkkYYYYkkkkRK',
  'KRkkYkkYYkkYkkRK',
  'kKRkkYkkkkYkkRKk',
  'kKRkkkkYYkkkkRKk',
  'kkKRRkkkkkkRRKkk',
  'kkkKKRRRRRRKKkkk',
  'kkkkkKKKKKKkkkkk',
];
tile('seal_off', SEAL_ROWS, { seal: true });
tile('seal_on', recolor(SEAL_ROWS, { R: 'r', Y: 'y', k: 'k' }).map((r, y) => (y === 7 || y === 8 ? r.replace(/RR/, 'oo') : r)), { seal: true, glow: true });
tile('tower_wall', Array(16).fill('K'.repeat(16)), { wall: 'tower', solid: true, rim: 'f' });
tile('tower_top', noiseRows('K', [['k', 6]], 101));
tile('tower_face', [
  'fffffffKffffffffK'.slice(0, 16),
  'RRRRRRRKRRRRRRRK',
  'RrRRRRRKRrRRRRRK',
  'RRRRRRRKRRRRRRRK',
  'KKKKKKKKKKKKKKKK',
  'RRRKRRRRRRRKRRRR',
  'RRRKRrRRRRRKRrRR',
  'RRRKRRRRRRRKRRRR',
  'KKKKKKKKKKKKKKKK',
  'RRRRRRRKRRRRRRRK',
  'RrRRRRRKRrRRRRRK',
  'RRRRRRRKRRRRRRRK',
  'KKKKKKKKKKKKKKKK',
  'ffffffffffffffff',
  'kkkkkkkkkkkkkkkk',
  'KKKKKKKKKKKKKKKK',
]);
bigTile('pillar', [
  '..KKKKKKKKKKKK..',
  '..KyyyyyyyyyyK..',
  '..KKKKKKKKKKKK..',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '...KRrRRRRRfK...',
  '..KKKKKKKKKKKK..',
  '..KyyyyyyyyyyK..',
  '..KKKKKKKKKKKK..',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
], (tx, ty) => (ty === 0 ? { over: true } : { solid: true }));
tile('brazier', [
  '................',
  '.......r........',
  '......ror.......',
  '.....royor......',
  '.....oyOyo......',
  '....royOyor.....',
  '...KKKKKKKKKK...',
  '...KyYYYYYYyK...',
  '....KKKKKKKK....',
  '.....KkkkkK.....',
  '......KkkK......',
  '......KkkK......',
  '.....KkkkkK.....',
  '....KKKKKKKK....',
  '................',
  '................',
], { solid: true, glow: true });
TILES.brazier.frames = [TILES.brazier.rows, [
  '................',
  '........r.......',
  '.......ror......',
  '......royo......',
  '.....royOyr.....',
  '....roOyOyor....',
  '...KKKKKKKKKK...',
  '...KyYYYYYYyK...',
  '....KKKKKKKK....',
  '.....KkkkkK.....',
  '......KkkK......',
  '......KkkK......',
  '.....KkkkkK.....',
  '....KKKKKKKK....',
  '................',
  '................',
]];
TILES.brazier.animSpeed = 10;
tile('sealdoor', [
  'KKKKKKKKKKKKKKKK',
  'KRRRRRRRRRRRRRRK',
  'KRfKKKKKKKKKKfRK',
  'KRKyyyyyyyyyyKRK',
  'KRKyrrrrrrrryKRK',
  'KRKyrKKKKKKryKRK',
  'KRKyrKyyyyKryKRK',
  'KRKyrKyrryKryKRK',
  'KRKyrKyrryKryKRK',
  'KRKyrKyyyyKryKRK',
  'KRKyrKKKKKKryKRK',
  'KRKyrrrrrrrryKRK',
  'KRKyyyyyyyyyyKRK',
  'KRfKKKKKKKKKKfRK',
  'KRRRRRRRRRRRRRRK',
  'KKKKKKKKKKKKKKKK',
], { solid: true });
tile('chain_deco', [
  '.......K........',
  '......KgK.......',
  '.......K........',
  '......KgK.......',
  '.......K........',
  '......KgK.......',
  '.......K........',
  '......KgK.......',
  '................', '................', '................', '................',
  '................', '................', '................', '................',
], { decal: true });

// ---------------- 剑冢 ----------------
tile('ash', noiseRows('k', [['n', 10], ['K', 6]], 113));
tile('ash2', (() => { const r = noiseRows('k', [['n', 8], ['K', 5]], 127); return patch16(r, 3, 8, ['RR....', '..RRR.', '....RR']); })());
tile('ash3', (() => { const r = noiseRows('k', [['n', 8]], 131); return patch16(r, 6, 6, ['.zz.', 'zKKz', '.zz.']); })());
tile('tomb_wall', Array(16).fill('K'.repeat(16)), { wall: 'tomb', solid: true, rim: 'R' });
tile('tomb_top', noiseRows('K', [['Z', 8], ['f', 3]], 139));
tile('tomb_face', [
  'ZZZZKZZZZZKZZZZZ',
  'ZQZZKZZQZZKZZZQZ',
  'ZZZKZZZZZKZZZZZZ',
  'ZZZKZZfZZKZZZZZZ',
  'ZZZZKZZfZZKZZfZZ',
  'KZZZZKZZfZZKZZfZ',
  'ZKZZZZKZZZZZKZZZ',
  'ZZKZQZZKZZZQZKZZ',
  'ZZZKZZZZKZZZZZKZ',
  'ZZZZKZZZZKZZZZZK',
  'ZfZZZKZZZZKZZfZZ',
  'ZZfZZZKZZZZKZZfZ',
  'ZZZfZZZKZZZZKZZZ',
  'KKKKKKKKKKKKKKKK',
  'kkkkkkkkkkkkkkkk',
  'KKKKKKKKKKKKKKKK',
]);
tile('tsword1', [
  '.......KK.......',
  '......KyyK......',
  '.......KK.......',
  '.......KbK......',
  '.......KbK......',
  '....KKKKyKKKK...',
  '....KyyyyyyyK...',
  '....KKKKKKKKK...',
  '.......KWK......',
  '.......KWgK.....',
  '.......KWgK.....',
  '.......KWgK.....',
  '.......KWgK.....',
  '......KKKKKK....',
  '.....nkkkkkkn...',
  '................',
], { solid: true });
tile('tsword2', [
  '..........KK....',
  '.........KyyK...',
  '..........KbK...',
  '.........KbK....',
  '......KKKyKK....',
  '......KyyyyK....',
  '.......KKKK.....',
  '.......KgK......',
  '......KgnK......',
  '......KgnK......',
  '.....KgnK.......',
  '.....KgnK.......',
  '.....KKKK.......',
  '....nkkkkkn.....',
  '................',
  '................',
], { solid: true });
tile('tsword3', [
  '................',
  '................',
  '....KK..........',
  '...KyyK.........',
  '....KbK.........',
  '.....KbK........',
  '.....KKyKK......',
  '.....KyyyyK.....',
  '......KKKgK.....',
  '.........KgK....',
  '.........KgnK...',
  '..........KgK...',
  '..........KKK...',
  '.........nkkkn..',
  '................',
  '................',
], { solid: true });
tile('bones', [
  '................',
  '................',
  '................',
  '.....KKK........',
  '....KzzzK.......',
  '....KzKzK.......',
  '....KzzzK..KK...',
  '.....KzK..KzzK..',
  '..KK.....KzzK...',
  '.KzzKKKKKzzK....',
  '..KKzzzzzzK.....',
  '....KKKKKK......',
  '................',
  '................',
  '................',
  '................',
]);
tile('abyss', (() => noiseRows('K', [['Z', 4], ['Q', 2], ['N', 6]], 151))(), { solid: true });
bigTile('shrine', [
  '................................',
  '................................',
  '...............KK...............',
  '..............KcCK..............',
  '..............KWcK..............',
  '..............KWcK..............',
  '..............KWcK..............',
  '..............KWcK..............',
  '..............KWcK..............',
  '..............KWcK..............',
  '.............KKKKKK.............',
  '..........KKKKyyyyKKKK..........',
  '..........KyyyyOOyyyyK..........',
  '..........KKKKKyyKKKKK..........',
  '..............KbbK..............',
  '..............KRRK..............',
  '..............KbbK..............',
  '.......KKKKKKKKKKKKKKKKKK.......',
  '......KggggggggggggggggggK......',
  '.....KgwwwwwwwwwwwwwwwwwwgK.....',
  '.....KgwnnnnnnnnnnnnnnnnwgK.....',
  '.....KgwnKKnnKKnnKKnnKKnwgK.....',
  '.....KgwnnnnnnnnnnnnnnnnwgK.....',
  '.....KgggggggggggggggggggnK.....',
  '....KKKKKKKKKKKKKKKKKKKKKKKK....',
  '....KnnnnnnnnnnnnnnnnnnnnnnK....',
  '....KKKKKKKKKKKKKKKKKKKKKKKK....',
  '................................',
  '................................',
  '................................',
  '................................',
  '................................',
], { solid: true, glow: true });
// generic exit glyph on dark floors (stairs)
tile('tstairs_up', recolor(TILES.stairs_up.rows, { g: 'n', n: 'k' }));
tile('tstairs_down', TILES.stairs_down.rows);

// cold furnace + flickering hot furnace
(function () {
  const parts = BIG.furnace.parts;
  BIG.furnacec = { w: BIG.furnace.w, h: BIG.furnace.h, parts: [] };
  for (const p of parts) {
    const rows = TILES[p].rows;
    tile('c_' + p, recolor(rows, { O: 'n', y: 'k', o: 'k', R: 'K' }), { solid: true });
    BIG.furnacec.parts.push('c_' + p);
    TILES[p].frames = [rows, recolor(rows, { O: 'y', y: 'O' })];
    TILES[p].animSpeed = 12;
  }
})();

// ---------------- polish pieces ----------------
// 粉墙黛瓦: whitewashed boundary wall with a snowy tiled coping
tile('twall', [
  '................',
  'WWWWWWWWWWWWWWWW',
  'xWWxWWWxWWWxWWWx',
  'KKKKKKKKKKKKKKKK',
  'UuUUuUUuUUuUUuUU',
  'UUUUUUUUUUUUUUUU',
  'KUKKUKKUKKUKKUKK',
  'kkkkkkkkkkkkkkkk',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'pppppppppppppppp',
  'PPPPPPPPPPPPPPPP',
  'gngggnggggnggggn',
  'nnnnnnnnnnnnnnnn',
  'wwwwwwwwwwwwwwww',
], { solid: true });
// plaza variety for the sect
tile('court2', patch16(TILES.court.rows, 2, 9, ['.WWW.', 'WWWWW', '.xxx.']), { edge: 'snow' });
tile('court3', patch16(TILES.court.rows, 9, 2, ['n..', '.n.', '.nn', '..n']), { edge: 'snow' });
bigTile('emblem', (() => {
  // a carved cloud roundel spanning 2x2 slabs, drawn procedurally
  const rows = [];
  for (let y = 0; y < 32; y++) {
    let r = '';
    for (let x = 0; x < 32; x++) {
      const dx = x - 15.5, dy = y - 15.5, d = Math.sqrt(dx * dx + dy * dy);
      let c = (x % 16 === 15 || y % 16 === 15) ? 'g' : (x % 16 === 0 || y % 16 === 0) ? 'x' : 'w';
      if (d < 14.5 && d > 12.5) c = 'n';
      else if (d <= 12.5) {
        c = 'g';
        const a = Math.atan2(dy, dx);
        // taiji-like swirl: two interlocking halves
        const s = Math.sin(a * 1 + d * 0.32);
        if (s > 0.35) c = 'w';
        if (d < 2.2) c = 'n';
        if (Math.abs(d - 7) < 0.7 && s <= 0.35) c = 'n';
      }
      r += c;
    }
    rows.push(r);
  }
  return rows;
})(), { flat: true });
// 巨剑: a greatsword driven into the ash (1x2)
bigTile('greatsword', [
  '......KKKK......',
  '.....KyOyyK.....',
  '......KyyK......',
  '.......KK.......',
  '......KbbK......',
  '......KRbK......',
  '......KbRK......',
  '......KRbK......',
  '..KKKKKyyKKKKK..',
  '.KyyYyyOyyyYyyK.',
  '..KKKKKKKKKKKK..',
  '.....KWWwgK.....',
  '.....KWWwgK.....',
  '.....KWwwgK.....',
  '.....KWwwgK.....',
  '.....KWwggK.....',
  '.....KWwwgK.....',
  '.....KWwggK.....',
  '.....KwwggK.....',
  '.....KWwggK.....',
  '.....KwwgnK.....',
  '.....KwggnK.....',
  '....KKKKKKKK....',
  '...nkKkkkkKkn...',
  '..nkkkkkkkkkkn..',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
], (tx, ty) => (ty === 0 ? { over: true } : { solid: true }));
// frozen lake: autotiled like water, icy colours, impassable
tile('lake', [
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBcBBBBBBBBBBBB',
  'BBBBccBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBDDBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BDDBBBBBBBBBBBBB',
  'BBBBBBBBBWcBBBBB',
  'BBBBBBBBBBBcBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBDDBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
  'BBBBBBBBBBBBBBBB',
], { solid: true, water: true, anim: 'shift', lip: ['w', 'i', 'D'] });
