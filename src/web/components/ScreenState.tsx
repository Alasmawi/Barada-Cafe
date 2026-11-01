import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import { MessageState } from './MessageState';

type Props<T> = {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  errorTitle: string;
  /** Shown instead of the error when the thing doesn't exist, or isn't this user's to see. */
  notFound?: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
};

/** Every screen goes through here, so none can forget its loading, empty or error state. */
export function ScreenState<T>({
  query,
  skeleton,
  errorTitle,
  notFound,
  isEmpty,
  empty,
  children,
}: Props<T>) {
  if (query.isPending) {
    return (
      <div role="status" aria-label="Loading">
        {skeleton}
      </div>
    );
  }

  // A failed refresh keeps showing the data we have: only a screen with nothing to show errors.
  if (query.data === undefined) {
    const { error } = query;
    if (notFound && error instanceof ApiError && [403, 404].includes(error.status)) {
      return notFound;
    }
    return (
      <MessageState
        art="error"
        title={errorTitle}
        body="Check your connection, then try again."
        action={
          <button className="button" type="button" onClick={() => query.refetch()}>
            {query.isFetching ? 'Trying…' : 'Try again'}
          </button>
        }
      />
    );
  }

  if (isEmpty?.(query.data)) return empty;
  return children(query.data);
}
