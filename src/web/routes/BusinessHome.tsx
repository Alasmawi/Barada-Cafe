import { Link } from 'react-router-dom';
import { bahrainToday, endsLabel } from '../../shared/dates';
import { useBusinessCollabs } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { AccountMenu } from '../components/AccountMenu';
import { Icon } from '../components/Icon';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { Stat } from '../components/Stat';
import { SpotsBar, spotsLabel } from '../features/collabs/CollabShared';
import { CreatorRail } from '../features/creators/CreatorRail';
import { useSession } from '../session';

const ENDING_SOON_SIZE = 3;

export function BusinessHome() {
  const { user } = useSession();
  const collabs = useBusinessCollabs();
  const house = user?.businessHouse ?? 'saffron';

  return (
    <>
      <section className={`brand-banner brand-banner--home house--${house}`}>
        <BrandMark house={house} size={64} />
        <div className="brand-banner__text">
          <h1 className="brand-banner__name">{user?.businessName}</h1>
          <p className="brand-banner__detail">Business account</p>
        </div>
        <AccountMenu />
      </section>

      <Link className="button button--primary button--wide" to="/business/collabs/new">
        <Icon name="plus" size={20} /> Post a collab
      </Link>

      <ScreenState
        query={collabs}
        errorTitle="Couldn't load your overview."
        skeleton={<Skeleton className="skeleton--row" count={3} />}
      >
        {(data) => {
          const live = data.collabs.filter(({ state }) => state !== 'ended');
          const waiting = live.filter(({ pendingCount }) => pendingCount > 0);
          const applicants = live.reduce((total, collab) => total + collab.pendingCount, 0);
          const filled = live.reduce((total, collab) => total + collab.spotsTaken, 0);
          const endingSoon = [...live]
            .sort((a, b) => a.endsOn.localeCompare(b.endsOn))
            .slice(0, ENDING_SOON_SIZE);
          return (
            <>
              <div className="stat-row stat-row--three">
                <Stat value={applicants} label="Applicants" />
                <Stat value={live.length} label="Live posts" />
                <Stat value={filled} label="Spots filled" />
              </div>
              <div className="two-up">
                <section>
                  <h2 className="group-label">Needs your decision</h2>
                  {waiting.length === 0 ? (
                    <MessageState art="empty" title="You're all caught up" />
                  ) : (
                    <ul className="group">
                      {waiting.map((collab) => (
                        <li key={collab.id}>
                          <Link className="list-row" to={`/business/collabs/${collab.id}`}>
                            <span className="list-row__text">
                              <span className="list-row__title">{collab.title}</span>
                              <span className="list-row__detail">
                                {collab.pendingCount} new{' '}
                                {collab.pendingCount === 1 ? 'applicant' : 'applicants'}
                              </span>
                            </span>
                            <Icon name="chevron" size={18} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                {endingSoon.length > 0 && (
                  <section>
                    <h2 className="group-label">Ending soon</h2>
                    <ul className="group">
                      {endingSoon.map((collab) => (
                        <li key={collab.id}>
                          <Link
                            className="list-row list-row--stack"
                            to={`/business/collabs/${collab.id}`}
                          >
                            <span className="list-row__title">{collab.title}</span>
                            <span className="list-row__detail">
                              {spotsLabel(collab)} · {endsLabel(collab.endsOn, bahrainToday())}
                            </span>
                            <SpotsBar collab={collab} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          );
        }}
      </ScreenState>
      <CreatorRail />
    </>
  );
}
