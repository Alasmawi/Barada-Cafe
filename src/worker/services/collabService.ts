import type { Collab, CollabRequest, User } from '../../shared/api';
import { bahrainToday } from '../../shared/dates';
import type { CollabInput } from '../../shared/schemas';
import type { CollabState } from '../../shared/status';
import { DomainError, notFound } from '../http/errors';
import { newId } from '../ids';
import * as collabsRepo from '../repositories/collabsRepo';
import * as requestsRepo from '../repositories/requestsRepo';
import { assertBusiness, assertOwnerOf } from './permissions';

function assertEndDateNotPast(endsOn: string, today: string): void {
  if (endsOn < today) {
    throw new DomainError('VALIDATION_FAILED', 422, 'Please check the highlighted fields.', {
      endsOn: "The end date can't be in the past",
    });
  }
}

export async function loadCollab(db: D1Database, id: string, today: string): Promise<Collab> {
  const collab = await collabsRepo.findById(db, id, today);
  if (!collab) throw notFound('This collab has been removed.');
  return collab;
}

/** The feed: open collabs first, then full ones. Ended collabs are left out. */
export async function listFeed(
  db: D1Database,
  state: Extract<CollabState, 'open' | 'full'> | undefined,
): Promise<Collab[]> {
  const collabs = await collabsRepo.listActive(db, bahrainToday());
  if (state) return collabs.filter((collab) => collab.state === state);
  return [
    ...collabs.filter((collab) => collab.state === 'open'),
    ...collabs.filter((collab) => collab.state === 'full'),
  ];
}

export async function getDetail(
  db: D1Database,
  actor: User,
  id: string,
): Promise<{ collab: Collab; myRequest: CollabRequest | null }> {
  const collab = await loadCollab(db, id, bahrainToday());
  const myRequest =
    actor.role === 'creator'
      ? await requestsRepo.findByCollabAndCreator(db, id, actor.id)
      : null;
  return { collab, myRequest };
}

export async function listForBusiness(db: D1Database, actor: User): Promise<Collab[]> {
  assertBusiness(actor);
  return collabsRepo.listForBusiness(db, actor.businessId, bahrainToday());
}

export async function create(db: D1Database, actor: User, input: CollabInput): Promise<Collab> {
  assertBusiness(actor);
  const today = bahrainToday();
  assertEndDateNotPast(input.endsOn, today);

  const id = newId('col');
  await collabsRepo.insert(db, {
    ...input,
    id,
    businessId: actor.businessId,
    createdBy: actor.id,
    createdAt: new Date().toISOString(),
  });
  return loadCollab(db, id, today);
}

export async function update(
  db: D1Database,
  actor: User,
  id: string,
  input: CollabInput,
): Promise<Collab> {
  const today = bahrainToday();
  const collab = await loadCollab(db, id, today);
  assertOwnerOf(actor, collab.businessId);
  // An ended collab can have its copy fixed without having to invent a new date.
  if (input.endsOn !== collab.endsOn) assertEndDateNotPast(input.endsOn, today);

  const saved = await collabsRepo.updateIfSpotsCoverTaken(db, id, input);
  if (!saved) {
    const { spotsTaken } = await loadCollab(db, id, today);
    const holders = spotsTaken === 1 ? '1 creator is' : `${spotsTaken} creators are`;
    throw new DomainError(
      'SPOTS_BELOW_TAKEN',
      409,
      `${holders} already accepted — spots can't go below ${spotsTaken}.`,
    );
  }
  return loadCollab(db, id, today);
}
