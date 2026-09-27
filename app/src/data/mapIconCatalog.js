// Catalog of placeable map icons. Each entry is an icon "kind" — the
// editor's Map icons section lets admins pick one of these per placement.
// Adding a new icon = drop a PNG under `app/public/map-icons/` and add an
// entry here.
//
// Entry shape:
//   id:          stable key stored on icon drafts (iconDraft.kind)
//   name:        UI label in the editor dropdown
//   category:    default top-level filter group surfaced in the Hexagon
//                popover; user can override per-draft
//   subcategory: default second-level filter group under the category
//                (e.g. "Resonance › Nexus" vs "Resonance › Beacon");
//                user can override per-draft
//   group:       optional middle level between category and subcategory in
//                the filter tree (e.g. "Collectible › Chest › Supply Chest"),
//                so several chest kinds can be shown/hidden together
//   imageUrl:    relative path under the app's BASE_URL
//   size:        natural size on disk in px (square)
//   tags:        optional extra search words (see the Enemies section below)

import { ECHO_DATA } from './echoes.js';

export const MAP_ICON_CATALOG = [
  {
    id: 'resonance-nexus',
    name: 'Nexus',
    category: 'Resonance',
    subcategory: 'Nexus',
    imageUrl: 'map-icons/Resonance-Nexus.png',
    size: 128,
  },
  {
    id: 'resonance-beacon',
    name: 'Resonance Beacon',
    category: 'Resonance',
    subcategory: 'Beacon',
    imageUrl: 'map-icons/Resonance-beacon.png',
    size: 128,
  },
  {
    id: 'treasure-spot',
    name: 'Treasure Spot',
    category: 'Collectible',
    subcategory: 'Treasure Spot',
    imageUrl: 'map-icons/Treasure-Spot.png',
    size: 128,
  },
  {
    id: 'sonance-casket',
    name: 'Sonance Casket',
    category: 'Collectible',
    subcategory: 'Sonance Casket',
    imageUrl: 'map-icons/Sonance-Casket.png',
    size: 256,
  },
  {
    id: 'supply-chest',
    name: 'Supply Chest',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Supply Chest',
    imageUrl: 'map-icons/Supply-Chest.png',
    size: 128,
  },
];

