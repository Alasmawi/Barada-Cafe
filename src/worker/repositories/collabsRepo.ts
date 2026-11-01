import type { Collab } from '../../shared/api';
import type { BusinessType, House } from '../../shared/houses';
import type { CollabInput, CollabKind } from '../../shared/schemas';
import { collabState } from '../../shared/status';
import { SPOT_HOLDING_SQL } from './sql';

type CollabRow = {
  id: string;
  kind: CollabKind;
  business_id: string;
  business_name: string;
  business_area: string;
  business_type: BusinessType;
  business_house: House;
  title: string;
  offer: string;
  deliverable: string;
  details: string;
  requirements: string;
  location: string;
  spots: number;
  spots_taken: number;
  pending_count: number;
  ends_on: string;
  created_at: string;
};

const SELECT_COLLAB = `
  SELECT
    c.id, c.kind, c.business_id, c.title, c.offer, c.deliverable, c.details, c.requirements, c.location, c.spots, c.ends_on, c.created_at,
    businesses.name AS business_name,
    businesses.area AS business_area,
    businesses.type AS business_type,
    businesses.house AS business_house,
    (SELECT COUNT(*) FROM requests r
     WHERE r.collab_id = c.id AND r.status IN (${SPOT_HOLDING_SQL})) AS spots_taken,
    (SELECT COUNT(*) FROM requests r
     WHERE r.collab_id = c.id AND r.status = 'pending') AS pending_count
  FROM collabs c
  JOIN businesses ON businesses.id = c.business_id`;

function toCollab(row: CollabRow, today: string): Collab {
  const shape = { endsOn: row.ends_on, spots: row.spots, spotsTaken: row.spots_taken };
  return {
    id: row.id,
    kind: row.kind,
    businessId: row.business_id,
    businessName: row.business_name,
    businessArea: row.business_area,
    businessType: row.business_type,
    businessHouse: row.business_house,
    title: row.title,
    offer: row.offer,
    deliverable: row.deliverable,
    details: row.details,
    requirements: row.requirements,
    location: row.location,
    spots: row.spots,
    spotsTaken: row.spots_taken,
    spotsLeft: Math.max(row.spots - row.spots_taken, 0),
    pendingCount: row.pending_count,
    endsOn: row.ends_on,
    state: collabState(shape, today),
    createdAt: row.created_at,
  };
}

export async function findById(db: D1Database, id: string, today: string): Promise<Collab | null> {
  const row = await db.prepare(`${SELECT_COLLAB} WHERE c.id = ?`).bind(id).first<CollabRow>();
  return row ? toCollab(row, today) : null;
}

/** Collabs that haven't ended, soonest deadline first. */
export async function listActive(db: D1Database, today: string): Promise<Collab[]> {
  const { results } = await db
    .prepare(`${SELECT_COLLAB} WHERE c.ends_on >= ? ORDER BY c.ends_on, c.created_at`)
    .bind(today)
    .all<CollabRow>();
  return results.map((row) => toCollab(row, today));
}

export async function listForBusiness(
  db: D1Database,
  businessId: string,
  today: string,
): Promise<Collab[]> {
  const { results } = await db
    .prepare(`${SELECT_COLLAB} WHERE c.business_id = ? ORDER BY c.ends_on DESC, c.created_at DESC`)
    .bind(businessId)
    .all<CollabRow>();
  return results.map((row) => toCollab(row, today));
}

export async function listForCreator(
  db: D1Database,
  creatorId: string,
  today: string,
): Promise<Collab[]> {
  const { results } = await db
    .prepare(
      `${SELECT_COLLAB} WHERE c.id IN (SELECT collab_id FROM requests WHERE creator_id = ?)`,
    )
    .bind(creatorId)
    .all<CollabRow>();
  return results.map((row) => toCollab(row, today));
}

export async function insert(
  db: D1Database,
  collab: CollabInput & { id: string; businessId: string; createdBy: string; createdAt: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO collabs (id, kind, business_id, title, offer, deliverable, details, requirements,
                            location, spots, ends_on, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      collab.id,
      collab.kind,
      collab.businessId,
      collab.title,
      collab.offer,
      collab.deliverable,
      collab.details,
      collab.requirements,
      collab.location,
      collab.spots,
      collab.endsOn,
      collab.createdBy,
      collab.createdAt,
    )
    .run();
}

/**
 * Saves an edit unless it would drop `spots` below the spots already taken. One statement,
 * like the accept guard, so an edit and an accept can't interleave and break the invariant.
 * Returns false when the guard refused.
 */
export async function updateIfSpotsCoverTaken(
  db: D1Database,
  id: string,
  input: CollabInput,
): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE collabs
       SET title = ?1, offer = ?2, deliverable = ?3, spots = ?4, ends_on = ?5, kind = ?7,
           details = ?8, requirements = ?9, location = ?10
       WHERE id = ?6
         AND ?4 >= (SELECT COUNT(*) FROM requests
                    WHERE requests.collab_id = collabs.id
                      AND requests.status IN (${SPOT_HOLDING_SQL}))`,
    )
    .bind(
      input.title,
      input.offer,
      input.deliverable,
      input.spots,
      input.endsOn,
      id,
      input.kind,
      input.details,
      input.requirements,
      input.location,
    )
    .run();
  return meta.changes === 1;
}
