// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/events/eventRuns.js
// Ties an event's done/skipped status to the run it was set in, so a new run
// (weekly reset, next 28-day cycle, next scheduled run) starts unchecked even
// when the app was closed at the moment the previous run ended.
// ═══════════════════════════════════════════════════════════════════════════════

import { getRecurringEventEnd, getNextWeeklyReset } from '../../core/time.js';

const RECURRING_RESET = /^~?\d+\s*(days?|d|h|m)?$/i;

const toIso = (value) => {
  const ms = new Date(value).getTime();
  return isNaN(ms) ? null : new Date(ms).toISOString();
};

/**
 * Identifies the event's current run by when it ends. Null for Daily Reset,
 * whose status is its own per-day list (see EventCard's isDailyDoneToday).
 */
export function getEventRunId(ev, server) {
  if (ev.dailyReset) return null;
  if (ev.weeklyReset) return toIso(getNextWeeklyReset(server));
  if (ev.resetType && RECURRING_RESET.test(ev.resetType.trim())) {
    return toIso(getRecurringEventEnd(ev.currentEnd, ev.resetType, server));
  }
  return ev.currentEnd ? toIso(ev.currentEnd) : null;
}

/**
 * The stored status is { status, run }. It only counts while `run` is still the
 * current run. A bare 'done'/'skipped' string (saved before runs were tracked)
 * is read as belonging to the current run.
 */
export function readEventStatus(stored, runId) {
  if (stored == null) return null;
  if (typeof stored === 'string') return stored;
  if (typeof stored === 'object' && 'status' in stored) {
    return stored.run === runId ? stored.status : null;
  }
  return stored; // Daily Reset's { weekStart, days } list
}

/** What to store for a status set now (null clears it). */
export function makeEventStatus(status, runId) {
  if (status == null) return null;
  if (typeof status !== 'string' || runId == null) return status;
  return { status, run: runId };
}
