const SEEN_PREFIX = 'finjan.seen.';

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Remembers on this device that a one-time moment has played. */
export function hasSeen(key: string): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + key) !== null;
  } catch {
    return true; // Without storage it would replay on every visit, so skip it instead.
  }
}

export function markSeen(key: string): void {
  try {
    localStorage.setItem(SEEN_PREFIX + key, '1');
  } catch {
    // Nothing to remember it in.
  }
}

/** After a demo reset, every moment should play again. */
export function forgetSeen(): void {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(SEEN_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Nothing to forget.
  }
}
