import { useMemo } from 'react';
import { cupSVG } from '../../../brand/src/finjan-art.js';

/** One cup from the art engine. The seed is hashed and only numbers reach the markup. */
export function CupArt({ seed, fill = 0, size }: { seed: string; fill?: number; size: number }) {
  const markup = useMemo(() => cupSVG({ seed, fill, size }), [seed, fill, size]);
  return <span className="cup-art" aria-hidden dangerouslySetInnerHTML={{ __html: markup }} />;
}
