// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/mapRoute.js
// Short visiting order through a set of map points (an open path, no return to
// the start): nearest-neighbour tour from every candidate start, the shortest
// one kept, then improved with 2-opt until no segment swap shortens it. Plain
// Euclidean distance in map pixels — the map has no walkable-path data, so the
// route is a straight-line guide, not in-game pathfinding.
// ═══════════════════════════════════════════════════════════════════════════════

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** Total length of a path through `points` in order. */
export function routeLength(points) {
  let d = 0;
  for (let i = 1; i < points.length; i++) d += dist(points[i - 1], points[i]);
  return d;
}

function nearestNeighbour(points, start) {
  const left = new Set(points.map((_, i) => i));
  const order = [start];
  left.delete(start);
  let cur = start;
  while (left.size) {
    let best = -1;
    let bestD = Infinity;
    for (const j of left) {
      const d = dist(points[cur], points[j]);
      if (d < bestD) { bestD = d; best = j; }
    }
    order.push(best);
    left.delete(best);
    cur = best;
  }
  return order;
}

// 2-opt for an open path: reversing order[i..k] replaces edges (i-1,i) and
// (k,k+1) with (i-1,k) and (i,k+1); an end segment has no outer edge.
// With `fixedStart`, the first stop never moves.
function twoOpt(points, order, fixedStart) {
  const n = order.length;
  const p = (i) => points[order[i]];
  let improved = true;
  let passes = 0;
  while (improved && passes < 50) {
    improved = false;
    passes++;
    for (let i = fixedStart ? 1 : 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const before = (i > 0 ? dist(p(i - 1), p(i)) : 0) + (k < n - 1 ? dist(p(k), p(k + 1)) : 0);
        const after = (i > 0 ? dist(p(i - 1), p(k)) : 0) + (k < n - 1 ? dist(p(i), p(k + 1)) : 0);
        if (after < before - 1e-9) {
          for (let a = i, b = k; a < b; a++, b--) [order[a], order[b]] = [order[b], order[a]];
          improved = true;
        }
      }
    }
  }
  return order;
}

/**
 * Orders `points` ({ x, y, ... }) into a short open path and returns the same
 * objects in visiting order. `startIndex` pins the first stop; otherwise every
 * point is tried as the start (capped for large sets, where it only tries a
 * spread-out sample) and the shortest tour wins.
 */
export function optimizeRoute(points, startIndex = null) {
  const n = points.length;
  if (n < 3) return points.slice();
  let starts;
  if (startIndex != null) starts = [startIndex];
  else if (n <= 64) starts = points.map((_, i) => i);
  else starts = Array.from({ length: 16 }, (_, i) => Math.floor((i * n) / 16));
  let best = null;
  let bestLen = Infinity;
  for (const s of starts) {
    const order = nearestNeighbour(points, s);
    const len = routeLength(order.map(i => points[i]));
    if (len < bestLen) { bestLen = len; best = order; }
  }
  const order = n <= 400 ? twoOpt(points, best, startIndex != null) : best;
  return order.map(i => points[i]);
}

/**
 * For each leg of an ordered route, the teleporter to warp to instead of walking, or null.
 * A leg a→b teleports when walking from the teleporter nearest b, plus `overhead` (the
 * warp itself, in map pixels), is shorter than walking a→b.
 */
export function teleportLegs(points, teleporters, overhead) {
  const legs = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    let via = null;
    let viaD = Infinity;
    for (const t of teleporters) {
      const d = dist(t, b);
      if (d < viaD) { viaD = d; via = t; }
    }
    legs.push(via && viaD + overhead < dist(a, b) ? via : null);
  }
  return legs;
}

/**
 * Route that respects region unlock order. Stops in an unlocked region (or with no region)
 * are routed freely first; each locked region follows in `progression` order, entered at
 * the stop nearest the previous leg's end. `regionOf(point)` returns a region id or null.
 * `start`, when given, is the pinned first point of the whole route.
 */
export function progressionRoute(points, { regionOf, unlocked, progression, start = null }) {
  const free = [];
  const locked = new Map();
  for (const p of points) {
    const r = regionOf(p);
    if (r == null || unlocked.has(r) || !progression.includes(r)) free.push(p);
    else {
      if (!locked.has(r)) locked.set(r, []);
      locked.get(r).push(p);
    }
  }
  let route = start ? optimizeRoute([start, ...free], 0) : optimizeRoute(free);
  for (const r of progression) {
    const pts = locked.get(r);
    if (!pts) continue;
    const from = route[route.length - 1];
    route = from ? [...route, ...optimizeRoute([from, ...pts], 0).slice(1)] : optimizeRoute(pts);
  }
  return route;
}
