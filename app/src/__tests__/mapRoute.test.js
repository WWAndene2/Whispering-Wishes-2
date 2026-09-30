import { describe, it, expect } from 'vitest';
import { optimizeRoute, routeLength, teleportLegs, progressionRoute } from '../features/map/mapRoute.js';

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

describe('teleportLegs', () => {
  const tps = [{ x: 1000, y: 0 }, { x: 0, y: 500 }];
  it('warps a long leg to the teleporter nearest its destination', () => {
    const legs = teleportLegs([{ x: 0, y: 0 }, { x: 1010, y: 0 }], tps, 128);
    expect(legs).toEqual([tps[0]]);
  });
  it('walks when the warp would not save distance', () => {
    expect(teleportLegs([{ x: 0, y: 0 }, { x: 100, y: 0 }], tps, 128)).toEqual([null]);
    expect(teleportLegs([{ x: 0, y: 0 }, { x: 1010, y: 0 }], [], 128)).toEqual([null]);
  });
});

describe('progressionRoute', () => {
  const regionOf = (p) => p.r;
  const progression = ['a', 'b', 'c'];
  const P = (x, r) => ({ x, y: 0, r });
  it('visits locked regions in progression order after the unlocked ones', () => {
    const pts = [P(0, 'c'), P(10, 'b'), P(20, 'a'), P(30, 'a'), P(40, 'b')];
    const out = progressionRoute(pts, { regionOf, unlocked: new Set(['a']), progression });
    expect(out.slice(0, 2).map(p => p.r)).toEqual(['a', 'a']);
    expect(out.slice(2).map(p => p.r)).toEqual(['b', 'b', 'c']);
  });
  it('treats every region before the furthest unlocked one as unlocked', () => {
    const pts = [P(0, 'c'), P(10, 'a'), P(20, 'b')];
    const out = progressionRoute(pts, { regionOf, unlocked: new Set(['b']), progression });
    // a and b are routed together (nearest-first from either end), c comes last.
    expect(out[2].r).toBe('c');
    expect(new Set(out.slice(0, 2).map(p => p.r))).toEqual(new Set(['a', 'b']));
  });
  it('keeps the pinned start first', () => {
    const start = { x: 100, y: 0, isStart: true };
    const out = progressionRoute([P(0, 'a'), P(50, 'b')], { regionOf, unlocked: new Set(), progression, start });
    expect(out[0]).toBe(start);
    expect(out.slice(1).map(p => p.r)).toEqual(['a', 'b']);
  });
});
