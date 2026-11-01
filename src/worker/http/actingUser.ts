import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { hashToken, SESSION_COOKIE } from '../auth/sessions';
import type { AppEnv } from '../env';
import * as usersRepo from '../repositories/usersRepo';
import { DomainError } from './errors';

/** Loads who is signed in. What they may do is decided by the services from this row. */
export const actingUser = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  const actor = token ? await usersRepo.findBySession(c.env.DB, await hashToken(token)) : null;
  if (!actor) throw new DomainError('NOT_SIGNED_IN', 401, 'Log in to continue.');

  c.set('actor', actor);
  await next();
});
