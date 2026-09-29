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
    // CHARACTER_TAG_TABLES is checked against the source data instead (see the character overlay tests):
    // Spanish deliberately leaves untranslated the status-effect names French has official terms for.
    for (const [name, { fr, es }] of Object.entries(tables)) {
      if (name !== 'CHARACTER_TAG_TABLES') expect(Object.keys(es).sort(), name).toEqual(Object.keys(fr).sort());
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

describe('echo overlays (data/echoes.*.js)', () => {
  it('Spanish covers every Sonata set and echo skill description of the source data', async () => {
    const { ECHO_SETS, ECHO_DATA } = await import('../data/echoes.js');
    const { ECHO_SETS_ES, ECHO_DATA_ES } = await import('../data/echoes.es.js');
    expect(Object.keys(ECHO_SETS_ES).sort()).toEqual(Object.keys(ECHO_SETS).sort());
    for (const [name, s] of Object.entries(ECHO_SETS)) {
      for (const piece of ['p2', 'p3', 'p5']) expect(Boolean(ECHO_SETS_ES[name][piece]), `${name}.${piece}`).toBe(Boolean(s[piece]));
      expect(ECHO_SETS_ES[name].name, name).toBeTruthy();
    }
    const withDesc = Object.entries(ECHO_DATA).filter(([, v]) => v.desc).map(([k]) => k);
    expect(Object.keys(ECHO_DATA_ES).sort()).toEqual(withDesc.sort());
  });
});

describe('weapon overlay (data/weapons.*.js)', () => {
  it('Spanish covers every weapon with a description and passive', async () => {
    const { WEAPON_DATA, getLocalizedWeaponData } = await import('../data/weapons.js');
    const { WEAPON_DATA_ES } = await import('../data/weapons.es.js');
    expect(Object.keys(WEAPON_DATA_ES).sort()).toEqual(Object.keys(WEAPON_DATA).sort());
    for (const [name, w] of Object.entries(WEAPON_DATA_ES)) { expect(w.desc, name).toBeTruthy(); expect(w.passive, name).toBeTruthy(); }
    const es = getLocalizedWeaponData('es');
    expect(es['Kumokiri'].passive).toContain('ATQ +12 %');
    expect(es['Kumokiri'].stat).toBe(WEAPON_DATA['Kumokiri'].stat);
  });
});

describe('character label overlays (data/characters.*.js)', () => {
  it('Spanish titles cover every character that has a title', async () => {
    const { CHARACTER_DATA, getLocalizedCharacterData } = await import('../data/characters.js');
    const { CHARACTER_TITLE_ES } = await import('../data/characters.es.js');
    const titled = Object.entries(CHARACTER_DATA).filter(([, d]) => d.title).map(([n]) => n);
    expect(Object.keys(CHARACTER_TITLE_ES).sort()).toEqual(titled.sort());
    expect(getLocalizedCharacterData('es')['Jiyan'].title).toBe('Jinete del viento');
    expect(getLocalizedCharacterData('es')['Jiyan'].desc).toBe(CHARACTER_DATA['Jiyan'].desc);
  });

  it('Spanish tags cover every tag or say deliberately to keep it', async () => {
    const { CHARACTER_DATA } = await import('../data/characters.js');
    const { CHARACTER_TAG_ES } = await import('../data/characters.es.js');
    const keep = new Set(['Ashinohara', 'Chongzhou', 'Mingting', 'Ragunna', 'Septimont', 'Rinascita', 'Huanglong', 'Jinzhou', 'Lahai-Roi', 'Fractsidus', 'Night City', 'Frazzle', 'Spectro Frazzle', 'Glacio Chafe', 'Havoc Bane', 'Fusion Burst', 'Electro Flare', 'Hack - Shifting', 'Hack Response', 'Off-Tune', 'Tune Break Boost', 'Tune Rupture Response', 'Tune Strain - Interfered', 'Tune Strain - Shifting', 'Tune Strain Response']);
    const used = new Set();
    for (const d of Object.values(CHARACTER_DATA)) {
      for (const f of ['birthplace', 'region', 'organization']) if (d[f]) used.add(d[f]);
      for (const f of ['dmgFocus', 'buffs', 'debuffs']) for (const x of d[f] || []) used.add(x);
    }
    for (const tag of used) expect(CHARACTER_TAG_ES[tag] || keep.has(tag), tag).toBeTruthy();
  });
});

describe('Spanish skill text fallbacks', () => {
  it('translates generic skill names, composes translated bespoke names, and leaves unknown names in English', async () => {
    const { localizeSkillName, localizeSkillDesc } = await import('../data/characters.js');
    expect(localizeSkillName('es', 'Jiyan', 'Stage 1-4')).toBe('Fase 1-4');
    expect(localizeSkillName('es', 'Hiyuki', 'Dodge Counter - Present Self')).toBe('Contraataque de esquiva - Yo presente');
    expect(localizeSkillName('es', 'Hiyuki', 'Foreclaimed Self Stage 1-3')).toBe('Yo reclamado Fase 1-3');
    expect(localizeSkillName('es', 'Jiyan', 'Some Unlisted Skill')).toBe('Some Unlisted Skill');
    expect(localizeSkillDesc('es', 'X', 's', 'Considered Echo Skill DMG.')).toBe('Se considera daño de habilidad de Eco.');
    expect(localizeSkillDesc('es', 'X', 's', 'Hits for Heavy Attack DMG')).toBe('Hits for daño de ataque pesado');
  });
});

describe('Spanish skill and chain-node names', () => {
  it('has all six chain node titles for every character that has them', async () => {
    const { CHAIN_NODE_NAMES } = await import('../data/characters.js');
    const { CHAIN_NODE_NAMES_ES } = await import('../data/characters.es.js');
    expect(Object.keys(CHAIN_NODE_NAMES_ES).sort()).toEqual(Object.keys(CHAIN_NODE_NAMES).sort());
    for (const [name, nodes] of Object.entries(CHAIN_NODE_NAMES_ES)) expect(Object.keys(nodes), name).toEqual(['s1', 's2', 's3', 's4', 's5', 's6']);
  });

  it('only names skills that exist in SKILL_MULTIPLIERS', async () => {
    const { SKILL_MULTIPLIERS, localizeSkillName } = await import('../data/characters.js');
    const { SKILL_NAME_ES } = await import('../data/characters.es.js');
    for (const [char, names] of Object.entries(SKILL_NAME_ES)) {
      const real = new Set((SKILL_MULTIPLIERS[char] || []).map(r => r[1]));
      for (const n of Object.keys(names)) expect(real.has(n), `${char}: ${n}`).toBe(true);
    }
    expect(localizeSkillName('es', 'Jiyan', 'Lone Lance Stage 1-5')).toBe('Lanza solitaria Fase 1-5');
  });
});

describe('Spanish character buff notes', () => {
  it('covers every character that has a buff note and leaves the numeric fields untouched', async () => {
    const { CHAR_BUFF_TABLE, getLocalizedCharBuffTable } = await import('../data/characters.js');
    const { CHAR_BUFF_NOTE_ES } = await import('../data/characters.es.js');
    const withNote = Object.entries(CHAR_BUFF_TABLE).filter(([, v]) => v.note).map(([k]) => k);
    expect(Object.keys(CHAR_BUFF_NOTE_ES).sort()).toEqual(withNote.sort());
    const es = getLocalizedCharBuffTable('es');
    expect(es['Verina'].note).toBe(CHAR_BUFF_NOTE_ES['Verina']);
    expect(es['Verina'].stat).toBe(CHAR_BUFF_TABLE['Verina'].stat);
  });
});
