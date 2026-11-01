import { useFeed } from '../api/queries';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { CollabShelf } from '../features/collabs/CollabShelf';

export function Feed() {
  const feed = useFeed();

  return (
    <>
      <h1 className="page__title">Pick your cup</h1>
      <ScreenState
        query={feed}
        errorTitle="The feed spilled."
        skeleton={<Skeleton className="skeleton--shelf" count={3} />}
        isEmpty={({ collabs }) => collabs.length === 0}
        empty={
          <MessageState
            art="empty"
            title="Nothing brewing yet"
            body="Cafés post new collabs every week."
            action={
              <button className="button" type="button" onClick={() => feed.refetch()}>
                Check back soon
              </button>
            }
          />
        }
      >
        {({ collabs }) => {
          const open = collabs.filter(({ state }) => state === 'open');
          const full = collabs.filter(({ state }) => state === 'full');
          return (
            <>
              <ul className="shelf-list">
                {open.map((collab) => (
                  <CollabShelf key={collab.id} collab={collab} />
                ))}
              </ul>
              {full.length > 0 && (
                <section>
                  <h2 className="section-title">Fully poured</h2>
                  <ul className="shelf-list">
                    {full.map((collab) => (
                      <CollabShelf key={collab.id} collab={collab} />
                    ))}
                  </ul>
                </section>
              )}
            </>
          );
        }}
      </ScreenState>
    </>
  );
}
