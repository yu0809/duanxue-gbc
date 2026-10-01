'use strict';
// ============================================================
//  Bitmap font — glyphs baked from Fusion Pixel 12px (OFL 1.1)
// ============================================================
const Font = (() => {
  const { chars, widths, bits } = FONT_DATA;
  const bin = atob(bits);
  const idx = new Map();
  const list = Array.from(chars);
  list.forEach((ch, i) => idx.set(ch, i));
  const cache = new Map();
  const LH = 12;

  function rowsOf(i) {
    const out = [];
    for (let r = 0; r < 12; r++) {
      const o = i * 24 + r * 2;
      out.push((bin.charCodeAt(o) << 8) | bin.charCodeAt(o + 1));
    }
    return out;
  }
  function width(ch) {
    const i = idx.get(ch);
    if (i === undefined) return ch.charCodeAt(0) < 128 ? 6 : 12;
    return widths[i] === 'c' ? 12 : +widths[i];
  }
  function glyph(ch, color) {
    const key = ch + color;
    let c = cache.get(key);
    if (c) return c;
    const i = idx.get(ch);
    c = makeCanvas(12, 12);
    if (i !== undefined) {
      const x = c.getContext('2d');
      const img = x.createImageData(12, 12);
      const [R, G, B] = hexToRgb(color);
      const rows = rowsOf(i);
      for (let y = 0; y < 12; y++) for (let xx = 0; xx < 12; xx++) {
        if (rows[y] & (1 << (15 - xx))) {
          const p = (y * 12 + xx) * 4;
          img.data[p] = R; img.data[p + 1] = G; img.data[p + 2] = B; img.data[p + 3] = 255;
        }
      }
      x.putImageData(img, 0, 0);
    }
    cache.set(key, c);
    return c;
  }
  function draw(g, str, x, y, color = '#181820') {
    let cx = x;
    for (const ch of str) {
      if (ch === '\n') { cx = x; y += LH + 1; continue; }
      if (ch !== ' ' && ch !== '　') g.drawImage(glyph(ch, color), cx, y);
      cx += width(ch);
    }
    return cx - x;
  }
  function measure(str) {
    let w = 0, best = 0;
    for (const ch of str) {
      if (ch === '\n') { best = Math.max(best, w); w = 0; continue; }
      w += width(ch);
    }
    return Math.max(best, w);
  }
  function drawOutlined(g, str, x, y, color, outline = '#181820') {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) draw(g, str, x + dx, y + dy, outline);
    return draw(g, str, x, y, color);
  }
  function drawShadow(g, str, x, y, color, shadow) {
    draw(g, str, x + 1, y + 1, shadow);
    return draw(g, str, x, y, color);
  }
  function drawCenter(g, str, cx, y, color, outline) {
    const w = measure(str);
    if (outline) return drawOutlined(g, str, Math.round(cx - w / 2), y, color, outline);
    return draw(g, str, Math.round(cx - w / 2), y, color);
  }
  // Chinese line-breaking with simple kinsoku: never start a line with closing punctuation.
  const NO_START = '，。！？：；、”’）》」』…—~～,.!?:;)';
  function wrap(text, maxW) {
    const out = [];
    for (const para of text.split('\n')) {
      let line = '', w = 0;
      const chs = Array.from(para);
      for (let i = 0; i < chs.length; i++) {
        const ch = chs[i];
        const cw = width(ch);
        if (w + cw > maxW && line) {
          if (NO_START.includes(ch)) { // pull last char down with it
            const arr = Array.from(line);
            const last = arr.pop();
            out.push(arr.join(''));
            line = last + ch; w = width(last) + cw;
            continue;
          }
          out.push(line); line = ''; w = 0;
        }
        line += ch; w += cw;
      }
      out.push(line);
    }
    return out;
  }
  return { draw, measure, wrap, width, drawOutlined, drawShadow, drawCenter, LH, has: (ch) => idx.has(ch) };
})();
