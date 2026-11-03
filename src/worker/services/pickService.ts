import type { Pick, PicksResponse, User } from '../../shared/api';
import { bahrainToday } from '../../shared/dates';
import type { AiClient } from '../ai/aiClient';
import { explainPicks } from '../ai/explainPicks';
import * as collabsRepo from '../repositories/collabsRepo';
import * as picksRepo from '../repositories/picksRepo';
import { assertCreator } from './permissions';
import { factReason, MAX_PICKS, rankPicks } from './pickRanking';

/** Caps AI calls for one creator in a day, even if their picks keep changing. */
const MAX_REASONS_PER_DAY = MAX_PICKS * 3;

async function rank(db: D1Database, actor: User, today: string) {
  const [collabs, requested] = await Promise.all([
    collabsRepo.listActive(db, today),
    picksRepo.requestedCollabIds(db, actor.id),
  ]);
  return rankPicks(collabs, actor.tags, requested);
}

function toPicks(
  ranked: Awaited<ReturnType<typeof rank>>,
  saved: Map<string, string | null>,
  today: string,
): Pick[] {
  return ranked.map(({ collab, matchedTags }) => {
    const aiReason = saved.get(collab.id) ?? null;
    return {
      collab,
      matchedTags,
      reason: aiReason ?? factReason(collab, matchedTags, today),
      isAiReason: aiReason !== null,
    };
  });
}

function needsReasons(ranked: Awaited<ReturnType<typeof rank>>, saved: Map<string, string | null>) {
  if (saved.size >= MAX_REASONS_PER_DAY) return [];
  return ranked.filter(({ collab }) => !saved.has(collab.id));
}

/** Fast, and costs no AI: plain reasons, plus any AI reasons already saved today. */
export async function list(db: D1Database, actor: User): Promise<PicksResponse> {
  assertCreator(actor);
  const today = bahrainToday();
  const [ranked, saved] = await Promise.all([rank(db, actor, today), picksRepo.reasonsForDay(db, actor.id, today)]);
  return { picks: toPicks(ranked, saved, today), aiPending: needsReasons(ranked, saved).length > 0 };
}

/** One AI call for whichever of today's picks has no saved reason yet. Failures are saved too. */
export async function explain(db: D1Database, client: AiClient, actor: User): Promise<PicksResponse> {
  assertCreator(actor);
  const today = bahrainToday();
  const [ranked, saved] = await Promise.all([rank(db, actor, today), picksRepo.reasonsForDay(db, actor.id, today)]);
  const missing = needsReasons(ranked, saved);

  if (missing.length > 0) {
    const reasons = await explainPicks(
      client,
      actor,
      missing.map(({ collab, matchedTags }) => ({
        id: collab.id,
        business: collab.businessName,
        title: collab.title,
        offer: collab.offer,
        deliverable: collab.deliverable,
        matchedTags,
      })),
    );
    await picksRepo.saveReasons(db, actor.id, today, reasons);
    for (const [id, reason] of reasons) saved.set(id, reason);
  }

  return { picks: toPicks(ranked, saved, today), aiPending: false };
}
