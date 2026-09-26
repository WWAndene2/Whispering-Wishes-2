// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — utils/firebaseWriteRateLimit.js
// Per-path client-side cooldown for Firebase writes (e.g. leaderboard submits).
// ═══════════════════════════════════════════════════════════════════════════════

const FIREBASE_WRITE_COOLDOWN_MS = 5000;
const FIREBASE_RATE_LIMIT_MAX_ENTRIES = 100;

// Rate limiter for Firebase writes
const firebaseWriteTimestamps = new Map();
export const checkFirebaseRateLimit = (pathKey) => {
  const now = Date.now();
  const lastWrite = firebaseWriteTimestamps.get(pathKey) || 0;
  if (now - lastWrite < FIREBASE_WRITE_COOLDOWN_MS) return false;
  firebaseWriteTimestamps.set(pathKey, now);
  if (firebaseWriteTimestamps.size > FIREBASE_RATE_LIMIT_MAX_ENTRIES) {
    const staleThreshold = now - FIREBASE_WRITE_COOLDOWN_MS * 10;
    for (const [key, ts] of firebaseWriteTimestamps) {
      if (ts < staleThreshold) firebaseWriteTimestamps.delete(key);
    }
  }
  return true;
};
