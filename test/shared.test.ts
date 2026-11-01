import { describe, expect, it } from 'vitest';
import {
  addDays,
  bahrainToday,
  daysBetween,
  endsLabel,
  lastDayOfMonth,
  shortDate,
} from '../src/shared/dates';
import { detectPlatform, isHttpsUrl } from '../src/shared/postLink';
import { nextStep } from '../src/shared/requestSteps';
import { ringFromTags } from '../src/shared/ring';
import { isValidTagSet, VIBE_TAGS } from '../src/shared/tags';
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

  it.each([
    ['2026-11-15', '2026-11-30'],
    ['2026-12-31', '2026-12-31'],
    ['2028-02-01', '2028-02-29'],
  ])('finds the last day of the month from %s', (date, last) => {
    expect(lastDayOfMonth(date)).toBe(last);
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

describe('nextStep', () => {
  it('gives an accepted creator their deadline', () => {
    expect(nextStep('accepted', '2026-11-05', '2026-11-01')).toBe(
      'Visit by Thu 5 Nov, then add your post link.',
    );
  });

  it('drops the deadline once it has passed', () => {
    expect(nextStep('accepted', '2026-10-31', '2026-11-01')).toBe(
      'Add your post link when it’s live.',
    );
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

describe('ringFromTags', () => {
  it('draws one ring per tag: more tags, more rings', () => {
    expect(ringFromTags(['Coffee', 'Reels', 'Calm']).layers).toHaveLength(3);
    expect(ringFromTags(['Coffee', 'Food', 'Film', 'Reels', 'Stories', 'Bold']).layers).toHaveLength(6);
  });

  it('gives each tag its own colour', () => {
    const { layers } = ringFromTags(['Coffee', 'Food', 'Reels', 'TikTok', 'Calm']);

    expect(new Set(layers.map(({ color }) => color)).size).toBe(5);
  });

  it('puts dots only on format rings', () => {
    const { layers } = ringFromTags(['Coffee', 'Stories', 'Carousels', 'Calm']);

    expect(layers.map(({ dots }) => dots)).toEqual([0, 8, 12, 0]);
  });

  it('keeps rings concentric, outermost first and evenly spaced', () => {
    const { layers } = ringFromTags(['Coffee', 'Food', 'Reels', 'Calm']);
    const gaps = layers.slice(1).map((layer, index) => layers[index]!.radius - layer.radius);

    expect(new Set(gaps).size).toBe(1);
    expect(gaps[0]).toBeGreaterThan(0);
  });

  it('draws the same ring for the same tags, whatever order they came in', () => {
    expect(ringFromTags(['Reels', 'Calm', 'Coffee'])).toEqual(ringFromTags(['Coffee', 'Calm', 'Reels']));
  });

  it('lets the vibe set the line weight', () => {
    expect(ringFromTags(['Coffee', 'Reels', 'Bold']).lineWidth).toBe(VIBE_TAGS.Bold.width);
  });

  it('never draws more rings than the limit', () => {
    const tags = ['Coffee', 'Food', 'Beauty', 'Fashion', 'Fitness', 'Travel', 'Film', 'Reels', 'Calm'];

    expect(ringFromTags(tags).layers).toHaveLength(6);
  });
});

describe('isValidTagSet', () => {
  it('needs a niche, a format and exactly one vibe', () => {
    expect(isValidTagSet(['Coffee', 'Reels', 'Calm'])).toBe(true);
    expect(isValidTagSet(['Reels', 'Calm'])).toBe(false);
    expect(isValidTagSet(['Coffee', 'Calm'])).toBe(false);
    expect(isValidTagSet(['Coffee', 'Reels'])).toBe(false);
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
