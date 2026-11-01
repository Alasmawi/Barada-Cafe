import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Collab, RequestWithCollab, User } from '../src/shared/api';
import { REQUEST_STATUSES } from '../src/shared/status';
import { accept, api, countHeldSpots, errorCode } from './helpers';

type UsersBody = { users: User[]; lastResetAt: string | null };

const resetDemo = () => api('/demo/reset', { method: 'POST' });

describe('demo data', () => {
  it('seeds itself on first boot when the database is empty', async () => {
    await env.DB.batch(
      ['requests', 'collabs', 'users', 'cafes'].map((table) =>
        env.DB.prepare(`DELETE FROM ${table}`),
      ),
    );

    const response = await api('/users');
    const { users, lastResetAt } = await response.json<UsersBody>();

    expect(users.length).toBeGreaterThan(0);
    expect(lastResetAt).not.toBeNull();
  });

  it('gives Barada two staff and leaves a neighbour to show the cross-café rule', async () => {
    await resetDemo();

    const { users } = await (await api('/users')).json<UsersBody>();
    const staffByCafe = Object.groupBy(
      users.filter(({ role }) => role === 'cafe_staff'),
      ({ cafeId }) => cafeId!,
    );

    expect(staffByCafe['caf_barada']).toHaveLength(2);
    expect(Object.keys(staffByCafe).length).toBeGreaterThan(1);
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
    const mine = await api('/cafe/collabs', { as: 'usr_huda' });
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

describe('health', () => {
  it('reports the schema version', async () => {
    const response = await api('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, schema: '0001_init.sql' });
  });
});

describe('errors', () => {
  it('uses the error envelope for an unknown route', async () => {
    const response = await api('/nope', { as: 'usr_huda' });

    expect(response.status).toBe(404);
    expect(await errorCode(response)).toBe('NOT_FOUND');
  });
});
