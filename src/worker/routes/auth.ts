import { Hono } from 'hono';
import { LoginInput, SignUpInput } from '../../shared/schemas';
import { endSession, startSession } from '../auth/sessions';
import type { AppEnv } from '../env';
import { parseBody } from '../http/validate';
import * as authService from '../services/authService';

export const authRoutes = new Hono<AppEnv>()
  .post('/auth/signup', async (c) => {
    const input = await parseBody(c, SignUpInput);
    const id = await authService.signUp(c.env.DB, input);
    await startSession(c, id);
    return c.json({ user: await authService.loadUser(c.env.DB, id) }, 201);
  })
  .post('/auth/login', async (c) => {
    const input = await parseBody(c, LoginInput);
    const id = await authService.logIn(c.env.DB, input);
    await startSession(c, id);
    return c.json({ user: await authService.loadUser(c.env.DB, id) });
  })
  .post('/auth/logout', async (c) => {
    await endSession(c);
    return c.json({ ok: true });
  });
