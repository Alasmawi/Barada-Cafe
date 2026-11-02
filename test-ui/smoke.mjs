// Every route at phone widths in every preview state. Needs a running app:
//   npm run dev, then npm run test:ui
// Asserts no horizontal scroll, and that each failed screen offers a way forward.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
/** Reset needs the secret: from the environment, or from .dev.vars when running locally. */
const RESET_TOKEN =
  process.env.DEMO_RESET_TOKEN ??
  readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8').match(/^DEMO_RESET_TOKEN=(.+)$/m)?.[1];
const WIDTHS = [320, 360, 390, 768, 1280];
const MODES = ['normal', 'slow', 'error', 'empty'];

const ACCOUNTS = { creator: 'noor', business: 'barada' };
const DEMO_PASSWORD = 'demo-password';

const ROUTES = {
  creator: ['/', '/collabs/col_saffron', '/collabs/col_oud', '/collabs/col_missing', '/me', '/profile',
    '/me/passes/req_brunch_noor', '/me/passes/req_lastcup_noor'],
  business: ['/business', '/business/collabs', '/business/creators', '/business/collabs/new',
    '/business/collabs/col_saffron', '/business/collabs/col_saffron/edit', '/business/collabs/col_cupping'],
};

/** These screens show nothing from the server while they load, so they have no skeleton. */
const NO_REMOTE_DATA = ['/business/collabs/new', '/profile'];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const failures = [];
let checked = 0;

const reset = await fetch(`${BASE_URL}/api/v1/demo/reset`, {
  method: 'POST',
  headers: { 'X-Reset-Token': RESET_TOKEN ?? '' },
});
if (!reset.ok) throw new Error(`Demo reset failed with ${reset.status}. Is DEMO_RESET_TOKEN set?`);

for (const [role, routes] of Object.entries(ROUTES)) {
  for (const width of WIDTHS) {
    for (const mode of MODES) {
      const context = await browser.newContext({ viewport: { width, height: 780 } });
      await context.request.post(`${BASE_URL}/api/v1/auth/login`, {
        data: { username: ACCOUNTS[role], password: DEMO_PASSWORD },
      });
      await context.addInitScript((preview) => {
        sessionStorage.setItem('cb.preview', preview);
      }, mode);
      const page = await context.newPage();
      page.on('pageerror', (error) => failures.push(`${role} ${mode}: ${error.message}`));

      for (const route of routes) {
        const label = `${role} ${route} ${width}px ${mode}`;
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('main');
        // Slow is judged mid-load, where its skeleton shows. The others are judged once settled.
        await page.waitForTimeout(mode === 'slow' ? 300 : 500);

        const screen = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          skeletons: document.querySelectorAll('.skeleton').length,
          alert: document.querySelector('.message-state[role=alert]') !== null,
          retry: document.querySelector('.message-state .button') !== null,
        }));

        checked += 1;
        if (screen.overflow) failures.push(`${label}: scrolls sideways`);
        if (screen.alert && !screen.retry) failures.push(`${label}: error with no way forward`);
        if (mode === 'slow' && !NO_REMOTE_DATA.includes(route) && screen.skeletons === 0) {
          failures.push(`${label}: no skeleton while loading`);
        }
      }
      await context.close();
    }
  }
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`${checked} screens checked.`);
