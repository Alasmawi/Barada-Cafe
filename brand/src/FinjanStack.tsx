import { useMemo, useRef } from 'react';
import { stackSVG } from './finjan-art.js';

type Props = {
  /** Total spots on the collab. */
  spots: number;
  /** Spots taken (accepted + submitted + done). */
  taken: number;
  /** Use the collab id — gives every collab its own foil pattern. */
  seed: string;
  width?: number;
  theme?: 'night' | 'light';
};

/**
 * The spots meter: open spots stand as a leaning stack of finjans,
 * taken spots sit filled on the tray. When `taken` goes up, the newest
 * cup animates from the stack onto the tray.
 */
export function FinjanStack({ spots, taken, seed, width = 200, theme = 'night' }: Props) {
  const previousTaken = useRef(taken);
  const animateLast = taken > previousTaken.current;
  previousTaken.current = taken;

  const markup = useMemo(
    () => stackSVG({ spots, taken, seed, width, theme, animateLast }),
    [spots, taken, seed, width, theme, animateLast],
  );

  return (
    <div
      className="finjan-stack"
      role="img"
      aria-label={taken >= spots ? `All ${spots} cups taken` : `${taken} of ${spots} spots taken`}
      // Markup is generated locally from numbers and a hashed seed — no user text is interpolated.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
