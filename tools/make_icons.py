#!/usr/bin/env python3
"""App icons (PWA / home screen) drawn from the game's own pixel data:
the baked 断雪 brush calligraphy plus a vermilion 剑灵 seal in the pixel font."""
import base64, json, os, re, struct, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs')

def load_brush():
    src = open(os.path.join(ROOT, 'js', 'art_title.js'), encoding='utf-8').read()
    data = json.loads(src[src.index('{', src.index('const BRUSH')):src.index('};') + 1])
    rows = data['title'].split('|')
    w = max(len(r) for r in rows)
    return [r.ljust(w, '.') for r in rows]

def load_glyph(ch):
    src = open(os.path.join(ROOT, 'js', 'font_data.js'), encoding='utf-8').read()
    m = re.search(r'chars:"((?:[^"\\]|\\.)*)",widths:"([^"]*)",bits:"([^"]*)"', src)
    chars = json.loads('"' + m.group(1) + '"')
    bits = base64.b64decode(m.group(3))
    i = chars.index(ch)
    return [[(((bits[i * 24 + r * 2] << 8) | bits[i * 24 + r * 2 + 1]) >> (15 - x)) & 1 for x in range(12)] for r in range(12)]

def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

def hexc(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)] + [255]

def render(size):
    # logical canvas in game pixels: 96 x 96, scaled to `size`
    L = 96
    g = [[hexc('#141c38')] * L for _ in range(L)]
    def put(x, y, c):
        if 0 <= x < L and 0 <= y < L: g[y][x] = c
    # soft horizon bands
    for y in range(62, L):
        for x in range(L):
            g[y][x] = hexc('#1c2850') if y < 70 else hexc('#283460')
    for y in range(70, L):
        for x in range(L):
            if (x + y) % 2 == 0 and y < 72: g[y][x] = hexc('#1c2850')
    # snow mound
    for y in range(80, L):
        for x in range(L):
            g[y][x] = hexc('#d0d8e8') if y < 82 else hexc('#e8f0f8')
    brush = load_brush()
    bw, bh = len(brush[0]), len(brush)
    ox, oy = (L - (bw + 17)) // 2, 18
    white, ink, shadow = hexc('#f8f8f8'), hexc('#181820'), hexc('#203878')
    on = lambda x, y: 0 <= y < bh and 0 <= x < bw and brush[y][x] == '#'
    for y in range(-2, bh + 3):
        for x in range(-2, bw + 3):
            if on(x, y): put(ox + x, oy + y, white)
            elif on(x - 1, y) or on(x + 1, y) or on(x, y - 1) or on(x, y + 1): put(ox + x, oy + y, ink)
            elif on(x - 2, y - 2) or on(x - 1, y - 2): put(ox + x, oy + y, shadow)
    # vermilion seal with 剑 / 灵
    sx, sy = ox + bw + 1, oy + 10
    for y in range(30):
        for x in range(16):
            edge = x in (0, 15) or y in (0, 29)
            inner = x in (1, 14) or y in (1, 28)
            put(sx + x, sy + y, hexc('#d83830') if edge or not inner else hexc('#902020'))
    for k, ch in enumerate('剑灵'):
        gl = load_glyph(ch)
        for y in range(12):
            for x in range(12):
                if gl[y][x]: put(sx + 2 + x, sy + 3 + k * 12 + y, hexc('#f8f0d8'))
    # the sword in the snow
    for y in range(66, 82):
        put(48, y, hexc('#f8f8f8')); put(49, y, hexc('#98a8d0'))
    for x in range(44, 54): put(x, 65, hexc('#f8e060'))
    for y in range(60, 65): put(48, y, hexc('#902020')); put(49, y, hexc('#503020'))
    put(48, 59, hexc('#f8e060')); put(49, 59, hexc('#f8e060'))
    # scale up (nearest neighbour)
    px = bytearray(size * size * 4)
    for y in range(size):
        sy2 = y * L // size
        row = g[sy2]
        for x in range(size):
            c = row[x * L // size]
            i = (y * size + x) * 4
            px[i:i + 4] = bytes(c)
    return px

for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')]:
    png(os.path.join(OUT, name), size, size, render(size))
    print('wrote', name)
