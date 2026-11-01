import { shortDate } from './dates';
import type { RequestStatus } from './status';

/** The creator's journey, in order. Declined leaves it, so it isn't a step. */
export const JOURNEY_STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'pending', label: 'Asked' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'submitted', label: 'Posted' },
  { status: 'done', label: 'Served' },
];

/** One line telling the creator where they stand and what happens next. */
export function nextStep(status: RequestStatus, endsOn: string, today: string): string {
  switch (status) {
    case 'pending':
      return 'The café will read your pitch soon.';
    case 'accepted':
      return today > endsOn
        ? 'Add your post link when it’s live.'
        : `Visit by ${shortDate(endsOn)}, then add your post link.`;
    case 'submitted':
      return 'The café will check your post next.';
    case 'done':
      return 'All done. Thanks for visiting.';
    case 'declined':
      return 'The café went another way on this one.';
  }
}
