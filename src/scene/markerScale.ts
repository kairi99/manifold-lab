import { useMemo } from 'react';
import type { Surface } from '../math/types';

const cache = new WeakMap<Surface, number>();
const UNIT_SPHERE_DIAG = 2 * Math.sqrt(3);

/** Marker size factor: bounding-box diagonal of the surface relative to the unit sphere's (1 for the sphere, <1 small, >1 large). */
export function markerScale(s: Surface): number {
  let k = cache.get(s);
  if (k === undefined) {
    const { u: [u0, u1], v: [v0, v1] } = s.domain;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    const N = 24;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const p = s.position(u0 + ((u1 - u0) * i) / N, v0 + ((v1 - v0) * j) / N);
      if (!p.every(Number.isFinite)) continue;
      p.forEach((x, c) => { lo[c] = Math.min(lo[c], x); hi[c] = Math.max(hi[c], x); });
    }
    const d = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / UNIT_SPHERE_DIAG;
    // tiny or huge surfaces still get usable markers; degenerate/non-finite extents fall back to 1
    k = Number.isFinite(d) && d > 0 ? Math.min(100, Math.max(0.01, d)) : 1;
    cache.set(s, k);
  }
  return k;
}

export const useMarkerScale = (s: Surface): number => useMemo(() => markerScale(s), [s]);
