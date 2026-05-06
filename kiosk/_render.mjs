import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, 'welcome.png');

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto('http://localhost:3000/kiosk/welcome.html', { waitUntil: 'networkidle' });
// Wait for fonts and image to settle
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: false, omitBackground: false });
await browser.close();
console.log('saved:', out);
