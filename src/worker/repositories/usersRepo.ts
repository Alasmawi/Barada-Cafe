import type { Role, User } from '../../shared/api';

type UserRow = {
  id: string;
  name: string;
  role: Role;
  cafe_id: string | null;
  handle: string | null;
  avatar_seed: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    cafeId: row.cafe_id,
    handle: row.handle,
    avatarSeed: row.avatar_seed,
  };
}

export async function findById(db: D1Database, id: string): Promise<User | null> {
  const row = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  return row ? toUser(row) : null;
}

export async function listAll(db: D1Database): Promise<User[]> {
  const { results } = await db.prepare('SELECT * FROM users ORDER BY role, name').all<UserRow>();
  return results.map(toUser);
}
