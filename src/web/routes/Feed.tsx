import { useState } from 'react';
import { useFeed, useMyRequests } from '../api/queries';
import { LargeTitle } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { CardSkeleton, CollabCard } from '../features/collabs/CollabCard';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'collab', label: 'Collabs' },
  { value: 'offer', label: 'Offers' },
] as const;

export function Feed() {
  const feed = useFeed();
  const myRequests = useMyRequests();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');

  const statusOf = (collabId: string) =>
    myRequests.data?.requests.find((request) => request.collabId === collabId)?.status;

  return (
    <>
      <LargeTitle>Browse</LargeTitle>
      <div className="segmented" role="radiogroup" aria-label="Show">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            className="segmented__option"
            type="button"
            role="radio"
            aria-checked={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ScreenState
        query={feed}
        errorTitle="Couldn't load collabs."
        skeleton={<CardSkeleton />}
        isEmpty={({ collabs }) => collabs.length === 0}
        empty={
          <MessageState
            art="empty"
            title="Nothing to apply to yet"
            body="Businesses post new collabs and offers every week."
            action={
              <button className="button" type="button" onClick={() => feed.refetch()}>
                Refresh
              </button>
            }
          />
        }
      >
        {({ collabs }) => {
          const shown = collabs.filter(({ kind }) => filter === 'all' || kind === filter);
          if (shown.length === 0) {
            return <p className="note note--centre">Nothing here right now.</p>;
          }
          return (
            <ul className="post-list">
              {shown.map((collab) => (
                <CollabCard key={collab.id} collab={collab} myStatus={statusOf(collab.id)} />
              ))}
            </ul>
          );
        }}
      </ScreenState>
    </>
  );
}
