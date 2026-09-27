import { describe, it, expect, beforeEach } from 'vitest';
import { mergeIconSeed, loadIconDrafts, ICON_DRAFTS_KEY, ICON_SEED_VERSION_KEY } from '../features/map/mapStorage.js';
import { DEFAULT_ICON_DRAFTS, ICON_SEED_ADDITIONS, ICON_SEED_VERSION } from '../data/mapDefaults.js';

const ic = (id) => ({ id, kind: 'resonance-beacon', x: 0, y: 0 });
const seed = [ic('a'), ic('b'), ic('c'), ic('d')];
const additions = { 2: ['c'], 3: ['d'] };

describe('mergeIconSeed', () => {
  it('adds only icons introduced after the player version', () => {
    const r = mergeIconSeed([ic('a'), ic('b')], 1, seed, additions, 3);
    expect(r.icons.map(i => i.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(r.added).toBe(2);
    expect(mergeIconSeed([ic('a')], 2, seed, additions, 3).icons.map(i => i.id)).toEqual(['a', 'd']);
  });
  it('never re-adds an older icon the player deleted, nor duplicates an existing one', () => {
    const r = mergeIconSeed([ic('c')], 1, seed, additions, 3); // 'a','b' deleted by the player
    expect(r.icons.map(i => i.id)).toEqual(['c', 'd']);
  });
  it('keeps the player edits of an icon it already has', () => {
    const edited = { ...ic('c'), x: 99 };
    expect(mergeIconSeed([edited], 1, seed, additions, 3).icons[0]).toBe(edited);
  });
});

describe('loadIconDrafts', () => {
  beforeEach(() => localStorage.clear());
  it('gives a new player the full seed at the current version', () => {
    expect(loadIconDrafts()).toBe(DEFAULT_ICON_DRAFTS);
    expect(localStorage.getItem(ICON_SEED_VERSION_KEY)).toBe(String(ICON_SEED_VERSION));
  });
  it('merges the version-2 boss icons into a pre-versioning save, once', () => {
    const v2 = new Set(ICON_SEED_ADDITIONS[2]);
    const old = DEFAULT_ICON_DRAFTS.filter(i => !v2.has(i.id)).slice(0, 10);
    localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(old));
    const got = loadIconDrafts();
    expect(got).toHaveLength(10 + 40);
    expect(JSON.parse(localStorage.getItem(ICON_DRAFTS_KEY))).toHaveLength(50);
    localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(old)); // player deletes them again
    expect(loadIconDrafts()).toHaveLength(10);
  });
  it('seed additions all exist in the seed', () => {
    const ids = new Set(DEFAULT_ICON_DRAFTS.map(i => i.id));
    for (const list of Object.values(ICON_SEED_ADDITIONS)) for (const id of list) expect(ids.has(id), id).toBe(true);
  });
});
