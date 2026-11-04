import type { ParamCurve, Surface, TransportSample, Vec2 } from './types';

/** g_ij V^i V^j */
export function normSq(surface: Surface, uv: Vec2, V: Vec2): number {
  const g = surface.metric(uv[0], uv[1]);
  return g[0][0] * V[0] * V[0] + 2 * g[0][1] * V[0] * V[1] + g[1][1] * V[1] * V[1];
}

/** Parallel transport of V0 along curve: dV^k/dt = -Γ^k_ij V^i du^j/dt, classic RK4. */
export function transport(surface: Surface, curve: ParamCurve, V0: Vec2, steps = 600): TransportSample[] {
  const f = (t: number, V: Vec2): Vec2 => {
    const [u, v] = curve.point(t);
    const du = curve.velocity(t);
    const G = surface.christoffel(u, v);
    const out: Vec2 = [0, 0];
    for (let k = 0; k < 2; k++) {
      let s = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += G[k][i][j] * V[i] * du[j];
      out[k] = -s;
    }
    return out;
  };
  const h = 1 / steps;
  let V: Vec2 = [V0[0], V0[1]];
  const out: TransportSample[] = [{ t: 0, uv: curve.point(0), V: [...V] as Vec2 }];
  for (let n = 0; n < steps; n++) {
    const t = n * h;
    const k1 = f(t, V);
    const k2 = f(t + h / 2, [V[0] + (h / 2) * k1[0], V[1] + (h / 2) * k1[1]]);
    const k3 = f(t + h / 2, [V[0] + (h / 2) * k2[0], V[1] + (h / 2) * k2[1]]);
    const k4 = f(t + h, [V[0] + h * k3[0], V[1] + h * k3[1]]);
    V = [
      V[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      V[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    ];
    const t1 = (n + 1) * h;
    out.push({ t: t1, uv: curve.point(t1), V: [V[0], V[1]] });
  }
  return out;
}

/** A transport sample re-expressed in the base chart: undoes the surface's chart identification (Möbius seam, pole), V included. */
export function foldSample(surface: Surface, s: TransportSample): TransportSample {
  const w = surface.chartWrap?.({ uv: s.uv, vel: s.V });
  return w ? { t: s.t, uv: w.uv, V: w.vel } : s;
}

/**
 * Signed angle from V0 to V1 in (-π, π], measured in the orthonormal frame
 * e1 = ∂_u/|∂_u|, e2 = unit part of ∂_v orthogonal to e1. Positive = from e1 toward e2.
 */
export function holonomyAngle(surface: Surface, uv: Vec2, V0: Vec2, V1: Vec2): number {
  const g = surface.metric(uv[0], uv[1]);
  const s11 = Math.sqrt(g[0][0]);
  const w: Vec2 = [-g[0][1] / g[0][0], 1];
  const wn = Math.sqrt(g[1][1] - (g[0][1] * g[0][1]) / g[0][0]);
  const comp = (V: Vec2): Vec2 => {
    const a = (g[0][0] * V[0] + g[0][1] * V[1]) / s11;
    // <V,w> = g_ij V^i w^j
    const b =
      (V[0] * (g[0][0] * w[0] + g[0][1] * w[1]) + V[1] * (g[1][0] * w[0] + g[1][1] * w[1])) / wn;
    return [a, b];
  };
  const a = comp(V0);
  const b = comp(V1);
  return Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
}
