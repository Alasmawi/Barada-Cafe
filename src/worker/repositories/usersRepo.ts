import type { CreatorCard, Role, User } from '../../shared/api';
import type { House } from '../../shared/houses';
import { parseSocials, type Socials } from '../../shared/socials';

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: Role;
  business_id: string | null;
  business_name: string | null;
  business_house: House | null;
  handle: string | null;
  tags: string;
  signature: string | null;
  socials: string;
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
    businessHouse: row.business_house,
    handle: row.handle,
    tags: toTags(row.tags),
    signature: row.signature,
    socials: parseSocials(row.socials),
  };
}

const SELECT_USER = `
  SELECT users.id, users.username, users.name, users.role, users.business_id, users.handle,
         users.tags, users.signature, users.socials,
         businesses.name AS business_name,
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
    socials: parseSocials(row.socials),
    servedCount: row.served_count,
    aiSummary: row.summary,
    summaryKey: row.summary_key,
  };
}

const SELECT_CREATOR = `
  SELECT users.*, NULL AS business_name, NULL AS business_house,
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
  socials: Socials;
};

const insertUserStatement = (db: D1Database, user: NewUser, role: Role, businessId: string | null) =>
  db
    .prepare(
      `INSERT INTO users (id, username, password_hash, name, role, business_id, handle, tags, signature, socials)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      JSON.stringify(user.socials),
    );

export async function saveSocials(db: D1Database, id: string, socials: Socials): Promise<void> {
  await db
    .prepare('UPDATE users SET socials = ? WHERE id = ?')
    .bind(JSON.stringify(socials), id)
    .run();
}

export async function insertCreator(db: D1Database, user: NewUser): Promise<void> {
  await insertUserStatement(db, user, 'creator', null).run();
}

/** Both rows or neither, so a failed sign-up can't leave a business with no owner. */
export async function insertBusinessOwner(
  db: D1Database,
  user: NewUser,
  business: { id: string; name: string; house: House },
): Promise<void> {
  await db.batch([
    db
      .prepare('INSERT INTO businesses (id, name, house) VALUES (?, ?, ?)')
      .bind(business.id, business.name, business.house),
    insertUserStatement(db, user, 'business', business.id),
  ]);
}
