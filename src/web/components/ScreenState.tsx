import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import { MessageState } from './MessageState';

type Props<T> = {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  errorTitle: string;
  /** Shown instead of the error when the server says the thing doesn't exist. */
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
      <div role="status" aria-label="Pouring…">
        {skeleton}
      </div>
    );
  }

  // A failed refresh keeps showing the data we have: only a screen with nothing to show errors.
  if (query.data === undefined) {
    if (notFound && query.error instanceof ApiError && query.error.status === 404) {
      return notFound;
    }
    return (
      <MessageState
        art="error"
        title={errorTitle}
        action={
          <button className="button" type="button" onClick={() => query.refetch()}>
            {query.isFetching ? 'Pouring…' : 'Try again'}
          </button>
        }
      />
    );
  }

  if (isEmpty?.(query.data)) return empty;
  return children(query.data);
}
