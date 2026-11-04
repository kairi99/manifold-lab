import type { Mat2, Surface, Vec2 } from './types';

export interface TissotEllipse {
  /** semi-axes: r1 along `angle`, r2 along `angle + π/2` (coordinate units, chart basis) */
  r1: number; r2: number; angle: number;
}

/** Ellipse {w : g_ij w^i w^j = ε²} in the (u,v) chart, from the eigen-decomposition of g. */
export function tissotEllipse(g: Mat2, eps: number): TissotEllipse {
  const [a, b, d] = [g[0][0], g[0][1], g[1][1]];
  const angle = 0.5 * Math.atan2(2 * b, a - d); // eigenvector of the larger eigenvalue
  const m = (a + d) / 2, r = Math.hypot((a - d) / 2, b);
  return { r1: eps / Math.sqrt(m + r), r2: eps / Math.sqrt(Math.max(m - r, 1e-300)), angle };
}

/** n points of the ellipse as chart displacement vectors (w^u, w^v). */
export function tissotPoints(g: Mat2, eps: number, n = 32): Vec2[] {
  const { r1, r2, angle } = tissotEllipse(g, eps), c = Math.cos(angle), s = Math.sin(angle);
  return Array.from({ length: n }, (_, k) => {
    const t = (2 * Math.PI * k) / n, x = r1 * Math.cos(t), y = r2 * Math.sin(t);
    return [c * x - s * y, s * x + c * y];
  });
}

/** Chart degenerates at (u,v): flagged by the surface, or det g ≈ 0 / non-finite. */
export function chartSingular(s: Surface, u: number, v: number): boolean {
  if (s.singularAt?.(u, v)) return true;
  const g = s.metric(u, v), d = g[0][0] * g[1][1] - g[0][1] * g[1][0];
  return !Number.isFinite(d) || Math.abs(d) < 1e-9;
}
