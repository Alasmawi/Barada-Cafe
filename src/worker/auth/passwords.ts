/**
 * This is a demo, and the free plan allows 10 ms of CPU per request, so the work factor is
 * far below what real accounts need. Raise it, on a paid plan, before holding real passwords.
 */
const ITERATIONS = 10_000;
const HASH_BYTES = 32;

const toHex = (bytes: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BYTES * 8,
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(await derive(password, salt, ITERATIONS))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, iterations, salt, hash] = stored.split('$');
  if (!iterations || !salt || !hash) return false;
  const actual = await derive(password, fromHex(salt), Number(iterations));
  return crypto.subtle.timingSafeEqual(actual, fromHex(hash));
}
