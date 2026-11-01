import { Link } from 'react-router-dom';
import { FinjanStack } from '../../../../brand/src/FinjanStack';
import { bahrainToday, endsLabel } from '../../../shared/dates';
import type { Collab } from '../../../shared/api';

export function spotsLabel({ state, spotsLeft }: Collab): string {
  if (state === 'full') return 'All cups taken';
  return spotsLeft === 1 ? '1 cup left' : `${spotsLeft} cups left`;
}

/** One collab standing on its tray line. A taller stack means more spots to go round. */
export function CollabShelf({ collab }: { collab: Collab }) {
  return (
    <li className={`shelf shelf--${collab.state}`}>
      <Link className="shelf__link" to={`/collabs/${collab.id}`}>
        <div className="shelf__text">
          <p className="shelf__cafe">
            {collab.cafeName} · {collab.cafeArea}
          </p>
          <h3 className="shelf__offer">{collab.offer}</h3>
          <p className="shelf__meta">
            <span>{spotsLabel(collab)}</span>
            <span>{endsLabel(collab.endsOn, bahrainToday())}</span>
          </p>
        </div>
        <FinjanStack spots={collab.spots} taken={collab.spotsTaken} seed={collab.id} width={104} />
      </Link>
    </li>
  );
}
