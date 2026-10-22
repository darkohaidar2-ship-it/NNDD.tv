const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SOURCE_IMAGE_PATH = 'C:/Users/Diwan-ashley/.gemini/antigravity/brain/c8b1be17-764e-4b58-83ca-04471f5f8ce0/.user_uploaded/media_1792654470381_1dc4d13a.png';

// -------------------------------------------------------------
// 1. CRC32 & PNG Encoding
// -------------------------------------------------------------
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // 8 bits per channel
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // scanlines with filter 0 (None)
  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(rawScanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// -------------------------------------------------------------
// 2. PNG Decoding with full filter support (None, Sub, Up, Avg, Paeth)
// -------------------------------------------------------------
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePng(buffer) {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Unsupported PNG: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const idatChunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const len = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') idatChunks.push(buffer.slice(offset + 8, offset + 8 + len));
    offset += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = 1 + width * 4;
  const rgba = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const prevRowOffset = (y - 1) * width * 4;
    const currRowOffset = y * width * 4;

    for (let x = 0; x < width * 4; x++) {
      const rawByte = raw[y * stride + 1 + x];
      const left = x >= 4 ? rgba[currRowOffset + x - 4] : 0;
      const up = y > 0 ? rgba[prevRowOffset + x] : 0;
      const upLeft = (y > 0 && x >= 4) ? rgba[prevRowOffset + x - 4] : 0;

      let val = rawByte;
      if (filter === 0) {
        val = rawByte;
      } else if (filter === 1) { // Sub
        val = (rawByte + left) & 0xff;
      } else if (filter === 2) { // Up
        val = (rawByte + up) & 0xff;
      } else if (filter === 3) { // Average
        val = (rawByte + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) { // Paeth
        val = (rawByte + paethPredictor(left, up, upLeft)) & 0xff;
      }
      rgba[currRowOffset + x] = val;
    }
  }

  return { width, height, rgba };
}

// -------------------------------------------------------------
// 3. Image Processing Helpers: Crop, Resize, Compose
// -------------------------------------------------------------
function cropImage(src, sx, sy, sw, sh) {
  const dst = Buffer.alloc(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    const srcY = sy + y;
    if (srcY < 0 || srcY >= src.height) continue;
    for (let x = 0; x < sw; x++) {
      const srcX = sx + x;
      if (srcX < 0 || srcX >= src.width) continue;
      const srcIdx = (srcY * src.width + srcX) * 4;
      const dstIdx = (y * sw + x) * 4;
      dst[dstIdx] = src.rgba[srcIdx];
      dst[dstIdx + 1] = src.rgba[srcIdx + 1];
      dst[dstIdx + 2] = src.rgba[srcIdx + 2];
      dst[dstIdx + 3] = src.rgba[srcIdx + 3];
    }
  }
  return { width: sw, height: sh, rgba: dst };
}

function resizeImageBilinear(src, targetW, targetH) {
  const dst = Buffer.alloc(targetW * targetH * 4);
  const xRatio = (src.width - 1) / Math.max(1, targetW - 1);
  const yRatio = (src.height - 1) / Math.max(1, targetH - 1);

  for (let y = 0; y < targetH; y++) {
    const sy = y * yRatio;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, src.height - 1);
    const yLerp = sy - y0;

    for (let x = 0; x < targetW; x++) {
      const sx = x * xRatio;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, src.width - 1);
      const xLerp = sx - x0;

      const idx00 = (y0 * src.width + x0) * 4;
      const idx10 = (y0 * src.width + x1) * 4;
      const idx01 = (y1 * src.width + x0) * 4;
      const idx11 = (y1 * src.width + x1) * 4;

      const outIdx = (y * targetW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = src.rgba[idx00 + c] * (1 - xLerp) + src.rgba[idx10 + c] * xLerp;
        const bottom = src.rgba[idx01 + c] * (1 - xLerp) + src.rgba[idx11 + c] * xLerp;
        dst[outIdx + c] = Math.round(top * (1 - yLerp) + bottom * yLerp);
      }
    }
  }
  return { width: targetW, height: targetH, rgba: dst };
}

