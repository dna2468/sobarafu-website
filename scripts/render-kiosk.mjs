// Render kiosk HTML pages to high-resolution PNG images via headless Chrome.
// Usage:
//   node scripts/render-kiosk.mjs                 # render all default targets
//   node scripts/render-kiosk.mjs welcome         # render only kiosk/welcome.html → kiosk/welcome.png

import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..');
const KIOSK_DIR = path.join(SITE_ROOT, 'kiosk');

// width × height (px). 縦長の食券機画面想定
const TARGETS = [
  { name: 'welcome', width: 1080, height: 1920 },
];

async function main() {
  const filter = process.argv[2];
  const targets = filter ? TARGETS.filter(t => t.name === filter) : TARGETS;
  if (!targets.length) {
    console.error(`No target named "${filter}". Available: ${TARGETS.map(t => t.name).join(', ')}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (const t of targets) {
      const htmlPath = path.join(KIOSK_DIR, `${t.name}.html`);
      const outPath = path.join(KIOSK_DIR, `${t.name}.png`);
      if (!existsSync(htmlPath)) {
        console.error(`[skip] ${htmlPath} not found`);
        continue;
      }
      const fileUrl = 'file://' + htmlPath.replace(/\\/g, '/');
      console.log(`[${t.name}] ${t.width}×${t.height}px`);

      const page = await browser.newPage();
      await page.setViewport({
        width: t.width,
        height: t.height,
        deviceScaleFactor: 1,
      });
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });
      // Give web fonts a moment to render fully
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({
        path: outPath,
        type: 'png',
        clip: { x: 0, y: 0, width: t.width, height: t.height },
        omitBackground: false,
      });
      await page.close();
      console.log(`  ✓ wrote ${path.relative(SITE_ROOT, outPath)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
