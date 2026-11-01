import { env, exports } from 'cloudflare:workers';
import type { Collab, CollabRequest, ErrorBody } from '../src/shared/api';
import { addDays, bahrainToday } from '../src/shared/dates';
import type { RequestStatus } from '../src/shared/status';

/**
 * Every test builds its own café, staff, creators and collab with fresh ids, so tests
 * don't share rows or depend on order. Requests go over HTTP into the real Worker.
 */

let sequence = 0;
const nextId = (prefix: string) => `${prefix}_t${++sequence}`;

export const today = () => bahrainToday();
export const yesterday = () => addDays(bahrainToday(), -1);
export const nextWeek = () => addDays(bahrainToday(), 7);

export function api(
  path: string,
  { as, method, body }: { as?: string; method?: string; body?: unknown } = {},
): Promise<Response> {
  return exports.default.fetch(`https://finjan.test/api/v1${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: {
      ...(as ? { 'X-User-Id': as } : {}),
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

export async function makeCafe(staffCount = 1): Promise<{ cafeId: string; staff: string[] }> {
  const cafeId = nextId('caf');
  const staff = Array.from({ length: staffCount }, () => nextId('usr'));
  await env.DB.batch([
    env.DB.prepare('INSERT INTO cafes (id, name, area) VALUES (?, ?, ?)').bind(
      cafeId,
      'Test Café',
      'Adliya',
    ),
    ...staff.map((id) =>
      env.DB.prepare(
        `INSERT INTO users (id, name, role, cafe_id, avatar_seed)
         VALUES (?, 'Staff', 'cafe_staff', ?, ?)`,
      ).bind(id, cafeId, id),
    ),
  ]);
  return { cafeId, staff };
}

export async function makeCreators(count: number): Promise<string[]> {
  const creators = Array.from({ length: count }, () => nextId('usr'));
  await env.DB.batch(
    creators.map((id) =>
      env.DB.prepare(
        `INSERT INTO users (id, name, role, handle, avatar_seed)
         VALUES (?, 'Creator', 'creator', ?, ?)`,
      ).bind(id, `@${id}`, id),
    ),
  );
  return creators;
}

type Scenario = {
  collabId: string;
  cafeId: string;
  /** Staff of the collab's café. */
  staff: string[];
  creators: string[];
  /** One pending request per creator, in the same order. */
  requestIds: string[];
};

/** A collab with `pending` creators waiting. `endsOn` may be in the past. */
export async function makeCollab({
  spots,
  pending = 0,
  staffCount = 1,
  endsOn = nextWeek(),
}: {
  spots: number;
  pending?: number;
  staffCount?: number;
  endsOn?: string;
}): Promise<Scenario> {
  const { cafeId, staff } = await makeCafe(staffCount);
  const creators = pending > 0 ? await makeCreators(pending) : [];
  const collabId = nextId('col');
  const requestIds = creators.map(() => nextId('req'));
  const createdAt = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO collabs (id, cafe_id, title, offer, deliverable, spots, ends_on, created_by, created_at)
       VALUES (?, ?, 'Test collab', 'A free latte', 'One Reel', ?, ?, ?, ?)`,
    ).bind(collabId, cafeId, spots, endsOn, staff[0], createdAt),
    ...creators.map((creatorId, index) =>
      env.DB.prepare(
        `INSERT INTO requests (id, collab_id, creator_id, pitch, created_at)
         VALUES (?, ?, ?, 'Pick me', ?)`,
      ).bind(requestIds[index], collabId, creatorId, createdAt),
    ),
  ]);
  return { collabId, cafeId, staff, creators, requestIds };
}

/** A scenario with one request already moved to `status` over the API. */
export async function makeRequestIn(status: RequestStatus) {
  const scenario = await makeCollab({ spots: 2, pending: 1 });
  const [staffId, creatorId, requestId] = [
    scenario.staff[0]!,
    scenario.creators[0]!,
    scenario.requestIds[0]!,
  ];

  if (status === 'declined') await decline(requestId, staffId);
  if (status === 'accepted' || status === 'submitted' || status === 'done') {
    await accept(requestId, staffId);
  }
  if (status === 'submitted' || status === 'done') await submitLink(requestId, creatorId);
  if (status === 'done') await complete(requestId, staffId);

  return { ...scenario, staffId, creatorId, requestId };
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
