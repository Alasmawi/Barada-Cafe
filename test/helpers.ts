import { env, exports } from 'cloudflare:workers';
import type { Collab, CollabRequest, ErrorBody } from '../src/shared/api';
import { addDays, bahrainToday } from '../src/shared/dates';
import type { RequestStatus } from '../src/shared/status';
import { hashToken, SESSION_COOKIE } from '../src/worker/auth/sessions';

/**
 * Every test builds its own business, creators and collab with fresh ids, so tests
 * don't share rows or depend on order. Requests go over HTTP into the real Worker.
 */

let sequence = 0;
const nextId = (prefix: string) => `${prefix}_t${++sequence}_${crypto.randomUUID().slice(0, 8)}`;

export const today = () => bahrainToday();
export const yesterday = () => addDays(bahrainToday(), -1);
export const nextWeek = () => addDays(bahrainToday(), 7);

/** Signs a user straight in, so tests only pay for password hashing where it's being tested. */
async function sessionFor(userId: string): Promise<string> {
  const token = `test-session-${userId}`;
  await env.DB.prepare(
    `INSERT OR REPLACE INTO sessions (token_hash, user_id, created_at)
     SELECT ?, id, 'now' FROM users WHERE id = ?`,
  )
    .bind(await hashToken(token), userId)
    .run();
  return token;
}

export async function api(
  path: string,
  {
    as,
    cookie,
    method,
    body,
  }: { as?: string; cookie?: string; method?: string; body?: unknown } = {},
): Promise<Response> {
  const session = as ? `${SESSION_COOKIE}=${await sessionFor(as)}` : cookie;
  return exports.default.fetch(`https://collab.test/api/v1${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(session ? { Cookie: session } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const accept = (requestId: string, as: string) =>
  api(`/requests/${requestId}/accept`, { as, method: 'POST' });
export const decline = (requestId: string, as: string) =>
  api(`/requests/${requestId}/decline`, { as, method: 'POST' });
export const complete = (requestId: string, as: string) =>
  api(`/requests/${requestId}/complete`, { as, method: 'POST' });
export const submitLink = (
  requestId: string,
  as: string,
  postUrl = 'https://www.instagram.com/reel/abc/',
) => api(`/requests/${requestId}/submission`, { as, body: { postUrl } });
export const askToJoin = (collabId: string, as: string, pitch = 'I would love to visit.') =>
  api(`/collabs/${collabId}/requests`, { as, body: { pitch } });

export async function errorCode(response: Response): Promise<string> {
  const { error } = await response.json<ErrorBody>();
  return error.code;
}

export async function makeBusiness(): Promise<{ businessId: string; owner: string }> {
  const businessId = nextId('biz');
  const owner = nextId('usr');
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO businesses (id, name, area, type, house)
       VALUES (?, 'Test Business', 'Adliya', 'Café', 'saffron')`,
    ).bind(businessId),
    env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, name, role, business_id)
       VALUES (?, ?, 'unused', 'Test Business', 'business', ?)`,
    ).bind(owner, owner, businessId),
  ]);
  return { businessId, owner };
}

export async function makeCreators(count: number): Promise<string[]> {
  const creators = Array.from({ length: count }, () => nextId('usr'));
  await env.DB.batch(
    creators.map((id) =>
      env.DB.prepare(
        `INSERT INTO users (id, username, password_hash, name, role, handle, tags)
         VALUES (?, ?, 'unused', 'Creator', 'creator', ?, 'Coffee,Reels,Calm')`,
      ).bind(id, id, `@${id}`),
    ),
  );
  return creators;
}

type Scenario = {
  collabId: string;
  businessId: string;
  /** The account of the collab's business. */
  owner: string;
  creators: string[];
  /** One pending request per creator, in the same order. */
  requestIds: string[];
};

/** A collab with `pending` creators waiting. `endsOn` may be in the past. */
export async function makeCollab({
  spots,
  pending = 0,
  endsOn = nextWeek(),
}: {
  spots: number;
  pending?: number;
  endsOn?: string;
}): Promise<Scenario> {
  const { businessId, owner } = await makeBusiness();
  const creators = pending > 0 ? await makeCreators(pending) : [];
  const collabId = nextId('col');
  const requestIds = creators.map(() => nextId('req'));
  const createdAt = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO collabs (id, business_id, title, offer, deliverable, spots, ends_on, created_by, created_at)
       VALUES (?, ?, 'Test collab', 'A free latte', 'One Reel', ?, ?, ?, ?)`,
    ).bind(collabId, businessId, spots, endsOn, owner, createdAt),
    ...creators.map((creatorId, index) =>
      env.DB.prepare(
        `INSERT INTO requests (id, collab_id, creator_id, pitch, created_at)
         VALUES (?, ?, ?, 'Pick me', ?)`,
      ).bind(requestIds[index], collabId, creatorId, createdAt),
    ),
  ]);
  return { collabId, businessId, owner, creators, requestIds };
}

/** A scenario with one request already moved to `status` over the API. */
export async function makeRequestIn(status: RequestStatus) {
  const scenario = await makeCollab({ spots: 2, pending: 1 });
  const [ownerId, creatorId, requestId] = [
    scenario.owner,
    scenario.creators[0]!,
    scenario.requestIds[0]!,
  ];

  if (status === 'declined') await decline(requestId, ownerId);
  if (status === 'accepted' || status === 'submitted' || status === 'done') {
    await accept(requestId, ownerId);
  }
  if (status === 'submitted' || status === 'done') await submitLink(requestId, creatorId);
  if (status === 'done') await complete(requestId, ownerId);

  return { ...scenario, ownerId, creatorId, requestId };
}

export async function getCollab(collabId: string, as: string): Promise<Collab> {
  const response = await api(`/collabs/${collabId}`, { as });
  const { collab } = await response.json<{ collab: Collab }>();
  return collab;
}

export async function getRequest(requestId: string): Promise<CollabRequest> {
  const row = await env.DB.prepare('SELECT status, pass_code AS passCode FROM requests WHERE id = ?')
    .bind(requestId)
    .first<CollabRequest>();
  return row!;
}

/** Spots held according to the database itself, not the API. */
export async function countHeldSpots(collabId: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS held FROM requests
     WHERE collab_id = ? AND status IN ('accepted', 'submitted', 'done')`,
  )
    .bind(collabId)
    .first<{ held: number }>();
  return row!.held;
}
