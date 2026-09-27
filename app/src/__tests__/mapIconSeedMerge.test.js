import { describe, it, expect, beforeEach } from 'vitest';
import { mergeIconSeed, loadIconDrafts, ICON_DRAFTS_KEY, ICON_SEED_VERSION_KEY } from '../features/map/mapStorage.js';
import { DEFAULT_ICON_DRAFTS, ICON_SEED_ADDITIONS, ICON_SEED_CHANGES, ICON_SEED_VERSION } from '../data/mapDefaults.js';

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

describe('mergeIconSeed field changes', () => {
  const chg = { 3: [['a', 'floor', null, 0]] };
  it('applies a change only where the player still has the old value', () => {
    expect(mergeIconSeed([{ ...ic('a'), floor: null }], 2, seed, {}, 3, chg).icons[0].floor).toBe(0);
    expect(mergeIconSeed([{ ...ic('a'), floor: 4 }], 2, seed, {}, 3, chg).icons[0].floor).toBe(4);
    expect(mergeIconSeed([ic('b')], 2, seed, {}, 3, chg).icons).toEqual([ic('b')]); // deleted: nothing added
  });
  it('treats a missing field as null and never mutates the saved list', () => {
    const saved = [ic('a')];
    const r = mergeIconSeed(saved, 2, seed, {}, 3, chg);
    expect(r.icons[0].floor).toBe(0);
    expect(saved[0].floor).toBeUndefined();
  });
  it('seed already holds every change target value', () => {
    const byId = new Map(DEFAULT_ICON_DRAFTS.map(i => [i.id, i]));
    for (const list of Object.values(ICON_SEED_CHANGES)) for (const [id, f, , to] of list) expect(byId.get(id)?.[f]).toBe(to);
  });
});

describe('loadIconDrafts', () => {
  beforeEach(() => localStorage.clear());
  it('gives a new player the full seed at the current version', () => {
    expect(loadIconDrafts()).toBe(DEFAULT_ICON_DRAFTS);
    expect(localStorage.getItem(ICON_SEED_VERSION_KEY)).toBe(String(ICON_SEED_VERSION));
  });
  it('merges every later version\'s icons into a pre-versioning save, once', () => {
    const added = new Set(Object.values(ICON_SEED_ADDITIONS).flat());
    const old = DEFAULT_ICON_DRAFTS.filter(i => !added.has(i.id)).slice(0, 10);
    localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(old));
    const got = loadIconDrafts();
    expect(got).toHaveLength(10 + added.size);
    expect(JSON.parse(localStorage.getItem(ICON_DRAFTS_KEY))).toHaveLength(10 + added.size);
    localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(old)); // player deletes them again
    expect(loadIconDrafts()).toHaveLength(10);
  });
  it('a version-3 save receives only the version-4 collectibles', () => {
    const v4 = new Set(ICON_SEED_ADDITIONS[4]);
    const v3Save = DEFAULT_ICON_DRAFTS.filter(i => !v4.has(i.id));
    localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(v3Save));
    localStorage.setItem(ICON_SEED_VERSION_KEY, '3');
    const got = loadIconDrafts();
    expect(got).toHaveLength(v3Save.length + v4.size);
    expect(got.filter(i => v4.has(i.id)).map(i => i.id).sort()).toEqual([...v4].sort());
  });
  it('seed additions all exist in the seed', () => {
    const ids = new Set(DEFAULT_ICON_DRAFTS.map(i => i.id));
    for (const list of Object.values(ICON_SEED_ADDITIONS)) for (const id of list) expect(ids.has(id), id).toBe(true);
  });
});
