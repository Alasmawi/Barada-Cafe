import { Link } from 'react-router-dom';
import { CupStack } from '../../components/CupStack';
import { bahrainToday, daysBetween, endsLabel } from '../../../shared/dates';
import type { Collab } from '../../../shared/api';
import type { RequestStatus } from '../../../shared/status';
import { StatusChip } from '../../components/StatusChip';

export function spotsLabel({ state, spots, spotsTaken, spotsLeft }: Collab): string {
  if (state === 'ended') return `${spotsTaken} of ${spots} spots taken`;
  if (state === 'full') return 'All spots taken';
  return spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`;
}

type Props = {
  collab: Collab;
  to?: string;
  /** The café's own view leads with the title and shows how many pitches are waiting. */
  cafeView?: boolean;
  /** Set when this creator has already asked to join. */
  myStatus?: RequestStatus;
};

const SOON_DAYS = 1;

export function ShelfSkeleton() {
  return (
    <ul className="shelf-list" aria-hidden>
      {[0, 1, 2].map((key) => (
        <li key={key} className="shelf-skeleton">
          <span className="shelf-skeleton__text">
            <span className="skeleton skeleton--eyebrow" />
            <span className="skeleton skeleton--title" />
            <span className="skeleton skeleton--title skeleton--short" />
            <span className="skeleton skeleton--eyebrow" />
          </span>
          <span className="skeleton skeleton--cups" />
        </li>
      ))}
    </ul>
  );
}

/** One collab standing on its tray line. A taller stack means more spots to go round. */
export function CollabShelf({ collab, to = `/collabs/${collab.id}`, cafeView, myStatus }: Props) {
  const today = bahrainToday();
  const open = collab.state === 'open';
  const endsSoon = open && daysBetween(today, collab.endsOn) <= SOON_DAYS;
  const lastSpot = open && collab.spotsLeft === 1;

  return (
    <li className={`shelf shelf--${collab.state}`}>
      <Link className="shelf__link" to={to}>
        <div className="shelf__text">
          <p className="shelf__cafe">
            {cafeView ? collab.title : `${collab.cafeName} · ${collab.cafeArea}`}
          </p>
          <h3 className="shelf__offer">{collab.offer}</h3>
          <p className="shelf__meta">
            <span className={lastSpot ? 'shelf__urgent' : undefined}>{spotsLabel(collab)}</span>
            {collab.state !== 'ended' && (
              <span className={endsSoon ? 'shelf__urgent' : undefined}>
                {endsLabel(collab.endsOn, today)}
              </span>
            )}
          </p>
          {myStatus && (
            <p className="shelf__mine">
              <StatusChip status={myStatus} />
            </p>
          )}
          {cafeView && collab.state !== 'ended' && collab.pendingCount > 0 && (
            <p className="shelf__pending">{collab.pendingCount} new {collab.pendingCount === 1 ? 'pitch' : 'pitches'}</p>
          )}
        </div>
        <CupStack spots={collab.spots} taken={collab.spotsTaken} seed={collab.id} width={104} />
      </Link>
    </li>
  );
}
