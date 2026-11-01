const BAHRAIN_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Today in Asia/Bahrain as YYYY-MM-DD. Bahrain is UTC+3 all year, with no daylight saving. */
export function bahrainToday(now: Date = new Date()): string {
  return new Date(now.getTime() + BAHRAIN_OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`. Negative when `to` has passed. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

export function endsLabel(endsOn: string, today: string): string {
  const days = daysBetween(today, endsOn);
  if (days < 0) return 'Ended';
  if (days === 0) return 'Ends today';
  if (days === 1) return 'Ends tomorrow';
  return `Ends in ${days} days`;
}

/** "Thu 5 Nov". Formatted in UTC because a YYYY-MM-DD string parses as UTC midnight. */
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(new Date(date))
    .replace(',', '');
}
