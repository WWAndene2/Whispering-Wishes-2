import { describe, it, expect } from 'vitest';
import { getCurrentBannerAuto, getLocalizedEvents, resolveEventWindow, getConveneAnimation } from '../data/banners.js';

const at = (iso) => Date.parse(iso);

describe('getCurrentBannerAuto', () => {
  it('switches to v3.7 phase 1 at its exact start time', () => {
    expect(getCurrentBannerAuto(at('2026-09-30T01:59:00Z')).version).not.toBe('3.7');
    const p1 = getCurrentBannerAuto(at('2026-09-30T02:00:00Z'));
    expect([p1.version, p1.phase]).toEqual(['3.7', 1]);
    expect(p1.characters.map(c => c.name)).toEqual(['Hsin', 'Chisa', 'Iuno']);
    expect(p1.characters.map(c => c.title)).toEqual(['As Full as Tonight, Forever', 'Horizon of Danbreak', "Across Time's Waxes and Wanes"]);
    expect(p1.endDate).toBe('2026-10-22T09:00:00Z');
    expect(p1.characters[0].featured4Stars).toEqual(['Buling', 'Taoqi', 'Youhu']);
    expect(p1.weapons[0].featured4Stars).toEqual(['Fusion Accretion', 'Commando of Conviction', 'Dauntless Evernight']);
  });

  it('switches to v3.7 phase 2 with Lynae paired to Spectrum Blaster', () => {
    const p2 = getCurrentBannerAuto(at('2026-10-22T09:00:00Z'));
    expect([p2.version, p2.phase]).toEqual(['3.7', 2]);
    expect(p2.characters[0].featured4Stars).toEqual(['Lumi', 'Danjin', 'Chixia']);
    expect(p2.weapons[0].featured4Stars).toEqual(['Overture', 'Relativistic Jet', 'Amity Accord']);
    expect(p2.weapons.map(w => [w.name, w.forCharacter])).toEqual([
      ['Unspoken Rue', 'Suoming'], ['Freeze Frame', 'Lucilla'], ['Spectrum Blaster', 'Lynae'],
    ]);
  });
});

describe('resolveEventWindow', () => {
  const ev = { name: 'X', currentStart: '2026-01-01T00:00:00Z', currentEnd: '2026-01-10T00:00:00Z', schedule: [{ currentStart: '2026-02-01T00:00:00Z', currentEnd: '2026-02-10T00:00:00Z' }] };

  it('keeps the current run until it ends, then moves to the next one', () => {
    expect(resolveEventWindow(ev, at('2026-01-05T00:00:00Z')).currentEnd).toBe('2026-01-10T00:00:00Z');
    expect(resolveEventWindow(ev, at('2026-01-15T00:00:00Z')).currentStart).toBe('2026-02-01T00:00:00Z');
    expect(resolveEventWindow(ev, at('2026-03-01T00:00:00Z')).currentEnd).toBe('2026-02-10T00:00:00Z');
    expect(resolveEventWindow(ev, at('2026-01-05T00:00:00Z')).schedule).toBeUndefined();
  });

  it('is applied by getLocalizedEvents in both locales', () => {
    for (const locale of ['en', 'fr']) {
      const events = getLocalizedEvents(locale, at('2026-10-01T00:00:00Z'));
      expect(events.pioneerPodcast.currentStart).toBe('2026-09-30T02:00:00Z');
      expect(events.giftsOfWakingMoon.currentStart).toBe('2026-09-30T02:00:00Z');
    }
  });
});

describe('convene animations', () => {
  it('has clips for the v3.7 debuts', () => {
    expect(getConveneAnimation('Hsin')).toBe('./convene-animations/hsin-convene.mp4');
    expect(getConveneAnimation('Suoming')).toBe('./convene-animations/suoming-convene.mp4');
  });
});
