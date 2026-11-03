import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useExplainPicks, usePicks } from '../../api/queries';
import { Icon } from '../../components/Icon';
import { tiltStyle } from '../../components/Stamp';

/**
 * Up to three open collabs that fit the creator's tags. Code picks them and writes a plain
 * reason; the AI is asked once a day to reword the reasons. Hidden when there's nothing to pick,
 * or when the picks fail to load, so Browse below always works.
 */
export function PickedForYou() {
  const picks = usePicks();
  const explain = useExplainPicks();
  const asked = useRef(false);
  const aiPending = picks.data?.aiPending ?? false;

  useEffect(() => {
    if (!aiPending || asked.current) return;
    asked.current = true;
    explain.mutate();
  }, [aiPending, explain]);

  const shown = picks.data?.picks ?? [];
  if (shown.length === 0) return null;

  return (
    <section className="picks" aria-labelledby="picks-title">
      <h2 id="picks-title" className="group-label picks__label">
        <Icon name="sparkle" size={16} /> Picked for you
      </h2>
      <ul className="pick-rail" aria-busy={explain.isPending}>
        {shown.map(({ collab, reason, isAiReason }) => (
          <li key={collab.id}>
            <Link
              className={`pick-card house--${collab.businessHouse}`}
              style={tiltStyle(collab.id)}
              to={`/collabs/${collab.id}`}
            >
              <span className="pick-card__business">{collab.businessName}</span>
              <span className="pick-card__title">{collab.title}</span>
              <span className="pick-card__reason">
                {isAiReason && <span className="pick-card__ai">AI</span>}
                {reason}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
