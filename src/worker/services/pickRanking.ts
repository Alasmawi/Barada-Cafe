import type { Collab } from '../../shared/api';

/** The words in a collab that suggest each tag. Code decides the match, never the model. */
const TAG_WORDS: Record<string, string[]> = {
  Coffee: ['coffee', 'karak', 'latte', 'espresso', 'café', 'cafe', 'roast', 'roastery', 'cupping', 'pour'],
  Food: ['food', 'meal', 'dinner', 'breakfast', 'brunch', 'lunch', 'cake', 'kunafa', 'dessert', 'tasting', 'balaleet', 'chebab'],
  Beauty: ['beauty', 'perfume', 'fragrance', 'oud', 'scent', 'skincare', 'makeup'],
  Fashion: ['fashion', 'outfit', 'style', 'abaya', 'wear', 'clothing'],
  Fitness: ['fitness', 'gym', 'yoga', 'pilates', 'workout', 'mat', 'class', 'training'],
  Travel: ['travel', 'trip', 'stay', 'hotel', 'tour'],
  Film: ['film', 'video', 'cinematic', 'footage'],
  Reels: ['reel'],
  TikTok: ['tiktok'],
  Stories: ['story', 'stories'],
  Carousels: ['carousel', 'photo', 'photos'],
};

export const MAX_PICKS = 3;

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WORD_PATTERNS = Object.fromEntries(
  Object.entries(TAG_WORDS).map(([tag, words]) => [
    tag,
    new RegExp(`(^|[^\\p{L}])(${words.map(escape).join('|')})(s|es)?(?=$|[^\\p{L}])`, 'iu'),
  ]),
);

function collabText(collab: Collab): string {
  return [collab.businessName, collab.title, collab.offer, collab.deliverable, collab.details, collab.requirements].join(' ');
}

export function matchTags(collab: Collab, tags: string[]): string[] {
  const text = collabText(collab);
  return tags.filter((tag) => WORD_PATTERNS[tag]?.test(text));
}

function daysUntil(endsOn: string, today: string): number {
  return Math.round((Date.parse(endsOn) - Date.parse(today)) / 86_400_000);
}

/** The reason a creator sees before any AI runs, and whenever it fails. */
export function factReason(collab: Collab, matched: string[], today: string): string {
  const fits = matched.length === 1 ? matched[0] : `${matched.slice(0, -1).join(', ')} and ${matched.at(-1)}`;
  const spots = collab.spotsLeft === 1 ? '1 spot left' : `${collab.spotsLeft} spots left`;
  const days = daysUntil(collab.endsOn, today);
  const ends = days <= 0 ? 'ends today' : days === 1 ? 'ends tomorrow' : `ends in ${days} days`;
  return `Fits your ${fits} · ${spots} · ${ends}`;
}

/**
 * Open collabs the creator hasn't applied to, that match at least one of their tags.
 * More matching tags rank higher, then the last spot, then the soonest end date.
 */
export function rankPicks(
  collabs: Collab[],
  tags: string[],
  requested: Set<string>,
): { collab: Collab; matchedTags: string[] }[] {
  return collabs
    .filter((collab) => collab.state === 'open' && !requested.has(collab.id))
    .map((collab) => ({ collab, matchedTags: matchTags(collab, tags) }))
    .filter(({ matchedTags }) => matchedTags.length > 0)
    .sort(
      (a, b) =>
        b.matchedTags.length - a.matchedTags.length ||
        Number(a.collab.spotsLeft === 1 ? 0 : 1) - Number(b.collab.spotsLeft === 1 ? 0 : 1) ||
        a.collab.endsOn.localeCompare(b.collab.endsOn) ||
        a.collab.id.localeCompare(b.collab.id),
    )
    .slice(0, MAX_PICKS);
}
