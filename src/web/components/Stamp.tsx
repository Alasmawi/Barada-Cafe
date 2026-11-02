import type { CSSProperties } from 'react';
import type { Collab } from '../../shared/api';
import { STATUS_LABELS, type RequestStatus } from '../../shared/status';

type Tone = 'red' | 'green' | 'blue' | 'ink' | 'grey';

const STATUS_TONES: Record<RequestStatus, Tone> = {
  invited: 'red',
  pending: 'green',
  accepted: 'red',
  submitted: 'blue',
  done: 'ink',
  declined: 'grey',
};

/** Status is inked onto the card like a rubber stamp. The words stay real text. */
export function Stamp({ tone, children }: { tone: Tone; children: string }) {
  return <span className={`stamp stamp--${tone}`}>{children}</span>;
}

export function StatusStamp({ status }: { status: RequestStatus }) {
  return <Stamp tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Stamp>;
}

/** Last spot, Full or Ended. Nothing for an open collab with room. */
export function CollabStamp({ collab }: { collab: Collab }) {
  if (collab.state === 'ended') return <Stamp tone="grey">Ended</Stamp>;
  if (collab.state === 'full') return <Stamp tone="grey">Full</Stamp>;
  if (collab.spotsLeft === 1) return <Stamp tone="red">Last spot</Stamp>;
  return null;
}

/** A small fixed lean per card, so the board looks pinned up but never jumps on reload. */
export function tiltStyle(id: string): CSSProperties {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  const steps = [-1.4, -1, -0.6, 0.6, 1, 1.4];
  return { '--tilt': `${steps[Math.abs(hash) % steps.length]}deg` } as CSSProperties;
}
