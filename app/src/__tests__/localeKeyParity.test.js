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
    expect(getLocalizedCharacterData('es')['Jiyan'].desc).toContain('Guardabosques de Medianoche');
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

describe('Spanish character biographies', () => {
  it('covers every character that has a description', async () => {
    const { CHARACTER_DATA } = await import('../data/characters.js');
    const { CHARACTER_DESC_ES } = await import('../data/characters.es.js');
    const withDesc = Object.entries(CHARACTER_DATA).filter(([, d]) => d.desc).map(([n]) => n);
    expect(Object.keys(CHARACTER_DESC_ES).sort()).toEqual(withDesc.sort());
  });
});

describe('Spanish rotation notes', () => {
  it('has a note in the same step positions as the English guide', async () => {
    const { CHARACTER_ROTATIONS, getLocalizedCharacterRotations } = await import('../data/characters.js');
    const { CHARACTER_ROTATION_NOTE_ES } = await import('../data/characters.es.js');
    const withNotes = Object.entries(CHARACTER_ROTATIONS).filter(([, steps]) => steps.some(s => s.note)).map(([n]) => n);
    expect(Object.keys(CHARACTER_ROTATION_NOTE_ES).sort()).toEqual(withNotes.sort());
    for (const [name, notes] of Object.entries(CHARACTER_ROTATION_NOTE_ES)) {
      const steps = CHARACTER_ROTATIONS[name];
      expect(notes.length, name).toBe(steps.length);
      notes.forEach((n, i) => expect(Boolean(n), `${name}[${i}]`).toBe(Boolean(steps[i].note)));
    }
    const es = getLocalizedCharacterRotations('es');
    expect(es['Jinhsi'][0].note).toBe(CHARACTER_ROTATION_NOTE_ES['Jinhsi'][0]);
    expect(es['Jinhsi'][0].skill).toBe(CHARACTER_ROTATIONS['Jinhsi'][0].skill);
  });
});

describe('Spanish weapon-recommendation reasons', () => {
  it('cover the same characters and fields as the source data', async () => {
    const { CHARACTER_DATA } = await import('../data/characters.js');
    const { WEAPON_VERDICT_REASON_ES, WEAPON_ALT_REASON_ES } = await import('../data/characters.es.js');
    const withV = Object.entries(CHARACTER_DATA).filter(([, d]) => d.weaponVerdictReason).map(([n]) => n);
    const withA = Object.entries(CHARACTER_DATA).filter(([, d]) => d.weaponAltReason).map(([n]) => n);
    expect(Object.keys(WEAPON_VERDICT_REASON_ES).sort()).toEqual(withV.sort());
    expect(Object.keys(WEAPON_ALT_REASON_ES).sort()).toEqual(withA.sort());
    for (const n of withV) expect(Object.keys(WEAPON_VERDICT_REASON_ES[n]).sort()).toEqual(Object.keys(CHARACTER_DATA[n].weaponVerdictReason).sort());
  });
});

describe('Spanish skill descriptions and multiplier text', () => {
  it('translates every SKILL_MULTIPLIERS description and every prose multiplier cell', async () => {
    const { SKILL_MULTIPLIERS, localizeSkillDesc, localizeSkillMult } = await import('../data/characters.js');
    for (const [char, rows] of Object.entries(SKILL_MULTIPLIERS)) {
      for (const r of rows) {
        if (r[3]) expect(localizeSkillDesc('es', char, r[1], r[3]) !== r[3] || /^[\d%.\s]/.test(r[3]), `${char}: ${r[1]}`).toBe(true);
        if (typeof r[2] === 'string' && /[A-Za-z]{4,}/.test(r[2])) expect(localizeSkillMult('es', char, r[1], r[2]), `${char}: ${r[1]}`).not.toBe(r[2]);
      }
    }
  });
});

describe('Spanish achievements', () => {
  it('covers every achievement and series id and localizes them', async () => {
    const { ACHIEVEMENTS_ES, ACHIEVEMENT_SERIES_ES } = await import('../data/achievements.es.js');
    const { ACHIEVEMENTS_FR, ACHIEVEMENT_SERIES_FR } = await import('../data/achievements.fr.js');
    expect(Object.keys(ACHIEVEMENTS_ES).sort()).toEqual(Object.keys(ACHIEVEMENTS_FR).sort());
    expect(Object.keys(ACHIEVEMENT_SERIES_ES).sort()).toEqual(Object.keys(ACHIEVEMENT_SERIES_FR).sort());
    const { getLocalizedAchievements } = await import('../data/achievements.js');
    const es = getLocalizedAchievements('es');
    for (const [id, tr] of Object.entries(ACHIEVEMENTS_ES)) expect(es[id].name).toBe(tr.name);
  });
});
