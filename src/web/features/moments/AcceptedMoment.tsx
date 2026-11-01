import { useEffect, useMemo } from 'react';
import acceptedArt from '../../../../brand/svg/state-accepted.svg';

/** The art's own length: the dallah pours once and the cup lands. */
const POUR_MS = 3600;

/** Plays the first time a creator opens an accepted request. Any tap skips to the pass. */
export function AcceptedMoment({ onDone }: { onDone: () => void }) {
  const src = useMemo(() => `${acceptedArt}#${Date.now()}`, []);

  useEffect(() => {
    const timer = setTimeout(onDone, POUR_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <button className="accepted-moment" type="button" onClick={onDone}>
      <img src={src} alt="" />
      <span className="accepted-moment__title">You're in</span>
      <span className="accepted-moment__body">The café accepted your pitch. Your pass is next.</span>
    </button>
  );
}
