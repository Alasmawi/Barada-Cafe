import type { CollabRequest, InboxRequest } from '../../shared/api';
import type { RequestStatus } from '../../shared/status';
import { SPOT_HOLDING_SQL } from './sql';

type RequestRow = {
  id: string;
  collab_id: string;
  creator_id: string;
  pitch: string;
  status: RequestStatus;
  pass_code: string | null;
  post_url: string | null;
  created_at: string;
  decided_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
};

type InboxRow = RequestRow & {
  creator_name: string;
  creator_handle: string | null;
  creator_avatar_seed: string;
};

function toRequest(row: RequestRow): CollabRequest {
  return {
    id: row.id,
    collabId: row.collab_id,
    creatorId: row.creator_id,
    pitch: row.pitch,
    status: row.status,
    passCode: row.pass_code,
    postUrl: row.post_url,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
  };
}

export async function findById(db: D1Database, id: string): Promise<CollabRequest | null> {
  const row = await db.prepare('SELECT * FROM requests WHERE id = ?').bind(id).first<RequestRow>();
  return row ? toRequest(row) : null;
}

export async function findByCollabAndCreator(
  db: D1Database,
  collabId: string,
  creatorId: string,
): Promise<CollabRequest | null> {
  const row = await db
    .prepare('SELECT * FROM requests WHERE collab_id = ? AND creator_id = ?')
    .bind(collabId, creatorId)
    .first<RequestRow>();
  return row ? toRequest(row) : null;
}

export async function listInbox(db: D1Database, collabId: string): Promise<InboxRequest[]> {
  const { results } = await db
    .prepare(
      `SELECT requests.*,
              users.name AS creator_name,
              users.handle AS creator_handle,
              users.avatar_seed AS creator_avatar_seed
       FROM requests
       JOIN users ON users.id = requests.creator_id
       WHERE requests.collab_id = ?
       ORDER BY requests.created_at`,
    )
    .bind(collabId)
    .all<InboxRow>();
  return results.map((row) => ({
    ...toRequest(row),
    creatorName: row.creator_name,
    creatorHandle: row.creator_handle,
    creatorAvatarSeed: row.creator_avatar_seed,
  }));
}

export async function listForCreator(
  db: D1Database,
  creatorId: string,
): Promise<CollabRequest[]> {
  const { results } = await db
    .prepare('SELECT * FROM requests WHERE creator_id = ? ORDER BY created_at DESC')
    .bind(creatorId)
    .all<RequestRow>();
  return results.map(toRequest);
}

/**
 * Inserts the request only while the collab is open. Returns false when nothing was
 * inserted: a duplicate, an ended collab or a full one, which the service tells apart.
 */
export async function insertIfCollabOpen(
  db: D1Database,
  request: {
    id: string;
    collabId: string;
    creatorId: string;
    pitch: string;
    createdAt: string;
    today: string;
  },
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `INSERT INTO requests (id, collab_id, creator_id, pitch, created_at)
       SELECT ?1, c.id, ?3, ?4, ?5
       FROM collabs c
       WHERE c.id = ?2
         AND c.ends_on >= ?6
         AND (SELECT COUNT(*) FROM requests taken
              WHERE taken.collab_id = c.id
                AND taken.status IN (${SPOT_HOLDING_SQL})) < c.spots
       ON CONFLICT (collab_id, creator_id) DO NOTHING`,
    )
    .bind(
      request.id,
      request.collabId,
      request.creatorId,
      request.pitch,
      request.createdAt,
      request.today,
    )
    .run();
  return meta.changes === 1;
}

/**
 * THE invariant: a collab never accepts more creators than it has spots.
 *
 * One statement on purpose. D1 runs a write statement atomically, so the count and the
 * update can't be split by another request. Never "SELECT count, then UPDATE".
 * The count follows the row's own collab_id, so no caller can pass the wrong collab.
 *
 * Returns false when the guard refused; the service re-reads the row to explain why.
 */
export async function acceptIfSpotAvailable(
  db: D1Database,
  accept: { id: string; decidedAt: string; decidedBy: string; passCode: string; today: string },
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE requests
       SET status = 'accepted', decided_at = ?1, decided_by = ?2, pass_code = ?3
       WHERE id = ?4
         AND status = 'pending'
         AND (SELECT ends_on FROM collabs WHERE id = requests.collab_id) >= ?5
         AND (SELECT COUNT(*) FROM requests AS taken
              WHERE taken.collab_id = requests.collab_id
                AND taken.status IN (${SPOT_HOLDING_SQL}))
             < (SELECT spots FROM collabs WHERE id = requests.collab_id)`,
    )
    .bind(accept.decidedAt, accept.decidedBy, accept.passCode, accept.id, accept.today)
    .run();
  return meta.changes === 1;
}

export async function declineIfPending(
  db: D1Database,
  decline: { id: string; decidedAt: string; decidedBy: string },
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE requests SET status = 'declined', decided_at = ?, decided_by = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .bind(decline.decidedAt, decline.decidedBy, decline.id)
    .run();
  return meta.changes === 1;
}

/** `submitted_at` keeps the first submission when a creator corrects their link. */
export async function submitLinkIfAllowed(
  db: D1Database,
  submission: { id: string; postUrl: string; submittedAt: string },
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE requests
       SET status = 'submitted', post_url = ?, submitted_at = COALESCE(submitted_at, ?)
       WHERE id = ? AND status IN ('accepted', 'submitted')`,
    )
    .bind(submission.postUrl, submission.submittedAt, submission.id)
    .run();
  return meta.changes === 1;
}

export async function completeIfSubmitted(
  db: D1Database,
  completion: { id: string; completedAt: string },
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE requests SET status = 'done', completed_at = ?
       WHERE id = ? AND status = 'submitted'`,
    )
    .bind(completion.completedAt, completion.id)
    .run();
  return meta.changes === 1;
}
