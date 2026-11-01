import type { Role, User } from '../../shared/api';

type UserRow = {
  id: string;
  name: string;
  role: Role;
  cafe_id: string | null;
  cafe_name: string | null;
  handle: string | null;
  avatar_seed: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    cafeId: row.cafe_id,
    cafeName: row.cafe_name,
    handle: row.handle,
    avatarSeed: row.avatar_seed,
  };
}

const SELECT_USER = `
  SELECT users.*, cafes.name AS cafe_name
  FROM users
  LEFT JOIN cafes ON cafes.id = users.cafe_id`;

export async function findById(db: D1Database, id: string): Promise<User | null> {
  const row = await db
    .prepare(`${SELECT_USER} WHERE users.id = ?`)
    .bind(id)
    .first<UserRow>();
  return row ? toUser(row) : null;
}

export async function listAll(db: D1Database): Promise<User[]> {
  const { results } = await db
    .prepare(`${SELECT_USER} ORDER BY users.role, users.name`)
    .all<UserRow>();
  return results.map(toUser);
}
