const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ─── PNG encoder ────────────────────────────────────────────────────────────
function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) | 0;
}
function makeChunk(type, data) {
  const buf = Buffer.alloc(12 + data.length);
  buf.writeUInt32BE(data.length, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  buf.writeInt32BE(crc32(buf.slice(4, 8 + data.length)), 8 + data.length);
  return buf;
}
function buildPNG(w, h, rgba) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── High-res renderer (renders at size × superSample, then box-filters down)
function renderAtSize(targetSize, superSample = 4) {
  const hi = targetSize * superSample; // high-res canvas
  const cx = hi / 2, cy = hi / 2;

  // Keep logo within Android adaptive safe-zone (inner 66% of canvas)
  const safeR   = hi * 0.33;
  const outerR  = safeR * 0.92;
  const innerR  = safeR * 0.58;
  const strokeMid = (outerR + innerR) / 2;

  // Gap: 60° opening at ~1 o'clock (-48°)
  const gapCentreDeg = -48;
  const gapHalfDeg   = 30;

  // Red dot in the gap
  const dotAngle = (gapCentreDeg * Math.PI) / 180;
  const dotCx = cx + strokeMid * Math.cos(dotAngle);
  const dotCy = cy + strokeMid * Math.sin(dotAngle);
  const dotR  = (outerR - innerR) * 0.6;

  const ARC = { r: 26,  g: 28,  b: 46  }; // dark navy
  const DOT = { r: 235, g: 15,  b: 35  }; // Circles red

  function isInGap(deg) {
    let a  = ((deg % 360) + 360) % 360;
    let gc = ((gapCentreDeg % 360) + 360) % 360;
    let d  = Math.abs(a - gc);
    if (d > 180) d = 360 - d;
    return d < gapHalfDeg;
  }

  // Smooth AA coverage (half-pixel feather on both edges)
  function ringCov(dist) {
    if (dist >= outerR + 0.5 || dist <= innerR - 0.5) return 0;
    const o = dist > outerR - 0.5 ? (outerR + 0.5 - dist)        : 1;
    const i = dist < innerR + 0.5 ? (dist   - innerR + 0.5)      : 1;
    return clamp(Math.min(o, i), 0, 1);
  }
  function dotCov(dist) {
    if (dist >= dotR + 0.5) return 0;
    if (dist <= dotR - 0.5) return 1;
    return clamp(dotR + 0.5 - dist, 0, 1);
  }

  // Render high-res RGBA buffer
  const hiPx = Buffer.alloc(hi * hi * 4);
  for (let y = 0; y < hi; y++) {
    for (let x = 0; x < hi; x++) {
      let pr = 255, pg = 255, pb = 255, pa = 255; // white bg

      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const deg  = Math.atan2(dy, dx) * 180 / Math.PI;

      const rc = ringCov(dist);
      if (rc > 0 && !isInGap(deg)) {
        pr = Math.round(255 + (ARC.r - 255) * rc);
        pg = Math.round(255 + (ARC.g - 255) * rc);
        pb = Math.round(255 + (ARC.b - 255) * rc);
      }

      const ddx = x - dotCx, ddy = y - dotCy;
      const dc = dotCov(Math.sqrt(ddx * ddx + ddy * ddy));
      if (dc > 0) {
        pr = Math.round(pr + (DOT.r - pr) * dc);
        pg = Math.round(pg + (DOT.g - pg) * dc);
        pb = Math.round(pb + (DOT.b - pb) * dc);
      }

      const idx = (y * hi + x) * 4;
      hiPx[idx]     = clamp(pr, 0, 255);
      hiPx[idx + 1] = clamp(pg, 0, 255);
      hiPx[idx + 2] = clamp(pb, 0, 255);
      hiPx[idx + 3] = pa;
    }
  }

  // ── Box-filter downscale ──────────────────────────────────────────────────
  const outPx = Buffer.alloc(targetSize * targetSize * 4);
  const ss2 = superSample * superSample;
  for (let ty = 0; ty < targetSize; ty++) {
    for (let tx = 0; tx < targetSize; tx++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      const hy0 = ty * superSample, hx0 = tx * superSample;
      for (let sy = 0; sy < superSample; sy++) {
        for (let sx = 0; sx < superSample; sx++) {
          const idx = ((hy0 + sy) * hi + (hx0 + sx)) * 4;
          sr += hiPx[idx]; sg += hiPx[idx + 1]; sb += hiPx[idx + 2]; sa += hiPx[idx + 3];
        }
      }
      const oi = (ty * targetSize + tx) * 4;
      outPx[oi]     = Math.round(sr / ss2);
      outPx[oi + 1] = Math.round(sg / ss2);
      outPx[oi + 2] = Math.round(sb / ss2);
      outPx[oi + 3] = Math.round(sa / ss2);
    }
  }

  return buildPNG(targetSize, targetSize, outPx);
}

// ─── 1. Source assets (full res) ─────────────────────────────────────────────
const assets = path.join(__dirname, 'assets');
const src = renderAtSize(1024, 4); // 4096×4096 → box-filtered to 1024
fs.writeFileSync(path.join(assets, 'icon.png'),          src);
fs.writeFileSync(path.join(assets, 'circles.png'),       src);
fs.writeFileSync(path.join(assets, 'adaptive-icon.png'), src);
fs.writeFileSync(path.join(assets, 'splash.png'),        src);
console.log('✅ Source assets — 1024×1024 (4× supersampled)');

// ─── 2. Write directly into Android mipmap folders ───────────────────────────
const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Each mipmap folder gets its own perfectly-sized, supersampled icon
const mipmaps = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

for (const { folder, size } of mipmaps) {
  const dir = path.join(resDir, folder);
  if (!fs.existsSync(dir)) { console.warn(`⚠️  Skipped: ${folder}`); continue; }

  const png = renderAtSize(size, 4); // always 4× supersampled

  // Remove WebP, write PNG
  for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
    const webp = path.join(dir, `${name}.webp`);
    if (fs.existsSync(webp)) fs.unlinkSync(webp);
    fs.writeFileSync(path.join(dir, `${name}.png`), png);
  }

  console.log(`✅ ${folder} (${size}×${size} @ 4× SS → ${size * 4}×${size * 4} rendered)`);
}

console.log('\n🎉 All icons written with 4× supersampling — crisp at every density.');
console.log('   Connect device → npx expo run:android');
