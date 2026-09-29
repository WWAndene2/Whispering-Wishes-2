// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — data/localeTables.js
// Groups each display-label overlay by locale so a call site reads
// `pickTable(ROLE_TABLES)[role] || role` and needs no change when a language is added.
// Aggregation only — the translations live in the <base>.<locale>.js files.
// ═══════════════════════════════════════════════════════════════════════════════

import { ROLE_FR, WEAPON_TYPE_FR, STAT_NAME_FR, PV_LABEL_FR, SKILL_TYPE_FR } from './characters.fr.js';
import { ROLE_ES, WEAPON_TYPE_ES, STAT_NAME_ES, PV_LABEL_ES, SKILL_TYPE_ES } from './characters.es.js';
import { RANK_FR } from './echoes.fr.js';
import { RANK_ES } from './echoes.es.js';

export const ROLE_TABLES = { fr: ROLE_FR, es: ROLE_ES };
export const WEAPON_TYPE_TABLES = { fr: WEAPON_TYPE_FR, es: WEAPON_TYPE_ES };
export const STAT_NAME_TABLES = { fr: STAT_NAME_FR, es: STAT_NAME_ES };
export const PV_LABEL_TABLES = { fr: PV_LABEL_FR, es: PV_LABEL_ES };
export const SKILL_TYPE_TABLES = { fr: SKILL_TYPE_FR, es: SKILL_TYPE_ES };
export const RANK_TABLES = { fr: RANK_FR, es: RANK_ES };
