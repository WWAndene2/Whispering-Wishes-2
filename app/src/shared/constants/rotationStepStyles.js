// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — shared/constants/rotationStepStyles.js
// Color + label per rotation step type, shared by the Teams tab (RotationTimeline,
// RotationGuideCard) and the character detail modal.
// ═══════════════════════════════════════════════════════════════════════════════

// Color + full label per CHARACTER_ROTATIONS step type — shared by the Rotation Guide's skill-sequence
// chips, just the category name and color (Intro/Skill/Liberation/Heavy/Basic/Forte/Echo/Outro spelled
// out, no 2-3 letter codes to decode). The actual how-to-execute instructions live in each step's own
// `note` field in CHARACTER_ROTATIONS (character- and step-specific — a generic "what a Forte Circuit
// is" blurb here can't tell you HOW to charge THIS character's Forte, only the real per-character combat
// text can), so this table intentionally carries no generic description text anymore.
import { pickTable } from '../../utils/i18n.js';
export const STEP_TYPE_STYLE = {
  Intro: { label: 'Intro Skill', cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  Skill: { label: 'Resonance Skill', cls: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  Liberation: { label: 'Resonance Liberation', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  Ultimate: { label: 'Resonance Liberation (Ultimate)', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  'Heavy ATK': { label: 'Heavy Attack', cls: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  'Basic ATK': { label: 'Basic Attack', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
  Forte: { label: 'Forte Circuit', cls: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  'Mid-air': { label: 'Mid-air Attack', cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  'Mid-air ATK': { label: 'Mid-air Attack', cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  Echo: { label: 'Echo Skill', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  Outro: { label: 'Outro Skill', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  Step: { label: 'Action', cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
};
// French labels for the same step types — display-only, keyed the same as STEP_TYPE_STYLE.
// STEP_TYPE_STYLE's English keys (Intro/Skill/Liberation/etc.) stay untouched since they're
// matched against CHARACTER_ROTATIONS'/SKILL_MULTIPLIERS' raw `type` strings elsewhere.
export const STEP_TYPE_LABEL_FR = {
  Intro: "Compétence d'Intro",
  Skill: 'Compétence de Résonance',
  Liberation: 'Libération de Résonance',
  Ultimate: 'Libération de Résonance (Ultime)',
  'Heavy ATK': 'Attaque Lourde',
  'Heavy Attack': 'Attaque Lourde',
  'Basic ATK': 'Attaque Normale',
  Forte: 'Circuit de Forte',
  'Mid-air': 'Attaque Aérienne',
  'Mid-air ATK': 'Attaque Aérienne',
  'Mid-air Attack': 'Attaque Aérienne',
  'Dodge Counter': "Contre-attaque d'Esquive",
  Echo: "Compétence d'Écho",
  Outro: "Compétence d'Outro",
  Step: 'Action',
};
/** @param {string} type @param {string} [locale] */
export const stepStyle = (type, locale) => {
  const base = STEP_TYPE_STYLE[type] || { label: type || 'Action', cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
  const label = pickTable({ fr: STEP_TYPE_LABEL_FR }, locale)[type];
  if (label) return { ...base, label };
  return base;
};
