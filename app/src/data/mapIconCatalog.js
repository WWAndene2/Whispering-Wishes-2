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
    group: 'Chest',
    subcategory: 'Treasure Spot',
    imageUrl: 'map-icons/Treasure-Spot.png',
    size: 128,
  },
  {
    id: 'sonance-casket',
    name: 'Sonance Casket',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Sonance Casket',
    imageUrl: 'map-icons/Sonance-Casket.png',
    size: 256,
  },
  {
    id: 'sonance-casket-ragunna',
    name: 'Sonance Casket: Ragunna',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Sonance Casket: Ragunna',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-3.png) by
    // colour-to-alpha against black, so the inner triangle is see-through as
    // in the game; the in-game glow and the neighbouring label are removed;
    // 65% of the canvas height.
    imageUrl: 'map-icons/Sonance-Casket-Ragunna.png',
    size: 128,
  },
  {
    id: 'soliskin',
    name: 'Soliskin',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Soliskin',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-5.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Soliskin.png',
    size: 128,
  },
  {
    id: 'viewpoint',
    name: 'Viewpoint',
    category: 'Point of Interest',
    subcategory: 'Viewpoint',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-2.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Viewpoint.png',
    size: 128,
  },
  {
    id: 'melody-orchestration',
    name: 'Melody Orchestration',
    category: 'Point of Interest',
    group: 'Puzzle',
    subcategory: 'Melody Orchestration',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-4.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Melody-Orchestration.png',
    size: 128,
  },
  {
    id: 'pipe-maintenance',
    name: 'Pipe Maintenance',
    category: 'Point of Interest',
    group: 'Puzzle',
    subcategory: 'Pipe Maintenance',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-4.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Pipe-Maintenance.png',
    size: 128,
  },
  {
    id: 'void-storm-zone',
    name: 'Void Storm Zone',
    category: 'Point of Interest',
    group: 'Challenge',
    subcategory: 'Void Storm Zone',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-5.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Void-Storm-Zone.png',
    size: 128,
  },
  {
    id: 'blobfly',
    name: 'Blobfly',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Blobfly',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-2.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Blobfly.png',
    size: 128,
  },
  {
    id: 'windchimer',
    name: 'Windchimer',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Windchimer',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture.png): outer
    // background removed, colours untouched; 65% of the canvas height, in
    // line with the other Trinkets (~60%).
    imageUrl: 'map-icons/Windchimer.png',
    size: 128,
  },
  {
    id: 'frostbug',
    name: 'Frostbug',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Frostbug',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture.png): outer
    // background removed, colours untouched; 65% of the canvas height, in
    // line with the other Trinkets (~60%).
    imageUrl: 'map-icons/Frostbug.png',
    size: 128,
  },
  {
    id: 'tape-of-last-words',
    name: 'Tape of Last Words',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Tape of Last Words',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-5.png): outer
    // background removed, colours untouched; 65% of the canvas height
    // (and of its width: the tape is a wide shape).
    imageUrl: 'map-icons/Tape-Of-Last-Words.png',
    size: 128,
  },
  {
    id: 'unclaimed-rafter-kites',
    name: 'Unclaimed Rafter Kites',
    category: 'Collectible',
    group: 'Trinkets',
    subcategory: 'Unclaimed Rafter Kites',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-6.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Unclaimed-Rafter-Kites.png',
    size: 128,
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
  {
    id: 'tidal-heritage-blue',
    name: 'Tidal Heritage (Blue)',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Tidal Heritage',
    // In-game icon (assets/map-icon-sources/tidal-heritage-blue.png) with
    // its gradient grey background removed row by row (colour-to-alpha), glow
    // kept; the solid star is 65% of the canvas height.
    imageUrl: 'map-icons/Tidal-Heritage-Blue.png',
    size: 128,
  },
  {
    id: 'tidal-heritage-purple',
    name: 'Tidal Heritage (Purple)',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Tidal Heritage',
    // In-game icon (assets/map-icon-sources/tidal-heritage-purple.png) with
    // its gradient grey background removed row by row (colour-to-alpha), glow
    // kept; the solid star is 65% of the canvas height.
    imageUrl: 'map-icons/Tidal-Heritage-Purple.png',
    size: 128,
  },
  {
    id: 'tidal-heritage-gold',
    name: 'Tidal Heritage (Gold)',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Tidal Heritage',
    // In-game icon (assets/map-icon-sources/tidal-heritage-gold.png) with
    // its gradient grey background removed row by row (colour-to-alpha), glow
    // kept; the solid star is 65% of the canvas height.
    imageUrl: 'map-icons/Tidal-Heritage-Gold.png',
    size: 128,
  },
  {
    id: 'triptych-chest',
    name: 'Triptych Chest',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Triptych Chest',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-4.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Triptych-Chest.png',
    size: 128,
  },
  {
    id: 'treasures-of-perilous-enclave',
    name: 'Treasures of Perilous Enclave',
    category: 'Collectible',
    group: 'Chest',
    subcategory: 'Treasures of Perilous Enclave',
    // Cut from a native in-game capture (Exploration Progress screen,
    // assets/map-icon-sources/exploration-progress-capture-6.png): outer
    // background removed, colours untouched; 65% of the canvas height.
    imageUrl: 'map-icons/Treasures-Of-Perilous-Enclave.png',
    size: 128,
  },
];

