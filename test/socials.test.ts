import { describe, expect, it } from 'vitest';
import type { Collab, CreatorCard, ErrorBody, InboxRequest, User } from '../src/shared/api';
import { parseSocials, SOCIAL_NAMES, SOCIAL_PLATFORMS, SocialsInput } from '../src/shared/socials';
import { api, makeBusiness, makeCollab, makeCreators, nextWeek } from './helpers';

const signUpCreator = (socials: object) =>
  api('/auth/signup', {
    body: {
      role: 'creator',
      username: `s${crypto.randomUUID().slice(0, 8)}`,
      password: 'correct horse',
      name: 'Sara',
      handle: '@sara.new',
      tags: ['Coffee', 'Reels', 'Calm'],
      socials,
    },
  });

const save = (as: string, socials: object) =>
  api('/me/socials', { as, method: 'PUT', body: socials });

describe('creator socials', () => {
  it('can be added at sign-up', async () => {
    const response = await signUpCreator({ instagram: 'sara.new', tiktok: '@saranew' });

    expect(response.status).toBe(201);
    const { user } = await response.json<{ user: User }>();
    expect(user.socials).toEqual({ instagram: 'sara.new', tiktok: 'saranew' });
  });

  it('are optional at sign-up', async () => {
    const response = await signUpCreator({});

    expect(response.status).toBe(201);
  });

  it('can be changed later, and a blank field removes one', async () => {
    const [creator] = await makeCreators(1);
    await save(creator!, { instagram: 'one', x: 'two' });

    const response = await save(creator!, { instagram: 'three', x: '' });

    const { user } = await response.json<{ user: User }>();
    expect(user.socials).toEqual({ instagram: 'three' });
    const me = await (await api('/me', { as: creator! })).json<{ user: User }>();
    expect(me.user.socials).toEqual({ instagram: 'three' });
  });

  it.each([
    ['a full link', 'https://evil.example/me'],
    ['a script', 'javascript:alert(1)'],
    ['spaces', 'two words'],
    ['a path', '../admin'],
  ])('rejects %s', async (_name, instagram) => {
    const [creator] = await makeCreators(1);

    const response = await save(creator!, { instagram });

    expect(response.status).toBe(422);
    const { error } = await response.json<ErrorBody>();
    expect(error.fields).toHaveProperty('instagram');
  });

  it('are for creators only', async () => {
    const { staff } = await makeBusiness();

    expect((await save(staff[0]!, { instagram: 'mine' })).status).toBe(403);
  });

  it('need a signed-in user', async () => {
    expect((await api('/me/socials', { method: 'PUT', body: {} })).status).toBe(401);
  });

  it('are shown to businesses in search and in the inbox', async () => {
    await api('/demo/reset', { method: 'POST' });

    const search = await api('/creators?q=noor', { as: 'usr_huda' });
    const { creators } = await search.json<{ creators: CreatorCard[] }>();
    expect(creators[0]?.socials.instagram).toBe('noor.sips');

    const inbox = await api('/collabs/col_lastcup/requests', { as: 'usr_huda' });
    const { requests } = await inbox.json<{ requests: InboxRequest[] }>();
    const noor = requests.find(({ creatorId }) => creatorId === 'usr_noor');
    expect(noor?.creatorSocials.instagram).toBe('noor.sips');
  });

  it('only ever link to the known sites over https', () => {
    for (const name of SOCIAL_NAMES) {
      expect(SOCIAL_PLATFORMS[name].url('someone')).toMatch(/^https:\/\/[a-z.]+\//);
    }
  });

  it('survive bad stored data', () => {
    expect(parseSocials('not json')).toEqual({});
    expect(parseSocials('{"instagram":"<bad>"}')).toEqual({});
  });

  it('ignore platforms that are not on the list', () => {
    expect(SocialsInput.parse({ instagram: 'me', myspace: 'me' })).toEqual({ instagram: 'me' });
  });
});

describe('post details', () => {
  const body = (overrides: object = {}) => ({
    title: 'Launch',
    offer: 'A free meal',
    deliverable: 'One Reel',
    spots: 2,
    endsOn: nextWeek(),
    ...overrides,
  });

  it('saves the extra details', async () => {
    const { staff } = await makeBusiness();

    const response = await api('/collabs', {
      as: staff[0]!,
      body: body({
        details: 'A longer story about the launch.',
        requirements: 'Food creators in Bahrain.',
        location: 'Adliya',
      }),
    });

    const { collab } = await response.json<{ collab: Collab }>();
    expect(collab).toMatchObject({
      details: 'A longer story about the launch.',
      requirements: 'Food creators in Bahrain.',
      location: 'Adliya',
    });
  });

  it('leaves them optional', async () => {
    const { staff } = await makeBusiness();

    const response = await api('/collabs', { as: staff[0]!, body: body() });

    expect(response.status).toBe(201);
    const { collab } = await response.json<{ collab: Collab }>();
    expect(collab.details).toBe('');
  });

  it('can be edited', async () => {
    const { collabId, staff } = await makeCollab({ spots: 2 });

    await api(`/collabs/${collabId}`, {
      as: staff[0]!,
      method: 'PUT',
      body: body({ details: 'Updated', location: 'Seef' }),
    });

    const response = await api(`/collabs/${collabId}`, { as: staff[0]! });
    const { collab } = await response.json<{ collab: Collab }>();
    expect(collab).toMatchObject({ details: 'Updated', location: 'Seef' });
  });

  it.each([
    ['details', { details: 'x'.repeat(1001) }],
    ['requirements', { requirements: 'x'.repeat(501) }],
    ['location', { location: 'x'.repeat(81) }],
    ['offer', { offer: 'x'.repeat(401) }],
    ['deliverable', { deliverable: 'x'.repeat(501) }],
  ])('limits %s', async (field, overrides) => {
    const { staff } = await makeBusiness();

    const response = await api('/collabs', { as: staff[0]!, body: body(overrides) });

    expect(response.status).toBe(422);
    const { error } = await response.json<ErrorBody>();
    expect(error.fields).toHaveProperty(field);
  });

  it('accepts a long description up to the limit', async () => {
    const { staff } = await makeBusiness();

    const response = await api('/collabs', {
      as: staff[0]!,
      body: body({ details: 'x'.repeat(1000) }),
    });

    expect(response.status).toBe(201);
  });
});
