// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapShareCode.js
// Text share codes for a player's map state (personal pins, optionally the
// found-icon list, optionally saved searches with their route styles): "WWMAP1:" + base64url(deflate-raw(JSON)). No URL, no
// server, no HTML — a code is inert data. Decoding treats it as untrusted:
// size-capped before and after decompression, strict whitelist of fields,
// every value range-checked, notes stripped of control / bidi characters.
// Anything that fails is dropped (per item) or rejected (whole code).
// ═══════════════════════════════════════════════════════════════════════════════

import { MAP_PIN_MARKERS } from '../../data/mapPinMarkers.js';
import { MAP_W, MAP_H } from './tileMath.js';

export const SHARE_PREFIX = 'WWMAP1:';
export const MAX_CODE_CHARS = 200_000;
export const MAX_JSON_BYTES = 512 * 1024;
export const MAX_PINS = 1000;
export const MAX_FOUND = 20_000;
export const MAX_NOTE_CHARS = 80;
export const MAX_ROUTE_TAGS = 20;

// Saved-search keys come from mapSearch.js ("kind:…", "sub:…/…", "kz:…@zone", "zone:…"…):
// a known prefix, then printable text. Only colours from the route palette and the four line
// styles are accepted.
const TAG_KEY_RE = /^(?:kind|sub|cat|kz|cz|icon|zone):[^\u0000-\u001f\u007f]{1,160}$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const LINE_STYLES = new Set(['solid', 'dashed', 'dotted', 'dashdot']);

const MARKER_IDS = new Set(MAP_PIN_MARKERS.map(m => m.id));
const ICON_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// Sub-map overlays may sit past the base map's edges, so allow one map-size
// of margin on each side; anything beyond that is not a real map position.
const inBounds = (x, y) => x >= -MAP_W && x <= 2 * MAP_W && y >= -MAP_H && y <= 2 * MAP_H;

// Links are never allowed in notes (editor or share codes): a scheme
// ("https://", "javascript:"), "www.", an e-mail address, or a bare domain
// ending in a common TLD ("scam-site.com", "bit.ly/x", "discord.gg/abc").
// NFKC first folds full-width / stylised look-alikes ("ｗｗｗ．ｃｏｍ") and
// "dot" / "(.)" / "[.]" spellings count as a dot. Two passes:
//  1. text as written — every pattern, full TLD list (a real domain has no
//     space around its dots; "Mt.Firmament" / "Lv.90" match no TLD);
//  2. spaces around dots removed ("evil . com") — only strong signals, with
//     TLDs that are not also everyday words, so "Go north. It is…" or
//     "Wait. Me first" stay allowed.
const STRONG_TLDS = 'com|net|org|io|gg|ly|xyz|ru|cn|app|dev|info|biz|tk|ml|ga|cf|gq|link|site|online|shop|store|top|club|vip|icu|fr|de|uk|tv|cc|ws|sh|gl|jp|kr|br|eu|ca|au|nl|pl|ch|cz|su|ua|ph|vn|tw|hk|sg|lol|gift|gifts|click|pro|bet|money|cash|pw|lt|lv|ee';
const WORD_TLDS = 'co|me|to|be|ai|it|es|in|us|at|id|th|my|se|la|st|so|nu|is|im|am|fm|win|live|fun';
const SCHEME = '(?:[a-z][a-z0-9+.-]*:\\/\\/|\\b(?:javascript|data|vbscript|file|intent|mailto|tel|sms):)';
const domainRe = (tlds) => `[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.(?:${tlds})\\b`;
const LINK_RE_WRITTEN = new RegExp(`${SCHEME}|\\bwww\\.|[a-z0-9._%+-]+@[a-z0-9-]+\\.[a-z]{2,}|${domainRe(`${STRONG_TLDS}|${WORD_TLDS}`)}`, 'i');
const LINK_RE_SPACED = new RegExp(`\\bwww\\.|${domainRe(STRONG_TLDS)}`, 'i');

export function containsLink(text) {
  if (typeof text !== 'string' || !text) return false;
  const folded = text.normalize('NFKC').toLowerCase()
    .replace(/\s*(?:\(\s*(?:\.|dot)\s*\)|\[\s*(?:\.|dot)\s*\]|\{\s*(?:\.|dot)\s*\})\s*/g, '.')
    .replace(/\s+dot\s+/g, ' . ')
    .replace(/。/g, '.');
  if (LINK_RE_WRITTEN.test(folded)) return true;
  return LINK_RE_SPACED.test(folded.replace(/\s*\.\s*/g, '.'));
}

