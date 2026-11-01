import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CollabDraft } from '../src/shared/api';
import type { AiClient } from '../src/worker/ai/aiClient';
import { draftCollab } from '../src/worker/ai/draftCollab';
import { AI_TIMEOUT_MS } from '../src/worker/ai/withTimeout';
import { api, errorCode, makeBusiness, makeCreators } from './helpers';

const TODAY = '2026-11-01';
const COMPLETE = {
  title: 'Saffron latte launch',
  offer: 'Two free lattes',
  deliverable: 'One Reel',
  spots: 3,
  endsOn: '2026-11-20',
};

const answering = (output: unknown): AiClient => ({ generate: () => Promise.resolve(output) });
const draftFrom = (output: unknown, sentence = 'Free lattes for three creators') =>
  draftCollab(answering(output), sentence, TODAY);

const NOTHING = {
  draft: {},
  unfilled: ['title', 'offer', 'deliverable', 'spots', 'endsOn'],
  warning: "The AI couldn't help this time — the form is all yours.",
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('a good answer', () => {
  it('fills every field from an object', async () => {
    expect(await draftFrom(COMPLETE)).toEqual({ draft: COMPLETE, unfilled: [], warning: null });
  });

  it('fills every field from a JSON string', async () => {
    const { draft } = await draftFrom(JSON.stringify(COMPLETE));

    expect(draft).toEqual(COMPLETE);
  });

  it('digs JSON out of code fences and chatter', async () => {
    const output = `Sure! Here you go:\n\`\`\`json\n${JSON.stringify(COMPLETE)}\n\`\`\``;

    expect((await draftFrom(output)).draft).toEqual(COMPLETE);
  });
});

describe('a partial answer', () => {
  it('keeps the valid fields and lists the rest as unfilled', async () => {
    const result = await draftFrom({ title: 'Saffron latte launch', spots: 3 });

    expect(result).toEqual({
      draft: { title: 'Saffron latte launch', spots: 3 },
      unfilled: ['offer', 'deliverable', 'endsOn'],
      warning: null,
    });
  });

  it('drops a field that fails validation without losing the others', async () => {
    const { draft, unfilled } = await draftFrom({ ...COMPLETE, title: 'x'.repeat(81) });

    expect(draft).not.toHaveProperty('title');
    expect(draft.offer).toBe(COMPLETE.offer);
    expect(unfilled).toEqual(['title']);
  });
});

describe('a useless answer', () => {
  it.each([
    ['prose', 'I would suggest a lovely latte promotion!'],
    ['an empty string', ''],
    ['broken JSON', '{"title": "Saffron'],
    ['nothing', undefined],
    ['null', null],
    ['a number', 42],
    ['an array', ['title']],
    ['an empty object', {}],
  ])('returns an empty draft and a warning for %s', async (_name, output) => {
    expect(await draftFrom(output)).toEqual(NOTHING);
  });
});

describe('a failing model', () => {
  it('turns a thrown error into an empty draft', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing: AiClient = {
      generate: () => Promise.reject(new Error("JSON Mode couldn't be met")),
    };

    expect(await draftCollab(failing, 'Free lattes', TODAY)).toEqual(NOTHING);
  });

  it('gives up after the timeout, even if the model ignores the signal', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    const hanging: AiClient = { generate: () => new Promise(() => {}) };

    const result = draftCollab(hanging, 'Free lattes', TODAY);
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS);

    expect(await result).toEqual(NOTHING);
  });

  it('tells the model to stop at the timeout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
    let received: AbortSignal | undefined;
    const hanging: AiClient = {
      generate: ({ signal }) => {
        received = signal;
        return new Promise(() => {});
      },
    };

    const result = draftCollab(hanging, 'Free lattes', TODAY);
    await vi.advanceTimersByTimeAsync(AI_TIMEOUT_MS);
    await result;

    expect(received?.aborted).toBe(true);
  });

  it('stops when the business cancels', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const cancel = new AbortController();
    const hanging: AiClient = { generate: () => new Promise(() => {}) };

    const result = draftCollab(hanging, 'Free lattes', TODAY, cancel.signal);
    cancel.abort(new Error('cancelled'));

    expect(await result).toEqual(NOTHING);
  });
});

