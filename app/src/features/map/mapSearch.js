// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapSearch.js
// Search engine behind the map's magnifying-glass panel (MapSearchPopover.jsx).
// Pure functions, no React / Leaflet: MapTab.jsx builds an index from the live
// icon + zone data, queries it as the user types, and resolves a chosen
// result (or saved tag) back to the set of icon ids to focus on the map.
//
// What a result can be:
//   kind      every icon of one kind           "Supply Chest" (144)
//   kindZone  one kind inside one region       "Supply Chest · Jinzhou" (12)
//   category  every icon of a category         "Resonance" (Nexus + Beacon)
//   catZone   one category inside one region   "Resonance · Jinzhou"
//   zone      a region itself                  "Jinzhou" (all its icons)
//   icon      a single icon that has a label
// A region matches every icon placed in it OR in any of its sub-regions.
//
// Matching: the query is split into words; every word must match somewhere in
// a result (AND), so words can be freely combined across the item type and the
// region hierarchy ("chest jinzhou", "jinzhou chest", "huanglong beacon").
// Each word is tried as exact word > prefix > substring > typo (1 edit for
// 4+ letters, 2 edits for 7+), accent- and case-insensitive, and expanded
// through SYNONYMS (English/French/common player vocabulary).
// ═══════════════════════════════════════════════════════════════════════════════

// Words ignored in a query ("chests in jinzhou", "coffres dans jinzhou").
const STOP_WORDS = new Set([
  'in', 'at', 'the', 'of', 'near', 'on', 'a', 'an', 'and', 'all', 'my', 'find', 'show', 'where', 'is', 'are',
  'dans', 'en', 'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'au', 'aux', 'sur', 'un', 'une', 'et', 'tous', 'toutes', 'ou',
]);

// Query word → extra words it also stands for. Keys and values are normalized.
const SYNONYMS = {
  teleport: ['nexus', 'beacon', 'resonance'],
  teleports: ['nexus', 'beacon', 'resonance'],
  teleporter: ['nexus', 'beacon', 'resonance'],
  tp: ['nexus', 'beacon', 'resonance'],
  waypoint: ['nexus', 'beacon', 'resonance'],
  waypoints: ['nexus', 'beacon', 'resonance'],
  travel: ['nexus', 'beacon', 'resonance'],
  teleporteur: ['nexus', 'beacon', 'resonance'],
  teleporteurs: ['nexus', 'beacon', 'resonance'],
  teleportation: ['nexus', 'beacon', 'resonance'],
  balise: ['beacon'],
  balises: ['beacon'],
  chests: ['chest'],
  coffre: ['chest'],
  coffres: ['chest'],
  loot: ['chest', 'collectible', 'treasure'],
  box: ['chest'],
  caisse: ['chest'],
  ravitaillement: ['supply'],
  tresor: ['treasure'],
  tresors: ['treasure'],
  collectibles: ['collectible'],
  collectable: ['collectible'],
  collectables: ['collectible'],
  objets: ['collectible'],
  region: ['zone'],
  regions: ['zone'],
  area: ['zone'],
  zones: ['zone'],
  beacons: ['beacon'],
  nexuses: ['nexus'],
};

const MAX_RESULTS = 30;

/** Lowercases and strips accents/diacritics, keeping string length stable per char. */
export function normalizeText(s) {
  let out = '';
  for (const ch of String(s ?? '')) out += normalizeChar(ch);
  return out;
}

function normalizeChar(ch) {
  const n = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // Keep a 1:1 char mapping so match ranges line up with the original label.
  return n.length === 1 ? n : (n[0] ?? ' ');
}

