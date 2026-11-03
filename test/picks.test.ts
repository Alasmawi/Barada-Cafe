import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import type { Collab, PicksResponse, User } from '../src/shared/api';
import type { AiClient } from '../src/worker/ai/aiClient';
import { cleanReason, explainPicks } from '../src/worker/ai/explainPicks';
import * as usersRepo from '../src/worker/repositories/usersRepo';
import { factReason, matchTags, rankPicks } from '../src/worker/services/pickRanking';
import * as pickService from '../src/worker/services/pickService';
import { api, askToJoin, resetDemo } from './helpers';

const TODAY = '2026-11-03';

function collab(overrides: Partial<Collab>): Collab {
  return {
    id: 'col_x',
    businessId: 'biz_x',
    businessName: 'Test Business',
    businessHouse: 'saffron',
    title: 'A collab',
    offer: 'Something nice',
    deliverable: 'One post',
    details: '',
    requirements: '',
    location: '',
    spots: 3,
    spotsTaken: 0,
    spotsLeft: 3,
    pendingCount: 0,
    endsOn: '2026-11-10',
    state: 'open',
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  };
}

const replyWith = (reply: unknown): AiClient => ({ generate: vi.fn(() => Promise.resolve(reply)) });

async function noor(): Promise<User> {
  return (await usersRepo.findById(env.DB, 'usr_noor'))!;
}

describe('ranking picks', () => {
  it('matches tags from the words in a collab, including plurals', () => {
    const latte = collab({ title: 'Saffron latte first pour', deliverable: 'Two Reels of the pour' });
    expect(matchTags(latte, ['Coffee', 'Reels', 'Fitness'])).toEqual(['Coffee', 'Reels']);
  });

  it("doesn't match a word inside another word", () => {
    expect(matchTags(collab({ offer: 'Any format you like' }), ['Fitness'])).toEqual([]);
  });

  it('ranks more matching tags first, then the last spot, then the soonest end', () => {
    const picks = rankPicks(
      [
        collab({ id: 'one_tag', title: 'Coffee morning', endsOn: '2026-11-04' }),
        collab({ id: 'two_tags', title: 'Coffee and cake', deliverable: 'One reel' }),
        collab({ id: 'last_spot', title: 'Coffee tasting', spotsLeft: 1, endsOn: '2026-11-20' }),
      ],
      ['Coffee', 'Reels'],
      new Set(),
    );
    expect(picks.map(({ collab: picked }) => picked.id)).toEqual(['two_tags', 'last_spot', 'one_tag']);
  });

  it('leaves out full, ended, already requested and unmatched collabs, and keeps three at most', () => {
    const coffee = (id: string, extra: Partial<Collab> = {}) => collab({ id, title: 'Coffee', ...extra });
    const picks = rankPicks(
      [
        coffee('full', { state: 'full', spotsLeft: 0 }),
        coffee('ended', { state: 'ended' }),
        coffee('applied'),
        collab({ id: 'no_match', title: 'Yoga class' }),
        coffee('a'),
        coffee('b'),
        coffee('c'),
        coffee('d'),
      ],
      ['Coffee'],
      new Set(['applied']),
    );
    expect(picks.map(({ collab: picked }) => picked.id)).toEqual(['a', 'b', 'c']);
  });

  it('writes a plain reason from the facts', () => {
    const latte = collab({ spotsLeft: 1, endsOn: '2026-11-04' });
    expect(factReason(latte, ['Coffee', 'Reels'], TODAY)).toBe('Fits your Coffee and Reels · 1 spot left · ends tomorrow');
  });
});

