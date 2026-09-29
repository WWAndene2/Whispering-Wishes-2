// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — data/localeTables.js
// Groups each display-label overlay by locale so a call site reads
// `pickTable(ROLE_TABLES)[role] || role` and needs no change when a language is added.
// Aggregation only — the translations live in the <base>.<locale>.js files.
// ═══════════════════════════════════════════════════════════════════════════════

import { ROLE_FR, WEAPON_TYPE_FR, STAT_NAME_FR, PV_LABEL_FR, SKILL_TYPE_FR, CHARACTER_TAG_FR, WEAPON_VERDICT_REASON_FR, WEAPON_ALT_REASON_FR } from './characters.fr.js';
import { ROLE_ES, WEAPON_TYPE_ES, STAT_NAME_ES, PV_LABEL_ES, SKILL_TYPE_ES, CHARACTER_TAG_ES, WEAPON_VERDICT_REASON_ES, WEAPON_ALT_REASON_ES } from './characters.es.js';
import { RANK_FR, ECHO_SETS_FR } from './echoes.fr.js';
import { MATERIAL_NAME_FR } from './materialData.fr.js';
import { CURRENT_BANNER_TITLES_FR, STANDARD_BANNER_TITLES_FR } from './banners.fr.js';
import { RANK_ES, ECHO_SETS_ES } from './echoes.es.js';
import { MATERIAL_NAME_ES } from './materialData.es.js';
import { CURRENT_BANNER_TITLES_ES, STANDARD_BANNER_TITLES_ES } from './banners.es.js';

export const ROLE_TABLES = { fr: ROLE_FR, es: ROLE_ES };
export const WEAPON_TYPE_TABLES = { fr: WEAPON_TYPE_FR, es: WEAPON_TYPE_ES };
export const STAT_NAME_TABLES = { fr: STAT_NAME_FR, es: STAT_NAME_ES };
export const PV_LABEL_TABLES = { fr: PV_LABEL_FR, es: PV_LABEL_ES };
export const SKILL_TYPE_TABLES = { fr: SKILL_TYPE_FR, es: SKILL_TYPE_ES };
export const ECHO_SETS_TABLES = { fr: ECHO_SETS_FR, es: ECHO_SETS_ES };
export const CHARACTER_TAG_TABLES = { fr: CHARACTER_TAG_FR, es: CHARACTER_TAG_ES };
export const WEAPON_VERDICT_REASON_TABLES = { fr: WEAPON_VERDICT_REASON_FR, es: WEAPON_VERDICT_REASON_ES };
export const WEAPON_ALT_REASON_TABLES = { fr: WEAPON_ALT_REASON_FR, es: WEAPON_ALT_REASON_ES };
export const RANK_TABLES = { fr: RANK_FR, es: RANK_ES };
export const MATERIAL_NAME_TABLES = { fr: MATERIAL_NAME_FR, es: MATERIAL_NAME_ES };
export const CURRENT_BANNER_TITLE_TABLES = { fr: CURRENT_BANNER_TITLES_FR, es: CURRENT_BANNER_TITLES_ES };
export const STANDARD_BANNER_TITLE_TABLES = { fr: STANDARD_BANNER_TITLES_FR, es: STANDARD_BANNER_TITLES_ES };
