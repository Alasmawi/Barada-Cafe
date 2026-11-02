import { describe, expect, it } from 'vitest';
import type { Collab, ErrorBody, InboxRequest, RequestWithCollab } from '../src/shared/api';
import {
  accept,
  api,
  askToJoin,
  errorCode,
  getCollab,
  makeBusiness,
  makeCollab,
  makeCreators,
  nextWeek,
  yesterday,
} from './helpers';

const input = (overrides: object = {}) => ({
  title: 'Saffron latte',
  offer: 'Two lattes on the house',
  deliverable: 'One Reel',
  spots: 3,
  endsOn: nextWeek(),
  ...overrides,
});

describe('creating a collab', () => {
  it('belongs to the acting business and starts open', async () => {
    const { businessId, owner } = await makeBusiness();

    const response = await api('/collabs', { as: owner, body: input() });

    expect(response.status).toBe(201);
    const { collab } = await response.json<{ collab: Collab }>();
    expect(collab).toMatchObject({ businessId, state: 'open', spotsLeft: 3, spotsTaken: 0 });
  });

  it.each([
    ['a blank title', { title: '   ' }, 'title'],
    ['zero spots', { spots: 0 }, 'spots'],
    ['51 spots', { spots: 51 }, 'spots'],
    ['fractional spots', { spots: 1.5 }, 'spots'],
    ['an impossible date', { endsOn: '2026-02-31' }, 'endsOn'],
    ['a past end date', { endsOn: yesterday() }, 'endsOn'],
  ])('rejects %s', async (_name, overrides, field) => {
    const { owner } = await makeBusiness();

    const response = await api('/collabs', { as: owner, body: input(overrides) });

    expect(response.status).toBe(422);
    const { error } = await response.json<ErrorBody>();
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fields).toHaveProperty(field);
  });

  it('rejects a body that is not JSON', async () => {
    const { owner } = await makeBusiness();

    const response = await api('/collabs', { as: owner, body: undefined, method: 'POST' });

    expect(response.status).toBe(422);
  });
});

describe('editing a collab', () => {
  it('saves new details', async () => {
    const { collabId, owner } = await makeCollab({ spots: 2 });

    const response = await api(`/collabs/${collabId}`, {
      as: owner,
      method: 'PUT',
      body: input({ title: 'Renamed' }),
    });

    expect(response.status).toBe(200);
    expect((await getCollab(collabId, owner)).title).toBe('Renamed');
  });

  it('refuses to reduce spots below the spots taken, naming the number', async () => {
    const { collabId, owner, requestIds } = await makeCollab({ spots: 3, pending: 2 });
    await accept(requestIds[0]!, owner);
    await accept(requestIds[1]!, owner);

    const response = await api(`/collabs/${collabId}`, {
      as: owner,
      method: 'PUT',
      body: input({ spots: 1 }),
    });

    expect(response.status).toBe(409);
    const { error } = await response.json<ErrorBody>();
    expect(error.code).toBe('SPOTS_BELOW_TAKEN');
    expect(error.message).toBe("2 creators are already accepted — spots can't go below 2.");
    expect((await getCollab(collabId, owner)).spots).toBe(3);
  });

  it('allows spots to drop exactly to the spots taken', async () => {
    const { collabId, owner, requestIds } = await makeCollab({ spots: 3, pending: 1 });
    await accept(requestIds[0]!, owner);

    const response = await api(`/collabs/${collabId}`, {
      as: owner,
      method: 'PUT',
      body: input({ spots: 1 }),
    });

    expect(response.status).toBe(200);
    expect((await getCollab(collabId, owner)).state).toBe('full');
  });

  it('lets an ended collab fix its copy without moving the date', async () => {
    const endsOn = yesterday();
    const { collabId, owner } = await makeCollab({ spots: 1, endsOn });

    const response = await api(`/collabs/${collabId}`, {
      as: owner,
      method: 'PUT',
      body: input({ endsOn }),
    });

    expect(response.status).toBe(200);
  });
});

