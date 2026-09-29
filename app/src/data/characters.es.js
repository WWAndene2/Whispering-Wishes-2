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

/** @type {Record<string, string>} */
export const CHARACTER_TITLE_ES = {
  "Jiyan": "Jinete del viento",
  "Calcharo": "Cazadores fantasma",
  "Encore": "Juego de contar ovejas",
  "Jianxin": "Reflejos purificadores",
  "Lingyang": "Brío gélido",
  "Verina": "Llamada de la naturaleza",
  "Yinlin": "Rayo de la ejecución",
  "Jinhsi": "Renovación del deshielo",
  "Changli": "Llama eterna",
  "Zhezhi": "Pincel encantado",
  "Xiangli Yao": "Tejedor de materia",
  "Shorekeeper": "Crisálida eufónica",
  "Camellya": "Flor sanguina",
  "Carlotta": "Remodelando dimensiones",
  "Roccia": "Escenario en la caja",
  "Phoebe": "Luminiscencia grácil",
  "Brant": "Brújula en llamas",
  "Cantarella": "Mar de sueños",
  "Zani": "Resplandor calcinado",
  "Ciaccona": "Melodías entretejidas",
  "Cartethyia": "Tempestad emplumada",
  "Lupa": "Llama aullante",
  "Phrolova": "Sinfonía del más allá",
  "Augusta": "Éforo de Septimont",
  "Iuno": "Estasis, ciclo, renovación",
  "Galbrena": "Descenso infernal",
  "Qiuyuan": "Paisaje de bambú",
  "Chisa": "Ojo de la revelación",
  "Lynae": "Espectro radiante",
  "Mornye": "Cartografía astral",
  "Luuk Herssen": "Transición de fase",
  "Aemeath": "Lanza estelar guía",
  "Sigrika": "Manifestación del verdadero nombre",
  "Rebecca": "Arsenal de tipo furia",
  "Lucilla": "Palacio de la memoria",
  "Lucy": "Hackeo del xenodominio",
  "Yangyang: Xuanling": "Voces de la pluma azur",
  "Denia": "Burbujas de la nada",
  "Hiyuki": "Diezmo de los futuros",
  "Suisui": "Anfitriona de la armonía",
  "Qingxiao": "Espada del corazón",
  "Jingran": "Arte del qi del inframundo",
  "Aalto": "Golpe de la capa de bruma",
  "Baizhi": "Sanación de You'tan",
  "Chixia": "Llama galante",
  "Danjin": "Sombra escarlata",
  "Yangyang": "Aliento de los vientos",
  "Sanhua": "Vals de nieve",
  "Taoqi": "Flor de tajos",
  "Yuanwu": "Puño del trueno",
  "Mortefi": "Aliento del dragón",
  "Youhu": "Maravillas criogénicas",
  "Lumi": "Refracción caleidoscópica",
  "Buling": "Oído divino",
};

