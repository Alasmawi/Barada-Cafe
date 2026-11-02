import { describe, expect, it } from 'vitest';
import type { RequestWithCollab } from '../src/shared/api';
import {
  accept,
  api,
  askToJoin,
  complete,
  decline,
  errorCode,
  getRequest,
  makeBusiness,
  makeCollab,
  makeCreators,
  makeRequestIn,
  nextWeek,
  submitLink,
} from './helpers';

const collabBody = () => ({
  title: 'Mine now',
  offer: 'A free latte',
  deliverable: 'One Reel',
  spots: 2,
  endsOn: nextWeek(),
});

async function expectForbidden(response: Response) {
  expect(response.status).toBe(403);
  expect(await errorCode(response)).toBe('FORBIDDEN');
}

describe('who is acting', () => {
  it('answers 401 with no session', async () => {
    const response = await api('/collabs');

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('NOT_SIGNED_IN');
  });

  it('answers 401 for a user who does not exist', async () => {
    const response = await api('/collabs', { as: 'usr_nobody' });

    expect(response.status).toBe(401);
  });
});

describe('a creator', () => {
  it('cannot accept, decline or complete', async () => {
    const { requestId, creatorId } = await makeRequestIn('pending');

    await expectForbidden(await accept(requestId, creatorId));
    await expectForbidden(await decline(requestId, creatorId));
    await expectForbidden(await complete(requestId, creatorId));
    expect((await getRequest(requestId)).status).toBe('pending');
  });

  it('cannot create or edit a collab', async () => {
    const { collabId } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    await expectForbidden(await api('/collabs', { as: creator!, body: collabBody() }));
    await expectForbidden(
      await api(`/collabs/${collabId}`, { as: creator!, method: 'PUT', body: collabBody() }),
    );
  });

  it('cannot read the inbox', async () => {
    const { collabId, creators } = await makeCollab({ spots: 1, pending: 1 });

    await expectForbidden(await api(`/collabs/${collabId}/requests`, { as: creators[0]! }));
  });

  it("cannot submit for someone else's request", async () => {
    const { requestId } = await makeRequestIn('accepted');
    const [other] = await makeCreators(1);

    await expectForbidden(await submitLink(requestId, other!));
  });

  it("cannot read someone else's pass", async () => {
    const { requestId } = await makeRequestIn('accepted');
    const [other] = await makeCreators(1);

    await expectForbidden(await api(`/requests/${requestId}`, { as: other! }));
  });

  it('can read their own pass', async () => {
    const { requestId, creatorId } = await makeRequestIn('accepted');

    const response = await api(`/requests/${requestId}`, { as: creatorId });

    expect(response.status).toBe(200);
    const { request } = await response.json<{ request: RequestWithCollab }>();
    expect(request.passCode).not.toBeNull();
    expect(request.collab.title).toBe('Test collab');
  });
});

describe('another business', () => {
  it('cannot see requests, accept, decline, complete or edit', async () => {
    const { collabId, requestId } = await makeRequestIn('pending');
    const { owner } = await makeBusiness();
    const outsider = owner;

    await expectForbidden(await api(`/collabs/${collabId}/requests`, { as: outsider }));
    await expectForbidden(await api(`/requests/${requestId}`, { as: outsider }));
    await expectForbidden(await accept(requestId, outsider));
    await expectForbidden(await decline(requestId, outsider));
    await expectForbidden(await complete(requestId, outsider));
    await expectForbidden(
      await api(`/collabs/${collabId}`, { as: outsider, method: 'PUT', body: collabBody() }),
    );
    expect((await getRequest(requestId)).status).toBe('pending');
  });
});

describe('a business', () => {
  it('cannot ask to join a collab', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });

    await expectForbidden(await askToJoin(collabId, owner));
  });

  it("cannot submit a creator's link", async () => {
    const { requestId, ownerId } = await makeRequestIn('accepted');

    await expectForbidden(await submitLink(requestId, ownerId));
  });
});
