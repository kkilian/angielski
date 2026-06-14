// make-icons.js — generuje ikony PNG bez zależności (własny enkoder PNG).
// Motyw: niebieskie tło akcentu + biały "play" (przycisk audio).
// Rozmiary: ekran główny iPhone (apple-touch 180) + okładka Media Session / manifest.
// Uruchom raz: `node tools/make-icons.js`. Pliki commitujemy jako statyczne assety.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'icons');

const ACCENT = [0x25, 0x63, 0xeb];
const WHITE = [255, 255, 255];

/* --- enkoder PNG (RGBA, 8 bit) --- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtr: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* --- rysowanie z 4× supersamplingiem (gładkie krawędzie) --- */
function triSign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}
function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = triSign(px, py, ax, ay, bx, by);
  const d2 = triSign(px, py, bx, by, cx, cy);
  const d3 = triSign(px, py, cx, cy, ax, ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
function render(size) {
  const s = 4, N = size * s;
  const hi = Buffer.alloc(N * N * 3);
  const c = N / 2, rd = 0.32 * N;
  const ax = c - 0.075 * N, ay1 = c - 0.13 * N, ay2 = c + 0.13 * N, tipx = c + 0.16 * N, tipy = c;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let col = ACCENT; // tło akcentu (full-bleed -> ładnie pod maską ikony)
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      if (dx * dx + dy * dy <= rd * rd) col = WHITE;                 // biały dysk
      if (inTriangle(x + 0.5, y + 0.5, ax, ay1, ax, ay2, tipx, tipy)) col = ACCENT; // play
      const o = (y * N + x) * 3;
      hi[o] = col[0]; hi[o + 1] = col[1]; hi[o + 2] = col[2];
    }
  }
  // downsample s×s -> RGBA (alpha 255)
  const out = Buffer.alloc(size * size * 4);
  const n = s * s;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
        const o = ((y * s + j) * N + (x * s + i)) * 3;
        r += hi[o]; g += hi[o + 1]; b += hi[o + 2];
      }
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n); out[o + 1] = Math.round(g / n); out[o + 2] = Math.round(b / n); out[o + 3] = 255;
    }
  }
  return out;
}

fs.mkdirSync(OUT, { recursive: true });
const sizes = [96, 128, 192, 256, 384, 512];
for (const size of sizes) {
  fs.writeFileSync(path.join(OUT, `icon-${size}.png`), encodePNG(size, render(size)));
}
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), encodePNG(180, render(180)));
console.log(`Ikony: ${sizes.map((s) => `icon-${s}`).join(', ')}, apple-touch-icon (180)`);
