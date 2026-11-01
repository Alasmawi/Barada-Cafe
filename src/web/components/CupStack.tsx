import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { stackSVG } from '../../../brand/src/finjan-art.js';

/** The length of `fj-serve` in the art engine, plus a beat. */
const SERVE_MS = 800;

type Props = { spots: number; taken: number; seed: string; width: number };

/**
 * The spots meter. Like the brand's FinjanStack, but it holds the animation for its full
 * length. FinjanStack animates for one render only, so the refetch after an accept redraws
 * the art and cuts the cup off mid-flight.
 */
export function CupStack({ spots, taken, seed, width }: Props) {
  const previousTaken = useRef(taken);
  const [animateLast, setAnimateLast] = useState(false);

  // A layout effect, so the cup never paints on the tray before its animation starts.
  useLayoutEffect(() => {
    const gainedCup = taken > previousTaken.current;
    previousTaken.current = taken;
    if (!gainedCup) return;

    setAnimateLast(true);
    const timer = setTimeout(() => setAnimateLast(false), SERVE_MS);
    return () => clearTimeout(timer);
  }, [taken]);

  const markup = useMemo(
    () => stackSVG({ spots, taken, seed, width, animateLast }),
    [spots, taken, seed, width, animateLast],
  );

  return (
    <div
      className="finjan-stack"
      role="img"
      aria-label={taken >= spots ? `All ${spots} spots taken` : `${taken} of ${spots} spots taken`}
      // Markup is generated locally from numbers and a hashed seed. No user text goes in.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