// ── Local specialties ──────────────────────────────────────────────────────
// Resonator ascension materials picked up by hand on the map (the only kind
// of item that gets a map icon: enemy drops and farm-instance rewards are
// obtained from the enemy / instance, not found lying on the map). Filter
// tree: Collectible › Ascension Material › <item>. Icon = the item's own image
// (the same file materialData.js uses) on a dark disc in the round frame
// (map-icons/frames/round-frame.png); images in map-icons/specialty/.
const LOCAL_SPECIALTIES = [
  ['afterlife', 'Afterlife'],
  ['arithmetic-shell', 'Arithmetic Shell'],
  ['bamboo-iris', 'Bamboo Iris'],
  ['belle-poppy', 'Belle Poppy'],
  ['bloodleaf-viburnum', 'Bloodleaf Viburnum'],
  ['coriolus', 'Coriolus'],
  ['edelschnee', 'Edelschnee'],
  ['firecracker-jewelweed', 'Firecracker Jewelweed'],
  ['gemini-spore', 'Gemini Spore'],
  ['golden-fleece', 'Golden Fleece'],
  ['iris', 'Iris'],
  ['lanternberry', 'Lanternberry'],
  ['loongs-pearl', 'Loong\'s Pearl'],
  ['luminous-calendula', 'Luminous Calendula'],
  ['moss-amber', 'Moss Amber'],
  ['nova', 'Nova'],
  ['pavo-plum', 'Pavo Plum'],
  ['pecok-flower', 'Pecok Flower'],
  ['rimewisp', 'Rimewisp'],
  ['seaside-cendrelis', 'Seaside Cendrelis'],
  ['sliverglow-bloom', 'Sliverglow Bloom'],
  ['stone-rose', 'Stone Rose'],
  ['summer-flower', 'Summer Flower'],
  ['sword-acorus', 'Sword Acorus'],
  ['terraspawn-fungus', 'Terraspawn Fungus'],
  ['violet-coral', 'Violet Coral'],
  ['wintry-bell', 'Wintry Bell'],
];

