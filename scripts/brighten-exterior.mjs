// Shop exterior: replace overcast grey sky with clear blue sky + sunny lighting,
// while preserving the building and sign exactly.
// Usage: node scripts/brighten-exterior.mjs

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(SITE_ROOT, '.env');

const { config: loadEnv } = await import('dotenv');
loadEnv({ path: ENV_PATH, override: true });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.error('ERROR: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

const MODEL = 'gemini-2.5-flash-image';
const SRC = path.join(SITE_ROOT, 'images-original/shop-exterior.jpg');
const OUT_JPG = path.join(SITE_ROOT, 'images/shop-exterior.jpg');
const OUT_WEBP = path.join(SITE_ROOT, 'images/shop-exterior.webp');

const PROMPT = `Task: enhance this Japanese yakisoba shop exterior photograph.

CHANGE:
- Replace the grey overcast sky with a clear bright blue sky featuring a few soft realistic white clouds. Cheerful, inviting, sunny afternoon atmosphere.
- Add warm bright afternoon sunlight cast naturally on the building — soft golden highlights on the concrete wall, gentle realistic natural shadows consistent with the sun direction.
- Lift the overall scene brightness so the shop feels welcoming and lively, as if photographed on a perfect sunny afternoon.
- The illuminated shop sign should look naturally lit, white background crisp, red characters more vibrant.

STRICT PRESERVATION (do not modify in any way — must remain pixel-faithful):
- The building architecture, concrete wall, tile pattern, joints, window frames — identical.
- The shop sign: the らふ roundel logo, the Japanese text "焼きそばスタンド らふ", typography, stroke widths, colors, character proportions, position and size — absolutely identical.
- The doorway, storefront entrance, any visible interior frames — identical.
- Overhead power lines on the right side: keep them visible as real urban details (do not remove, do not fabricate new ones).
- Camera angle, framing, crop, perspective, lens distortion — identical.

Output: photorealistic, bright, cheerful, sunny exterior of a small Japanese yakisoba stand in Nagoya.`;

const ai = new GoogleGenAI({ apiKey: API_KEY });

(async () => {
  console.log('Reading:', SRC);
  const srcBuf = await fs.readFile(SRC);
  const base64 = srcBuf.toString('base64');
  console.log(`Calling Gemini (${MODEL})...`);
  const start = Date.now();
  const res = await ai.models.generateContent({
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
  const parts = res.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imgPart) {
    const textPart = parts.find(p => p.text);
    throw new Error(`No image in response${textPart ? ` (text: ${textPart.text?.slice(0, 200)})` : ''}`);
  }
  const outBuf = Buffer.from(imgPart.inlineData.data, 'base64');
  console.log(`Received ${outBuf.length} bytes in ${elapsed}s`);

  await sharp(outBuf).jpeg({ quality: 90, mozjpeg: true }).toFile(OUT_JPG);
  await sharp(outBuf).webp({ quality: 87 }).toFile(OUT_WEBP);
  const m = await sharp(outBuf).metadata();
  console.log(`✓ Wrote ${path.relative(SITE_ROOT, OUT_JPG)} + webp (${m.width}x${m.height})`);
})().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
