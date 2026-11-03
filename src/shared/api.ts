import type { House } from './houses';
import type { CollabInput } from './schemas';
import type { Socials } from './socials';
import type { CollabState, RequestStatus } from './status';

/** JSON shapes the API returns. The web client imports these, so the two can't drift. */

export type Role = 'business' | 'creator';

export type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  businessId: string | null;
  businessName: string | null;
  businessHouse: House | null;
  handle: string | null;
  tags: string[];
  signature: string | null;
  socials: Socials;
};

/** What a business sees when it searches for creators. */
export type CreatorCard = {
  id: string;
  name: string;
  handle: string | null;
  tags: string[];
  signature: string | null;
  socials: Socials;
  servedCount: number;
  summary: string;
  /** False while the summary is only the plain facts, so the AI can be asked for one. */
  isAiSummary: boolean;
};

export type Collab = {
  id: string;
  businessId: string;
  businessName: string;
  businessHouse: House;
  title: string;
  offer: string;
  deliverable: string;
  details: string;
  requirements: string;
  location: string;
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

/** A request as the business sees it in the inbox. */
export type InboxRequest = CollabRequest & {
  creatorName: string;
  creatorHandle: string | null;
  creatorTags: string[];
  creatorSignature: string | null;
  creatorSocials: Socials;
};

/** A request as the creator sees it, with the collab it belongs to. */
export type RequestWithCollab = CollabRequest & { collab: Collab };

/** A collab picked for a creator. Code chooses it; AI may only reword the reason. */
export type Pick = {
  collab: Collab;
  matchedTags: string[];
  reason: string;
  isAiReason: boolean;
};

export type PicksResponse = {
  picks: Pick[];
  /** True while today's AI reasons haven't been asked for yet. */
  aiPending: boolean;
};

/** What the AI could fill. Every field passed validation, and nothing here is ever published. */
export type CollabDraft = {
  draft: Partial<CollabInput>;
  unfilled: (keyof CollabInput)[];
  /** Set when the AI gave us nothing usable, so the business knows the form is theirs. */
  warning: string | null;
};

export type ErrorCode =
  | 'NOT_SIGNED_IN'
  | 'WRONG_LOGIN'
  | 'USERNAME_TAKEN'
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