// ── Enemies ────────────────────────────────────────────────────────────────
// Filter tree: Enemy › <class> (Calamity / Overlord / Elite / Common). Class,
// element and Sonata sets are read from ECHO_DATA (data/echoes.js) — the same
// source the rest of the app uses — so they are never re-typed here; the
// second column must match its ECHO_DATA key exactly. Images live in
// map-icons/enemy/. The map shows the ENEMY's name: an Echo name's
// "Reminiscence: " prefix qualifies the Echo you obtain, not the enemy you
// fight, so it is dropped for display ("Reminiscence: Fenrico" → "Fenrico").
// `tags` feed the map search (class, element, Sonata sets, "boss").
const ENEMY_ICONS = [
  ['calamity-effigy', 'Calamity Effigy'],
  ['bell-borne-geochelone', 'Bell-Borne Geochelone'],
  ['crownless', 'Crownless'],
  ['dragon-of-dirge', 'Dragon of Dirge'],
  ['dreamless', 'Dreamless'],
  ['fallacy-of-no-return', 'Fallacy of No Return'],
  ['feilian-beringal', 'Feilian Beringal'],
  ['fenrico', 'Reminiscence: Fenrico'],
  ['fleurdelys', 'Reminiscence: Fleurdelys'],
  ['hecate', 'Hecate'],
  ['hyvatia', 'Hyvatia'],
  ['impermanence-heron', 'Impermanence Heron'],
  ['inferno-rider', 'Inferno Rider'],
  ['jue', 'Jué'],
  ['lampylumen-myriad', 'Lampylumen Myriad'],
  ['lorelei', 'Lorelei'],
  ['mech-abomination', 'Mech Abomination'],
  ['mourning-aix', 'Mourning Aix'],
  ['myriad-snare-rustfire-chassis', 'Myriad Snare: Rustfire Chassis'],
  ['nameless-explorer', 'Nameless Explorer'],
  ['nightmare-inferno-rider', 'Nightmare: Inferno Rider'],
  ['nightmare-feilian-beringal', 'Nightmare: Feilian Beringal'],
  ['nightmare-hecate', 'Nightmare: Hecate'],
  ['nightmare-impermanence-heron', 'Nightmare: Impermanence Heron'],
  ['nightmare-kelpie', 'Nightmare: Kelpie'],
  ['nightmare-mourning-aix', 'Nightmare: Mourning Aix'],
  ['nightmare-thundering-mephis', 'Nightmare: Thundering Mephis'],
  ['nightmare-tempest-mephis', 'Nightmare: Tempest Mephis'],
  ['reactor-husk', 'Reactor Husk'],
  ['sentry-construct', 'Sentry Construct'],
  ['sigillum', 'Sigillum'],
  ['tempest-mephis', 'Tempest Mephis'],
  ['the-false-sovereign', 'The False Sovereign'],
  ['threnodian-leviathan', 'Reminiscence: Threnodian - Leviathan'],
  ['thundering-mephis', 'Thundering Mephis'],
  ['thousand-puppet-pavilion', 'Thousand-Puppet Pavilion'],
  // Shown on the map as "Seed of Illusory Origin" — it is also Denia, searchable as such.
  ['seed-of-illusory-origin', 'Reminiscence: Denia', { name: 'Seed of Illusory Origin', tags: ['Denia'] }],
  ['nightmare-adam-smasher', 'Reminiscence - Nightmare: Adam Smasher', { name: 'Nightmare: Adam Smasher' }],
  ['threnodian-voidborne-construct', 'Reminiscence: Threnodian - Voidborne Construct'],
  ['lady-of-the-sea', 'Lady of the Sea'],
  ['nightmare-crownless', 'Nightmare: Crownless'],
  ['nightmare-lampylumen-myriad', 'Nightmare: Lampylumen Myriad'],
  // Arsinosa is the Lioness of Glory's own name — searchable as an extra tag.
  ['lioness-of-glory', 'Lioness of Glory', { tags: ['Arsinosa'] }],
];

// Enemies with no Echo in ECHO_DATA: class (and element when known) given by
// hand, per the project owner.
const ENEMY_ICONS_MANUAL = [
  { slug: 'scar-aberrant-nightmare', name: 'Scar: Aberrant Nightmare', rank: 'Calamity', element: 'Havoc' },
];

const ENEMY_CLASS_ORDER = ['Calamity', 'Overlord', 'Elite', 'Common'];

for (const [slug, echoName, extra] of ENEMY_ICONS) {
  const echo = ECHO_DATA[echoName];
  if (!echo) throw new Error(`mapIconCatalog: no ECHO_DATA entry named "${echoName}"`);
  MAP_ICON_CATALOG.push({
    id: `enemy-${slug}`,
    name: extra?.name || echoName.replace(/^Reminiscence:\s*/, ''),
    echoName,
    category: 'Enemy',
    subcategory: echo.rank,
    imageUrl: `map-icons/enemy/${slug}.png`,
    size: 128,
    tags: ['boss', 'enemy', echo.rank, echo.element, ...(echo.sets || []), ...(extra?.tags || [])].filter(Boolean),
  });
}
for (const { slug, name, rank, element } of ENEMY_ICONS_MANUAL) {
  MAP_ICON_CATALOG.push({
    id: `enemy-${slug}`,
    name,
    category: 'Enemy',
    subcategory: rank,
    imageUrl: `map-icons/enemy/${slug}.png`,
    size: 128,
    tags: ['boss', 'enemy', rank, element].filter(Boolean),
  });
}

export { ENEMY_CLASS_ORDER };

export function getIconCatalogEntry(kindId) {
  return MAP_ICON_CATALOG.find((c) => c.id === kindId) || null;
}
