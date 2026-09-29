import { describe, it, expect, vi, afterEach } from 'vitest';
import { getEventRunId, readEventStatus, makeEventStatus } from '../features/events/eventRuns.js';

afterEach(() => { vi.useRealTimers(); });

describe('getEventRunId', () => {
  it('is null for Daily Reset', () => {
    expect(getEventRunId({ dailyReset: true }, 'Europe')).toBeNull();
  });

  it('moves to the next week after the weekly reset', () => {
    const weekly = { weeklyReset: true };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-04T12:00:00Z')); // Sunday
    const before = getEventRunId(weekly, 'Europe');
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z')); // Tuesday, after Monday's reset
    const after = getEventRunId(weekly, 'Europe');
    expect(after).not.toBe(before);
    expect(Date.parse(after) - Date.parse(before)).toBe(7 * 86400000);
  });

  it('moves to the next 28-day cycle once the current one ends', () => {
    const ev = { resetType: '28 days', currentEnd: '2026-10-12T02:59:59Z' };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const first = getEventRunId(ev, 'Europe');
    vi.setSystemTime(new Date('2026-10-20T00:00:00Z'));
    expect(Date.parse(getEventRunId(ev, 'Europe')) - Date.parse(first)).toBe(28 * 86400000);
  });

  it('is the run end for a one-off or scheduled event', () => {
    expect(getEventRunId({ resetType: 'Limited-time', currentEnd: '2026-11-11T02:59:59Z' }, 'Europe')).toBe('2026-11-11T02:59:59.000Z');
  });
});

describe('readEventStatus / makeEventStatus', () => {
  const run = '2026-11-11T02:59:59.000Z';

  it('keeps a status only for the run it was set in', () => {
    const stored = makeEventStatus('done', run);
    expect(readEventStatus(stored, run)).toBe('done');
    expect(readEventStatus(stored, '2026-12-01T00:00:00.000Z')).toBeNull();
  });

  it('reads a status saved before runs were tracked as current', () => {
    expect(readEventStatus('skipped', run)).toBe('skipped');
  });

  it('leaves Daily Reset lists and clears untouched', () => {
    const daily = { weekStart: '2026-10-05', days: ['2026-10-05'] };
    expect(makeEventStatus(daily, null)).toBe(daily);
    expect(readEventStatus(daily, null)).toBe(daily);
    expect(makeEventStatus(null, run)).toBeNull();
  });
});
