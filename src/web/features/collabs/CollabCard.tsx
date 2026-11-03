import { Link } from 'react-router-dom';
import type { Collab } from '../../../shared/api';
import { bahrainToday, endsLabel } from '../../../shared/dates';
import type { RequestStatus } from '../../../shared/status';
import { BrandMark } from '../../components/BrandMark';
import { CollabStamp, StatusStamp, tiltStyle } from '../../components/Stamp';
import { spotsLabel } from './CollabShared';

/** A collab as a creator sees it: pinned up as a sticker in the business's colour. */
export function CollabCard({ collab, myStatus }: { collab: Collab; myStatus?: RequestStatus }) {
  return (
    <li>
      <Link
        className={`post-card post-card--${collab.state} house--${collab.businessHouse}`}
        style={tiltStyle(collab.id)}
        to={`/collabs/${collab.id}`}
      >
        <div className="post-card__brand">
          <BrandMark house={collab.businessHouse} size={44} />
          <span className="list-row__title">{collab.businessName}</span>
        </div>
        <h3 className="post-card__title">{collab.title}</h3>
        <p className="post-card__offer">{collab.offer}</p>
        <div className="post-card__meta">
          <span>
            {spotsLabel(collab)} · {endsLabel(collab.endsOn, bahrainToday())}
          </span>
          {myStatus ? <StatusStamp status={myStatus} /> : <CollabStamp collab={collab} />}
        </div>
      </Link>
    </li>
  );
}

export function CardSkeleton() {
  return (
    <div className="post-list" aria-hidden>
      {[0, 1, 2].map((key) => (
        <div key={key} className="skeleton skeleton--card" />
      ))}
    </div>
  );
}