function createCinemaDarkBackground(width, height) {
  const dst = Buffer.alloc(width * height * 4);
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / maxDist;
      
      // Left-to-right subtle cyan-to-amber color tint
      const xNorm = x / width;
      const r = Math.round(2 + xNorm * 8 + (1 - dist) * 12);
      const g = Math.round(6 + (1 - Math.abs(xNorm - 0.5) * 2) * 8 + (1 - dist) * 14);
      const b = Math.round(23 + (1 - xNorm) * 24 + (1 - dist) * 35);

      dst[idx] = Math.min(255, r);
      dst[idx + 1] = Math.min(255, g);
      dst[idx + 2] = Math.min(255, b);
      dst[idx + 3] = 255;
    }
  }
  return { width, height, rgba: dst };
}

function composeOverlay(bg, fg, offsetX, offsetY) {
  const result = Buffer.from(bg.rgba);
  for (let y = 0; y < fg.height; y++) {
    const dy = offsetY + y;
    if (dy < 0 || dy >= bg.height) continue;
    for (let x = 0; x < fg.width; x++) {
      const dx = offsetX + x;
      if (dx < 0 || dx >= bg.width) continue;

      const fgIdx = (y * fg.width + x) * 4;
      const bgIdx = (dy * bg.width + dx) * 4;

      const fa = fg.rgba[fgIdx + 3] / 255;
      if (fa <= 0) continue;

      const ba = result[bgIdx + 3] / 255;
      const outA = fa + ba * (1 - fa);

      if (outA > 0) {
        result[bgIdx] = Math.round((fg.rgba[fgIdx] * fa + result[bgIdx] * ba * (1 - fa)) / outA);
        result[bgIdx + 1] = Math.round((fg.rgba[fgIdx + 1] * fa + result[bgIdx + 1] * ba * (1 - fa)) / outA);
        result[bgIdx + 2] = Math.round((fg.rgba[fgIdx + 2] * fa + result[bgIdx + 2] * ba * (1 - fa)) / outA);
        result[bgIdx + 3] = Math.round(outA * 255);
      }
    }
  }
  return { width: bg.width, height: bg.height, rgba: result };
}

