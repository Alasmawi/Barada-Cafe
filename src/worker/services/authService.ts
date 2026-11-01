import type { User } from '../../shared/api';
import type { LoginInput, SignUpInput } from '../../shared/schemas';
import { hashPassword, verifyPassword } from '../auth/passwords';
import { DomainError } from '../http/errors';
import { newId } from '../ids';
import * as usersRepo from '../repositories/usersRepo';

const usernameTaken = () =>
  new DomainError('USERNAME_TAKEN', 409, 'That username is taken.', {
    username: 'That username is taken. Try another.',
  });

/** Compared against when the username is unknown, so both failures take the same time. */
const NO_ACCOUNT_HASH =
  'pbkdf2$10000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000';

export async function signUp(db: D1Database, input: SignUpInput): Promise<string> {
  if (await usersRepo.findLogin(db, input.username)) throw usernameTaken();

  const id = newId('usr');
  const shared = {
    id,
    username: input.username,
    passwordHash: await hashPassword(input.password),
  };

  try {
    if (input.role === 'creator') {
      await usersRepo.insertCreator(db, {
        ...shared,
        name: input.name,
        handle: input.handle,
        tags: input.tags,
        signature: input.signature || null,
        socials: input.socials,
      });
    } else {
      await usersRepo.insertBusinessOwner(
        db,
        { ...shared, name: input.businessName, handle: null, tags: [], signature: null, socials: {} },
        {
          id: newId('biz'),
          name: input.businessName,
          area: input.area,
          type: input.businessType,
          house: input.house,
        },
      );
    }
  } catch (error) {
    // Two people taking the same name at once: the UNIQUE constraint settles it.
    if (String(error).includes('UNIQUE')) throw usernameTaken();
    throw error;
  }
  return id;
}

export async function logIn(db: D1Database, input: LoginInput): Promise<string> {
  const login = await usersRepo.findLogin(db, input.username);
  const matches = await verifyPassword(input.password, login?.passwordHash ?? NO_ACCOUNT_HASH);
  if (!login || !matches) {
    throw new DomainError('WRONG_LOGIN', 401, "That username and password don't match.");
  }
  return login.id;
}

export async function loadUser(db: D1Database, id: string): Promise<User> {
  const user = await usersRepo.findById(db, id);
  if (!user) throw new DomainError('NOT_SIGNED_IN', 401, 'Log in to continue.');
  return user;
}
