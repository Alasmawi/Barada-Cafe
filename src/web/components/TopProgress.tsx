import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/** A thin bar for anything loading in the background, so the app never looks stuck. */
export function TopProgress() {
  const fetching = useIsFetching();
  const saving = useIsMutating();
  if (fetching + saving === 0) return null;
  return <div className="top-progress" role="progressbar" aria-label="Loading" />;
}
