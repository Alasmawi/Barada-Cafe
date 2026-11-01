import { Link } from 'react-router-dom';
import type { Collab } from '../../../shared/api';
import { bahrainToday, endsLabel } from '../../../shared/dates';
import type { RequestStatus } from '../../../shared/status';
import { BrandMark } from '../../components/BrandMark';
import { StatusChip } from '../../components/StatusChip';
import { KindBadge, spotsLabel } from './CollabShared';

/** A collab or offer as a creator sees it, led by the business behind it. */
export function CollabCard({ collab, myStatus }: { collab: Collab; myStatus?: RequestStatus }) {
  return (
    <li>
      <Link className={`post-card post-card--${collab.state}`} to={`/collabs/${collab.id}`}>
        <div className="post-card__brand">
          <BrandMark house={collab.businessHouse} size={44} />
          <div className="list-row__text">
            <span className="list-row__title">{collab.businessName}</span>
            <span className="list-row__detail">
              {collab.businessType} · {collab.businessArea}
            </span>
          </div>
          <KindBadge kind={collab.kind} />
        </div>
        <h3 className="post-card__title">{collab.title}</h3>
        <p className="post-card__offer">{collab.offer}</p>
        <div className="post-card__meta">
          <span>
            {spotsLabel(collab)} · {endsLabel(collab.endsOn, bahrainToday())}
          </span>
          {myStatus && <StatusChip status={myStatus} />}
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
