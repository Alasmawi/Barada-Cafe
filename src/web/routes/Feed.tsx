import { useFeed, useMyRequests } from '../api/queries';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { CollabShelf, ShelfSkeleton } from '../features/collabs/CollabShelf';

export function Feed() {
  const feed = useFeed();
  const myRequests = useMyRequests();
  const statusOf = (collabId: string) =>
    myRequests.data?.requests.find((request) => request.collabId === collabId)?.status;

  return (
    <>
      <h1 className="page__title">Open collabs</h1>
      <ScreenState
        query={feed}
        errorTitle="The feed spilled."
        skeleton={<ShelfSkeleton />}
        isEmpty={({ collabs }) => collabs.length === 0}
        empty={
          <MessageState
            art="empty"
            title="No open collabs yet"
            body="Cafés post new collabs every week."
            action={
              <button className="button" type="button" onClick={() => feed.refetch()}>
                Refresh
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
                  <CollabShelf key={collab.id} collab={collab} myStatus={statusOf(collab.id)} />
                ))}
              </ul>
              {full.length > 0 && (
                <section>
                  <h2 className="section-title">Full collabs</h2>
                  <ul className="shelf-list">
                    {full.map((collab) => (
                      <CollabShelf key={collab.id} collab={collab} myStatus={statusOf(collab.id)} />
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
