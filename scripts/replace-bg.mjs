// Menu photo background replacement via Gemini 2.5 Flash Image (Nano Banana).
// Usage:
//   cd sobarafu-website
//   node scripts/replace-bg.mjs                       # process all jpg in menu-photos/
//   node scripts/replace-bg.mjs <filename.jpg>        # process a single file
// Originals are backed up to menu-photos-original/ on first run.

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const PHOTO_DIR = path.join(SITE_ROOT, 'menu-photos');
const BACKUP_DIR = path.join(SITE_ROOT, 'menu-photos-original');
const ENV_PATH = path.join(SITE_ROOT, '.env');

// Reload .env from site root (dotenv/config loaded from CWD by default).
const { config: loadEnv } = await import('dotenv');
loadEnv({ path: ENV_PATH, override: true });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('ERROR: GEMINI_API_KEY is not set in .env');
  console.error('See .env.example for the format.');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';

// Food-focused center crop applied after generation.
// CROP_RATIO=0.78 keeps the central 78% of the image (22% removed total).
const CROP_RATIO = 0.78;
const CROP_Y_OFFSET = 0.02; // positive = nudge crop downward toward plate

async function cropToFood(buf) {
  const meta = await sharp(buf).metadata();
  const { width, height } = meta;
  const cw = Math.round(width * CROP_RATIO);
  const ch = Math.round(height * CROP_RATIO);
  const left = Math.max(0, Math.round((width - cw) / 2));
  const top = Math.max(0, Math.min(height - ch,
    Math.round((height - ch) / 2 + height * CROP_Y_OFFSET)
  ));
  return sharp(buf).extract({ left, top, width: cw, height: ch }).toBuffer();
}

const PROMPT = `Task: edit this food photograph.

CHANGE: Replace the dark/black studio background with a warm natural wooden counter (light oak or warm walnut, visible horizontal wood grain) in bright, cheerful natural daylight — high-key food photography lighting, airy and inviting, not moody. Add a gentle realistic (but soft/light) shadow of the plate on the wood. Very shallow depth-of-field background hinting at a cozy, intimate Japanese yakisoba-stand interior, without any distracting objects or text.

SIZZLE & APPETITE:
- If the dish is hot yakisoba, add a very subtle, restrained wisp of steam rising from the food (realistic, not dramatic).
- Slightly warmer overall color balance and a faint glossy highlight on the sauce — but do not oversaturate.

PRESERVE EXACTLY (do not modify in any way):
- The food itself: noodles, sauce, toppings, garnishes, portion, color, texture.
- The plate / bowl / utensils: same position, size, color, material.
- The camera angle and framing must remain identical.
- No re-rendering or re-arranging of any food element.

Output: photorealistic, appetizing food photography, high resolution.`;

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function ensureBackup(srcPath, backupPath) {
  try {
    await fs.stat(backupPath);
    // already backed up, keep original
    return false;
  } catch {
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.copyFile(srcPath, backupPath);
    return true;
  }
}

async function processImage(filename) {
  const jpgPath = path.join(PHOTO_DIR, filename);
  const webpPath = jpgPath.replace(/\.jpg$/i, '.webp');
  const jpgBackup = path.join(BACKUP_DIR, filename);
  const webpBackup = path.join(BACKUP_DIR, path.basename(webpPath));

  console.log(`\n[${filename}]`);

  // Backup originals (once)
  const didBackupJpg = await ensureBackup(jpgPath, jpgBackup);
  try { await ensureBackup(webpPath, webpBackup); } catch {}
  if (didBackupJpg) console.log(`  backed up to menu-photos-original/`);

  // Always read from the backup (so re-running uses the true original)
  const srcBuffer = await fs.readFile(jpgBackup);
  const base64 = srcBuffer.toString('base64');

  console.log(`  → calling Gemini (${MODEL})...`);
  const start = Date.now();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        { text: PROMPT },
      ],
    }],
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) {
    const textPart = parts.find(p => p.text);
    throw new Error(`No image in response${textPart ? ` (text: ${textPart.text?.slice(0, 200)})` : ''}`);
  }

  const outBuf = Buffer.from(imagePart.inlineData.data, 'base64');
  console.log(`  ← received ${outBuf.length} bytes in ${elapsed}s`);

  // Crop to food-focused center, brighten, then convert to JPG + WebP.
  const cropped = await cropToFood(outBuf);
  const brightened = await sharp(cropped).modulate({ brightness: 1.08 }).toBuffer();
  const meta = await sharp(brightened).metadata();
  await sharp(brightened).jpeg({ quality: 88, mozjpeg: true }).toFile(jpgPath);
  await sharp(brightened).webp({ quality: 85 }).toFile(webpPath);
  console.log(`  ✓ cropped to ${meta.width}x${meta.height} + brightened, wrote ${path.basename(jpgPath)} + ${path.basename(webpPath)}`);
}

async function main() {
  const target = process.argv[2];

  if (target) {
    await processImage(target);
    return;
  }

  const files = await fs.readdir(PHOTO_DIR);
  const jpgs = files.filter(f => f.toLowerCase().endsWith('.jpg')).sort();
  console.log(`Found ${jpgs.length} jpg files. Processing sequentially...`);

  for (const f of jpgs) {
    try {
      await processImage(f);
      // light rate-limit courtesy
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}`);
    }
  }
  console.log('\nAll done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
