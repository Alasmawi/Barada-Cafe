import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { newToken } from '../ids';

export const SESSION_COOKIE = 'cb_session';
const THIRTY_DAYS = 30 * 24 * 60 * 60;

/** Only a hash is stored, so a copy of the database can't be used to sign in. */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function startSession(c: Context, userId: string): Promise<void> {
  const token = newToken();
  await c.env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at) VALUES (?, ?, ?)')
    .bind(await hashToken(token), userId, new Date().toISOString())
    .run();
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'Lax',
    // Plain http only happens on a local network, where a Secure cookie would never be sent.
    secure: new URL(c.req.url).protocol === 'https:',
    path: '/',
    maxAge: THIRTY_DAYS,
  });
}

export async function endSession(c: Context): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await hashToken(token))
      .run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}
