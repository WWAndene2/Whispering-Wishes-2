// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapStorage.js (extracted from MapTab.jsx)
// localStorage persistence for zone drafts, icon drafts and freehand paint strokes.
// ═══════════════════════════════════════════════════════════════════════════════

import { DEFAULT_ZONE_DRAFTS, DEFAULT_PAINT_STROKES, DEFAULT_ICON_DRAFTS, ICON_SEED_ADDITIONS, ICON_SEED_CHANGES, ICON_SEED_VERSION } from '../../data/mapDefaults.js';

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
 * Brings a player's saved icons up to the current seed version: adds the
 * icons each newer version introduced (ICON_SEED_ADDITIONS) that the player
 * doesn't have, and applies each newer version's field changes
 * (ICON_SEED_CHANGES: [id, field, from, to]) only where the player's icon
 * still holds `from` — edits and deletions the player made are never undone.
 * A missing version means the player predates versioning (version 1).
 * Pure: returns { icons, added, changed }.
 */
export function mergeIconSeed(saved, fromVersion, seed = DEFAULT_ICON_DRAFTS, additions = ICON_SEED_ADDITIONS, toVersion = ICON_SEED_VERSION, changes = ICON_SEED_CHANGES) {
  const byId = new Map(seed.map(ic => [ic.id, ic]));
  let icons = saved;
  let added = 0;
  let changed = 0;
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const have = new Set(icons.map(ic => ic.id));
    const add = (additions[v] || []).filter(id => !have.has(id) && byId.has(id)).map(id => byId.get(id));
    if (add.length) { icons = [...icons, ...add]; added += add.length; }
    for (const [id, field, from, to] of changes[v] || []) {
      const i = icons.findIndex(ic => ic.id === id);
      if (i === -1 || (icons[i][field] ?? null) !== from) continue;
      if (icons === saved) icons = [...saved];
      icons[i] = { ...icons[i], [field]: to };
      changed++;
    }
  }
  return { icons, added, changed };
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
    const { icons, added, changed } = mergeIconSeed(parsed, from);
    if (added || changed) localStorage.setItem(ICON_DRAFTS_KEY, JSON.stringify(icons));
    localStorage.setItem(ICON_SEED_VERSION_KEY, String(ICON_SEED_VERSION));
    return icons;
  } catch { return DEFAULT_ICON_DRAFTS; }
}