for (const [slug, name] of LOCAL_SPECIALTIES) {
  MAP_ICON_CATALOG.push({
    id: `specialty-${slug}`,
    name,
    category: 'Collectible',
    group: 'Ascension Material',
    subcategory: name,
    imageUrl: `map-icons/specialty/${slug}.png`,
    size: 128,
    tags: ['local specialty', 'specialty', 'plant', 'ascension material', 'collectible'],
  });
}

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
  // Elite — portrait from public/echoes/<slug>/IconMonsterHead in the diamond monster frame.
  ['abyssal-gladius', 'Abyssal Gladius'],
  ['abyssal-mercator', 'Abyssal Mercator'],
  ['abyssal-patricius', 'Abyssal Patricius'],
  ['autopuppet-scout', 'Autopuppet Scout'],
  ['capitaneus', 'Capitaneus'],
  ['carapace', 'Carapace'],
  ['chasm-guardian', 'Chasm Guardian'],
  ['chop-chop', 'Chop Chop'],
  ['corrosaurus', 'Corrosaurus'],
  ['cuddle-wuddle', 'Cuddle Wuddle'],
  ['cyan-feathered-heron', 'Cyan-Feathered Heron'],
  ['diurnus-knight', 'Diurnus Knight'],
  ['flautist', 'Flautist'],
  ['flora-reindeer', 'Flora Reindeer'],
  ['fog-lionarch', 'Fog Lionarch'],
  ['forbidden-bastion', 'Forbidden Bastion'],
  ['frostbite-coleoid', 'Frostbite Coleoid'],
  ['glacio-dreadmane', 'Glacio Dreadmane'],
  ['glommoth', 'Glommoth'],
  ['havoc-dreadmane', 'Havoc Dreadmane'],
  ['hoochief', 'Hoochief'],
  ['hurriclaw', 'Hurriclaw'],
  ['ironhoof', 'Ironhoof'],
  ['kerasaur', 'Kerasaur'],
  ['kronablight', 'Kronablight'],
  ['kronaclaw', 'Reminiscence - Kronaclaw'],
  ['lightcrusher', 'Lightcrusher'],
  ['lumiscale-construct', 'Lumiscale Construct'],
  ['mining-reindeer', 'Mining Reindeer'],
  ['nightmare-cyan-feathered-heron', 'Nightmare: Cyan-Feathered Heron'],
  ['nightmare-roseshroom', 'Nightmare: Roseshroom'],
  ['nightmare-tambourinist', 'Nightmare: Tambourinist'],
  ['nightmare-violet-feathered-heron', 'Nightmare: Violet-Feathered Heron'],
  ['nightmare-viridblaze-saurian', 'Nightmare: Viridblaze Saurian'],
  ['nocturnus-knight', 'Nocturnus Knight'],
  ['questless-knight', 'Questless Knight'],
  ['rage-against-the-statue', 'Rage Against the Statue'],
  ['rocksteady-guardian', 'Rocksteady Guardian'],
  ['roseshroom', 'Roseshroom'],
  ['sabercat-prowler', 'Sabercat Prowler'],
  ['sabercat-reaver', 'Sabercat Reaver'],
  ['spacetrek-explorer', 'Spacetrek Explorer'],
  ['spearback', 'Spearback'],
  ['stonewall-bracer', 'Stonewall Bracer'],
  ['tambourinist', 'Tambourinist'],
  ['twin-nova-collapsar-blade', 'Twin Nova - Collapsar Blade'],
  ['twin-nova-nebulous-cannon', 'Twin Nova - Nebulous Cannon'],
  ['violet-feathered-heron', 'Violet-Feathered Heron'],
  ['viridblaze-saurian', 'Viridblaze Saurian'],
  ['vitreum-dancer', 'Vitreum Dancer'],
  ['voidwing-moth', 'Voidwing Moth'],
  ['windlash-coleoid', 'Windlash Coleoid'],
  // Common — portrait from public/echoes/<slug>/IconMonsterHead in the diamond monster frame.
  ['aero-drake', 'Aero Drake'],
  ['aero-predator', 'Aero Predator'],
  ['aero-prism', 'Aero Prism'],
  ['aureate-picket', 'Aureate Picket'],
  ['baby-roseshroom', 'Baby Roseshroom'],
  ['baby-viridblaze-saurian', 'Baby Viridblaze Saurian'],
  ['calcified-junrock', 'Calcified Junrock'],
  ['chest-mimic', 'Chest Mimic'],
  ['chirpuff', 'Chirpuff'],
  ['chop-chop-headless', 'Chop Chop: Headless'],
  ['chop-chop-leftless', 'Chop Chop: Leftless'],
  ['chop-chop-rightless', 'Chop Chop: Rightless'],
  ['clang-bang', 'Clang Bang'],
  ['cruisewing', 'Cruisewing'],
  ['diamondclaw', 'Diamondclaw'],
  ['diggy-duggy', 'Diggy Duggy'],
  ['dwarf-cassowary', 'Dwarf Cassowary'],
  ['electro-drake', 'Electro Drake'],
  ['electro-predator', 'Electro Predator'],
  ['excarat', 'Excarat'],
  ['fae-ignis', 'Fae Ignis'],
  ['fission-junrock', 'Fission Junrock'],
  ['flora-drone', 'Flora Drone'],
  ['fog-lionarch-body', 'Fog Lionarch: Body'],
  ['fog-lionarch-head', 'Fog Lionarch: Head'],
  ['frostscourge-stalker', 'Frostscourge Stalker'],
  ['fusion-drake', 'Fusion Drake'],
  ['fusion-dreadmane', 'Fusion Dreadmane'],
  ['fusion-prism', 'Fusion Prism'],
  ['fusion-warrior', 'Fusion Warrior'],
  ['galescourge-stalker', 'Galescourge Stalker'],
  ['geospider-s4', 'Geospider S4'],
  ['glacio-drake', 'Glacio Drake'],
  ['glacio-predator', 'Glacio Predator'],
  ['glacio-prism', 'Glacio Prism'],
  ['golden-junrock', 'Golden Junrock'],
  ['gulpuff', 'Gulpuff'],
  ['havoc-drake', 'Havoc Drake'],
  ['havoc-prism', 'Havoc Prism'],
  ['havoc-warrior', 'Havoc Warrior'],
  ['hoartoise', 'Hoartoise'],
  ['hocus-pocus', 'Hocus Pocus'],
  ['hooscamp', 'Hooscamp'],
  ['iceglint-dancer', 'Iceglint Dancer'],
  ['kernel-puppet-anger', 'Kernel Puppet: Anger'],
  ['kernel-puppet-fright', 'Kernel Puppet: Fright'],
  ['kernel-puppet-grief', 'Kernel Puppet: Grief'],
  ['kernel-puppet-joy', 'Kernel Puppet: Joy'],
  ['kernel-puppet-reflection', 'Kernel Puppet: Reflection'],
  ['kernel-puppet-worry', 'Kernel Puppet: Worry'],
  ['la-guardia', 'La Guardia'],
  ['lava-larva', 'Lava Larva'],
  ['lottie-lost', 'Lottie Lost'],
  ['mining-drone', 'Mining Drone'],
  ['nightmare-aero-predator', 'Nightmare: Aero Predator'],
  ['nightmare-baby-roseshroom', 'Nightmare: Baby Roseshroom'],
  ['nightmare-baby-viridblaze-saurian', 'Nightmare: Baby Viridblaze Saurian'],
  ['nightmare-chirpuff', 'Nightmare: Chirpuff'],
  ['nightmare-dwarf-cassowary', 'Nightmare: Dwarf Cassowary'],
  ['nightmare-electro-predator', 'Nightmare: Electro Predator'],
  ['nightmare-glacio-predator', 'Nightmare: Glacio Predator'],
  ['nightmare-gulpuff', 'Nightmare: Gulpuff'],
  ['nightmare-havoc-warrior', 'Nightmare: Havoc Warrior'],
  ['nightmare-tick-tack', 'Nightmare: Tick Tack'],
  ['nimbus-wraith', 'Nimbus Wraith'],
  ['porcelain-picket', 'Porcelain Picket'],
  ['sabyr-boar', 'Sabyr Boar'],
  ['sacerdos', 'Sacerdos'],
  ['sagittario', 'Sagittario'],
  ['shadow-stepper', 'Shadow Stepper'],
  ['smiter', 'Smiter'],
  ['smolder', 'Smolder'],
  ['snip-snap', 'Snip Snap'],
  ['spectro-drake', 'Spectro Drake'],
  ['spectro-prism', 'Spectro Prism'],
  ['stone-picket', 'Stone Picket'],
  ['tick-tack', 'Tick Tack'],
  ['traffic-illuminator', 'Traffic Illuminator'],
  ['tremor-warrior', 'Tremor Warrior'],
  ['vanguard-junrock', 'Vanguard Junrock'],
  ['voltscourge-stalker', 'Voltscourge Stalker'],
  ['whiff-whaff', 'Whiff Whaff'],
  ['zig-zag', 'Zig Zag'],
  ['zip-zap', 'Zip Zap'],
];