/** @type {Record<string, string>} */
export const CHARACTER_TAG_ES = {
  "New Federation": "Nueva Federación",
  "Spacetrek Collective": "Colectivo Spacetrek",
  "Black Shores": "Costas Negras",
  "Roya Frostlands": "Tierras Heladas de Roya",
  "Roya Tribe": "Tribu de Roya",
  "Troupe of Fools": "Compañía de los Necios",
  "Order of the Deep": "Orden de las Profundidades",
  "Ghost Hounds": "Sabuesos Fantasma",
  "Lollo Logistics": "Lollo Logística",
  "Midnight Rangers": "Guardabosques de Medianoche",
  "Pioneer Association": "Asociación de Pioneros",
  "Jinzhou City Hall": "Ayuntamiento de Jinzhou",
  "Public Security Bureau": "Oficina de Seguridad Pública",
  "Ministry of War": "Ministerio de Guerra",
  "Ministry of Development": "Ministerio de Desarrollo",
  "Yuanwu Boxing Gym": "Gimnasio de Boxeo Yuanwu",
  "Huaxu Academy": "Academia Huaxu",
  "Startorch Academy": "Academia Startorch",
  "Zhaoming Commerce Guild": "Gremio de Comercio de Zhaoming",
  "Tetragon Temple": "Templo del Tetrágono",
  "Liondance Troupe": "Compañía de la Danza del León",
  "Fisalia Family": "Familia Fisalia",
  "Montelli Family": "Familia Montelli",
  "Miko of Flaming Sakura": "Miko del Sakura Llameante",
  "Collaboration Resonators": "Resonadores de colaboración",
  "Abyssomancer": "Abismomante",
  "Unknown": "Desconocido",
  "Redacted": "Censurado",
  "Support and Healer": "Apoyo y sanador",
  "Main Damage Dealer": "Atacante principal",
  "Grouping": "Agrupación",
  "Traction": "Tracción",
  "Stagnation": "Estancamiento",
  "Erosion": "Erosión",
  "Aero Erosion": "Erosión Aero",
  "Energy Regen": "Regen. de energía",
  "Concerto Efficiency": "Eficiencia de Concerto",
  "Heal": "Curación",
  "Self-heal": "Autocuración",
  "Shield": "Escudo",
  "Echo": "Eco",
  "Skill": "Habilidad",
  "Liberation": "Liberación",
  "Outro": "Outro",
  "Basic ATK": "Ataque básico",
  "Heavy ATK": "Ataque pesado",
  "Coordinated ATK": "Ataque coordinado",
  "Coordinated Attack": "Ataque coordinado",
  "Mid-air:Plunging Attack": "Aéreo: ataque en picado",
  "DMG": "Daño",
  "DMG Buff": "Potenciador de daño",
  "DMG Amplification": "Amplificación de daño",
  "DMG Amplify": "Amplificación de daño",
  "All DMG Amp": "Amplificación de todo el daño",
  "ATK Buff": "Potenciador de ATQ",
  "Crit Buff": "Potenciador crítico",
  "Crit Rate Buff": "Potenciador de tasa crítica",
  "Crit DMG Amp": "Amplificación de daño crítico",
  "DEF Shred": "Reducción de DEF",
  "Fusion RES Shred": "Reducción de RES Fusión",
  "Havoc RES Shred": "Reducción de RES Destrucción",
  "Aero Buff": "Potenciador Aero",
  "Aero DMG Buff": "Potenciador de daño Aero",
  "Aero DMG Amplification": "Amplificación de daño Aero",
  "Electro DMG Amplification": "Amplificación de daño Electro",
  "Fusion DMG Amp": "Amplificación de daño Fusión",
  "Fusion DMG Amplification": "Amplificación de daño Fusión",
  "Fusion DMG Buff": "Potenciador de daño Fusión",
  "Glacio DMG Amplification": "Amplificación de daño Glacio",
  "Glacio DMG Buff": "Potenciador de daño Glacio",
  "Havoc DMG Amp": "Amplificación de daño Destrucción",
  "Havoc DMG Amplification": "Amplificación de daño Destrucción",
  "Havoc DMG Amplify": "Amplificación de daño Destrucción",
  "Spectro DMG Amplification": "Amplificación de daño Espectro",
  "Basic ATK Amp": "Amplificación de ataque básico",
  "Basic Attack DMG Amplification": "Amplificación de daño de ataque básico",
  "Basic Attack Damage": "Daño de ataque básico",
  "Heavy ATK Buff": "Potenciador de ataque pesado",
  "Heavy ATK DMG Buff": "Potenciador de daño de ataque pesado",
  "Heavy Attack DMG Amplification": "Amplificación de daño de ataque pesado",
  "Heavy Attack Damage": "Daño de ataque pesado",
  "Coordinated ATK Amp": "Amplificación de ataque coordinado",
  "Coordinated Attack DMG Amplification": "Amplificación de daño de ataque coordinado",
  "Echo DMG Buff": "Potenciador de daño de Eco",
  "Echo Skill DMG Amplification": "Amplificación de daño de habilidad de Eco",
  "Echo Skill DMG Buff": "Potenciador de daño de habilidad de Eco",
  "Echo Skill Damage": "Daño de habilidad de Eco",
  "Skill DMG Amp": "Amplificación de daño de habilidad",
  "Skill DMG Buff": "Potenciador de daño de habilidad",
  "Resonance Liberation DMG Amplification": "Amplificación de daño de liberación de resonancia",
  "Resonance Liberation Damage": "Daño de liberación de resonancia",
  "Resonance Liberation Regeneration": "Regeneración de liberación de resonancia",
  "Resonance Skill DMG Amplification": "Amplificación de daño de habilidad de resonancia",
  "Resonance Skill Damage": "Daño de habilidad de resonancia",
  "Erosion Cap Buff": "Potenciador del límite de Erosión",
  "Interruption Resistance Boost": "Aumento de resistencia a interrupciones",
  "Vibration Strength Reduction": "Reducción de la Fuerza de vibración",
  "Off-Tune Buildup Efficiency": "Eficiencia de acumulación de Off-Tune",
  "Tune Break DMG Buff": "Potenciador de daño de Tune Break",
};

// Character-agnostic skill names that recur verbatim across many characters' SKILL_MULTIPLIERS rows
// and CHARACTER_ROTATIONS steps. Bespoke per-character skill names (e.g. "Lone Lance") have no
// confirmed Spanish term and stay in English; only the generic words around them are translated.
/** @type {Record<string, string>} */
export const GENERIC_SKILL_NAME_ES = {
  'Attack': 'Ataque',
  'Plunging Attack': 'Ataque en picado',
  'Dodge Counter': 'Contraataque de esquiva',
  'Mid-air Attack': 'Ataque aéreo',
  'Standard': 'Estándar',
  'Use Echo': 'Usar Eco',
};

