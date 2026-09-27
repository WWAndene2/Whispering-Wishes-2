// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/iconImageCache.js (extracted from MapTab.jsx)
// Module-scoped cache of decoded HTMLImageElements for map icons. Keyed by
// catalog id; one <img> per kind is shared across every placed icon draft.
// Survives tab unmount so re-opening the Map is instant — must stay a
// module-level singleton, not per-instance hook state.
// ═══════════════════════════════════════════════════════════════════════════════

import { getIconCatalogEntry } from '../../data/mapIconCatalog.js';

const MAP_ICON_IMAGES = new Map();

/** Resolved URL of a catalog icon's image (shared by the map canvas and the search list). */
export function getIconImageUrl(kindId) {
  const cat = getIconCatalogEntry(kindId);
  if (!cat) return null;
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  // Encode each path segment defensively.
  const encoded = cat.imageUrl.split('/').map(encodeURIComponent).join('/');
  return (base + encoded).replace(/([^:])\/\//g, '$1/');
}

export function getIconImage(kindId, onReady) {
  const cat = getIconCatalogEntry(kindId);
  if (!cat) return null;
  const hit = MAP_ICON_IMAGES.get(cat.id);
  if (hit) return hit;
  const img = new Image();
  img.decoding = 'async';
  img.src = getIconImageUrl(kindId);
  img.onload = () => onReady && onReady();
  MAP_ICON_IMAGES.set(cat.id, img);
  return img;
}
