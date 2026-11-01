import { Link } from 'react-router-dom';
import { CupStack } from '../../components/CupStack';
import { bahrainToday, endsLabel } from '../../../shared/dates';
import type { Collab } from '../../../shared/api';

export function spotsLabel({ state, spotsLeft }: Collab): string {
  if (state === 'full') return 'All spots taken';
  return spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`;
}

type Props = {
  collab: Collab;
  to?: string;
  /** The café's own view leads with the title and shows how many pitches are waiting. */
  cafeView?: boolean;
};

/** One collab standing on its tray line. A taller stack means more spots to go round. */
export function CollabShelf({ collab, to = `/collabs/${collab.id}`, cafeView }: Props) {
  return (
    <li className={`shelf shelf--${collab.state}`}>
      <Link className="shelf__link" to={to}>
        <div className="shelf__text">
          <p className="shelf__cafe">
            {cafeView ? collab.title : `${collab.cafeName} · ${collab.cafeArea}`}
          </p>
          <h3 className="shelf__offer">{collab.offer}</h3>
          <p className="shelf__meta">
            <span>{spotsLabel(collab)}</span>
            <span>{endsLabel(collab.endsOn, bahrainToday())}</span>
          </p>
          {cafeView && collab.state !== 'ended' && collab.pendingCount > 0 && (
            <p className="shelf__pending">{collab.pendingCount} new {collab.pendingCount === 1 ? 'pitch' : 'pitches'}</p>
          )}
        </div>
        <CupStack spots={collab.spots} taken={collab.spotsTaken} seed={collab.id} width={104} />
      </Link>
    </li>
  );
}
