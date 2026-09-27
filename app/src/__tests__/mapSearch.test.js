import { describe, it, expect } from 'vitest';
import {
  buildSearchIndex, searchMap, highlightRanges, parseQuery, tokenize, resolveFilterKey, floorBreakdown,
} from '../features/map/mapSearch.js';

const KINDS = {
  'supply-chest': { name: 'Supply Chest', category: 'Collectible', subcategory: 'Supply Chest' },
  'treasure-spot': { name: 'Treasure Spot', category: 'Collectible', subcategory: 'Treasure Spot' },
  'resonance-nexus': { name: 'Nexus', category: 'Resonance', subcategory: 'Nexus' },
  'resonance-beacon': { name: 'Resonance Beacon', category: 'Resonance', subcategory: 'Beacon' },
};
const ZONES = [
  { id: 'huanglong', name: 'Huanglong', level: 1 },
  { id: 'jinzhou', name: 'Jinzhou', parentId: 'huanglong', level: 2 },
  { id: 'gorges', name: 'Gorges of Spirits', parentId: 'jinzhou', level: 3 },
  { id: 'shores', name: 'The Black Shores', level: 1 },
  { id: 'tethys', name: "Tethy's Deep", parentId: 'shores', level: 2 },
];
const ICONS = [
  { id: 'c1', kind: 'supply-chest', zoneId: 'gorges', floor: 0 },
  { id: 'c2', kind: 'supply-chest', zoneId: 'gorges', floor: 0 },
  { id: 'c3', kind: 'supply-chest', zoneId: 'tethys', floor: -2 },
  { id: 'n1', kind: 'resonance-nexus', zoneId: 'jinzhou', floor: 0 },
  { id: 'b1', kind: 'resonance-beacon', zoneId: 'tethys', floor: -2 },
  { id: 't1', kind: 'treasure-spot', zoneId: 'jinzhou', floor: 0, label: 'Hidden cave chest' },
];
const index = buildSearchIndex({ icons: ICONS, zones: ZONES, getKind: k => KINDS[k] || null });
const top = (q) => searchMap(index, q)[0]?.doc;
const keys = (q) => searchMap(index, q).map(r => r.doc.key);

describe('mapSearch — text normalization', () => {
  it('is case/accent-insensitive and joins apostrophes', () => {
    expect(tokenize("Tethy's DÉEP")).toEqual(['tethys', 'deep']);
  });
  it('drops stop words and expands synonyms', () => {
    const q = parseQuery('coffres dans Jinzhou');
    expect(q.map(w => w.word)).toEqual(['coffres', 'jinzhou']);
    expect(q[0].alts).toContain('chest');
  });
});

describe('mapSearch — ranking', () => {
  it('a bare item type returns the global result, not one copy per region', () => {
    expect(keys('supply chest')).toEqual(['kind:supply-chest']);
  });

  it('combines item type and region words in any order', () => {
    for (const q of ['chest gorges', 'gorges chest', 'supply chests in gorges of spirits']) {
      expect(top(q).key).toBe('kz:supply-chest@gorges');
      expect(top(q).count).toBe(2);
    }
  });

  it('a parent region covers icons placed in its sub-regions', () => {
    const d = index.byKey.get('kz:supply-chest@huanglong');
    expect(d.iconIds.sort()).toEqual(['c1', 'c2']);
    expect(top('chest huanglong').key).toBe('kz:supply-chest@huanglong');
  });

  it('a region name alone ranks the region first', () => {
    expect(top('jinzhou').key).toBe('zone:jinzhou');
    expect(index.byKey.get('zone:jinzhou').count).toBe(4); // c1, c2 (sub-region), n1, t1
  });

  it('tolerates typos and partial words', () => {
    expect(top('suply chst').key).toBe('kind:supply-chest');
    expect(top('tethys').key).toBe('zone:tethys');
    expect(top('jinz').key).toBe('zone:jinzhou');
  });

  it('matches player vocabulary through synonyms (EN/FR)', () => {
    const tp = keys('teleport');
    expect(tp).toEqual(expect.arrayContaining(['kind:resonance-nexus', 'kind:resonance-beacon', 'cat:Resonance']));
    expect(top('balise tethys').key).toBe('kz:resonance-beacon@tethys');
    expect(top('coffre gorges').key).toBe('kz:supply-chest@gorges');
  });

  it('finds individually labelled icons', () => {
    expect(keys('hidden cave')).toContain('icon:t1');
  });

  it('falls back to partial matches, flagged with the unmatched word', () => {
    const r = searchMap(index, 'nexus tethys');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(x => x.partial)).toBe(true);
    expect(r[0].missing).toHaveLength(1);
  });

  it('returns nothing for gibberish or stop words only', () => {
    expect(searchMap(index, 'qqqzzz')).toEqual([]);
    expect(searchMap(index, 'in the')).toEqual([]);
  });

  it('omits single-kind categories (they would duplicate the kind result)', () => {
    const idx = buildSearchIndex({ icons: [ICONS[3]], zones: ZONES, getKind: k => KINDS[k] });
    expect(idx.byKey.has('cat:Resonance')).toBe(false);
  });
});

describe('mapSearch — helpers', () => {
  it('highlights matched ranges on the original label, across apostrophes', () => {
    expect(highlightRanges("Tethy's Deep", 'tethys deep')).toEqual([[0, 7], [8, 12]]);
    expect(highlightRanges('Supply Chest', 'coffre')).toEqual([[7, 12]]);
  });
  it('resolves a saved result key against the current index', () => {
    expect(resolveFilterKey(index, 'kz:supply-chest@gorges').sort()).toEqual(['c1', 'c2']);
    expect(resolveFilterKey(index, 'kz:gone@nowhere')).toEqual([]);
  });
  it('breaks results down by floor', () => {
    expect([...floorBreakdown(index, ['c1', 'c3', 'b1'])]).toEqual([[0, 1], [-2, 2]]);
  });
});
