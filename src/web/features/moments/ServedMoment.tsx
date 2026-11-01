import { useEffect, useMemo } from 'react';
import doneArt from '../../../../brand/svg/state-done.svg';
import { prefersReducedMotion } from './motion';

/** One loop of the hazz. The art repeats on its own, so the moment ends it after one. */
const HAZZ_MS = 3400;
const STILL_MS = 1400;

type Props = { creatorName: string; onDone: () => void };

/** Sits over the inbox without blocking it, so staff can carry on through their pitches. */
export function ServedMoment({ creatorName, onDone }: Props) {
  // A fresh fragment restarts the animation when two posts are served in a row.
  const src = useMemo(() => `${doneArt}#${Date.now()}`, []);

  useEffect(() => {
    const timer = setTimeout(onDone, prefersReducedMotion() ? STILL_MS : HAZZ_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="served-moment" role="status">
      <img src={src} alt="" />
      <p>{creatorName}'s post is served.</p>
    </div>
  );
}
