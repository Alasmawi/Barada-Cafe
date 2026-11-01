import type { House } from '../../shared/houses';
import coral from '../assets/seals/coral.svg';
import gulf from '../assets/seals/gulf.svg';
import oud from '../assets/seals/oud.svg';
import saffron from '../assets/seals/saffron.svg';
import sage from '../assets/seals/sage.svg';

const SEALS: Record<House, string> = { saffron, gulf, sage, oud, coral };

/** A business is always a square, and a creator always a round ring. */
export function BrandMark({ house, size }: { house: House; size: number }) {
  return (
    <span className={`brand-mark house--${house}`} style={{ width: size, height: size }}>
      <img src={SEALS[house]} alt="" width={size * 0.78} height={size * 0.78} />
    </span>
  );
}
