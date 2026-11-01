/** Every tag a creator can pick. A ring is drawn from these, so each tag owns one colour. */

export const NICHE_TAGS = {
  Coffee: '#8A5A1F',
  Food: '#E4572E',
  Beauty: '#D6336C',
  Fashion: '#7B3FBF',
  Fitness: '#0E8C6D',
  Travel: '#1C7ED6',
  Film: '#3B3FB6',
} as const;

/** Formats carry dots, evenly spaced, so a ring stays symmetrical and its spin can be seen. */
export const FORMAT_TAGS = {
  Reels: { color: '#B8860B', dots: 4 },
  TikTok: { color: '#1E1A17', dots: 6 },
  Stories: { color: '#5C7C2E', dots: 8 },
  Carousels: { color: '#0B7285', dots: 12 },
} as const;

export const VIBE_TAGS = {
  Calm: { color: '#4C6EF5', width: 14, dashes: 0 },
  Bold: { color: '#C8102E', width: 24, dashes: 0 },
  Playful: { color: '#F08C00', width: 17, dashes: 12 },
} as const;

export type NicheTag = keyof typeof NICHE_TAGS;
export type FormatTag = keyof typeof FORMAT_TAGS;
export type VibeTag = keyof typeof VIBE_TAGS;

export const NICHES = Object.keys(NICHE_TAGS) as NicheTag[];
export const FORMATS = Object.keys(FORMAT_TAGS) as FormatTag[];
export const VIBES = Object.keys(VIBE_TAGS) as VibeTag[];

/** One ring per tag, and a ring needs room to read at the size of an avatar. */
export const MAX_TAGS = 6;

export function isValidTagSet(tags: string[]): boolean {
  const known = [...NICHES, ...FORMATS, ...VIBES] as string[];
  const vibes = tags.filter((tag) => (VIBES as string[]).includes(tag));
  return (
    tags.length <= MAX_TAGS &&
    new Set(tags).size === tags.length &&
    tags.every((tag) => known.includes(tag)) &&
    tags.some((tag) => (NICHES as string[]).includes(tag)) &&
    tags.some((tag) => (FORMATS as string[]).includes(tag)) &&
    vibes.length === 1
  );
}