// Action-type half of 'Action - Form/Stance Name' skill names; the bespoke suffix stays in English.
const ACTION_PREFIX_ES = {
  'Basic Attack': 'Ataque básico',
  'Heavy Attack': 'Ataque pesado',
  'Mid-air Attack': 'Ataque aéreo',
  'Mid-air Plunging Attack': 'Ataque aéreo en picado',
  'Dodge Counter': 'Contraataque de esquiva',
  'Resonance Skill': 'Habilidad de resonancia',
  'Attack': 'Ataque',
  'Standard': 'Estándar',
};

/**
 * Second-tier fallback for a skill name: bare 'Stage N', 'Action - Form Name' and
 * '<Form Name> Stage N'. Returns null when no pattern matches, so callers keep the English name.
 * @param {string} skillName @returns {string|null}
 */
export function getGenericSkillNameEs(skillName) {
  const stageMatch = /^Stage (\d+)(-\d+)?$/.exec(skillName);
  if (stageMatch) return `Fase ${stageMatch[1]}${stageMatch[2] || ''}`;
  const dash = skillName.indexOf(' - ');
  if (dash > 0) {
    const prefix = skillName.slice(0, dash);
    if (ACTION_PREFIX_ES[prefix]) return `${ACTION_PREFIX_ES[prefix]} - ${skillName.slice(dash + 3)}`;
  }
  const trailingStage = /^(.+) Stage (\d+)(-\d+)?$/.exec(skillName);
  if (trailingStage) {
    const prefix = ACTION_PREFIX_ES[trailingStage[1]] || GENERIC_SKILL_NAME_ES[trailingStage[1]] || trailingStage[1];
    return `${prefix} Fase ${trailingStage[2]}${trailingStage[3] || ''}`;
  }
  return null;
}

/** @type {Record<string, string>} */
export const GENERIC_SKILL_DESC_ES = {
  'Swap-in opener strike.': 'Golpe inicial al entrar en campo.',
  'Considered Heavy Attack DMG.': 'Se considera daño de ataque pesado.',
  'Considered Heavy Attack DMG per its own kit text.': 'Se considera daño de ataque pesado.',
  'Considered Echo Skill DMG.': 'Se considera daño de habilidad de Eco.',
  'Considered Resonance Liberation DMG.': 'Se considera daño de liberación de resonancia.',
  'Confirmed unused in her real rotation.': 'Confirmada como no usada en su rotación real.',
  'Confirmed unused in his real rotation.': 'Confirmada como no usada en su rotación real.',
  'Buffs the incoming Resonator.': 'Potencia al Resonador entrante.',
  'Basic ATK after a successful Dodge.': 'Ataque básico tras una esquiva exitosa.',
  'Charged aimed shot.': 'Disparo apuntado cargado.',
  'Consumes STA for consecutive mid-air shots.': 'Consume resistencia en disparos aéreos consecutivos.',
  'Plunging attack, consumes STA.': 'Ataque en picado, consume resistencia.',
  'Consumes STA; Mid-air Plunging Attack.': 'Consume resistencia; ataque aéreo en picado.',
};

// Bare English damage-category terms that recur inside bespoke descriptions. Longer phrases first so
// they match before their substrings. Status-effect names (Frazzle, Chafe, Bane…) stay in English.
const PHRASE_ES = [
  ['Resonance Liberation DMG', 'daño de liberación de resonancia'],
  ['Resonance Skill DMG', 'daño de habilidad de resonancia'],
  ['Echo Skill DMG', 'daño de habilidad de Eco'],
  ['All DMG Amp', 'amplificación de todo el daño'],
  ['All-Attribute DMG Amp', 'amplificación de todo el daño'],
  ['Heavy Attack DMG', 'daño de ataque pesado'],
  ['Basic ATK DMG', 'daño de ataque básico'],
  ['Basic Attack DMG', 'daño de ataque básico'],
  ['Mid-air Attack', 'ataque aéreo'],
  ['Heavy Attack', 'ataque pesado'],
  ['Basic Attack', 'ataque básico'],
  ['Basic ATK', 'ataque básico'],
  ['Dodge Counter', 'contraataque de esquiva'],
  ['confirmed unused in her real rotation', 'confirmada como no usada en su rotación real'],
  ['confirmed unused in his real rotation', 'confirmada como no usada en su rotación real'],
];

/**
 * Partial translation of a skill description: exact generic sentences first, then the bare
 * damage-category terms of PHRASE_ES; the rest of the English prose is left as-is.
 * @param {string} desc @returns {string}
 */
export function applyGenericDescPhrasesEs(desc) {
  if (GENERIC_SKILL_DESC_ES[desc]) return GENERIC_SKILL_DESC_ES[desc];
  let out = desc;
  for (const [en, es] of PHRASE_ES) out = out.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), es);
  return out;
}
