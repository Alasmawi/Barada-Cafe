import { Hono } from 'hono';
import { DEMO_PASSWORD_HASH, lastResetAt, seed, seedIfEmpty } from '../demo/seed';
import type { AppEnv } from '../env';
import { DomainError } from '../http/errors';
import * as usersRepo from '../repositories/usersRepo';

/** The newest file in /migrations. Health fails if the deploy skipped a migration. */
const SCHEMA_VERSION = '0003_one_account_per_business_no_offers.sql';

/** Routes that run before anyone has chosen who they are. */
export const publicRoutes = new Hono<AppEnv>()
  .get('/health', async (c) => {
    const row = await c.env.DB.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1')
      .first<{ name: string }>()
      .catch(() => null);
    if (row?.name !== SCHEMA_VERSION) {
      throw new DomainError('SCHEMA_OUT_OF_DATE', 503, 'The database is out of date.');
    }
    return c.json({ ok: true, schema: row.name });
  })
  .get('/demo/accounts', async (c) => {
    await seedIfEmpty(c.env.DB);
    const [accounts, resetAt] = await Promise.all([
      usersRepo.listDemoAccounts(c.env.DB, DEMO_PASSWORD_HASH),
      lastResetAt(c.env.DB),
    ]);
    return c.json({ accounts, lastResetAt: resetAt });
  })
  .post('/demo/reset', async (c) => {
    await seed(c.env.DB);
    return c.json({ ok: true, lastResetAt: await lastResetAt(c.env.DB) });
  });
