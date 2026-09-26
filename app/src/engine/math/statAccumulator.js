// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — engine/math/statAccumulator.js
// [MATH] The per-tier stat accumulator (createStats) and the single place a buff is
// gated and routed into it (applyBuff + universalStatApplies). Moved here from
// features/teams/calcEngine.js so engine/resolver/* no longer imports upward into a
// feature (CLAUDE.md §4.4); calcEngine.js re-exports these names unchanged.
// ═══════════════════════════════════════════════════════════════════════════════

import { BASE_CRIT_RATE, BASE_CRIT_DMG } from './damageFormula.js';

// ── Stat accumulator: replaces 50+ loose variables per tier ──
export function createStats() {
  return {
    atkPct: 0, cr: BASE_CRIT_RATE, cd: BASE_CRIT_DMG,
    elemDmg: 0, skillDmg: 0, basicDmg: 0, heavyDmg: 0,
    libDmg: 0, echoDmg: 0, coordDmg: 0, outroDmg: 0, frazzleDmg: 0,
    amplify: 0,
    defShred: 0, resShred: 0, defIgnore: 0,
    // hpPct/defPct (added 2026-09-05, engine-readiness pass): real kit buffs to Max HP%/DEF% —
    // e.g. Baizhi's Forte "Max HP+12% for 10s" — previously had no stat case at all, silently
    // falling through applyBuff()'s switch to a no-op. healBonusPct: a %-increase to a heal-kind
    // block's own computed amount (resolveHealComposed.js), the heal-side equivalent of skillDmg/
    // basicDmg/etc. for damage.
    hpPct: 0, defPct: 0, healBonusPct: 0,
    // totalMult (added 2026-09-02, the engine-merge history (git log) totalMult architecture-bug fix): a flat
    // fallback multiplier for real kit bonuses that don't map to a dedicated category stat — was
    // previously accepted by `applyBuff()`'s switch as a real case in NEITHER `resolveHitComposedDps.js`
    // nor `resolveHitComposedTeamDps.js` (both explicitly skipped it, "no accumulator here yet"), and
    // even where `resolveSimulatedTeamRotation.js` DID accumulate it (its own separate
    // `totalMultBonus` return value), `calcTeamStats.js`'s only caller for a fully-converted team
    // discarded that return field entirely — so a `stat:'totalMult'` effect (38 blocks across 24
    // character files at the time this was found) contributed ZERO to any actually-computed DPS
    // number in the app, in every real code path, despite being a real sourced kit bonus. See
    // the engine-merge history (git log)'s own writeup for the full investigation.
    totalMult: 0,
  };
}

// Which dmgFocus tag gates each type-specific stat — same mapping routeTypeBonuses/scoreTeamComposition
// already use, kept here too so applyBuff can enforce it itself instead of requiring every call site to
// remember to check first (that's exactly how calcTeamStats.js ended up with 8 near-identical chains
// that individually needed the same amplify/allDmg/elemDmg gating fix applied by hand).
const TYPE_FOCUS_MAP = { basicDmg: 'Basic ATK', heavyDmg: 'Heavy ATK', libDmg: 'Liberation', echoDmg: 'Echo', coordDmg: 'Coordinated ATK' };

// ── Apply buff to stat accumulator (replaces 8 identical if-else chains) ──
// options.condition + options.dpsFocus/dpsElLower let this enforce the exact same gates
// scoreTeamComposition uses (type-focus match for basicDmg/heavyDmg/libDmg/echoDmg/coordDmg; strict
// element match for elemDmg; off-element-mismatch-only for amplify/offTune/allDmg) in ONE place
// instead of at every call site. Passing neither dpsFocus nor dpsElLower skips gating entirely
// (e.g. a character's own selfBuffs, which are inherently about their own damage and need no
// target-matching).
// 'deepen' was merged into 'amplify' (2026-09-05, direct user correction) — the same real buff
// under an older/alternate term, not a distinct third multiplicative layer; see
// engine/math/damageFormula.js's calcDmgBonus for the merged formula.
export function applyBuff(stats, buff, value, options = {}) {
  const { isAmplify = false, condition, dpsFocus, dpsElLower, dpsName } = options;
  if (dpsFocus && TYPE_FOCUS_MAP[buff] && !dpsFocus.includes(TYPE_FOCUS_MAP[buff])) return;
  if (dpsElLower != null) {
    if (buff === 'elemDmg') {
      const cond = (condition || '').toLowerCase();
      if (cond && !cond.includes(dpsElLower) && !cond.includes('all')) return;
    } else if (buff === 'amplify' || buff === 'offTune' || buff === 'allDmg') {
      if (!universalStatApplies(condition, dpsElLower, dpsName)) return;
    }
  }
  const target = isAmplify ? 'amplify' : null;
  switch (buff) {
    case 'atkPct':    stats.atkPct += value; break;
    case 'hpPct':     stats.hpPct += value; break;
    case 'defPct':    stats.defPct += value; break;
    case 'healBonusPct': stats.healBonusPct += value; break;
    case 'allDmg':    stats[target || 'elemDmg'] += value; break;
    case 'elemDmg':   stats[target || 'elemDmg'] += value; break;
    case 'amplify':   stats.amplify += value; break;
    case 'offTune':   stats.amplify += value; break;
    case 'basicDmg':  stats[target || 'basicDmg'] += value; break;
    case 'heavyDmg':  stats[target || 'heavyDmg'] += value; break;
    case 'libDmg':    stats[target || 'libDmg'] += value; break;
    case 'echoDmg':   stats[target || 'echoDmg'] += value; break;
    case 'skillDmg':  stats[target || 'skillDmg'] += value; break;
    case 'coordDmg':  stats[target || 'coordDmg'] += value; break;
    case 'outroDmg':  stats[target || 'outroDmg'] += value; break;
    // frazzleDmg added (documented-gaps sweep): Spectro Frazzle DMG — a status-flag category some
    // hits carry ALONGSIDE their normal category (e.g. Zani's Heavy Slash combo is "counted as BOTH
    // Heavy Attack AND Spectro Frazzle DMG"), not a mutually-exclusive move-type slot like the others
    // above. See resolveHitComposedDps.js's own damage.secondaryCategory doc for how a hit reads
    // bonuses from two categories at once.
    case 'frazzleDmg': stats[target || 'frazzleDmg'] += value; break;
    case 'totalMult': stats.totalMult += value; break;
    case 'critRate':  stats.cr += value; break;
    case 'critDmg':   stats.cd += value; break;
    case 'resShred':  stats.resShred += value; break;
    case 'defShred':  stats.defShred += value; break;
    case 'defIgnore': stats.defIgnore += value; break;
    default: break;
  }
}

