// A Moment is for a meal soon, not a plan for next week
export const MAX_HOURS_AHEAD = 12;

/**
 * Turns a clock time from a time-only picker into the actual start time.
 * The picker keeps today's date, so a time already past means tomorrow
 * (e.g. 00:30 picked at 23:00). Returns null when that lands more than
 * MAX_HOURS_AHEAD away, which is almost always a mis-pick.
 */
export function resolvePickedTime(picked: Date, now: Date = new Date()): Date | null {
  const start = new Date(now);
  start.setHours(picked.getHours(), picked.getMinutes(), 0, 0);

  // Allow a minute of slack so "now" doesn't flip to tomorrow while the picker is open
  if (start.getTime() < now.getTime() - 60_000) {
    start.setDate(start.getDate() + 1);
  }

  if (start.getTime() - now.getTime() > MAX_HOURS_AHEAD * 60 * 60_000) return null;
  return start;
}

/** A sensible default for the picker: 30 minutes out, rounded up to 5 minutes. */
export function defaultPickerTime(now: Date = new Date()): Date {
  const time = new Date(now.getTime() + 30 * 60_000);
  time.setSeconds(0, 0);
  time.setMinutes(Math.ceil(time.getMinutes() / 5) * 5);
  return time;
}
