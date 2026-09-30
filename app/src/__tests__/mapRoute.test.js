import { describe, it, expect } from 'vitest';
import { optimizeRoute, routeLength } from '../features/map/mapRoute.js';

const pts = (arr) => arr.map(([x, y], i) => ({ id: i, x, y }));

describe('optimizeRoute', () => {
  it('visits every point exactly once', () => {
    const p = pts([[0, 0], [50, 10], [10, 40], [90, 90], [30, 70], [70, 20]]);
    const r = optimizeRoute(p);
    expect(r.map(q => q.id).sort()).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('orders points on a line end to end', () => {
    const p = pts([[30, 0], [0, 0], [20, 0], [10, 0], [40, 0]]);
    expect(routeLength(optimizeRoute(p))).toBe(40);
  });
  it('is never longer than the input order', () => {
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed % 1000; };
    const p = pts(Array.from({ length: 40 }, () => [rand(), rand()]));
    expect(routeLength(optimizeRoute(p))).toBeLessThanOrEqual(routeLength(p));
  });
  it('keeps a pinned start first', () => {
    const p = pts([[0, 0], [100, 0], [50, 0], [25, 0]]);
    expect(optimizeRoute(p, 2)[0].id).toBe(2);
  });
  it('handles tiny inputs', () => {
    expect(optimizeRoute([])).toEqual([]);
    expect(optimizeRoute(pts([[1, 1]]))).toHaveLength(1);
  });
});
