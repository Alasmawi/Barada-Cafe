import type { User } from '../../shared/api';
import { DomainError } from '../http/errors';

const forbidden = (message: string) => new DomainError('FORBIDDEN', 403, message);

export function assertCreator(actor: User): void {
  if (actor.role !== 'creator') throw forbidden('Only creators can do this.');
}

/** Narrows to staff with a café, for callers that need the café id. */
export function assertStaff(actor: User): asserts actor is User & { cafeId: string } {
  if (actor.role !== 'cafe_staff' || !actor.cafeId) throw forbidden('Only café staff can do this.');
}

export function assertStaffOf(actor: User, cafeId: string): void {
  assertStaff(actor);
  if (actor.cafeId !== cafeId) throw forbidden('This collab belongs to another café.');
}