describe('asking to join', () => {
  it('stores the pitch as pending', async () => {
    const { collabId } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    const response = await askToJoin(collabId, creator!, '  Trimmed pitch  ');

    expect(response.status).toBe(201);
    const { request } = await response.json<{ request: RequestWithCollab }>();
    expect(request).toMatchObject({ status: 'pending', pitch: 'Trimmed pitch', passCode: null });
  });

  it.each([
    ['empty', '   '],
    ['141 characters', 'x'.repeat(141)],
  ])('rejects a pitch that is %s', async (_name, pitch) => {
    const { collabId } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    const response = await askToJoin(collabId, creator!, pitch);

    expect(response.status).toBe(422);
    expect(await errorCode(response)).toBe('VALIDATION_FAILED');
  });

  it('accepts a pitch of exactly 140 characters', async () => {
    const { collabId } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);

    const response = await askToJoin(collabId, creator!, 'x'.repeat(140));

    expect(response.status).toBe(201);
  });

  it('answers 404 for a collab that does not exist', async () => {
    const [creator] = await makeCreators(1);

    const response = await askToJoin('col_missing', creator!);

    expect(response.status).toBe(404);
  });

  it('returns the original request when asked twice', async () => {
    const { collabId } = await makeCollab({ spots: 1 });
    const [creator] = await makeCreators(1);
    await askToJoin(collabId, creator!, 'First pitch');

    const response = await askToJoin(collabId, creator!, 'Second pitch');

    expect(response.status).toBe(200);
    const { request } = await response.json<{ request: RequestWithCollab }>();
    expect(request.pitch).toBe('First pitch');
  });
});

describe('reading', () => {
  it('lists open collabs before full ones, and leaves ended ones out', async () => {
    const full = await makeCollab({ spots: 1, pending: 1, endsOn: nextWeek() });
    await accept(full.requestIds[0]!, full.owner);
    const open = await makeCollab({ spots: 1 });
    const ended = await makeCollab({ spots: 1, endsOn: yesterday() });

    const response = await api('/collabs', { as: open.owner });
    const { collabs } = await response.json<{ collabs: Collab[] }>();
    const ids = collabs.map(({ id }) => id);

    expect(ids.indexOf(open.collabId)).toBeLessThan(ids.indexOf(full.collabId));
    expect(ids).not.toContain(ended.collabId);
    expect(collabs.map(({ state }) => state)).not.toContain('ended');
  });

  it('filters the feed by state', async () => {
    const full = await makeCollab({ spots: 1, pending: 1 });
    await accept(full.requestIds[0]!, full.owner);

    const response = await api('/collabs?state=open', { as: full.owner });
    const { collabs } = await response.json<{ collabs: Collab[] }>();

    expect(collabs.map(({ id }) => id)).not.toContain(full.collabId);
  });

  it('shows a creator their own request on the collab', async () => {
    const { collabId, creators } = await makeCollab({ spots: 1, pending: 1 });

    const response = await api(`/collabs/${collabId}`, { as: creators[0]! });
    const { myRequest } = await response.json<{ myRequest: { status: string } }>();

    expect(myRequest.status).toBe('pending');
  });

  it('answers 404 for a missing collab', async () => {
    const { owner } = await makeBusiness();

    const response = await api('/collabs/col_missing', { as: owner });

    expect(response.status).toBe(404);
  });

  it("lists only the business's own collabs, ended ones included", async () => {
    const mine = await makeCollab({ spots: 1, endsOn: yesterday() });
    const theirs = await makeCollab({ spots: 1 });

    const response = await api('/business/collabs', { as: mine.owner });
    const { collabs } = await response.json<{ collabs: Collab[] }>();

    expect(collabs.map(({ id }) => id)).toEqual([mine.collabId]);
    expect(collabs.map(({ id }) => id)).not.toContain(theirs.collabId);
  });

  it('gives the inbox creator names and pass codes', async () => {
    const { collabId, owner, requestIds } = await makeCollab({ spots: 2, pending: 2 });
    await accept(requestIds[0]!, owner);

    const response = await api(`/collabs/${collabId}/requests`, { as: owner });
    const { requests } = await response.json<{ requests: InboxRequest[] }>();

    expect(requests).toHaveLength(2);
    expect(requests.find(({ id }) => id === requestIds[0])?.passCode).toMatch(/^CB-/);
    expect(requests[0]?.creatorName).toBe('Creator');
  });

  it("gives a creator their requests with each collab, and refuses businesses", async () => {
    const { collabId, owner, creators } = await makeCollab({ spots: 1, pending: 1 });

    const response = await api('/me/requests', { as: creators[0]! });
    const { requests } = await response.json<{ requests: RequestWithCollab[] }>();

    expect(requests.map(({ collab }) => collab.id)).toEqual([collabId]);
    expect((await api('/me/requests', { as: owner })).status).toBe(403);
  });
});
