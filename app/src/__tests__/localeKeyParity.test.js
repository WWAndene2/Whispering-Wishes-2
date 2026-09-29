import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCALE_DIR = join(__dirname, '..', 'locale');
const leaves = (o, prefix = '') => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]);
// {{plural}} is the English "s" suffix flag; other languages pluralize with their own wording, so it is exempt.
const placeholders = (s) => [...new Set(String(s).match(/\{\{\w+\}\}/g) || [])].filter(p => p !== '{{plural}}').sort().join(',');
const flat = (o, prefix = '') => Object.fromEntries(Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? Object.entries(flat(v, `${prefix}${k}.`)) : [[`${prefix}${k}`, v]]));

// Modules whose Spanish translation is complete; extend as each sub-step lands.
// Every locale/en module now has a complete Spanish counterpart.
const TRANSLATED_ES = readdirSync(join(LOCALE_DIR, 'en')).map(f => f.replace(/\.json$/, ''));

describe.each(TRANSLATED_ES)('locale/es/%s.json', (mod) => {
  const load = (loc) => JSON.parse(readFileSync(join(LOCALE_DIR, loc, `${mod}.json`), 'utf8'));
  const en = load('en');
  const es = load('es');

  it('has exactly the same keys as English', () => {
    expect(leaves(es).sort()).toEqual(leaves(en).sort());
  });

  it('keeps every {{placeholder}} of the English string', () => {
    const fe = flat(en), fs = flat(es);
    for (const key of Object.keys(fe)) expect(placeholders(fs[key]), key).toBe(placeholders(fe[key]));
  });
});

it('every locale/en module has a locale/es module file', () => {
  const en = readdirSync(join(LOCALE_DIR, 'en')).sort();
  expect(readdirSync(join(LOCALE_DIR, 'es')).sort()).toEqual(en);
});

describe('display-label overlays (data/localeTables.js)', () => {
  it('Spanish covers every key the French overlay covers', async () => {
    const tables = await import('../data/localeTables.js');
    for (const [name, { fr, es }] of Object.entries(tables)) {
      expect(Object.keys(es).sort(), name).toEqual(Object.keys(fr).sort());
      for (const [key, label] of Object.entries(es)) expect(label, `${name}.${key}`).toBeTruthy();
    }
  });
});

describe('event overlays (data/banners.*.js)', () => {
  it('Spanish covers every event the app defines', async () => {
    const { EVENTS } = await import('../data/banners.js');
    const { EVENTS_ES } = await import('../data/banners.es.js');
    expect(Object.keys(EVENTS_ES).sort()).toEqual(Object.keys(EVENTS).sort());
    for (const [key, ev] of Object.entries(EVENTS_ES)) for (const f of ['name', 'subtitle', 'description']) expect(ev[f], `${key}.${f}`).toBeTruthy();
  });

  it('Spanish material names cover every French one', async () => {
    const { MATERIAL_NAME_FR } = await import('../data/materialData.fr.js');
    const { MATERIAL_NAME_ES } = await import('../data/materialData.es.js');
    expect(Object.keys(MATERIAL_NAME_ES).sort()).toEqual(Object.keys(MATERIAL_NAME_FR).sort());
  });
});
