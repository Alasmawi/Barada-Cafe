// 32 characters, so a random byte masked to 5 bits picks from it without bias.
const PASS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I look-alikes
const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function randomString(alphabet: string, length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte & 31]).join('');
}

export function newId(prefix: 'col' | 'req'): string {
  return `${prefix}_${randomString(ID_ALPHABET, 12)}`;
}

/** Doesn't need to be unique: staff check it against the creator's name in their own inbox. */
export function newPassCode(): string {
  return `FJ-${randomString(PASS_ALPHABET, 4)}`;
}
