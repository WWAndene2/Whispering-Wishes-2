// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapShareCode.js
// Text share codes for a player's map state (personal pins, optionally the
// found-icon list): "WWMAP1:" + base64url(deflate-raw(JSON)). No URL, no
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

const MARKER_IDS = new Set(MAP_PIN_MARKERS.map(m => m.id));
const ICON_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// Sub-map overlays may sit past the base map's edges, so allow one map-size
// of margin on each side; anything beyond that is not a real map position.
const inBounds = (x, y) => x >= -MAP_W && x <= 2 * MAP_W && y >= -MAP_H && y <= 2 * MAP_H;

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
 * (optional) are placed-icon ids.
 */
export async function encodeMapShare({ pins = [], foundIds = [] }) {
  const payload = { p: pins.map(p => [p.marker, Math.round(p.x), Math.round(p.y), p.floor || 0, sanitizeNote(p.note)]) };
  if (foundIds.length) payload.f = [...foundIds];
  const bytes = await deflate(new TextEncoder().encode(JSON.stringify(payload)));
  return SHARE_PREFIX + toBase64Url(bytes);
}

/**
 * Parses a share code. Resolves to { pins, foundIds, dropped } or rejects
 * with an Error whose message is one of: 'not-a-code', 'too-large',
 * 'corrupt'. `dropped` counts entries discarded as invalid.
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
    pins.push({ marker, x: Math.round(x), y: Math.round(y), floor: floor || null, note: sanitizeNote(note) });
  }
  if (Array.isArray(data.p) && data.p.length > MAX_PINS) dropped += data.p.length - MAX_PINS;

  const foundIds = [];
  for (const id of Array.isArray(data.f) ? data.f.slice(0, MAX_FOUND) : []) {
    if (typeof id === 'string' && ICON_ID_RE.test(id)) foundIds.push(id); else dropped++;
  }
  return { pins, foundIds: [...new Set(foundIds)], dropped };
}
