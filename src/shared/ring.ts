import { FORMAT_TAGS, MAX_TAGS, NICHE_TAGS, VIBE_TAGS, type FormatTag, type NicheTag, type VibeTag } from './tags';

export type RingLayer = {
  radius: number;
  color: string;
  /** Number of evenly spaced dots this ring carries. */
  dots: number;
  /** Number of evenly spaced dashes, or 0 for a solid line. */
  dashes: number;
};

export type RingShape = { layers: RingLayer[]; lineWidth: number; dotRadius: number };

const OUTER_RADIUS = 270;
const MAX_GAP = 46;
/** The innermost ring stays at least this far from the outer edge's inner limit. */
const RING_SPREAD = 200;
const DEFAULT_LINE_WIDTH = 14;
const MIN_DOT_RADIUS = 21;

/**
 * Draws a ring from tags, so it reads the same everywhere and costs nothing to make. One
 * perfect circle per tag, in that tag's colour: more tags, more rings. Niches sit outside,
 * then formats, which carry the dots, then the vibe, which sets the line weight.
 */
export function ringFromTags(tags: string[]): RingShape {
  const niches = tags.filter((tag): tag is NicheTag => tag in NICHE_TAGS);
  const formats = tags.filter((tag): tag is FormatTag => tag in FORMAT_TAGS);
  const vibe = tags.find((tag): tag is VibeTag => tag in VIBE_TAGS);

  const rings = [
    ...niches.map((tag) => ({ color: NICHE_TAGS[tag] as string, dots: 0, dashes: 0 })),
    ...formats.map((tag) => ({ color: FORMAT_TAGS[tag].color as string, dots: FORMAT_TAGS[tag].dots as number, dashes: 0 })),
    ...(vibe ? [{ color: VIBE_TAGS[vibe].color as string, dots: 0, dashes: VIBE_TAGS[vibe].dashes as number }] : []),
  ].slice(0, MAX_TAGS);

  const gap = Math.min(MAX_GAP, RING_SPREAD / Math.max(rings.length - 1, 1));
  const lineWidth = vibe ? VIBE_TAGS[vibe].width : DEFAULT_LINE_WIDTH;

  return {
    layers: rings.map((ring, index) => ({ ...ring, radius: OUTER_RADIUS - index * gap })),
    lineWidth,
    dotRadius: Math.max(lineWidth * 1.5, MIN_DOT_RADIUS),
  };
}
