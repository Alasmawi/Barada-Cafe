/** Collabs the creator has any request on, so they're never picked again. */
export async function requestedCollabIds(db: D1Database, creatorId: string): Promise<Set<string>> {
  const { results } = await db
    .prepare('SELECT collab_id FROM requests WHERE creator_id = ?')
    .bind(creatorId)
    .all<{ collab_id: string }>();
  return new Set(results.map((row) => row.collab_id));
}

/** Today's saved reasons. A null reason means the AI was asked and gave nothing usable. */
export async function reasonsForDay(
  db: D1Database,
  creatorId: string,
  day: string,
): Promise<Map<string, string | null>> {
  const { results } = await db
    .prepare('SELECT collab_id, reason FROM pick_reasons WHERE creator_id = ? AND day = ?')
    .bind(creatorId, day)
    .all<{ collab_id: string; reason: string | null }>();
  return new Map(results.map((row) => [row.collab_id, row.reason]));
}

/** INSERT OR IGNORE, so two tabs asking at once save one answer and neither fails. */
export async function saveReasons(
  db: D1Database,
  creatorId: string,
  day: string,
  reasons: Map<string, string | null>,
): Promise<void> {
  if (reasons.size === 0) return;
  await db.batch(
    [...reasons].map(([collabId, reason]) =>
      db
        .prepare(
          'INSERT OR IGNORE INTO pick_reasons (creator_id, collab_id, day, reason) VALUES (?, ?, ?, ?)',
        )
        .bind(creatorId, collabId, day, reason),
    ),
  );
}