describe('AI reasons', () => {
  const facts = [
    { id: 'col_a', business: 'Barada Café', title: 'Latte', offer: 'Two lattes', deliverable: 'One reel', matchedTags: ['Coffee'] },
    { id: 'col_b', business: 'Sidra Garden', title: 'Brunch', offer: 'Brunch for two', deliverable: 'One reel', matchedTags: ['Food'] },
  ];

  it('keeps checked reasons for known picks only', async () => {
    const reasons = await explainPicks(
      replyWith({
        reasons: [
          { id: 'col_a', reason: 'Your slow coffee reels suit a first pour.' },
          { id: 'col_b', reason: 'Read more at https://example.com' },
          { id: 'col_other', reason: 'Not one of your picks.' },
        ],
      }),
      { tags: ['Coffee'], signature: null },
      facts,
    );
    expect(Object.fromEntries(reasons)).toEqual({ col_a: 'Your slow coffee reels suit a first pour.', col_b: null });
  });

  it('reads JSON that arrives as a string', async () => {
    const reasons = await explainPicks(
      replyWith('Here you go: {"reasons": [{"id": "col_a", "reason": "Made for your coffee reels."}]}'),
      { tags: ['Coffee'], signature: null },
      facts,
    );
    expect(reasons.get('col_a')).toBe('Made for your coffee reels.');
  });

  it('drops markup, links, and answers too long or too short to help', () => {
    expect(cleanReason('<b>Great</b>')).toBeNull();
    expect(cleanReason('See www.example.com')).toBeNull();
    expect(cleanReason('x'.repeat(91))).toBeNull();
    expect(cleanReason('You make Reels')).toBeNull();
    expect(cleanReason('  Fits your calm coffee style.  ')).toBe('Fits your calm coffee style.');
  });

  it('gives every pick a null reason when the model fails, without throwing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing: AiClient = { generate: () => Promise.reject(new Error('Out of neurons')) };

    const reasons = await explainPicks(failing, { tags: ['Coffee'], signature: null }, facts);

    expect(Object.fromEntries(reasons)).toEqual({ col_a: null, col_b: null });
    vi.restoreAllMocks();
  });
});

describe('picks for a creator', () => {
  it('picks open collabs that match their tags, with plain reasons and no AI', async () => {
    await resetDemo();

    const response = await api('/me/picks', { as: 'usr_noor' });

    expect(response.status).toBe(200);
    const { picks, aiPending } = await response.json<PicksResponse>();
    const requested = await env.DB.prepare('SELECT collab_id FROM requests WHERE creator_id = ?')
      .bind('usr_noor')
      .all<{ collab_id: string }>();
    const requestedIds = requested.results.map((row) => row.collab_id);
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.length).toBeLessThanOrEqual(3);
    for (const pick of picks) {
      expect(pick.collab.state).toBe('open');
      expect(requestedIds).not.toContain(pick.collab.id);
      expect(pick.matchedTags.length).toBeGreaterThan(0);
      expect(pick.isAiReason).toBe(false);
      expect(pick.reason).toMatch(/^Fits your /);
    }
    expect(aiPending).toBe(true);
  });

  it('stops picking a collab once the creator applies to it', async () => {
    await resetDemo();
    const before = await (await api('/me/picks', { as: 'usr_noor' })).json<PicksResponse>();
    const first = before.picks[0]!.collab.id;

    await askToJoin(first, 'usr_noor');

    const after = await (await api('/me/picks', { as: 'usr_noor' })).json<PicksResponse>();
    expect(after.picks.map((pick) => pick.collab.id)).not.toContain(first);
  });

  it('is for creators only', async () => {
    await resetDemo();

    expect((await api('/me/picks', { as: 'usr_barada' })).status).toBe(403);
    expect((await api('/me/picks/explain', { as: 'usr_barada', method: 'POST' })).status).toBe(403);
  });

  it('asks the AI once a day, saves the reasons and serves them after', async () => {
    await resetDemo();
    const actor = await noor();
    const { picks } = await pickService.list(env.DB, actor);
    const client = replyWith({ reasons: picks.map((pick) => ({ id: pick.collab.id, reason: `Made for you: ${pick.collab.title}` })) });

    const explained = await pickService.explain(env.DB, client, actor);
    await pickService.explain(env.DB, client, actor);

    expect(client.generate).toHaveBeenCalledTimes(1);
    expect(explained.picks.every((pick) => pick.isAiReason)).toBe(true);
    const later = await (await api('/me/picks', { as: 'usr_noor' })).json<PicksResponse>();
    expect(later.aiPending).toBe(false);
    expect(later.picks[0]!.reason).toMatch(/^Made for you: /);
  });

  it("keeps plain reasons when the AI fails, and doesn't ask again that day", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await resetDemo();
    const actor = await noor();
    const failing: AiClient = { generate: vi.fn(() => Promise.reject(new Error('Out of neurons'))) };
    const working = replyWith({ reasons: [] });

    const explained = await pickService.explain(env.DB, failing, actor);
    await pickService.explain(env.DB, working, actor);

    expect(explained.picks.every((pick) => !pick.isAiReason && pick.reason.startsWith('Fits your '))).toBe(true);
    expect(working.generate).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('falls back to plain reasons over HTTP when the model is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await resetDemo();

    const response = await api('/me/picks/explain', { as: 'usr_noor', method: 'POST' });

    expect(response.status).toBe(200);
    const { picks, aiPending } = await response.json<PicksResponse>();
    expect(aiPending).toBe(false);
    expect(picks.every((pick) => !pick.isAiReason)).toBe(true);
    vi.restoreAllMocks();
  });
});
