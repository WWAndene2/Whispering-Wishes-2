// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — data/tierScores.js
// [DATA] Tower of Adversity tier label (CHARACTER_DATA[x].tier.toa) → numeric score.
// Used by team-composition scoring (features/teams/calcEngine.js) and the Planner's
// pull-priority ordering (features/planner/PlannerTab.jsx).
// ═══════════════════════════════════════════════════════════════════════════════

export const TIER_SCORES = { 'T0': 40, 'T0.5': 35, 'T1': 28, 'T1.5': 22, 'T2': 16, 'T3': 8, 'T4': 0 };