// -------------------------------------------------------------
// 4. Main Generator Routine
// -------------------------------------------------------------
async function run() {
  console.log('Loading source image:', SOURCE_IMAGE_PATH);
  const srcBuf = fs.readFileSync(SOURCE_IMAGE_PATH);
  const decoded = decodePng(srcBuf);
  console.log(`Decoded source: ${decoded.width}x${decoded.height}`);

  // 1. Save raw untouched logo to public/dabin-logo-raw.png
  fs.writeFileSync('public/dabin-logo-raw.png', srcBuf);
  console.log('Saved public/dabin-logo-raw.png');

  // 2. Find bounding box of visible pixels
  let minX = decoded.width, maxX = 0, minY = decoded.height, maxY = 0;
  for (let y = 0; y < decoded.height; y++) {
    for (let x = 0; x < decoded.width; x++) {
      const a = decoded.rgba[(y * decoded.width + x) * 4 + 3];
      if (a > 15) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(`Content bounding box: [${minX}, ${minY}] to [${maxX}, ${maxY}] (${maxX - minX + 1}x${maxY - minY + 1})`);

  // 3. Trimmed transparent logo with comfortable 16px padding
  const pad = 16;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(decoded.width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(decoded.height - cropY, (maxY - minY + 1) + pad * 2);

  const cropped = cropImage(decoded, cropX, cropY, cropW, cropH);
  console.log(`Cropped logo dimensions: ${cropped.width}x${cropped.height}`);
  const croppedPng = encodePng(cropped.width, cropped.height, cropped.rgba);

  // Write to public/dabin-logo.png, logo.png, dabin-tv-logo.png
  fs.writeFileSync('public/dabin-logo.png', croppedPng);
  fs.writeFileSync('public/logo.png', croppedPng);
  fs.writeFileSync('public/dabin-tv-logo.png', croppedPng);
  console.log('Saved public/dabin-logo.png, public/logo.png, public/dabin-tv-logo.png');

  // 4. Generate Square Icons (512x512, 192x192) on dark cinema background
  function makeSquareIcon(size) {
    const bg = createCinemaDarkBackground(size, size);
    // Fit cropped logo within 80% of width/height
    const maxDim = size * 0.82;
    const scale = Math.min(maxDim / cropped.width, maxDim / cropped.height);
    const targetW = Math.round(cropped.width * scale);
    const targetH = Math.round(cropped.height * scale);
    const resized = resizeImageBilinear(cropped, targetW, targetH);
    const ox = Math.round((size - targetW) / 2);
    const oy = Math.round((size - targetH) / 2);
    const composed = composeOverlay(bg, resized, ox, oy);
    return encodePng(size, size, composed.rgba);
  }

  const icon512Png = makeSquareIcon(512);
  fs.writeFileSync('public/icon-512.png', icon512Png);
  console.log('Saved public/icon-512.png');

  const icon192Png = makeSquareIcon(192);
  fs.writeFileSync('public/icon-192.png', icon192Png);
  console.log('Saved public/icon-192.png');

  // 5. Generate Android TV Banner (685x200)
  const bannerW = 685;
  const bannerH = 200;
  const bannerBg = createCinemaDarkBackground(bannerW, bannerH);
  const bannerScale = Math.min((bannerW * 0.75) / cropped.width, (bannerH * 0.82) / cropped.height);
  const bW = Math.round(cropped.width * bannerScale);
  const bH = Math.round(cropped.height * bannerScale);
  const bResized = resizeImageBilinear(cropped, bW, bH);
  const bOx = Math.round((bannerW - bW) / 2);
  const bOy = Math.round((bannerH - bH) / 2);
  const bannerComposed = composeOverlay(bannerBg, bResized, bOx, bOy);
  const bannerPng = encodePng(bannerW, bannerH, bannerComposed.rgba);

  const bannerDest = 'android/app/src/main/res/drawable/banner.png';
  if (fs.existsSync(path.dirname(bannerDest))) {
    fs.writeFileSync(bannerDest, bannerPng);
    console.log('Saved Android TV banner:', bannerDest);
  }

  // 6. Generate Android Mipmap Icons
  const mipmaps = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
  ];

  for (const m of mipmaps) {
    const dirPath = path.join('android/app/src/main/res', m.dir);
    if (fs.existsSync(dirPath)) {
      const pngData = makeSquareIcon(m.size);
      fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), pngData);
      fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), pngData);
      // For foreground, transparent background is fine
      const maxDim = m.size * 0.8;
      const s = Math.min(maxDim / cropped.width, maxDim / cropped.height);
      const fw = Math.round(cropped.width * s);
      const fh = Math.round(cropped.height * s);
      const fResized = resizeImageBilinear(cropped, fw, fh);
      const transBg = { width: m.size, height: m.size, rgba: Buffer.alloc(m.size * m.size * 4) };
      const fox = Math.round((m.size - fw) / 2);
      const foy = Math.round((m.size - fh) / 2);
      const fComp = composeOverlay(transBg, fResized, fox, foy);
      fs.writeFileSync(path.join(dirPath, 'ic_launcher_foreground.png'), encodePng(m.size, m.size, fComp.rgba));
      console.log(`Saved Android icons in ${m.dir} (${m.size}x${m.size})`);
    }
  }

  console.log('✅ ALL BRAND ASSETS GENERATED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Error generating brand assets:', err);
  process.exit(1);
});