describe('spots', () => {
  it.each([
    [0, 1],
    [-4, 1],
    [999, 50],
    [2.6, 3],
    ['4', 4],
  ])('turns %j into %i', async (spots, expected) => {
    expect((await draftFrom({ spots })).draft.spots).toBe(expected);
  });

  it.each([['lots'], [''], [null], [true], [Number.NaN]])('drops %j', async (spots) => {
    expect((await draftFrom({ ...COMPLETE, spots })).draft).not.toHaveProperty('spots');
  });
});

describe('the end date', () => {
  it('drops a date in the past', async () => {
    const { draft } = await draftFrom({ ...COMPLETE, endsOn: '2026-10-31' });

    expect(draft).not.toHaveProperty('endsOn');
  });

  it('keeps today, the last valid day', async () => {
    const { draft } = await draftFrom({ ...COMPLETE, endsOn: TODAY });

    expect(draft.endsOn).toBe(TODAY);
  });

  it('drops an impossible date', async () => {
    const { draft } = await draftFrom({ ...COMPLETE, endsOn: '2026-11-31' });

    expect(draft).not.toHaveProperty('endsOn');
  });

  it.each(['Free lattes this month', 'Free lattes until the end of the month'])(
    'resolves "%s" to the last day of the month, whatever the model said',
    async (sentence) => {
      const { draft } = await draftFrom({ ...COMPLETE, endsOn: '2026-12-25' }, sentence);

      expect(draft.endsOn).toBe('2026-11-30');
    },
  );
});

describe('a hostile answer', () => {
  it('drops a field holding markup', async () => {
    const { draft, unfilled } = await draftFrom({
      ...COMPLETE,
      title: '<img src=x onerror=alert(1)>',
    });

    expect(draft).not.toHaveProperty('title');
    expect(unfilled).toEqual(['title']);
  });

  it('keeps only the known fields', async () => {
    const output = { ...COMPLETE, businessId: 'biz_other', status: 'done', publish: true };

    expect(Object.keys((await draftFrom(output)).draft).sort()).toEqual(
      ['deliverable', 'endsOn', 'offer', 'spots', 'title'],
    );
  });

  it('sends only the sentence to the model, with no user or business data', async () => {
    const generate = vi.fn<AiClient['generate']>().mockResolvedValue(COMPLETE);

    await draftCollab({ generate }, 'Free lattes', TODAY);

    const request = generate.mock.calls[0]![0];
    expect(request.user).toBe('Free lattes');
    expect(request.system).toContain(TODAY);
  });
});

describe('POST /ai/draft-collab', () => {
  it('always answers 200, even when the model is unavailable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { staff } = await makeBusiness();

    const response = await api('/ai/draft-collab', {
      as: staff[0]!,
      body: { sentence: 'Free lattes for three creators' },
    });

    expect(response.status).toBe(200);
    const body = await response.json<CollabDraft>();
    expect(body.draft).toEqual({});
    expect(body.warning).not.toBeNull();
  });

  it('never creates a collab', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { staff } = await makeBusiness();
    const count = () =>
      env.DB.prepare('SELECT COUNT(*) AS total FROM collabs').first<{ total: number }>();
    const before = await count();

    await api('/ai/draft-collab', { as: staff[0]!, body: { sentence: 'Free lattes' } });

    expect(await count()).toEqual(before);
  });

  it('is for business staff only', async () => {
    const [creator] = await makeCreators(1);

    const response = await api('/ai/draft-collab', {
      as: creator!,
      body: { sentence: 'Free lattes' },
    });

    expect(response.status).toBe(403);
  });

  it('needs a signed-in user', async () => {
    const response = await api('/ai/draft-collab', { body: { sentence: 'Free lattes' } });

    expect(response.status).toBe(401);
  });

  it.each([
    ['blank', '   '],
    ['too long', 'x'.repeat(301)],
  ])('rejects a sentence that is %s', async (_name, sentence) => {
    const { staff } = await makeBusiness();

    const response = await api('/ai/draft-collab', { as: staff[0]!, body: { sentence } });

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });
});
