// Every route at phone widths in every preview state (PLAN §8). Needs a running app:
//   npm run dev, then npm run test:ui
// Asserts no horizontal scroll, and that each failed screen offers a way forward.
import { chromium } from 'playwright-core';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const WIDTHS = [360, 390];
const MODES = ['normal', 'slow', 'error', 'empty'];

const USERS = {
  creator: { id: 'usr_noor', name: 'Noor', role: 'creator', cafeId: null, avatarSeed: 'usr_noor' },
  staff: { id: 'usr_huda', name: 'Huda', role: 'cafe_staff', cafeId: 'caf_barada', avatarSeed: 'usr_huda' },
};

const ROUTES = {
  creator: ['/welcome', '/', '/collabs/col_saffron', '/collabs/col_missing', '/me',
    '/me/passes/req_brunch_noor', '/me/passes/req_lastcup_noor'],
  staff: ['/cafe', '/cafe/collabs/new', '/cafe/collabs/col_saffron',
    '/cafe/collabs/col_saffron/edit', '/cafe/collabs/col_cupping'],
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const failures = [];
let checked = 0;

await fetch(`${BASE_URL}/api/v1/demo/reset`, { method: 'POST' });

for (const [role, routes] of Object.entries(ROUTES)) {
  for (const width of WIDTHS) {
    for (const mode of MODES) {
      const context = await browser.newContext({ viewport: { width, height: 780 } });
      await context.addInitScript(
        ({ user, preview }) => {
          localStorage.setItem('finjan.user', JSON.stringify(user));
          sessionStorage.setItem('finjan.preview', preview);
        },
        { user: USERS[role], preview: mode },
      );
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
        if (mode === 'slow' && route !== '/cafe/collabs/new' && screen.skeletons === 0) {
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
