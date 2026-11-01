import { describe, expect, it } from 'vitest';
import { addDays, bahrainToday, daysBetween, endsLabel, shortDate } from '../src/shared/dates';
import { detectPlatform, isHttpsUrl } from '../src/shared/postLink';
import { collabState } from '../src/shared/status';

describe('bahrainToday', () => {
  it('rolls to the next day at 21:00 UTC, which is midnight in Bahrain', () => {
    expect(bahrainToday(new Date('2026-11-01T20:59:59Z'))).toBe('2026-11-01');
    expect(bahrainToday(new Date('2026-11-01T21:00:00Z'))).toBe('2026-11-02');
  });
});

describe('date arithmetic', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days in either direction', () => {
    expect(daysBetween('2026-11-01', '2026-11-04')).toBe(3);
    expect(daysBetween('2026-11-04', '2026-11-01')).toBe(-3);
  });
});

describe('date labels', () => {
  it.each([
    ['2026-11-04', 'Ends in 3 days'],
    ['2026-11-02', 'Ends tomorrow'],
    ['2026-11-01', 'Ends today'],
    ['2026-10-31', 'Ended'],
  ])('labels %s as %s on 1 Nov', (endsOn, label) => {
    expect(endsLabel(endsOn, '2026-11-01')).toBe(label);
  });

  it('formats a short date', () => {
    expect(shortDate('2026-11-05')).toBe('Thu 5 Nov');
  });
});

describe('collabState', () => {
  const today = '2026-11-01';

  it.each([
    ['open', { endsOn: today, spots: 2, spotsTaken: 1 }],
    ['full', { endsOn: today, spots: 2, spotsTaken: 2 }],
    ['ended', { endsOn: '2026-10-31', spots: 2, spotsTaken: 1 }],
    ['ended', { endsOn: '2026-10-31', spots: 2, spotsTaken: 2 }],
  ])('is %s for %j', (state, collab) => {
    expect(collabState(collab, today)).toBe(state);
  });
});

describe('post links', () => {
  it.each([
    ['https://www.instagram.com/reel/abc/', 'instagram'],
    ['https://instagram.com/p/abc', 'instagram'],
    ['https://www.tiktok.com/@me/video/1', 'tiktok'],
    ['https://vm.tiktok.com/abc', 'tiktok'],
    ['https://youtube.com/shorts/abc', 'other'],
    ['https://instagram.com.example.net/p/abc', 'other'],
    ['https://notinstagram.com/p/abc', 'other'],
    ['not a url', 'other'],
  ])('detects %s as %s', (url, platform) => {
    expect(detectPlatform(url)).toBe(platform);
  });

  it.each([
    ['https://example.com/post', true],
    ['http://example.com/post', false],
    ['javascript:alert(1)', false],
    ['https://localhost/post', false],
    ['example.com/post', false],
    ['', false],
  ])('isHttpsUrl(%j) is %s', (url, expected) => {
    expect(isHttpsUrl(url)).toBe(expected);
  });
});
