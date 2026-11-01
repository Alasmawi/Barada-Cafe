import { Link } from 'react-router-dom';
import { useCafeCollabs } from '../api/queries';
import { AppHeader } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { CollabShelf } from '../features/collabs/CollabShelf';

export function CafeCollabs() {
  const collabs = useCafeCollabs();
  const postLabel = collabs.data?.collabs.length === 0 ? 'Post your first collab' : 'Post a collab';

  return (
    <>
      <AppHeader />
      <main className="page page--bar">
        <h1 className="page__title">Your collabs</h1>
        <ScreenState
          query={collabs}
          errorTitle="Couldn't open your collabs."
          skeleton={<Skeleton className="skeleton--shelf" count={3} />}
          isEmpty={(data) => data.collabs.length === 0}
          empty={<MessageState art="empty" title="No collabs posted yet." />}
        >
          {(data) => {
            const active = data.collabs.filter(({ state }) => state !== 'ended');
            const ended = data.collabs.filter(({ state }) => state === 'ended');
            const shelf = (collab: (typeof data.collabs)[number]) => (
              <CollabShelf
                key={collab.id}
                collab={collab}
                to={`/cafe/collabs/${collab.id}`}
                cafeView
              />
            );
            return (
              <>
                <ul className="shelf-list">{active.map(shelf)}</ul>
                {ended.length > 0 && (
                  <section>
                    <h2 className="section-title">Ended</h2>
                    <ul className="shelf-list">{ended.map(shelf)}</ul>
                  </section>
                )}
              </>
            );
          }}
        </ScreenState>
        <div className="action-bar">
          <Link className="button button--primary button--wide" to="/cafe/collabs/new">
            {postLabel}
          </Link>
        </div>
      </main>
    </>
  );
}
