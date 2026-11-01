import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';
import * as usersRepo from '../repositories/usersRepo';
import { DomainError } from './errors';

/**
 * Faked login: the client names the user in `X-User-Id`. The header only picks who is
 * acting. What they may do is always decided by the services from the row loaded here.
 */
export const actingUser = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.req.header('X-User-Id');
  const actor = userId ? await usersRepo.findById(c.env.DB, userId) : null;
  if (!actor) throw new DomainError('UNKNOWN_USER', 401, 'Choose who you are to continue.');

  c.set('actor', actor);
  await next();
});
