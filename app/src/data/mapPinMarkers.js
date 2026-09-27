// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — data/mapPinMarkers.js
// Marker glyphs a player can choose for a personal map pin. White glyphs on a
// transparent 64×64 canvas (sources in app/assets/map-icon-sources/pins/);
// the map draws them on a dark disc. Labels live in locale map.json under
// pins.marker.<id>.
// ═══════════════════════════════════════════════════════════════════════════════

export const MAP_PIN_MARKERS = [
  { id: 'star',     imageUrl: 'map-icons/pins/star.png' },
  { id: 'monster',  imageUrl: 'map-icons/pins/monster.png' },
  { id: 'pickaxe',  imageUrl: 'map-icons/pins/pickaxe.png' },
  { id: 'diamond',  imageUrl: 'map-icons/pins/diamond.png' },
  { id: 'leaves',   imageUrl: 'map-icons/pins/leaves.png' },
  { id: 'question', imageUrl: 'map-icons/pins/question.png' },
];

export const DEFAULT_PIN_MARKER = 'star';

export function getPinMarker(id) {
  return MAP_PIN_MARKERS.find(m => m.id === id) || MAP_PIN_MARKERS[0];
}