// An amplify/offTune/allDmg buff or debuff is universal by convention UNLESS its free-text `condition`
// explicitly names a DIFFERENT element than the target's own (e.g. Ciaccona's outro: "Aero Erosion DMG
// Amp only"; Phoebe's outro: "Spectro Frazzle DMG Amp (Confession)") — a condition naming no element at
// all (the common case: pure activation-trigger text) stays universal. Shared by scoreTeamComposition
// (recommendation ranking) and calcTeamStats.js (the real damage calculator) so this rule can only ever
// be defined in one place — calcTeamStats.js previously summed every amplify contribution completely
// unconditionally with no equivalent check at all, so Ciaccona/Phoebe-style element-locked amplify amps
// were silently applied in full to the actual displayed DPS number for ANY paired main/sub DPS,
// regardless of element match.
const ELEMENT_NAMES = ['fusion', 'spectro', 'aero', 'glacio', 'electro', 'havoc'];
// An amplify buff can also be locked to a specific DAMAGE MECHANIC rather than (or in addition to) an
// element — e.g. Phoebe's outro is "Spectro Frazzle DMG Amp", which only amplifies Frazzle-type
// damage, not a Spectro DPS's general output. Found via a real recommendation audit (Jinhsi+Zhezhi):
// the buff's condition mentions "spectro" (Jinhsi's own element), so the element-only check above let
// it through in full for Jinhsi — who neither deals nor scales off Frazzle at all (her own `desc`'s
// dmgFocus is Skill/Liberation burst damage) — inflating her score 486.2 vs. her real curated partner
// Shorekeeper's 314.5. Phoebe's own kit description says outright she's "built specifically to
// empower Zani, her only current Frazzle-DPS partner" — Zani's Heavy Slash combo is explicitly
// "flagged as both Heavy Attack and Spectro Frazzle DMG" per her own `desc`, i.e. her own hits are
// computed under the Frazzle category, unlike every other character (whose damage a Frazzle DMG Amp
// buff does nothing for). Ciaccona's outro ("Aero Erosion DMG Amp only") has the identical shape for
// Erosion — kept here as an empty allow-list until a character whose own damage is documented as
// Erosion-flagged the same way Zani's is for Frazzle exists (Ciaccona's own outro buffs "the incoming
// Resonator", not herself, and no current kit text says any character's own hits are Erosion-typed).
// Deliberately a small, explicit, data-driven list — not a heuristic guess — so it only ever rejects
// what's actually confirmed, and extends the same way the last two audits' fixes did (grouped mode
// buffs, element-gated elemDmg) instead of another one-off hardcode.
const MECHANIC_DAMAGE_APPLIERS = { frazzle: ['Zani'], erosion: [] };

export function universalStatApplies(condition, targetElementLower, targetName) {
  const cond = (condition || '').toLowerCase();
  if (!cond) return true;
  for (const [mechanic, appliers] of Object.entries(MECHANIC_DAMAGE_APPLIERS)) {
    if (cond.includes(mechanic) && !appliers.includes(targetName)) return false;
  }
  const mentioned = ELEMENT_NAMES.filter(el => cond.includes(el));
  if (mentioned.length === 0) return true; // no element named — a genuine universal/trigger condition
  return mentioned.includes(targetElementLower);
}
