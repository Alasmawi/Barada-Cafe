import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { CollabRequest } from '../src/shared/api';
import {
  accept,
  api,
  askToJoin,
  countHeldSpots,
  errorCode,
  getRequest,
  makeCollab,
  makeBusiness,
  makeCreators,
  yesterday,
} from './helpers';

const invite = (collabId: string, as: string, creatorId: string) =>
  api(`/collabs/${collabId}/invites`, { as, body: { creatorId } });
const acceptInvite = (requestId: string, as: string) =>
  api(`/requests/${requestId}/accept-invite`, { as, method: 'POST' });
const declineInvite = (requestId: string, as: string) =>
  api(`/requests/${requestId}/decline-invite`, { as, method: 'POST' });

async function invited(collabId: string, ownerId: string, creatorId: string): Promise<string> {
  const response = await invite(collabId, ownerId, creatorId);
  const { request } = await response.json<{ request: CollabRequest }>();
  return request.id;
}

describe('inviting a creator', () => {
  it('creates an invite that holds no spot', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    const response = await invite(collabId, owner, creator!);

    expect(response.status).toBe(201);
    const { request } = await response.json<{ request: CollabRequest }>();
    expect(request).toMatchObject({ status: 'invited', passCode: null });
    expect(await countHeldSpots(collabId)).toBe(0);
  });

  it('sends one invite when tapped twice', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    const first = await invited(collabId, owner, creator!);
    const second = await invited(collabId, owner, creator!);

    expect(second).toBe(first);
  });

  it('is refused for a full collab', async () => {
    const { collabId, owner, requestIds } = await makeCollab({ spots: 1, pending: 1 });
    await accept(requestIds[0]!, owner);
    const [creator] = await makeCreators(1);

    const response = await invite(collabId, owner, creator!);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('COLLAB_FULL');
  });

  it('is refused for an ended collab', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1, endsOn: yesterday() });
    const [creator] = await makeCreators(1);

    const response = await invite(collabId, owner, creator!);

    expect(await errorCode(response)).toBe('COLLAB_ENDED');
  });

  it('is only for that business', async () => {
    const { collabId } = await makeCollab({ spots: 1 });
    const { owner: outsider } = await makeBusiness();
    const [creator, other] = await makeCreators(2);

    expect((await invite(collabId, outsider, creator!)).status).toBe(403);
    expect((await invite(collabId, other!, creator!)).status).toBe(403);
  });

  it('can only be sent to a creator', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });

    const response = await invite(collabId, owner, owner);

    expect(response.status).toBe(404);
  });

  it('leaves an existing application as it is', async () => {
    const { collabId, owner, creators } = await makeCollab({ spots: 2, pending: 1 });

    const response = await invite(collabId, owner, creators[0]!);

    const { request } = await response.json<{ request: CollabRequest }>();
    expect(response.status).toBe(200);
    expect(request.status).toBe('pending');
  });
});

describe('answering an invite', () => {
  it('gives the creator a spot and a pass when they accept', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);
    const requestId = await invited(collabId, owner, creator!);

    const response = await acceptInvite(requestId, creator!);

    expect(response.status).toBe(200);
    const { request } = await response.json<{ request: CollabRequest }>();
    expect(request.status).toBe('accepted');
    expect(request.passCode).toMatch(/^CB-/);
    expect(await countHeldSpots(collabId)).toBe(1);
  });

  it('answers a double tap on accept with 200 and one spot', async () => {
    const { collabId, owner } = await makeCollab({ spots: 2 });
    const [creator] = await makeCreators(1);
    const requestId = await invited(collabId, owner, creator!);

    const responses = await Promise.all([
      acceptInvite(requestId, creator!),
      acceptInvite(requestId, creator!),
    ]);

    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(await countHeldSpots(collabId)).toBe(1);
  });

  it('holds no spot when they decline, and stays declined', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);
    const requestId = await invited(collabId, owner, creator!);

    expect((await declineInvite(requestId, creator!)).status).toBe(200);

    expect((await getRequest(requestId)).status).toBe('declined');
    expect((await acceptInvite(requestId, creator!)).status).toBe(409);
    expect(await countHeldSpots(collabId)).toBe(0);
  });

  it('can only be answered by the creator who was invited', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator, other] = await makeCreators(2);
    const requestId = await invited(collabId, owner, creator!);

    expect((await acceptInvite(requestId, other!)).status).toBe(403);
    expect((await acceptInvite(requestId, owner)).status).toBe(403);
    expect((await declineInvite(requestId, other!)).status).toBe(403);
    expect((await getRequest(requestId)).status).toBe('invited');
  });

  it('cannot be accepted by the business on the creator’s behalf', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);
    const requestId = await invited(collabId, owner, creator!);

    const response = await accept(requestId, owner);

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('INVALID_TRANSITION');
  });

  it('is refused once the collab has ended', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);
    const requestId = await invited(collabId, owner, creator!);
    await env.DB.prepare('UPDATE collabs SET ends_on = ? WHERE id = ?')
      .bind(yesterday(), collabId)
      .run();

    const response = await acceptInvite(requestId, creator!);

    expect(await errorCode(response)).toBe('COLLAB_ENDED');
  });
});

describe('the spot invariant, with invites', () => {
  it('lets an invite and an application race for the last spot, and overbooks neither way', async () => {
    for (let round = 0; round < 20; round += 1) {
      const { collabId, owner, requestIds } = await makeCollab({ spots: 1, pending: 3 });
      const [creator] = await makeCreators(1);
      const requestId = await invited(collabId, owner, creator!);
      const pacer = await makeCollab({ spots: 1, pending: 1 });

      const responses = await Promise.all([
        accept(pacer.requestIds[0]!, pacer.owner),
        acceptInvite(requestId, creator!),
        accept(requestIds[0]!, owner),
        accept(requestIds[1]!, owner),
        accept(requestIds[2]!, owner),
      ]);

      expect(responses.slice(1).filter(({ status }) => status === 200)).toHaveLength(1);
      expect(await countHeldSpots(collabId)).toBe(1);
    }
  });

  it('lets invites go out beyond the spots, and only as many as fit can accept', async () => {
    const { collabId, owner } = await makeCollab({ spots: 2 });
    const creators = await makeCreators(4);
    const requestIds = [];
    for (const creator of creators) requestIds.push(await invited(collabId, owner, creator));

    const responses = await Promise.all(
      requestIds.map((requestId, index) => acceptInvite(requestId, creators[index]!)),
    );

    expect(responses.filter(({ status }) => status === 200)).toHaveLength(2);
    expect(await countHeldSpots(collabId)).toBe(2);
  });

  it('still lets a creator apply to a collab that has invites waiting', async () => {
    const { collabId, owner } = await makeCollab({ spots: 1 });
    const [creator, other] = await makeCreators(2);
    await invited(collabId, owner, creator!);

    expect((await askToJoin(collabId, other!)).status).toBe(201);
  });
});
