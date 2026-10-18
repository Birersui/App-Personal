import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "www/icons");
mkdirSync(outDir, { recursive: true });

const CRC = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size, maskable) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const na = a / 255;
    buf[i] = Math.round(buf[i] * (1 - na) + r * na);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - na) + g * na);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - na) + b * na);
    buf[i + 3] = Math.max(buf[i + 3], a);
  };

  const bg = [15, 20, 28, 255];
  const radius = maskable ? 0 : size * 0.22;
  const inCorner = (x, y) => {
    if (radius <= 0) return false;
    const cx = Math.min(Math.max(x, radius), size - radius);
    const cy = Math.min(Math.max(y, radius), size - radius);
    return Math.hypot(x - cx, y - cy) > radius;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!inCorner(x, y)) set(x, y, bg);
    }
  }

  const pad = maskable ? size * 0.28 : size * 0.2;
  const area = size - pad * 2;
  const barW = area * 0.2;
  const gap = area * 0.1;
  const heights = [0.45, 0.7, 1.0];
  const colors = [
    [79, 140, 255, 255],
    [79, 140, 255, 255],
    [49, 196, 141, 255],
  ];
  const baseY = size - pad;
  const r = barW * 0.35;
  for (let b = 0; b < 3; b++) {
    const bx = pad + b * (barW + gap);
    const bh = area * heights[b];
    const by = baseY - bh;
    for (let y = Math.floor(by); y < baseY; y++) {
      for (let x = Math.floor(bx); x < bx + barW; x++) {
        const dxl = x - (bx + r);
        const dxr = x - (bx + barW - r);
        const dyt = y - (by + r);
        let inside = true;
        if (y < by + r) {
          if (dxl < 0) inside = Math.hypot(dxl, dyt) <= r;
          else if (dxr > 0) inside = Math.hypot(dxr, dyt) <= r;
        }
        if (inside) set(x, y, colors[b]);
      }
    }
  }

  const name = maskable ? "icon-maskable-512.png" : `icon-${size}.png`;
  writeFileSync(resolve(outDir, name), encodePNG(size, size, buf));
  console.log("icono:", name);
}

makeIcon(192, false);
makeIcon(512, false);
makeIcon(512, true);