/** Note text as plain, single-line text: no control or bidi-override characters. */
export function sanitizeNote(note) {
  if (typeof note !== 'string') return '';
  return note
    .replace(/[\u0000-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NOTE_CHARS);
}

const toBase64Url = (bytes) => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (s) => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function deflate(bytes) {
  const stream = new Response(bytes).body.pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Inflates with a hard output cap so a tiny code can't expand into a huge
// string (decompression bomb).
async function inflateCapped(bytes, cap) {
  const reader = new Response(bytes).body.pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) { await reader.cancel(); throw new Error('too-large'); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

/**
 * Builds a share code. `pins` are { marker, x, y, floor, note }; `foundIds`
 * (optional) are placed-icon ids; `routes` (optional) is { tags: [{ key, label,
 * context, route, color, line }], start: { x, y, floor } | null, linked }.
 */
export async function encodeMapShare({ pins = [], foundIds = [], routes = null }) {
  // A note holding a link (from before links were blocked) is left out.
  const note = (n) => { const s = sanitizeNote(n); return containsLink(s) ? '' : s; };
  const payload = { p: pins.map(p => [p.marker, Math.round(p.x), Math.round(p.y), p.floor || 0, note(p.note)]) };
  if (foundIds.length) payload.f = [...foundIds];
  if (routes && routes.tags.length) {
    payload.r = {
      t: routes.tags.slice(0, MAX_ROUTE_TAGS).map(tg => [tg.key, note(tg.label), note(tg.context), tg.route ? 1 : 0, tg.color || '', tg.line || 'dashed']),
      s: routes.start ? [Math.round(routes.start.x), Math.round(routes.start.y), routes.start.floor || 0] : null,
      l: routes.linked ? 1 : 0,
    };
  }
  const bytes = await deflate(new TextEncoder().encode(JSON.stringify(payload)));
  return SHARE_PREFIX + toBase64Url(bytes);
}

/**
 * Parses a share code. Resolves to { pins, foundIds, routes, dropped } or rejects
 * with an Error whose message is one of: 'not-a-code', 'too-large',
 * 'corrupt', 'link-blocked' (any note holds a link — the whole code is refused). `dropped` counts entries discarded as invalid.
 */
export async function decodeMapShare(text) {
  const code = String(text || '').replace(/\s+/g, '');
  const at = code.indexOf(SHARE_PREFIX);
  if (at === -1) throw new Error('not-a-code');
  const body = code.slice(at + SHARE_PREFIX.length);
  if (body.length > MAX_CODE_CHARS) throw new Error('too-large');
  if (!/^[A-Za-z0-9_-]+$/.test(body)) throw new Error('corrupt');
  let data;
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(await inflateCapped(fromBase64Url(body), MAX_JSON_BYTES));
    data = JSON.parse(json);
  } catch (e) {
    throw new Error(e && e.message === 'too-large' ? 'too-large' : 'corrupt');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('corrupt');

  let dropped = 0;
  const pins = [];
  for (const row of Array.isArray(data.p) ? data.p.slice(0, MAX_PINS) : []) {
    const [marker, x, y, floor, note] = Array.isArray(row) ? row : [];
    const ok = MARKER_IDS.has(marker)
      && Number.isFinite(x) && Number.isFinite(y) && inBounds(x, y)
      && Number.isInteger(floor) && floor >= 0 && floor <= 20;
    if (!ok) { dropped++; continue; }
    const clean = sanitizeNote(note);
    if (containsLink(clean) || containsLink(typeof note === 'string' ? note : '')) throw new Error('link-blocked');
    pins.push({ marker, x: Math.round(x), y: Math.round(y), floor: floor || null, note: clean });
  }
  if (Array.isArray(data.p) && data.p.length > MAX_PINS) dropped += data.p.length - MAX_PINS;

  const foundIds = [];
  for (const id of Array.isArray(data.f) ? data.f.slice(0, MAX_FOUND) : []) {
    if (typeof id === 'string' && ICON_ID_RE.test(id)) foundIds.push(id); else dropped++;
  }
  let routes = null;
  const r = data.r;
  if (r && typeof r === 'object' && !Array.isArray(r)) {
    const tags = [];
    for (const row of Array.isArray(r.t) ? r.t.slice(0, MAX_ROUTE_TAGS) : []) {
      const [key, label, context, route, color, line] = Array.isArray(row) ? row : [];
      const ok = typeof key === 'string' && TAG_KEY_RE.test(key) && typeof label === 'string'
        && (color === '' || (typeof color === 'string' && COLOR_RE.test(color))) && LINE_STYLES.has(line);
      if (!ok) { dropped++; continue; }
      const cleanLabel = sanitizeNote(label);
      const cleanContext = sanitizeNote(typeof context === 'string' ? context : '');
      if (containsLink(cleanLabel) || containsLink(cleanContext) || containsLink(label)) throw new Error('link-blocked');
      if (!cleanLabel) { dropped++; continue; }
      tags.push({ key, label: cleanLabel, context: cleanContext, route: route === 1, color: color || null, line, active: true });
    }
    const [sx, sy, sf] = Array.isArray(r.s) ? r.s : [];
    const start = Number.isFinite(sx) && Number.isFinite(sy) && inBounds(sx, sy) && Number.isInteger(sf) && sf >= -20 && sf <= 20
      ? { x: Math.round(sx), y: Math.round(sy), floor: sf || null, label: '' } : null;
    if (tags.length) routes = { tags, start, linked: r.l === 1 };
  }
  return { pins, foundIds: [...new Set(foundIds)], routes, dropped };
}
