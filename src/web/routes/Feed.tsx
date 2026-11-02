import { useFeed, useMyRequests } from '../api/queries';
import { LargeTitle } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { CardSkeleton, CollabCard } from '../features/collabs/CollabCard';

export function Feed() {
  const feed = useFeed();
  const myRequests = useMyRequests();

  const statusOf = (collabId: string) =>
    myRequests.data?.requests.find((request) => request.collabId === collabId)?.status;

  return (
    <>
      <LargeTitle>Browse</LargeTitle>
      <ScreenState
        query={feed}
        errorTitle="Couldn't load collabs."
        skeleton={<CardSkeleton />}
        isEmpty={({ collabs }) => collabs.length === 0}
        empty={
          <MessageState
            art="empty"
            title="Nothing to apply to yet"
            body="Businesses post new collabs every week."
            action={
              <button className="button" type="button" onClick={() => feed.refetch()}>
                Refresh
              </button>
            }
          />
        }
      >
        {({ collabs }) => (
          <ul className="post-list">
            {collabs.map((collab) => (
              <CollabCard key={collab.id} collab={collab} myStatus={statusOf(collab.id)} />
            ))}
          </ul>
        )}
      </ScreenState>
    </>
  );
}
