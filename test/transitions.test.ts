import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { CollabRequest } from '../src/shared/api';
import type { RequestStatus } from '../src/shared/status';
import {
  accept,
  askToJoin,
  complete,
  decline,
  errorCode,
  getRequest,
  makeCollab,
  makeCreators,
  makeRequestIn,
  submitLink,
  today,
  yesterday,
} from './helpers';

type Action = 'accept' | 'decline' | 'submit' | 'complete';
type Scenario = Awaited<ReturnType<typeof makeRequestIn>>;

const perform: Record<Action, (scenario: Scenario) => Promise<Response>> = {
  accept: ({ requestId, staffId }) => accept(requestId, staffId),
  decline: ({ requestId, staffId }) => decline(requestId, staffId),
  submit: ({ requestId, creatorId }) => submitLink(requestId, creatorId),
  complete: ({ requestId, staffId }) => complete(requestId, staffId),
};

describe('request status machine', () => {
  it('walks the happy path from pending to done', async () => {
    const scenario = await makeRequestIn('pending');
    const { requestId, staffId, creatorId } = scenario;

    const accepted = await accept(requestId, staffId);
    const { request } = await accepted.json<{ request: CollabRequest }>();
    expect(request.status).toBe('accepted');
    expect(request.passCode).toMatch(/^FJ-[A-HJ-NP-Z2-9]{4}$/);

    await submitLink(requestId, creatorId);
    expect((await getRequest(requestId)).status).toBe('submitted');

    await complete(requestId, staffId);
    expect((await getRequest(requestId)).status).toBe('done');
  });

  const illegal: [Action, RequestStatus][] = [
    ['accept', 'declined'],
    ['accept', 'submitted'],
    ['accept', 'done'],
    ['decline', 'accepted'],
    ['decline', 'submitted'],
    ['decline', 'done'],
    ['submit', 'pending'],
    ['submit', 'declined'],
    ['submit', 'done'],
    ['complete', 'pending'],
    ['complete', 'accepted'],
    ['complete', 'declined'],
  ];

  it.each(illegal)('refuses %s from %s', async (action, from) => {
    const scenario = await makeRequestIn(from);

    const response = await perform[action](scenario);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('INVALID_TRANSITION');
    expect((await getRequest(scenario.requestId)).status).toBe(from);
  });

  const repeats: [Action, RequestStatus][] = [
    ['accept', 'accepted'],
    ['decline', 'declined'],
    ['submit', 'submitted'],
    ['complete', 'done'],
  ];

  it.each(repeats)('answers a repeated %s with 200', async (action, status) => {
    const scenario = await makeRequestIn(status);

    const response = await perform[action](scenario);

    expect(response.status).toBe(200);
    expect((await getRequest(scenario.requestId)).status).toBe(status);
  });
});

describe('the end date', () => {
  it('still accepts on the last day, which is inclusive', async () => {
    const { staff, requestIds } = await makeCollab({ spots: 1, pending: 1, endsOn: today() });

    const response = await accept(requestIds[0]!, staff[0]!);

    expect(response.status).toBe(200);
  });

  it('refuses an accept after the end date', async () => {
    const { staff, requestIds } = await makeCollab({ spots: 1, pending: 1, endsOn: yesterday() });

    const response = await accept(requestIds[0]!, staff[0]!);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('COLLAB_ENDED');
  });

  it('refuses a new request after the end date', async () => {
    const { collabId } = await makeCollab({ spots: 1, endsOn: yesterday() });
    const [creator] = await makeCreators(1);

    const response = await askToJoin(collabId, creator!);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('COLLAB_ENDED');
  });

  it('still lets a pending request be declined after the end date', async () => {
    const { staff, requestIds } = await makeCollab({ spots: 1, pending: 1, endsOn: yesterday() });

    const response = await decline(requestIds[0]!, staff[0]!);

    expect(response.status).toBe(200);
  });

  it('lets an accepted creator submit after the end date', async () => {
    const { collabId, staff, creators, requestIds } = await makeCollab({ spots: 1, pending: 1 });
    await accept(requestIds[0]!, staff[0]!);
    await env.DB.prepare('UPDATE collabs SET ends_on = ? WHERE id = ?')
      .bind(yesterday(), collabId)
      .run();

    const response = await submitLink(requestIds[0]!, creators[0]!);

    expect(response.status).toBe(200);
  });
});

describe('the post link', () => {
  it('can be corrected while submitted, keeping the first submitted time', async () => {
    const { requestId, creatorId } = await makeRequestIn('submitted');
    const before = await submitLink(requestId, creatorId, 'https://www.tiktok.com/@me/video/1');
    const first = (await before.json<{ request: CollabRequest }>()).request;

    const after = await submitLink(requestId, creatorId, 'https://www.tiktok.com/@me/video/2');
    const second = (await after.json<{ request: CollabRequest }>()).request;

    expect(second.postUrl).toBe('https://www.tiktok.com/@me/video/2');
    expect(second.submittedAt).toBe(first.submittedAt);
  });

  it('locks once done', async () => {
    const { requestId, creatorId } = await makeRequestIn('done');

    const response = await submitLink(requestId, creatorId, 'https://www.tiktok.com/@me/video/9');

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('INVALID_TRANSITION');
  });

  it.each(['http://instagram.com/p/1', 'javascript:alert(1)', 'not a link', ''])(
    'rejects %j',
    async (url) => {
      const { requestId, creatorId } = await makeRequestIn('accepted');

      const response = await submitLink(requestId, creatorId, url);

      expect(response.status).toBe(422);
      expect(await errorCode(response)).toBe('VALIDATION_FAILED');
    },
  );
});
