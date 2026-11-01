import type { CollabRequest, InboxRequest, RequestWithCollab, User } from '../../shared/api';
import { bahrainToday } from '../../shared/dates';
import type { RequestStatus } from '../../shared/status';
import { DomainError, notFound } from '../http/errors';
import { newId, newPassCode } from '../ids';
import * as collabsRepo from '../repositories/collabsRepo';
import * as requestsRepo from '../repositories/requestsRepo';
import { loadCollab } from './collabService';
import { assertCreator, assertStaffOf } from './permissions';

const invalidTransition = () =>
  new DomainError('INVALID_TRANSITION', 409, "This request has moved on, so that can't be done now.");
const collabEnded = () => new DomainError('COLLAB_ENDED', 409, 'This collab has ended.');
const collabFull = () =>
  new DomainError('COLLAB_FULL', 409, 'This collab has no spots left.');

async function loadRequest(db: D1Database, id: string): Promise<CollabRequest> {
  const request = await requestsRepo.findById(db, id);
  if (!request) throw notFound('This request has been removed.');
  return request;
}

/**
 * Finishes a guarded write. `written` means the guard passed. If it refused, the same
 * action already having happened is a double tap, so it answers with the row as it stands.
 */
async function settle(
  db: D1Database,
  id: string,
  written: boolean,
  alreadyDone: RequestStatus,
): Promise<CollabRequest> {
  const request = await loadRequest(db, id);
  if (!written && request.status !== alreadyDone) throw invalidTransition();
  return request;
}

export async function ask(
  db: D1Database,
  actor: User,
  collabId: string,
  pitch: string,
): Promise<{ request: CollabRequest; created: boolean }> {
  assertCreator(actor);
  const today = bahrainToday();
  const collab = await loadCollab(db, collabId, today);

  const id = newId('req');
  const inserted = await requestsRepo.insertIfCollabOpen(db, {
    id,
    collabId,
    creatorId: actor.id,
    pitch,
    createdAt: new Date().toISOString(),
    today,
  });
  if (inserted) return { request: await loadRequest(db, id), created: true };

  const existing = await requestsRepo.findByCollabAndCreator(db, collabId, actor.id);
  if (existing) return { request: existing, created: false };
  if (today > collab.endsOn) throw collabEnded();
  throw collabFull();
}

export async function accept(db: D1Database, actor: User, id: string): Promise<CollabRequest> {
  const today = bahrainToday();
  const request = await loadRequest(db, id);
  const collab = await loadCollab(db, request.collabId, today);
  assertStaffOf(actor, collab.cafeId);

  const accepted = await requestsRepo.acceptIfSpotAvailable(db, {
    id,
    decidedAt: new Date().toISOString(),
    decidedBy: actor.id,
    passCode: newPassCode(),
    today,
  });
  if (accepted) return loadRequest(db, id);

  // Refused: re-read, because the row may have changed since the load above.
  const current = await loadRequest(db, id);
  if (current.status === 'accepted') return current;
  if (current.status !== 'pending') throw invalidTransition();
  if (today > collab.endsOn) throw collabEnded();
  throw collabFull();
}

export async function decline(db: D1Database, actor: User, id: string): Promise<CollabRequest> {
  const request = await loadRequest(db, id);
  const collab = await loadCollab(db, request.collabId, bahrainToday());
  assertStaffOf(actor, collab.cafeId);

  const written = await requestsRepo.declineIfPending(db, {
    id,
    decidedAt: new Date().toISOString(),
    decidedBy: actor.id,
  });
  return settle(db, id, written, 'declined');
}

export async function submitLink(
  db: D1Database,
  actor: User,
  id: string,
  postUrl: string,
): Promise<CollabRequest> {
  const request = await loadRequest(db, id);
  if (request.creatorId !== actor.id) {
    throw new DomainError('FORBIDDEN', 403, 'This request belongs to another creator.');
  }

  const written = await requestsRepo.submitLinkIfAllowed(db, {
    id,
    postUrl,
    submittedAt: new Date().toISOString(),
  });
  if (!written) throw invalidTransition();
  return loadRequest(db, id);
}

export async function complete(db: D1Database, actor: User, id: string): Promise<CollabRequest> {
  const request = await loadRequest(db, id);
  const collab = await loadCollab(db, request.collabId, bahrainToday());
  assertStaffOf(actor, collab.cafeId);

  const written = await requestsRepo.completeIfSubmitted(db, {
    id,
    completedAt: new Date().toISOString(),
  });
  return settle(db, id, written, 'done');
}

/** The visit pass and the café's view of one request. Pass codes stay with these two people. */
export async function getOne(db: D1Database, actor: User, id: string): Promise<RequestWithCollab> {
  const request = await loadRequest(db, id);
  const collab = await loadCollab(db, request.collabId, bahrainToday());
  if (request.creatorId !== actor.id) assertStaffOf(actor, collab.cafeId);
  return { ...request, collab };
}

export async function listInbox(
  db: D1Database,
  actor: User,
  collabId: string,
): Promise<InboxRequest[]> {
  const collab = await loadCollab(db, collabId, bahrainToday());
  assertStaffOf(actor, collab.cafeId);
  return requestsRepo.listInbox(db, collabId);
}

export async function listMine(db: D1Database, actor: User): Promise<RequestWithCollab[]> {
  assertCreator(actor);
  const [requests, collabs] = await Promise.all([
    requestsRepo.listForCreator(db, actor.id),
    collabsRepo.listForCreator(db, actor.id, bahrainToday()),
  ]);
  const collabsById = new Map(collabs.map((collab) => [collab.id, collab]));
  return requests.flatMap((request) => {
    const collab = collabsById.get(request.collabId);
    return collab ? [{ ...request, collab }] : [];
  });
}
