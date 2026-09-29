import { describe, it, expect } from 'vitest';
import { pickTable, setAppLocale } from '../utils/i18n.js';
import { localizeSkillName, localizeSkillDesc, localizeSkillMult } from '../data/characters.js';

describe('pickTable', () => {
  it('returns the overlay for the requested locale and an empty table otherwise', () => {
    const tables = { fr: { Sword: 'Épée' } };
    expect(pickTable(tables, 'fr').Sword).toBe('Épée');
    expect(pickTable(tables, 'en').Sword).toBeUndefined();
    expect(pickTable(tables, 'es').Sword).toBeUndefined();
  });

  it('defaults to the active locale', () => {
    setAppLocale('fr');
    expect(pickTable({ fr: { a: 'x' } }).a).toBe('x');
    setAppLocale('en');
    expect(pickTable({ fr: { a: 'x' } }).a).toBeUndefined();
  });
});

describe('skill text resolvers', () => {
  it('hand back the English source when the locale has no overlay', () => {
    expect(localizeSkillName('en', 'Jiyan', 'Some Skill')).toBe('Some Skill');
    expect(localizeSkillDesc('es', 'Jiyan', 'Some Skill', 'Some desc')).toBe('Some desc');
    expect(localizeSkillMult('en', 'Jiyan', 'Some Skill', '10%')).toBe('10%');
  });

  it('never return an empty string for French', () => {
    expect(localizeSkillName('fr', 'Jiyan', 'Some Skill')).toBeTruthy();
  });
});

describe('Spanish locale registration', () => {
  it('is selectable, uses neutral Latin-American formatting, and falls back to English for untranslated keys', async () => {
    const i18n = await import('../utils/i18n.js');
    i18n.setAppLocale('es');
    expect(i18n.getLocale()).toBe('es');
    expect(i18n.getAppLocale()).toBe('es-419');
    expect(i18n.t('app.language')).toBe('Idioma');
    expect(i18n.t('tabs.tracker')).toBe(i18n.t('tabs.tracker', undefined)); // resolves, never the raw key
    expect(i18n.t('tabs.tracker')).not.toBe('tabs.tracker');
    i18n.setAppLocale('en');
  });
});