// Enemies with no Echo in ECHO_DATA: class (and element when known) given by
// hand, per the project owner.
const ENEMY_ICONS_MANUAL = [
  { slug: 'scar-aberrant-nightmare', name: 'Scar: Aberrant Nightmare', rank: 'Calamity', element: 'Havoc' },
];

const ENEMY_CLASS_ORDER = ['Calamity', 'Overlord', 'Elite', 'Common'];
const BOSS_CLASSES = new Set(['Calamity', 'Overlord']);

for (const [slug, echoName, extra] of ENEMY_ICONS) {
  const echo = ECHO_DATA[echoName];
  if (!echo) throw new Error(`mapIconCatalog: no ECHO_DATA entry named "${echoName}"`);
  MAP_ICON_CATALOG.push({
    id: `enemy-${slug}`,
    name: extra?.name || echoName.replace(/^Reminiscence\s*[-:]\s*/, ''),
    echoName,
    category: 'Enemy',
    subcategory: echo.rank,
    imageUrl: `map-icons/enemy/${slug}.png`,
    size: 128,
    // "boss" only for the classes players call bosses (Overlord, Calamity).
    tags: [BOSS_CLASSES.has(echo.rank) && 'boss', 'enemy', echo.rank, echo.element, ...(echo.sets || []), ...(extra?.tags || [])].filter(Boolean),
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
