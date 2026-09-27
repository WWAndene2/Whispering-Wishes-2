// ════════════════════════════════════��══════════════════════════════════════════
// WHISPERING WISHES — shared/constants/appConstants.js
// Shared constants used across multiple modules (single source of truth)
// ════════════════════════��══════════════════════════════════════════════════════

// ── localStorage keys ─────────────────────────────────────────────────────────
// Bump the suffix when the schema changes
// Keys that are part of backup/export/reset are defined once in core/storageKeys.js.
export { VISUAL_SETTINGS_KEY, IMAGE_FRAMING_KEY, TROPHY_OVERRIDES_KEY } from '../../core/storageKeys.js';
export const CONVENE_SIM_STATS_KEY = 'whispering-wishes-convene-sim-stats-v1';
export const STANDARD_WEAPON_TARGET_KEY = 'whispering-wishes-standard-weapon-target-v1';

// ── Admin ────��──────────────────────���─────────────────────────────────────────
export const ADMIN_SALT = 'whispering-wishes-v3-admin';
export const ADMIN_TAP_TIMEOUT_MS = 1500;

// ── Validation limits ────��───────────────────────────��────────────────────────
export const MAX_USERNAME_LENGTH = 24;
export const MAX_BOOKMARK_NAME_LENGTH = 30;

// ── Image host allowlist ──────────────────────────────────────────────────────
// P15-FIX: MEDIUM-3 - Domain allowlist for custom image URLs (single source of truth)
export const ALLOWED_IMAGE_HOSTS = Object.freeze([
  'i.ibb.co', 'ibb.co', 'i.imgur.com', 'imgur.com',
  'cdn.discordapp.com', 'media.discordapp.net',
  'pbs.twimg.com', 'raw.githubusercontent.com',
  'i.postimg.cc',
]);

export const isAllowedImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false; // Block userinfo bypass (https://evil@trusted.com)
    return ALLOWED_IMAGE_HOSTS.some(host =>
      parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    );
  } catch { return false; }
};

export const sanitizeImageUrl = (url, fallback = '') => isAllowedImageUrl(url) ? url : fallback;
