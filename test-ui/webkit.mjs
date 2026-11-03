// The app in Safari's engine (WebKit) on iPhone sizes, with touch. Not a real phone, but the same
// engine iOS uses. Defaults to the live site and only reads; MUTATE=1 also applies to a collab,
// so run that against a local app only:
//   npm run test:webkit
//   BASE_URL=http://localhost:5173 MUTATE=1 npm run test:webkit
import { mkdirSync } from 'node:fs';
import { devices, webkit } from 'playwright-core';

const BASE_URL = process.env.BASE_URL ?? 'https://collab-board.alasmawi.workers.dev';
const MUTATE = process.env.MUTATE === '1';
const SHOTS = process.env.SHOTS ?? 'test-ui/shots';
const PHONES = ['iPhone SE', 'iPhone 15', 'iPhone 15 Pro Max'];
const DEMO_PASSWORD = 'demo-password';

const ROUTES = {
  noor: ['/', '/collabs/col_saffron', '/me', '/profile', '/me/passes/req_brunch_noor'],
  barada: ['/business', '/business/collabs', '/business/creators', '/business/collabs/new',
    '/business/collabs/col_saffron'],
};

const failures = [];
let checked = 0;
const fail = (where, problem) => failures.push(`${where}: ${problem}`);
mkdirSync(SHOTS, { recursive: true });

/** Things that go wrong on iPhones in particular, read from the rendered page. */
async function inspect(page) {
  return page.evaluate(() => {
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const smallInputs = [...document.querySelectorAll('input, textarea, select')]
      .filter((el) => visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16)
      .map((el) => el.name || el.id || el.className);
    const smallTargets = [...document.querySelectorAll('.button, .icon-button, .tab-bar__link, .pill')]
      .filter(visible)
      .filter((el) => {
        const box = el.getBoundingClientRect();
        // A small button can reach further with an invisible ::after, as the AI button does.
        const after = getComputedStyle(el, '::after');
        const reach = after.content !== 'none' && after.position === 'absolute' ? -parseFloat(after.top) * 2 || 0 : 0;
        return Math.min(box.width, box.height) + reach < 40;
      })
      .map((el) => el.textContent.trim().slice(0, 20) || el.getAttribute('aria-label'));
    const bar = document.querySelector('.tab-bar, .action-bar');
    const barBottom = bar && visible(bar) ? Math.round(bar.getBoundingClientRect().bottom) : null;
    return {
      sideways: document.documentElement.scrollWidth - window.innerWidth,
      smallInputs,
      smallTargets,
      barBottom,
      innerHeight: window.innerHeight,
      // Fonts load only when text uses them, so only screens with a title need Ultra.
      titleFont:
        ![...document.querySelectorAll('body *')].some((el) => getComputedStyle(el).fontFamily.startsWith('Ultra')) ||
        document.fonts.check('24px Ultra'),
    };
  });
}

const browser = await webkit.launch();

for (const phone of PHONES) {
  for (const [account, routes] of Object.entries(ROUTES)) {
    const context = await browser.newContext({ ...devices[phone], reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const login = await context.request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: { username: account, password: DEMO_PASSWORD },
    });
    if (!login.ok()) {
      fail(`${phone} ${account}`, `login returned ${login.status()}`);
      await context.close();
      continue;
    }

    for (const route of routes) {
      const where = `${phone} ${account} ${route}`;
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const found = await inspect(page);
      checked++;
      if (found.sideways > 0) fail(where, `scrolls sideways by ${found.sideways}px`);
      if (found.smallInputs.length) fail(where, `inputs under 16px make iOS zoom in: ${found.smallInputs}`);
      if (found.smallTargets.length) fail(where, `tap targets under 40px: ${found.smallTargets}`);
      if (found.barBottom !== null && found.barBottom > found.innerHeight) {
        fail(where, `bottom bar is cut off (${found.barBottom} > ${found.innerHeight})`);
      }
      if (!found.titleFont) fail(where, 'Ultra title font did not load');
      await page.screenshot({ path: `${SHOTS}/${phone.replaceAll(' ', '-')}${route.replaceAll('/', '_') || '_'}.png` });
    }

    if (account === 'noor') {
      // A tap on a card opens it, the way a thumb would.
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await page.locator('.post-card').first().tap();
      await page.waitForURL(/\/collabs\//);
      checked++;

      const rail = page.locator('.pick-rail');
      if ((await rail.count()) && phone !== 'iPhone 15 Pro Max') {
        const swipes = await rail.evaluate((el) => el.scrollWidth > el.clientWidth);
        checked++;
        if (!swipes) fail(`${phone} picks`, 'the pick rail does not scroll sideways');
      }

      if (MUTATE) {
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
        await page.locator('.pick-card').first().tap();
        await page.getByRole('button', { name: 'Apply' }).tap();
        await page.locator('.starter').first().tap();
        await page.getByRole('button', { name: 'Send application' }).tap();
        const applied = page.locator('.action-bar__status .stamp');
        await applied.waitFor({ timeout: 5000 }).catch(() => fail(`${phone} apply`, 'no status after sending'));
        checked++;
        await page.screenshot({ path: `${SHOTS}/${phone.replaceAll(' ', '-')}_applied.png` });
      }
    }

    if (errors.length) fail(`${phone} ${account}`, `page errors: ${errors.join(' | ')}`);
    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.error(`${failures.length} problem(s) in ${checked} checks:\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`${checked} WebKit iPhone checks passed against ${BASE_URL}.`);
