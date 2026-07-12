import { t } from '@/shared/i18n/t';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RELATIVE_WINDOW_MS = 36 * HOUR_MS;

/**
 * Bounded relative formatter: "just now" / minutes / hours / "Yesterday" for anything within
 * ~36 hours, falling back to a plain absolute date otherwise. See TECH-PLAN.md §3.7 for why —
 * the reference server's CreatedAt/UpdatedAt are fully random (verified by actually running it,
 * see AGENTS.md), so an unbounded relative formatter would print nonsense like "120 years ago"
 * for most documents.
 */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0 || diffMs >= RELATIVE_WINDOW_MS) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (diffMs < MINUTE_MS) {
    return t('date.justNow');
  }

  if (diffMs < HOUR_MS) {
    const minutes = Math.floor(diffMs / MINUTE_MS);
    return t(minutes === 1 ? 'date.minuteAgo' : 'date.minutesAgo', { count: minutes });
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return t(hours === 1 ? 'date.hourAgo' : 'date.hoursAgo', { count: hours });
  }

  return t('date.yesterday');
}
