import { describe, expect, it, vi } from 'vitest';
import type { CreatorCard } from '../src/shared/api';
import type { AiClient } from '../src/worker/ai/aiClient';
import { factsKey, factSummary, summarizeCreator } from '../src/worker/ai/summarizeCreator';
import { api, errorCode, resetDemo } from './helpers';

const FACTS = { name: 'Noor', tags: ['Coffee', 'Reels', 'Calm'], signature: 'Slow.', servedCount: 2 };
const answering = (output: unknown): AiClient => ({ generate: () => Promise.resolve(output) });

async function search(query = ''): Promise<CreatorCard[]> {
  await resetDemo();
  const response = await api(`/creators?q=${encodeURIComponent(query)}`, { as: 'usr_barada' });
  return (await response.json<{ creators: CreatorCard[] }>()).creators;
}

describe('searching for creators', () => {
  it('finds creators by tag', async () => {
    const creators = await search('Film');

    expect(creators.map(({ name }) => name).sort()).toEqual(['Fatima', 'Lulwa']);
  });

  it('finds creators by name and handle, ignoring case', async () => {
    expect((await search('noor')).map(({ name }) => name)).toEqual(['Noor']);
    expect((await search('LULWA.FILMS')).map(({ name }) => name)).toEqual(['Lulwa']);
  });

  it('lists everyone for an empty search', async () => {
    expect(await search()).toHaveLength(6);
  });

  it('treats % as text, not a wildcard', async () => {
    expect(await search('%')).toEqual([]);
  });

  it('is safe against a quote in the search', async () => {
    expect(await search("' OR 1=1 --")).toEqual([]);
  });

  it('never exposes passwords or usernames', async () => {
    await resetDemo();

    const response = await api('/creators', { as: 'usr_barada' });
    const body = await response.text();

    expect(body).not.toContain('pbkdf2');
    expect(body).not.toContain('password');
  });

  it('is for businesses only', async () => {
    await resetDemo();

    const response = await api('/creators', { as: 'usr_noor' });

    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe('FORBIDDEN');
  });

  it('needs a signed-in user', async () => {
    expect((await api('/creators')).status).toBe(401);
  });

  it('counts completed collabs from the database', async () => {
    const [noor] = await search('noor');

    expect(noor).toMatchObject({ servedCount: 1, isAiSummary: false });
    expect(noor?.summary).toContain('Completed 1 collab.');
  });
});

describe('a creator summary', () => {
  it('states only facts when no AI is involved', () => {
    expect(factSummary(FACTS)).toBe(
      'Noor makes content around Coffee, Reels, Calm. Completed 2 collabs.',
    );
    expect(factSummary({ ...FACTS, servedCount: 0 })).toContain('New to Collab Board.');
  });

  it('keeps a good one-line answer', async () => {
    expect(await summarizeCreator(answering('Calm coffee Reels.'), FACTS)).toBe('Calm coffee Reels.');
  });

  it('keeps only the first line', async () => {
    expect(await summarizeCreator(answering('First.\nSecond.'), FACTS)).toBe('First.');
  });

  it.each([
    ['nothing', ''],
    ['too long', 'x'.repeat(161)],
    ['markup', 'Great <img src=x onerror=alert(1)> creator'],
    ['a link', 'See https://evil.example/now'],
    ['an object', { summary: 'hi' }],
    ['missing', undefined],
  ])('drops an answer that is %s', async (_name, output) => {
    expect(await summarizeCreator(answering(output), FACTS)).toBeNull();
  });

  it('survives a failing model', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing: AiClient = { generate: () => Promise.reject(new Error('Out of neurons')) };

    expect(await summarizeCreator(failing, FACTS)).toBeNull();
    vi.restoreAllMocks();
  });

  it('asks for a new summary when the facts change', () => {
    expect(factsKey({ ...FACTS, servedCount: 3 })).not.toBe(factsKey(FACTS));
  });

  it('falls back to the facts over HTTP when the model is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await resetDemo();

    const response = await api('/creators/usr_noor/summary', { as: 'usr_barada', method: 'POST' });

    expect(response.status).toBe(200);
    const { creator } = await response.json<{ creator: CreatorCard }>();
    expect(creator).toMatchObject({ isAiSummary: false });
    expect(creator.summary).toContain('Noor makes content');
    vi.restoreAllMocks();
  });

  it('is for businesses only', async () => {
    await resetDemo();

    const response = await api('/creators/usr_noor/summary', { as: 'usr_salman', method: 'POST' });

    expect(response.status).toBe(403);
  });
});
