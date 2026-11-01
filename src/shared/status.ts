export const REQUEST_STATUSES = [
  'invited',
  'pending',
  'accepted',
  'declined',
  'submitted',
  'done',
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

/** Statuses that hold a spot. A spot stays taken once given (no releasing no-shows in v1). */
export const SPOT_HOLDING_STATUSES = [
  'accepted',
  'submitted',
  'done',
] as const satisfies readonly RequestStatus[];

/** UI labels. Code keeps the plain status names (brand/README.md). */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  invited: 'Invited',
  pending: 'Applied',
  accepted: 'Accepted',
  submitted: 'Posted',
  done: 'Completed',
  declined: 'Declined',
};

export type CollabState = 'open' | 'full' | 'ended';

/** Derived, never stored. Ended wins over full. */
export function collabState(
  collab: { endsOn: string; spots: number; spotsTaken: number },
  today: string,
): CollabState {
  if (today > collab.endsOn) return 'ended';
  return collab.spotsTaken >= collab.spots ? 'full' : 'open';
}
