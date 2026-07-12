import { formatRelativeDate } from '@/shared/utils/formatRelativeDate';

const now = new Date('2026-07-12T12:00:00.000Z');

function minutesAgo(minutes: number): Date {
  return new Date(now.getTime() - minutes * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

describe('formatRelativeDate', () => {
  it('returns "Just now" for under a minute', () => {
    expect(formatRelativeDate(minutesAgo(0), now)).toBe('Just now');
    expect(formatRelativeDate(new Date(now.getTime() - 30 * 1000), now)).toBe('Just now');
  });

  it('returns singular "1 minute ago"', () => {
    expect(formatRelativeDate(minutesAgo(1), now)).toBe('1 minute ago');
  });

  it('returns plural minutes for 2-59 minutes', () => {
    expect(formatRelativeDate(minutesAgo(2), now)).toBe('2 minutes ago');
    expect(formatRelativeDate(minutesAgo(59), now)).toBe('59 minutes ago');
  });

  it('returns singular "1 hour ago"', () => {
    expect(formatRelativeDate(hoursAgo(1), now)).toBe('1 hour ago');
  });

  it('returns plural hours for 2-23 hours', () => {
    expect(formatRelativeDate(hoursAgo(2), now)).toBe('2 hours ago');
    expect(formatRelativeDate(hoursAgo(23), now)).toBe('23 hours ago');
  });

  it('returns "Yesterday" for 24 to just under 36 hours', () => {
    expect(formatRelativeDate(hoursAgo(24), now)).toBe('Yesterday');
    expect(formatRelativeDate(hoursAgo(35), now)).toBe('Yesterday');
  });

  it('falls back to an absolute date at 36 hours and beyond', () => {
    expect(formatRelativeDate(hoursAgo(36), now)).toBe('Jul 11, 2026');
  });

  it('falls back to an absolute date for dates far in the past', () => {
    const longAgo = new Date('2002-03-10T00:00:00.000Z');
    expect(formatRelativeDate(longAgo, now)).toBe('Mar 10, 2002');
  });

  it('falls back to an absolute date for dates in the future', () => {
    const future = new Date(now.getTime() + 60 * 60 * 1000);
    expect(formatRelativeDate(future, now)).toBe('Jul 12, 2026');
  });
});
