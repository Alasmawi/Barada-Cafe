import { Link } from 'react-router-dom';
import type { Collab } from '../../shared/api';
import { bahrainToday, endsLabel } from '../../shared/dates';
import { useBusinessCollabs } from '../api/queries';
import { Icon } from '../components/Icon';
import { LargeTitle } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { SpotsBar, spotsLabel } from '../features/collabs/CollabShared';

function PostRow({ collab }: { collab: Collab }) {
  return (
    <li>
      <Link className="list-row list-row--stack" to={`/business/collabs/${collab.id}`}>
        {collab.pendingCount > 0 && collab.state !== 'ended' && (
          <span className="list-row__head">
            <span className="count-badge">{collab.pendingCount} new</span>
          </span>
        )}
        <span className="list-row__title">{collab.title}</span>
        <span className="list-row__detail">
          {spotsLabel(collab)} · {endsLabel(collab.endsOn, bahrainToday())}
        </span>
        <SpotsBar collab={collab} />
      </Link>
    </li>
  );
}

export function BusinessCollabs() {
  const collabs = useBusinessCollabs();
  const postLink = (
    <Link className="icon-button icon-button--red" to="/business/collabs/new" aria-label="New post">
      <Icon name="plus" />
    </Link>
  );

  return (
    <>
      <LargeTitle action={postLink}>My posts</LargeTitle>
      <ScreenState
        query={collabs}
        errorTitle="Couldn't load your posts."
        skeleton={<Skeleton className="skeleton--row" count={3} />}
        isEmpty={(data) => data.collabs.length === 0}
        empty={
          <MessageState
            art="empty"
            title="No posts yet"
            body="Post a collab and creators can apply."
            action={
              <Link className="button button--primary" to="/business/collabs/new">
                Post your first
              </Link>
            }
          />
        }
      >
        {(data) => {
          const live = data.collabs.filter(({ state }) => state !== 'ended');
          const ended = data.collabs.filter(({ state }) => state === 'ended');
          return (
            <div className="two-up">
              <section>
                <h2 className="group-label">Live</h2>
                <ul className="group">
                  {live.map((collab) => (
                    <PostRow key={collab.id} collab={collab} />
                  ))}
                  <li>
                    <Link className="list-row list-row--add" to="/business/collabs/new">
                      <Icon name="plus" size={20} /> Post another collab
                    </Link>
                  </li>
                </ul>
              </section>
              {ended.length > 0 && (
                <section>
                  <h2 className="group-label">Ended</h2>
                  <ul className="group">
                    {ended.map((collab) => (
                      <PostRow key={collab.id} collab={collab} />
                    ))}
                  </ul>
                </section>
              )}
            </div>
          );
        }}
      </ScreenState>
    </>
  );
}
