// @ts-check
// Spanish localization overlay for the short display labels of character/weapon data —
// data/characters.js and data/weapons.js. Same keys and same display-only policy as the
// matching tables in characters.fr.js: the English string stays the internal key that
// calcEngine/autoEquip/typeColors compare against; only the label shown to the player changes.
// Terminology follows the official Spanish client/wiki: Espada, Hoja ancha, Pistolas,
// Guanteletes, Rectificador; Habilidad de resonancia, Liberación de resonancia,
// Habilidad Intro/Outro.

/** @type {Record<string, string>} */
export const SKILL_TYPE_ES = {
  'Basic ATK': 'Ataque básico',
  'Mid-air': 'Ataque aéreo',
  'Mid-air ATK': 'Ataque aéreo',
  'Mid-air Attack': 'Ataque aéreo',
  'Heavy ATK': 'Ataque pesado',
  'Heavy Attack': 'Ataque pesado',
  'Charged ATK': 'Ataque cargado',
  'Dodge Counter': 'Contraataque de esquiva',
  'Echo': 'Habilidad de Eco',
  'Skill': 'Habilidad de resonancia',
  'Liberation': 'Liberación de resonancia',
  'Forte': 'Circuito de Forte',
  'Intro': 'Habilidad Intro',
  'Outro': 'Habilidad Outro',
};

/** @type {Record<string, string>} */
export const WEAPON_TYPE_ES = {
  'Sword': 'Espada',
  'Broadblade': 'Hoja ancha',
  'Pistols': 'Pistolas',
  'Gauntlets': 'Guanteletes',
  'Rectifier': 'Rectificador',
};

/** @type {Record<string, string>} */
export const STAT_NAME_ES = {
  'Crit Rate': 'Tasa crít.',
  'Crit DMG': 'Daño crít.',
  'Energy Regen': 'Regen. de energía',
  'ATK%': 'ATQ %',
  'HP%': 'PV %',
  'DEF%': 'DEF %',
  'HP': 'PV',
};

/** @type {Record<string, string>} */
export const PV_LABEL_ES = {
  allDmg: 'Daño total',
  atkPct: 'ATQ',
  basicDmg: 'Daño de ataque básico',
  critDmg: 'Daño crít.',
  critRate: 'Tasa crít.',
  defIgnore: 'Ignorar DEF',
  defPct: 'DEF',
  echoDmg: 'Daño de habilidad de Eco',
  elemDmg: 'Bonif. de daño',
  healingBonus: 'Bonif. de curación',
  heavyDmg: 'Daño de ataque pesado',
  hpPct: 'PV',
  libDmg: 'Daño de liberación',
  resShred: 'Reducción de RES',
  skillDmg: 'Daño de habilidad',
};

/** @type {Record<string, string>} */
export const ROLE_ES = {
  'Main DPS': 'DPS principal',
  'Sub DPS': 'DPS secundario',
  'Support': 'Apoyo',
  'Healer': 'Sanador',
  'Support/Healer': 'Apoyo/Sanador',
};
