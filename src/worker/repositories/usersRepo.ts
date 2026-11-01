import type { CreatorCard, Role, User } from '../../shared/api';
import type { BusinessType, House } from '../../shared/houses';

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: Role;
  business_id: string | null;
  business_name: string | null;
  business_type: BusinessType | null;
  business_house: House | null;
  handle: string | null;
  tags: string;
  signature: string | null;
};

type CreatorRow = UserRow & {
  summary: string | null;
  summary_key: string | null;
  served_count: number;
};

const toTags = (tags: string) => (tags ? tags.split(',') : []);

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role,
    businessId: row.business_id,
    businessName: row.business_name,
    businessType: row.business_type,
    businessHouse: row.business_house,
    handle: row.handle,
    tags: toTags(row.tags),
    signature: row.signature,
  };
}

const SELECT_USER = `
  SELECT users.id, users.username, users.name, users.role, users.business_id, users.handle,
         users.tags, users.signature,
         businesses.name AS business_name,
         businesses.type AS business_type,
         businesses.house AS business_house
  FROM users
  LEFT JOIN businesses ON businesses.id = users.business_id`;

export async function findById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(`${SELECT_USER} WHERE users.id = ?`)
    .bind(id)
    .first<UserRow>();
  return row ? toUser(row) : null;
}

export async function findBySession(db: D1Database, tokenHash: string): Promise<User | null> {
  const row = await db
    .prepare(
      `${SELECT_USER} JOIN sessions ON sessions.user_id = users.id WHERE sessions.token_hash = ?`,
    )
    .bind(tokenHash)
    .first<UserRow>();
  return row ? toUser(row) : null;
}

export async function findLogin(
  db: D1Database,
  username: string,
): Promise<{ id: string; passwordHash: string } | null> {
  const row = await db
    .prepare('SELECT id, password_hash FROM users WHERE username = ?')
    .bind(username)
    .first<{ id: string; password_hash: string }>();
  return row ? { id: row.id, passwordHash: row.password_hash } : null;
}

/** Matched on the shared demo hash, so people who sign up are never listed publicly. */
export async function listDemoAccounts(db: D1Database, demoHash: string): Promise<User[]> {
  const { results } = await db
    .prepare(`${SELECT_USER} WHERE users.password_hash = ? ORDER BY users.role, users.name`)
    .bind(demoHash)
    .all<UserRow>();
  return results.map(toUser);
}

const SERVED_COUNT = `(SELECT COUNT(*) FROM requests
   WHERE requests.creator_id = users.id AND requests.status = 'done') AS served_count`;

export type StoredCreator = Omit<CreatorCard, 'summary' | 'isAiSummary'> & {
  aiSummary: string | null;
  summaryKey: string | null;
};

function toCreatorCard(row: CreatorRow): StoredCreator {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    tags: toTags(row.tags),
    signature: row.signature,
    servedCount: row.served_count,
    aiSummary: row.summary,
    summaryKey: row.summary_key,
  };
}

const SELECT_CREATOR = `
  SELECT users.*, NULL AS business_name, NULL AS business_type, NULL AS business_house,
         ${SERVED_COUNT}
  FROM users
  WHERE users.role = 'creator'`;

/** Wildcards in the search box are matched literally, so `%` can't list everyone by accident. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (match) => `\\${match}`);

export async function searchCreators(db: D1Database, query: string, limit: number) {
  const pattern = `%${escapeLike(query)}%`;
  const { results } = await db
    .prepare(
      `${SELECT_CREATOR}
         AND (users.name LIKE ?1 ESCAPE '\\'
              OR users.handle LIKE ?1 ESCAPE '\\'
              OR users.tags LIKE ?1 ESCAPE '\\')
       ORDER BY served_count DESC, users.name
       LIMIT ?2`,
    )
    .bind(pattern, limit)
    .all<CreatorRow>();
  return results.map(toCreatorCard);
}

export async function findCreator(db: D1Database, id: string) {
  const row = await db
    .prepare(`${SELECT_CREATOR} AND users.id = ?`)
    .bind(id)
    .first<CreatorRow>();
  return row ? toCreatorCard(row) : null;
}

export async function saveSummary(
  db: D1Database,
  id: string,
  summary: string,
  summaryKey: string,
): Promise<void> {
  await db
    .prepare('UPDATE users SET summary = ?, summary_key = ? WHERE id = ?')
    .bind(summary, summaryKey, id)
    .run();
}

export type NewUser = {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  handle: string | null;
  tags: string[];
  signature: string | null;
};

const insertUserStatement = (db: D1Database, user: NewUser, role: Role, businessId: string | null) =>
  db
    .prepare(
      `INSERT INTO users (id, username, password_hash, name, role, business_id, handle, tags, signature)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      user.id,
      user.username,
      user.passwordHash,
      user.name,
      role,
      businessId,
      user.handle,
      user.tags.join(','),
      user.signature,
    );

export async function insertCreator(db: D1Database, user: NewUser): Promise<void> {
  await insertUserStatement(db, user, 'creator', null).run();
}

/** Both rows or neither, so a failed sign-up can't leave a business with no owner. */
export async function insertBusinessOwner(
  db: D1Database,
  user: NewUser,
  business: { id: string; name: string; area: string; type: BusinessType; house: House },
): Promise<void> {
  await db.batch([
    db
      .prepare('INSERT INTO businesses (id, name, area, type, house) VALUES (?, ?, ?, ?, ?)')
      .bind(business.id, business.name, business.area, business.type, business.house),
    insertUserStatement(db, user, 'business', business.id),
  ]);
}
