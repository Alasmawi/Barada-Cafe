import type { Collab } from '../../../shared/api';

export const KIND_LABELS = { collab: 'Collab', offer: 'Offer' } as const;

export function spotsLabel({ state, spots, spotsTaken, spotsLeft }: Collab): string {
  if (state === 'ended') return `${spotsTaken} of ${spots} spots filled`;
  if (state === 'full') return 'All spots filled';
  return spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`;
}

export function KindBadge({ kind }: { kind: Collab['kind'] }) {
  return <span className={`kind-badge kind-badge--${kind}`}>{KIND_LABELS[kind]}</span>;
}

export function SpotsBar({ collab }: { collab: Collab }) {
  const percent = Math.round((collab.spotsTaken / collab.spots) * 100);
  return (
    <div className="spots-bar" role="img" aria-label={spotsLabel(collab)}>
      <span className="spots-bar__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}
