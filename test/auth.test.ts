import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { ErrorBody, User } from '../src/shared/api';
import { DEMO_PASSWORD } from '../src/worker/demo/seed';
import { hashToken, SESSION_COOKIE } from '../src/worker/auth/sessions';
import { api, errorCode, makeBusiness } from './helpers';

const creator = (overrides: object = {}) => ({
  role: 'creator',
  username: `noor${crypto.randomUUID().slice(0, 6)}`,
  password: 'correct horse',
  name: 'Noor',
  handle: '@noor.new',
  signature: 'Slow pours.',
  tags: ['Coffee', 'Reels', 'Calm'],
  ...overrides,
});

const business = (overrides: object = {}) => ({
  role: 'business',
  username: `layla${crypto.randomUUID().slice(0, 6)}`,
  password: 'correct horse',
  businessName: 'New Studio',
  area: 'Seef',
  businessType: 'Fitness',
  house: 'coral',
  ...overrides,
});

function cookieFrom(response: Response): string {
  const header = response.headers.get('Set-Cookie') ?? '';
  return header.split(';')[0]!;
}

describe('signing up', () => {
  it('creates a creator with their tags, and signs them in', async () => {
    const response = await api('/auth/signup', { body: creator() });

    expect(response.status).toBe(201);
    const { user } = await response.json<{ user: User }>();
    expect(user).toMatchObject({ role: 'creator', tags: ['Coffee', 'Reels', 'Calm'] });

    const me = await api('/me', { cookie: cookieFrom(response) });
    expect(me.status).toBe(200);
  });

  it('keeps a business to one account', async () => {
    const { businessId } = await makeBusiness();

    const second = env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, name, role, business_id)
       VALUES ('usr_second', 'second', 'unused', 'Second', 'business', ?)`,
    ).bind(businessId);

    await expect(second.run()).rejects.toThrow(/UNIQUE/);
  });

  it('creates a business of any kind with its owner, who can post a collab', async () => {
    const response = await api('/auth/signup', { body: business() });

    expect(response.status).toBe(201);
    const { user } = await response.json<{ user: User }>();
    expect(user).toMatchObject({
      role: 'business',
      businessName: 'New Studio',
      businessType: 'Fitness',
      businessHouse: 'coral',
    });

    const collab = await api('/collabs', {
      cookie: cookieFrom(response),
      body: {
        title: 'Mat classes',
        offer: 'Free classes',
        deliverable: 'One Reel',
        spots: 2,
        endsOn: '2099-01-01',
      },
    });
    expect(collab.status).toBe(201);
  });

  it('never returns or stores the password', async () => {
    const input = creator();
    const response = await api('/auth/signup', { body: input });

    expect(await response.text()).not.toContain(input.password);
    const row = await env.DB.prepare('SELECT password_hash FROM users WHERE username = ?')
      .bind(input.username)
      .first<{ password_hash: string }>();
    expect(row?.password_hash).toMatch(/^pbkdf2\$/);
    expect(row?.password_hash).not.toContain(input.password);
  });

  it('stores only a hash of the session token', async () => {
    const response = await api('/auth/signup', { body: creator() });
    const token = cookieFrom(response).split('=')[1]!;

    const { results } = await env.DB.prepare('SELECT token_hash FROM sessions').all<{
      token_hash: string;
    }>();
    expect(results.map((row) => row.token_hash)).toContain(await hashToken(token));
    expect(results.map((row) => row.token_hash)).not.toContain(token);
  });

  it('sends the session as an HttpOnly cookie', async () => {
    const response = await api('/auth/signup', { body: creator() });

    const header = response.headers.get('Set-Cookie') ?? '';
    expect(header).toContain(`${SESSION_COOKIE}=`);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Secure');
  });

  it('refuses a username that is taken, ignoring case', async () => {
    const input = creator();
    await api('/auth/signup', { body: input });

    const response = await api('/auth/signup', {
      body: creator({ username: input.username.toUpperCase() }),
    });

    expect(response.status).toBe(409);
    expect(await errorCode(response)).toBe('USERNAME_TAKEN');
  });

  it('gives only one of two people the same username at the same moment', async () => {
    const username = `race${crypto.randomUUID().slice(0, 6)}`;

    const responses = await Promise.all([
      api('/auth/signup', { body: creator({ username }) }),
      api('/auth/signup', { body: business({ username }) }),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
  });

  it.each([
    ['a short password', { password: 'short' }, 'password'],
    ['a bad username', { username: 'no spaces here' }, 'username'],
    ['a handle with no @', { handle: 'noor' }, 'handle'],
    ['no format tag', { tags: ['Coffee', 'Calm'] }, 'tags'],
    ['no vibe tag', { tags: ['Coffee', 'Reels'] }, 'tags'],
    ['two vibes', { tags: ['Coffee', 'Reels', 'Calm', 'Bold'] }, 'tags'],
    ['an unknown tag', { tags: ['Coffee', 'Reels', 'Calm', 'Crypto'] }, 'tags'],
    ['a repeated tag', { tags: ['Coffee', 'Coffee', 'Reels', 'Calm'] }, 'tags'],
    [
      'more than six tags',
      { tags: ['Coffee', 'Food', 'Beauty', 'Fashion', 'Fitness', 'Reels', 'Calm'] },
      'tags',
    ],
  ])('rejects %s', async (_name, overrides, field) => {
    const response = await api('/auth/signup', { body: creator(overrides) });

    expect(response.status).toBe(422);
    const { error } = await response.json<ErrorBody>();
    expect(error.fields).toHaveProperty(field);
  });

  it('rejects a house that is not on the list', async () => {
    const response = await api('/auth/signup', { body: business({ house: 'neon' }) });

    expect(response.status).toBe(422);
  });

  it('cannot be used to pick a role that does not exist', async () => {
    const response = await api('/auth/signup', { body: creator({ role: 'admin' }) });

    expect(response.status).toBe(422);
  });
});

describe('the public demo list', () => {
  it('never shows people who signed up', async () => {
    const input = creator();
    await api('/demo/reset', { method: 'POST' });
    await api('/auth/signup', { body: input });

    const response = await api('/demo/accounts');
    const body = await response.text();

    expect(body).toContain('noor');
    expect(body).not.toContain(input.username);
    expect(body).not.toContain('pbkdf2');
  });
});

describe('logging in', () => {
  it('works with the right password, ignoring username case', async () => {
    const input = creator();
    await api('/auth/signup', { body: input });

    const response = await api('/auth/login', {
      body: { username: input.username.toUpperCase(), password: input.password },
    });

    expect(response.status).toBe(200);
    expect((await api('/me', { cookie: cookieFrom(response) })).status).toBe(200);
  });

  it('works for a demo account after a reset', async () => {
    await api('/demo/reset', { method: 'POST' });

    const response = await api('/auth/login', {
      body: { username: 'noor', password: DEMO_PASSWORD },
    });

    expect(response.status).toBe(200);
  });

  it('gives the same answer for a wrong password and an unknown user', async () => {
    const input = creator();
    await api('/auth/signup', { body: input });

    const wrongPassword = await api('/auth/login', {
      body: { username: input.username, password: 'not the password' },
    });
    const unknownUser = await api('/auth/login', {
      body: { username: 'nobody.here', password: 'not the password' },
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
  });
});

describe('logging out', () => {
  it('ends the session on the server, not only in the browser', async () => {
    const signedUp = await api('/auth/signup', { body: creator() });
    const cookie = cookieFrom(signedUp);

    await api('/auth/logout', { cookie, method: 'POST' });

    expect((await api('/me', { cookie })).status).toBe(401);
  });
});

describe('a session', () => {
  it('rejects a made-up token', async () => {
    const response = await api('/me', { cookie: `${SESSION_COOKIE}=made-up` });

    expect(response.status).toBe(401);
    expect(await errorCode(response)).toBe('NOT_SIGNED_IN');
  });

  it('cannot be faked with the old X-User-Id header', async () => {
    await api('/demo/reset', { method: 'POST' });

    const response = await exports.default.fetch('https://collab.test/api/v1/me', {
      headers: { 'X-User-Id': 'usr_noor' },
    });

    expect(response.status).toBe(401);
  });
});
