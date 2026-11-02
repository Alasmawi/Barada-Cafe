import { Link } from 'react-router-dom';
import { useBusinessCollabs } from '../api/queries';
import { BrandMark } from '../components/BrandMark';
import { AccountMenu } from '../components/AccountMenu';
import { Icon } from '../components/Icon';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { useSession } from '../session';

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
          <p className="brand-banner__detail">{user?.businessType} · Business account</p>
        </div>
        <AccountMenu />
      </section>

      <Link className="button button--primary button--wide" to="/business/collabs/new">
        <Icon name="plus" size={20} /> Post a collab or offer
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
          return (
            <>
              <div className="stat-row">
                <div className="stat">
                  <span className="stat__value">{applicants}</span>
                  <span className="note">New applicants</span>
                </div>
                <div className="stat">
                  <span className="stat__value">{live.length}</span>
                  <span className="note">Live posts</span>
                </div>
              </div>
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
            </>
          );
        }}
      </ScreenState>
    </>
  );
}
