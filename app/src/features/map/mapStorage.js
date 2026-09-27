// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapStorage.js (extracted from MapTab.jsx)
// localStorage persistence for zone drafts, icon drafts and freehand paint strokes.
// ═══════════════════════════════════════════════════════════════════════════════

import { DEFAULT_ZONE_DRAFTS, DEFAULT_PAINT_STROKES, DEFAULT_ICON_DRAFTS, ICON_SEED_ADDITIONS, ICON_SEED_VERSION } from '../../data/mapDefaults.js';

export const DRAFTS_KEY = 'ww-zone-drafts';
export const PAINT_KEY = 'ww-paint-strokes';
export const ICON_DRAFTS_KEY = 'ww-icon-drafts';
export const ICON_SEED_VERSION_KEY = 'ww-icon-seed-version';

export function loadDrafts() {
  if (typeof localStorage === 'undefined') return DEFAULT_ZONE_DRAFTS;
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (raw === null) return DEFAULT_ZONE_DRAFTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ZONE_DRAFTS;
  } catch { return DEFAULT_ZONE_DRAFTS; }
}
export function saveDrafts(list) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); } catch {}
}
export function loadPaintStrokes() {
  if (typeof localStorage === 'undefined') return DEFAULT_PAINT_STROKES;
  try {
    const raw = localStorage.getItem(PAINT_KEY);
    if (raw === null) return DEFAULT_PAINT_STROKES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PAINT_STROKES;
  } catch { return DEFAULT_PAINT_STROKES; }
}
export function savePaintStrokes(list) {
  try { localStorage.setItem(PAINT_KEY, JSON.stringify(list)); } catch {}
}

/**
 * Adds to a player's saved icons the seed icons introduced after their seed
 * version. Only ids listed in ICON_SEED_ADDITIONS for a newer version are
 * added, and only if the player doesn't already have that id — so edits and
 * deletions of older icons are never undone. A missing version means the
 * player predates versioning (version 1). Pure: returns { icons, added }.
 */
export function mergeIconSeed(saved, fromVersion, seed = DEFAULT_ICON_DRAFTS, additions = ICON_SEED_ADDITIONS, toVersion = ICON_SEED_VERSION) {
  const have = new Set(saved.map(ic => ic.id));
  const byId = new Map(seed.map(ic => [ic.id, ic]));
  const add = [];
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    for (const id of additions[v] || []) {
      if (!have.has(id) && byId.has(id)) { add.push(byId.get(id)); have.add(id); }
    }
  }
  return { icons: add.length ? [...saved, ...add] : saved, added: add.length };
}

/** Loads the icon drafts (seed for a new player), merging in newer seed icons. */
export function loadIconDrafts() {
  if (typeof localStorage === 'undefined') return DEFAULT_ICON_DRAFTS;
  try {
    const raw = localStorage.getItem(ICON_DRAFTS_KEY);
    const parsed = raw === null ? null : JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(ICON_SEED_VERSION_KEY, String(ICON_SEED_VERSION));
      return DEFAULT_ICON_DRAFTS;
    }
    const from = Number(localStorage.getItem(ICON_SEED_VERSION_KEY)) || 1;
    if (from >= ICON_SEED_VERSION) return parsed;
    const { icons, added } = mergeIconSeed(parsed, from);
    if (added) localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(icons));
    localStorage.setItem(ICON_SEED_VERSION_KEY, String(ICON_SEED_VERSION));
    return icons;
  } catch { return DEFAULT_ICON_DRAFTS; }
}
