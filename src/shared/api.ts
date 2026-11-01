import type { CollabInput } from './schemas';
import type { CollabState, RequestStatus } from './status';

/** JSON shapes the API returns. The web client imports these, so the two can't drift. */

export type Role = 'cafe_staff' | 'creator';

export type User = {
  id: string;
  name: string;
  role: Role;
  cafeId: string | null;
  cafeName: string | null;
  handle: string | null;
  avatarSeed: string;
};

export type Collab = {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeArea: string;
  title: string;
  offer: string;
  deliverable: string;
  spots: number;
  spotsTaken: number;
  spotsLeft: number;
  pendingCount: number;
  endsOn: string;
  state: CollabState;
  createdAt: string;
};

export type CollabRequest = {
  id: string;
  collabId: string;
  creatorId: string;
  pitch: string;
  status: RequestStatus;
  passCode: string | null;
  postUrl: string | null;
  createdAt: string;
  decidedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
};

/** A request as the café sees it in the inbox. */
export type InboxRequest = CollabRequest & {
  creatorName: string;
  creatorHandle: string | null;
  creatorAvatarSeed: string;
};

/** A request as the creator sees it, with the collab it belongs to. */
export type RequestWithCollab = CollabRequest & { collab: Collab };

/** What the AI could fill. Every field passed validation, and nothing here is ever published. */
export type CollabDraft = {
  draft: Partial<CollabInput>;
  unfilled: (keyof CollabInput)[];
  /** Set when the AI gave us nothing usable, so the café knows the form is theirs. */
  warning: string | null;
};

export type ErrorCode =
  | 'UNKNOWN_USER'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INVALID_TRANSITION'
  | 'COLLAB_FULL'
  | 'COLLAB_ENDED'
  | 'SPOTS_BELOW_TAKEN'
  | 'SCHEMA_OUT_OF_DATE'
  | 'UNEXPECTED';

export type ErrorBody = {
  error: {
    code: ErrorCode;
    message: string;
    /** Per-field messages, present on VALIDATION_FAILED. */
    fields?: Record<string, string>;
  };
};
