import { describe, it, expect, afterEach } from 'vitest';
import { restoreAuxData } from '../core/storageKeys.js';

describe('restoreAuxData', () => {
  const realStorage = globalThis.localStorage;
  afterEach(() => { globalThis.localStorage = realStorage; });

  it('writes every key independently, so one failing key does not drop the ones after it', () => {
    const store = {};
    globalThis.localStorage = {
      setItem: (k, v) => {
        if (k.includes('collection-images')) throw new Error('QuotaExceededError');
        store[k] = v;
      },
    };
    restoreAuxData({ collectionImages: { a: 1 }, teamEquipment: { t: 1 }, calendarNotes: { d: 'x' } });
    expect(store['ww-team-equipment']).toBe('{"t":1}');
    expect(store['ww-calendar-notes']).toBe('{"d":"x"}');
  });
});
