import { useEffect, useState } from 'react';
import { useCreators } from '../api/queries';
import { LargeTitle } from '../components/Layout';
import { MessageState } from '../components/MessageState';
import { ScreenState } from '../components/ScreenState';
import { Skeleton } from '../components/Skeleton';
import { CreatorResult } from '../features/creators/CreatorResult';

const SEARCH_PAUSE_MS = 250;

export function BusinessCreators() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const creators = useCreators(query);

  // Waits for a pause in typing, so one search isn't a request per letter.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), SEARCH_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <>
      <LargeTitle>Creators</LargeTitle>
      <input
        className="search-input"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or tag"
        aria-label="Search creators"
      />
      <ScreenState
        query={creators}
        errorTitle="The search didn't work."
        skeleton={<Skeleton className="skeleton--card" count={3} />}
        isEmpty={(data) => data.creators.length === 0}
        empty={
          <MessageState
            art="empty"
            title="No creators found"
            body="Try a broader tag, like Food or Reels."
          />
        }
      >
        {(data) => (
          <ul className="post-list">
            {data.creators.map((creator) => (
              <CreatorResult key={creator.id} creator={creator} />
            ))}
          </ul>
        )}
      </ScreenState>
    </>
  );
}
