import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Collab, RequestWithCollab, User } from '../src/shared/api';
import { REQUEST_STATUSES } from '../src/shared/status';
import { DEMO_PASSWORD } from '../src/worker/demo/seed';
import { accept, api, countHeldSpots, errorCode } from './helpers';

type AccountsBody = { accounts: User[]; lastResetAt: string | null };

const resetDemo = () => api('/demo/reset', { method: 'POST' });

describe('demo data', () => {
  it('seeds itself on first boot when the database is empty', async () => {
    await env.DB.batch(
      ['requests', 'collabs', 'users', 'businesses'].map((table) =>
        env.DB.prepare(`DELETE FROM ${table}`),
      ),
    );

    const response = await api('/demo/accounts');
    const { accounts, lastResetAt } = await response.json<AccountsBody>();

    expect(accounts.length).toBeGreaterThan(0);
    expect(lastResetAt).not.toBeNull();
  });

  it('gives Barada two staff and leaves a neighbour to show the cross-business rule', async () => {
    await resetDemo();

    const { accounts } = await (await api('/demo/accounts')).json<AccountsBody>();
    const staffByBusiness = Object.groupBy(
      accounts.filter(({ role }) => role === 'business'),
      ({ businessId }) => businessId!,
    );

    expect(staffByBusiness['biz_barada']).toHaveLength(2);
    expect(Object.keys(staffByBusiness).length).toBeGreaterThan(1);
  });

  it('gives Noor a request in every status', async () => {
    await resetDemo();

    const response = await api('/me/requests', { as: 'usr_noor' });
    const { requests } = await response.json<{ requests: RequestWithCollab[] }>();

    expect(new Set(requests.map(({ status }) => status))).toEqual(new Set(REQUEST_STATUSES));
  });

  it('seeds open, full and ended collabs, none over its spots', async () => {
    await resetDemo();

    const { results } = await env.DB.prepare('SELECT id, spots FROM collabs').all<{
      id: string;
      spots: number;
    }>();
    for (const { id, spots } of results) {
      expect(await countHeldSpots(id)).toBeLessThanOrEqual(spots);
    }

    const feed = await api('/collabs', { as: 'usr_noor' });
    const { collabs } = await feed.json<{ collabs: Collab[] }>();
    const mine = await api('/business/collabs', { as: 'usr_huda' });
    const barada = (await mine.json<{ collabs: Collab[] }>()).collabs;

    expect(collabs.map(({ state }) => state)).toContain('open');
    expect(collabs.map(({ state }) => state)).toContain('full');
    expect(barada.map(({ state }) => state)).toContain('ended');
  });

  it('has a last-cup collab ready for the two-staff race', async () => {
    await resetDemo();

    const responses = await Promise.all([
      accept('req_lastcup_noor', 'usr_huda'),
      accept('req_lastcup_salman', 'usr_yusuf'),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(await countHeldSpots('col_lastcup')).toBe(3);
  });

  it('puts everything back on reset, with fresh dates', async () => {
    await resetDemo();
    await accept('req_saffron_salman', 'usr_huda');
    await env.DB.prepare(`UPDATE collabs SET ends_on = '2000-01-01'`).run();

    await resetDemo();

    const response = await api('/collabs/col_saffron', { as: 'usr_huda' });
    const { collab } = await response.json<{ collab: Collab }>();
    expect(collab).toMatchObject({ state: 'open', spotsTaken: 2 });
  });
});

describe('resetting the demo', () => {
  it('leaves other people logged in', async () => {
    await api('/demo/reset', { method: 'POST' });
    const login = await api('/auth/login', { body: { username: 'noor', password: DEMO_PASSWORD } });
    const cookie = (login.headers.get('Set-Cookie') ?? '').split(';')[0]!;

    await api('/demo/reset', { method: 'POST' });

    expect((await api('/me', { cookie })).status).toBe(200);
  });

  it('removes people who signed up, and their business', async () => {
    await api('/demo/reset', { method: 'POST' });
    const signUp = await api('/auth/signup', {
      body: {
        role: 'business',
        username: 'temporary',
        password: 'correct horse',
        businessName: 'Temporary',
        area: 'Seef',
        businessType: 'Retail',
        house: 'coral',
      },
    });
    const cookie = (signUp.headers.get('Set-Cookie') ?? '').split(';')[0]!;

    await api('/demo/reset', { method: 'POST' });

    expect((await api('/me', { cookie })).status).toBe(401);
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM businesses WHERE name = ?')
      .bind('Temporary')
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it('puts demo creators back as they were', async () => {
    await api('/demo/reset', { method: 'POST' });
    await api('/me/socials', { as: 'usr_noor', method: 'PUT', body: { instagram: 'changed' } });

    await api('/demo/reset', { method: 'POST' });

    const me = await api('/me', { as: 'usr_noor' });
    const { user } = await me.json<{ user: User }>();
    expect(user.socials.instagram).toBe('noor.sips');
  });
});

describe('security headers', () => {
  it('are sent with every API response', async () => {
    const response = await api('/health');

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });
});

describe('health', () => {
  it('reports the schema version', async () => {
    const response = await api('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, schema: '0002_socials_and_post_details.sql' });
  });
});

describe('errors', () => {
  it('uses the error envelope for an unknown route', async () => {
    const response = await api('/nope', { as: 'usr_huda' });

    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe('NOT_FOUND');
  });
});
