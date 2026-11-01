import type { User } from '../../shared/api';
import { DomainError } from '../http/errors';

const forbidden = (message: string) => new DomainError('FORBIDDEN', 403, message);

export function assertCreator(actor: User): void {
  if (actor.role !== 'creator') throw forbidden('Only creators can do this.');
}

/** Narrows to staff with a business, for callers that need the business id. */
export function assertStaff(actor: User): asserts actor is User & { businessId: string } {
  if (actor.role !== 'business' || !actor.businessId) throw forbidden('Only business staff can do this.');
}

export function assertStaffOf(actor: User, businessId: string): void {
  assertStaff(actor);
  if (actor.businessId !== businessId) throw forbidden('This collab belongs to another business.');
}