// Apostrophes join rather than split ("Tethy's" → "tethys", "Whining Aix's" → "aixs").
const APOSTROPHES = /['’`]/g;

/** Splits text into normalized words (letters/digits only). */
export function tokenize(s) {
  return normalizeText(String(s ?? '').replace(APOSTROPHES, '')).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Query words after stop-word removal, each with its synonym alternatives. */
export function parseQuery(query) {
  return tokenize(query)
    .filter(w => !STOP_WORDS.has(w))
    .map(w => ({ word: w, alts: [w, ...(SYNONYMS[w] || [])] }));
}

// Bounded Damerau-Levenshtein distance (adjacent transposition counts as 1).
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

// Quality (0..1) of one query word against one indexed word; 0 = no match.
function wordQuality(q, w) {
  if (q === w) return 1;
  if (w.startsWith(q)) return q.length >= 2 ? 0.85 : 0.5;
  if (q.length >= 3 && w.includes(q)) return 0.6;
  // Typo tolerance: also against the word's own prefix, so "suply ch" still
  // reaches "supply chest" while typing.
  const maxEdits = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (maxEdits) {
    if (editDistance(q, w, maxEdits) <= maxEdits) return 0.55;
    if (w.length > q.length && editDistance(q, w.slice(0, q.length), maxEdits) <= maxEdits) return 0.45;
  }
  return 0;
}

// ── Index ──────────────────────────────────────────────────────────────────

/**
 * Builds the searchable index.
 * @param {object} p
 * @param {Array} p.icons   placed icons ({ id, kind, category?, subcategory?, zoneId?, floor?, label? })
 * @param {Array} p.zones   all zones ({ id, name, parentId?, level?, tags?, note? })
 * @param {(kind:string)=>object|null} p.getKind  icon catalog lookup ({ name, category, subcategory })
 */
export function buildSearchIndex({ icons, zones, getKind }) {
  const zoneById = new Map(zones.map(z => [z.id, z]));
  const chainCache = new Map();
  // [zone, parent, grandparent, …] for a zone id, cycle-safe.
  const chainOf = (zoneId) => {
    if (!zoneId) return [];
    if (chainCache.has(zoneId)) return chainCache.get(zoneId);
    const chain = [];
    const seen = new Set();
    let z = zoneById.get(zoneId);
    while (z && !seen.has(z.id)) { chain.push(z); seen.add(z.id); z = z.parentId ? zoneById.get(z.parentId) : null; }
    chainCache.set(zoneId, chain);
    return chain;
  };
  const zoneName = (z) => z.name || z.id;
  const pathLabel = (zoneId) => chainOf(zoneId).slice(1).reverse().map(zoneName).join(' › ');

  const iconMeta = icons.map(ic => {
    const k = getKind(ic.kind) || {};
    return {
      ic,
      kindName: k.name || ic.kind,
      category: ic.category || k.category || 'Uncategorised',
      subcategory: ic.subcategory || k.subcategory || '',
      chain: chainOf(ic.zoneId),
    };
  });

  const docs = new Map();
  const add = (key, make) => {
    let d = docs.get(key);
    if (!d) { d = make(); d.iconIds = []; docs.set(key, d); }
    return d;
  };
  const fields = (label, typeWords, zoneId) => {
    const chain = chainOf(zoneId);
    return [
      { words: tokenize(label), weight: 3, role: 'label' },
      { words: tokenize(typeWords.join(' ')), weight: 2, role: 'type' },
      { words: chain[0] ? tokenize([zoneName(chain[0]), ...(chain[0].tags || [])].join(' ')) : [], weight: 2, role: 'zone' },
      { words: tokenize(chain.slice(1).map(zoneName).join(' ')), weight: 1.5, role: 'zone' },
    ];
  };

  for (const m of iconMeta) {
    const { ic, kindName, category, subcategory } = m;
    const typeWords = [category, subcategory, kindName];
    add(`kind:${ic.kind}`, () => ({
      type: 'kind', label: kindName, context: category, kind: ic.kind,
      filter: { kind: ic.kind }, fields: fields(kindName, typeWords, null),
    })).iconIds.push(ic.id);
    add(`cat:${category}`, () => ({
      type: 'category', label: category, context: '', kind: null,
      filter: { category }, fields: fields(category, [category], null),
    })).iconIds.push(ic.id);
    for (const z of m.chain) {
      add(`kz:${ic.kind}@${z.id}`, () => ({
        type: 'kindZone', label: kindName, context: [zoneName(z), pathLabel(z.id)].filter(Boolean).join(' · '), kind: ic.kind, zoneId: z.id,
        filter: { kind: ic.kind, zoneId: z.id }, fields: fields(kindName, typeWords, z.id),
      })).iconIds.push(ic.id);
      add(`cz:${category}@${z.id}`, () => ({
        type: 'catZone', label: category, context: [zoneName(z), pathLabel(z.id)].filter(Boolean).join(' · '), kind: null, zoneId: z.id,
        filter: { category, zoneId: z.id }, fields: fields(category, [category], z.id),
      })).iconIds.push(ic.id);
    }
    if (ic.label) {
      add(`icon:${ic.id}`, () => ({
        type: 'icon', label: ic.label, context: [kindName, m.chain[0] && zoneName(m.chain[0])].filter(Boolean).join(' · '), kind: ic.kind, zoneId: ic.zoneId,
        filter: { iconId: ic.id }, fields: fields(ic.label, typeWords, ic.zoneId),
      })).iconIds.push(ic.id);
    }
  }

  // A category doc that only ever holds one kind duplicates that kind's doc.
  const kindsPerCat = new Map();
  for (const m of iconMeta) {
    if (!kindsPerCat.has(m.category)) kindsPerCat.set(m.category, new Set());
    kindsPerCat.get(m.category).add(m.ic.kind);
  }
  for (const [key, d] of docs) {
    if ((d.type === 'category' || d.type === 'catZone') && (kindsPerCat.get(d.filter.category)?.size ?? 0) < 2) docs.delete(key);
  }

  const zoneIconIds = new Map();
  for (const m of iconMeta) for (const z of m.chain) {
    if (!zoneIconIds.has(z.id)) zoneIconIds.set(z.id, []);
    zoneIconIds.get(z.id).push(m.ic.id);
  }
  for (const z of zones) {
    const d = {
      type: 'zone', label: zoneName(z), context: pathLabel(z.id), kind: null, zoneId: z.id, zone: z,
      filter: { zoneId: z.id }, iconIds: zoneIconIds.get(z.id) || [],
      fields: [
        { words: tokenize(zoneName(z)), weight: 3, role: 'label' },
        { words: ['zone', ...tokenize([...(z.tags || []), z.note || ''].join(' '))], weight: 1, role: 'type' },
        { words: tokenize(chainOf(z.id).slice(1).map(zoneName).join(' ')), weight: 1.5, role: 'zone' },
      ],
    };
    docs.set(`zone:${z.id}`, d);
  }

  const floorOf = new Map(icons.map(ic => [ic.id, ic.floor ?? null]));
  const list = [...docs.entries()].map(([key, d]) => ({ key, ...d, count: d.iconIds.length }));
  return { docs: list, byKey: new Map(list.map(d => [d.key, d])), floorOf };
}

// ── Query ──────────────────────────────────────────────────────────────────

// Best match of one query word (any of its alternatives) against a doc.
function matchWord(qw, doc) {
  let best = null;
  for (const f of doc.fields) {
    for (const w of f.words) {
      for (let a = 0; a < qw.alts.length; a++) {
        let q = wordQuality(qw.alts[a], w);
        if (!q) continue;
        if (a > 0) q *= 0.9; // a synonym hit ranks just below the literal word
        const s = q * f.weight;
        if (!best || s > best.score) best = { score: s, role: f.role };
      }
    }
  }
  return best;
}

// Base rank per type for a tie: broad results first, then region-scoped ones.
const TYPE_BONUS = { kind: 0.6, category: 0.5, zone: 0.4, icon: 0.3, kindZone: 0.2, catZone: 0.1 };

/**
 * Ranked results for a query. Empty/stop-word-only queries return [].
 * @returns {Array<{doc, score}>}
 */
export function searchMap(index, query, { limit = MAX_RESULTS } = {}) {
  const words = parseQuery(query);
  if (!words.length) return [];
  const strict = runSearch(index, words, 0, limit);
  if (strict.length || words.length < 2) return strict;
  // Nothing satisfies every word (e.g. "chest jinzhou" when no chest is placed
  // in Jinzhou): fall back to results missing exactly one word, flagged
  // `partial` with the words they did not match so the UI can say so.
  return runSearch(index, words, 1, limit);
}

function runSearch(index, words, allowMissing, limit) {
  const out = [];
  for (const doc of index.docs) {
    if (doc.type !== 'zone' && doc.count === 0) continue;
    let score = 0;
    let zoneHit = false;
    let typeHit = false;
    let ok = true;
    const missing = [];
    for (const qw of words) {
      const m = matchWord(qw, doc);
      if (!m) {
        missing.push(qw.word);
        if (missing.length > allowMissing) { ok = false; break; }
        continue;
      }
      score += m.score;
      if (m.role === 'zone') zoneHit = true;
      if (m.role === 'type' || m.role === 'label') typeHit = true;
    }
    if (!ok) continue;
    // A region-scoped result the query never pointed at a region for is
    // noise ("chest" → the global Supply Chest result, not 40 per-region copies).
    if ((doc.type === 'kindZone' || doc.type === 'catZone') && !zoneHit) continue;
    // Likewise a bare region result when the query also names an item type
    // is less precise than the "type · region" results.
    if (doc.type === 'zone' && words.length > 1 && !typeHit) score -= 1;
    score += TYPE_BONUS[doc.type] ?? 0;
    out.push(missing.length ? { doc, score, partial: true, missing } : { doc, score });
  }
  out.sort((a, b) => b.score - a.score || b.doc.count - a.doc.count || a.doc.label.localeCompare(b.doc.label));
  return out.slice(0, limit);
}

/** [start, end) ranges of `label` matched by the query, for highlighting. */
export function highlightRanges(label, query) {
  // Search a copy without apostrophes (same as tokenize), mapping each of its
  // positions back to the original label's index.
  const map = [];
  let text = '';
  [...String(label ?? '')].forEach((ch, i) => {
    if (APOSTROPHES.test(ch)) { APOSTROPHES.lastIndex = 0; return; }
    APOSTROPHES.lastIndex = 0;
    text += normalizeChar(ch);
    map.push(i);
  });
  const ranges = [];
  for (const { alts } of parseQuery(query)) {
    for (const q of alts) {
      if (q.length < 2) continue;
      let from = 0;
      let i;
      while ((i = text.indexOf(q, from)) !== -1) {
        const atWordStart = i === 0 || /[^a-z0-9]/.test(text[i - 1]);
        if (atWordStart || q.length >= 3) ranges.push([map[i], map[i + q.length - 1] + 1]);
        from = i + q.length;
      }
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}

/** Icon ids for a saved filter spec, against the current index (icons may have changed since). */
export function resolveFilterKey(index, key) {
  return index.byKey.get(key)?.iconIds ?? [];
}

/** Floor → number of the given icons on it (floor null = shown on every floor). */
export function floorBreakdown(index, iconIds) {
  const out = new Map();
  for (const id of iconIds) {
    const f = index.floorOf.get(id) ?? null;
    out.set(f, (out.get(f) || 0) + 1);
  }
  return out;
}
