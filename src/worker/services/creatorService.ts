import type { CreatorCard, User } from '../../shared/api';
import type { AiClient } from '../ai/aiClient';
import { factsKey, factSummary, summarizeCreator } from '../ai/summarizeCreator';
import { notFound } from '../http/errors';
import * as usersRepo from '../repositories/usersRepo';
import { assertStaff } from './permissions';

const RESULT_LIMIT = 30;

function toCard(creator: usersRepo.StoredCreator): CreatorCard {
  const { aiSummary, summaryKey, ...card } = creator;
  const isCurrent = aiSummary !== null && summaryKey === factsKey(creator);
  return {
    ...card,
    summary: isCurrent ? aiSummary : factSummary(creator),
    isAiSummary: isCurrent,
  };
}

export async function search(db: D1Database, actor: User, query: string): Promise<CreatorCard[]> {
  assertStaff(actor);
  const creators = await usersRepo.searchCreators(db, query, RESULT_LIMIT);
  return creators.map(toCard);
}

/** Saved once per set of facts, so the free daily AI allowance only pays for new creators. */
export async function summarize(
  db: D1Database,
  client: AiClient,
  actor: User,
  id: string,
): Promise<CreatorCard> {
  assertStaff(actor);
  const creator = await usersRepo.findCreator(db, id);
  if (!creator) throw notFound('This creator has been removed.');

  const card = toCard(creator);
  if (card.isAiSummary) return card;

  const summary = await summarizeCreator(client, creator);
  if (!summary) return card;

  await usersRepo.saveSummary(db, id, summary, factsKey(creator));
  return { ...card, summary, isAiSummary: true };
}
