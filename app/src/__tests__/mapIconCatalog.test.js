import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MAP_ICON_CATALOG, ENEMY_CLASS_ORDER, getIconCatalogEntry } from '../data/mapIconCatalog.js';
import { ECHO_DATA } from '../data/echoes.js';
import { buildSearchIndex, searchMap } from '../features/map/mapSearch.js';

const PUBLIC = join(__dirname, '..', '..', 'public');
const enemies = MAP_ICON_CATALOG.filter(k => k.category === 'Enemy');

describe('map icon catalog', () => {
  it('has unique ids and an image on disk for every kind', () => {
    const ids = MAP_ICON_CATALOG.map(k => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const k of MAP_ICON_CATALOG) expect(existsSync(join(PUBLIC, k.imageUrl)), k.imageUrl).toBe(true);
  });

  it('enemy entries mirror ECHO_DATA (name, class, element, Sonata sets)', () => {
    expect(enemies.length).toBeGreaterThan(0);
    for (const k of enemies.filter(e => e.echoName)) {
      const echo = ECHO_DATA[k.echoName];
      expect(echo, k.echoName).toBeTruthy();
      expect(k.name).not.toMatch(/Reminiscence/);
      expect(k.subcategory).toBe(echo.rank);
      expect(ENEMY_CLASS_ORDER).toContain(k.subcategory);
      expect(k.tags).toEqual(expect.arrayContaining([echo.element, ...echo.sets]));
    }
  });
});

describe('map search over enemy icons', () => {
  const zones = [{ id: 'huanglong', name: 'Huanglong', level: 1 }];
  const icons = enemies.map((k, i) => ({ id: `e${i}`, kind: k.id, zoneId: 'huanglong', x: i, y: i }));
  const index = buildSearchIndex({ icons, zones, getKind: getIconCatalogEntry });
  const keys = (q) => searchMap(index, q).map(r => r.doc.key);

  it('covers hand-entered enemies and alternate names', () => {
    expect(getIconCatalogEntry('enemy-scar-aberrant-nightmare').subcategory).toBe('Calamity');
    expect(getIconCatalogEntry('enemy-lioness-of-glory').subcategory).toBe('Overlord');
    expect(keys('arsinosa')[0]).toBe('kind:enemy-lioness-of-glory');
    expect(getIconCatalogEntry('enemy-seed-of-illusory-origin').name).toBe('Seed of Illusory Origin');
    expect(keys('denia')[0]).toBe('kind:enemy-seed-of-illusory-origin');
    expect(keys('adam smasher')[0]).toBe('kind:enemy-nightmare-adam-smasher');
    expect(keys('scar')[0]).toBe('kind:enemy-scar-aberrant-nightmare');
    expect(keys('scar havoc')[0]).toBe('kind:enemy-scar-aberrant-nightmare');
  });

  it('finds a boss by name, typo included', () => {
    expect(keys('crownles')[0]).toBe('kind:enemy-crownless');
  });
  it('finds bosses by element and by Sonata set', () => {
    expect(keys('havoc')).toContain('kind:enemy-crownless');
    expect(keys('void thunder')).toEqual(expect.arrayContaining(['kind:enemy-tempest-mephis', 'kind:enemy-thundering-mephis']));
  });
  it('offers an "all of this class" result, in French too', () => {
    expect(keys('calamity')[0]).toBe('sub:Enemy/Calamity');
    expect(keys('calamité')[0]).toBe('sub:Enemy/Calamity');
    expect(keys('calamity effigy')[0]).toBe('kind:enemy-calamity-effigy');
    expect(keys('effigy')[0]).toBe('kind:enemy-calamity-effigy');
    expect(keys('boss huanglong').length).toBeGreaterThan(0);
  });
});
