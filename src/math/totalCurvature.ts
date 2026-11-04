import type { Surface } from './types';

// 5-point Gauss–Legendre nodes/weights on [-1,1]
const X = [0, 0.5384693101056831, -0.5384693101056831, 0.906179845938664, -0.906179845938664];
const W = [0.5688888888888889, 0.47862867049936647, 0.47862867049936647, 0.23692688505618908, 0.23692688505618908];

/**
 * ∬ K dA = ∬ K √det g du dv over the whole chart domain, composite 5-point Gauss–Legendre on n×n panels.
 * Nodes never sit on the domain boundary; non-finite integrand values (singular points) are skipped.
 * The built-in sphere's domain is clipped at ε from the poles for meshing, so its true range [0, π] is used.
 */
export function totalCurvature(s: Surface, n = 20): number {
  const [u0, u1] = s.id === 'sphere' ? [0, Math.PI] : s.domain.u;
  const [v0, v1] = s.domain.v;
  const hu = (u1 - u0) / n, hv = (v1 - v0) / n;
  let sum = 0;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
      const u = u0 + (a + 0.5 + X[i] / 2) * hu, v = v0 + (b + 0.5 + X[j] / 2) * hv;
      if (s.singularAt?.(u, v)) continue;
      const g = s.metric(u, v);
      const f = s.gaussK(u, v) * Math.sqrt(g[0][0] * g[1][1] - g[0][1] * g[1][0]);
      if (Number.isFinite(f)) sum += W[i] * W[j] * f * hu * hv / 4;
    }
  }
  return sum;
}
