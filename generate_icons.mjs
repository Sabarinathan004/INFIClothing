import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const SOURCE = 'public/INFI_Logo.png';

if (!existsSync(SOURCE)) {
  console.error(`ERROR: Source file not found: ${SOURCE}`);
  process.exit(1);
}

mkdirSync('public/icons', { recursive: true });
mkdirSync('public/splash', { recursive: true });
mkdirSync('src/app', { recursive: true });

const sourceBuffer = readFileSync(SOURCE);
const sourceMeta = await sharp(sourceBuffer).metadata();
console.log(`Source: ${sourceMeta.width}x${sourceMeta.height} ${sourceMeta.format}`);

// ─── Helper: logo centred on white background ────────────────────────────────
async function makeIconWhiteBg(size, paddingPct = 0.15) {
  const pad = Math.round(size * paddingPct);
  const inner = size - 2 * pad;

  const logoResized = await sharp(sourceBuffer)
    .resize(inner, inner, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoResized).metadata();
  const left = Math.round((size - logoMeta.width) / 2);
  const top = Math.round((size - logoMeta.height) / 2);

  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([{ input: logoResized, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// ─── Helper: white logo on dark navy splash ──────────────────────────────────
async function makeSplash(width, height, logoPct = 0.30) {
  const logoSize = Math.round(Math.min(width, height) * logoPct);

  // Invert logo: black → white (for dark background)
  const invertedLogo = await sharp(sourceBuffer)
    .resize(logoSize, logoSize, { fit: 'inside' })
    .negate({ alpha: false })   // invert RGB but keep alpha
    .png()
    .toBuffer();

  const logoMeta = await sharp(invertedLogo).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2);

  return sharp({
    create: { width, height, channels: 3, background: { r: 15, g: 10, b: 46 } }  // #0f0a2e
  })
    .composite([{ input: invertedLogo, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// ─── 1. PWA icons (white bg) ─────────────────────────────────────────────────
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const sz of iconSizes) {
  const buf = await makeIconWhiteBg(sz);
  const path = `public/icons/icon-${sz}x${sz}.png`;
  await sharp(buf).toFile(path);
  console.log(`✓ ${path}`);
}

// apple-touch-icon 180×180
const atcBuf = await makeIconWhiteBg(180);
await sharp(atcBuf).toFile('public/icons/apple-touch-icon.png');
console.log('✓ public/icons/apple-touch-icon.png');

// Static app dir icons (override TSX generators)
await sharp(atcBuf).toFile('src/app/apple-icon.png');
console.log('✓ src/app/apple-icon.png');

const fav32Buf = await makeIconWhiteBg(32);
await sharp(fav32Buf).toFile('src/app/icon.png');
console.log('✓ src/app/icon.png');

// ─── 2. public/logo.png (header / sidebar / login) ───────────────────────────
const logoBuf = await makeIconWhiteBg(512, 0.10);
await sharp(logoBuf).toFile('public/logo.png');
console.log('✓ public/logo.png');

// ─── 3. iOS Splash Screens ───────────────────────────────────────────────────
const splashes = [
  [640,  1136],   // iPhone SE
  [750,  1334],   // iPhone 6/7/8
  [828,  1792],   // iPhone XR/11
  [1125, 2436],   // iPhone X/XS
  [1170, 2532],   // iPhone 12/13
  [1179, 2556],   // iPhone 14 Pro
  [1242, 2208],   // iPhone 8 Plus
  [1284, 2778],   // iPhone 12/13 Pro Max
  [1290, 2796],   // iPhone 14 Pro Max
];

for (const [w, h] of splashes) {
  const buf = await makeSplash(w, h);
  const path = `public/splash/splash-${w}x${h}.png`;
  await sharp(buf).toFile(path);
  console.log(`✓ ${path}`);
}

console.log('\n✅ All icons and splash screens generated!');
