// Tidal tensor and geodesic deviation. Signature −+++, G = c = 1 (lengths in M unless SI helpers).
import { BODIES, C, G, GM_SUN } from '../data/celestial';
import { curvatureAt, schwarzschild, type SpacetimeMetric, type Vec4 } from './spacetime';

export type Mat3 = number[][];

/**
 * E_ij = R_{αβγδ} e_i^α u^β e_j^γ u^δ, so that d²ξ^i/dτ² = −E_ij ξ^j (ξ in the triad, parallel-transported frame).
 * Schwarzschild radial observer: E = diag(−2M/r³, +M/r³, +M/r³) (radial stretching, transverse squeezing).
 */
export function tidalTensor(metric: SpacetimeMetric, x: number[], p: Record<string, number>, u: Vec4, triad: Vec4[]): Mat3 {
  const R = curvatureAt(metric, x, p).RiemannLow, I = [0, 1, 2, 3];
  const Ru = I.map((a) => I.map((g) => I.reduce((s, b) => s + I.reduce((s2, d) => s2 + R[a][b][g][d] * u[b] * u[d], 0), 0))); // R_{aβγδ}u^β u^δ → [α][γ]
  return triad.map((ei) => triad.map((ej) => I.reduce((s, a) => s + I.reduce((s2, g) => s2 + ei[a] * Ru[a][g] * ej[g], 0), 0)));
}

/** Radially moving observer at radius r (dr/dτ = ur) with orthonormal triad (radial, θ̂, φ̂). Requires r > 2M. */
export function radialObserver(r: number, ur: number, M = 1, theta = Math.PI / 2): { u: Vec4; triad: Vec4[] } {
  const f = 1 - (2 * M) / r, ut = Math.sqrt((1 + (ur * ur) / f) / f), E = f * ut;
  return {
    u: [ut, ur, 0, 0],
    triad: [[ur / f, E, 0, 0], [0, 0, 1 / r, 0], [0, 0, 0, 1 / (r * Math.sin(theta))]],
  };
}

/** Radial free fall from rest at r0: r = (r0/2)(1+cos η), τ = sqrt(r0³/8M)(η + sin η). τ clamps to the singularity. */
export function fallState(r0: number, tau: number, M = 1): { r: number; u: Vec4; eta: number } {
  const K = Math.sqrt(r0 ** 3 / (8 * M));
  const t = Math.min(Math.max(tau, 0), Math.PI * K);
  let lo = 0, hi = Math.PI;
  for (let i = 0; i < 60; i++) { const mid = 0.5 * (lo + hi); if (K * (mid + Math.sin(mid)) < t) lo = mid; else hi = mid; }
  const eta = 0.5 * (lo + hi), r = 0.5 * r0 * (1 + Math.cos(eta));
  const f = 1 - (2 * M) / r, E = Math.sqrt(1 - (2 * M) / r0);
  const ur = -(r0 / (2 * K)) * Math.tan(eta / 2); // dr/dτ
  return { r, u: [E / f, ur, 0, 0], eta };
}

/** Triad of the infalling observer (radial boost of the static frame) at event (r, θ). */
export const fallFrame = (r0: number, tau: number, M = 1, theta = Math.PI / 2) => {
  const s = fallState(r0, tau, M);
  return { ...radialObserver(s.r, s.u[1], M, theta), r: s.r };
};

export interface RingResult {
  tau: number[];
  r: number[];
  /** offsets[step][particle] = ξ in the triad (radial, θ̂, φ̂) */
  offsets: Mat3[];
}

/**
 * Integrate the Jacobi equation ξ'' = −E(τ) ξ (RK4) for particles with initial offsets xi0 and ξ̇0 = 0,
 * along radial free fall from rest at r0 in Schwarzschild. Triad is parallel transported along this worldline.
 * tauEnd is clamped just outside the horizon, where Schwarzschild coordinates fail.
 */
export function ringDeformation(opts: { r0: number; M?: number; xi0: Mat3; tauEnd: number; steps: number; theta?: number }): RingResult {
  const { r0, xi0, steps } = opts, M = opts.M ?? 1, theta = opts.theta ?? Math.PI / 2, p = { M };
  const K = Math.sqrt(r0 ** 3 / (8 * M));
  // τ at which r = 2M(1+ε): stay outside the coordinate singularity.
  const etaH = Math.acos((4 * M * 1.001) / r0 - 1), tauH = K * (etaH + Math.sin(etaH));
  const tauEnd = Math.min(opts.tauEnd, tauH), h = tauEnd / steps;
  const Eat = (tau: number) => {
    const s = fallState(r0, tau, M), o = radialObserver(s.r, s.u[1], M, theta);
    return tidalTensor(schwarzschild, [0, s.r, theta, 0], p, o.u, o.triad);
  };
  const E = Array.from({ length: 2 * steps + 1 }, (_, i) => Eat((i * h) / 2)); // E at τ, τ+h/2, τ+h
  const taus = [0], rs = [r0], offsets: Mat3[] = [xi0.map((v) => [...v])];
  let xi = xi0.map((v) => [...v]), vel = xi0.map(() => [0, 0, 0]);
  const acc = (Em: Mat3, q: number[]) => [0, 1, 2].map((i) => -(Em[i][0] * q[0] + Em[i][1] * q[1] + Em[i][2] * q[2]));
  for (let s = 0; s < steps; s++) {
    const E0 = E[2 * s], E1 = E[2 * s + 1], E2 = E[2 * s + 2];
    const nx: number[][] = [], nv: number[][] = [];
    xi.forEach((x0, k) => {
      const v0 = vel[k];
      const add = (a: number[], b: number[], c: number) => a.map((v, i) => v + c * b[i]);
      const k1x = v0, k1v = acc(E0, x0);
      const k2x = add(v0, k1v, h / 2), k2v = acc(E1, add(x0, k1x, h / 2));
      const k3x = add(v0, k2v, h / 2), k3v = acc(E1, add(x0, k2x, h / 2));
      const k4x = add(v0, k3v, h), k4v = acc(E2, add(x0, k3x, h));
      nx.push(x0.map((v, i) => v + (h / 6) * (k1x[i] + 2 * k2x[i] + 2 * k3x[i] + k4x[i])));
      nv.push(v0.map((v, i) => v + (h / 6) * (k1v[i] + 2 * k2v[i] + 2 * k3v[i] + k4v[i])));
    });
    xi = nx; vel = nv;
    taus.push((s + 1) * h); rs.push(fallState(r0, (s + 1) * h, M).r); offsets.push(xi.map((v) => [...v]));
  }
  return { tau: taus, r: rs, offsets };
}

/** N particles on a unit circle in the plane spanned by triad axes a,b (0=radial, 1=θ̂, 2=φ̂), radius L. */
export function ringInitial(n: number, L = 1, a = 0, b = 1): Mat3 {
  return Array.from({ length: n }, (_, k) => {
    const v = [0, 0, 0], ph = (2 * Math.PI * k) / n;
    v[a] = L * Math.cos(ph); v[b] = L * Math.sin(ph);
    return v;
  });
}

// ---- SI helpers ----

/** Tidal acceleration (m/s²) across a length L at distance r from mass with gravitational parameter gm (m³/s²). */
export function tidalAccelerationSI(gm: number, rMeters: number, lengthM: number): { radial: number; transverse: number } {
  const base = (gm * lengthM) / rMeters ** 3;
  return { radial: 2 * base, transverse: base };
}

/** Local reference: 10 M☉ stellar-mass black hole (not in BODIES). */
export const GM_BH_10 = 10 * GM_SUN;

/** Tidal acceleration across L (default 2 m) at the Schwarzschild horizon r = 2GM/c². Newtonian formula, exact in Schwarzschild for a radial infaller's frame. */
export function horizonTidalSI(gm: number, lengthM = 2) {
  const r = (2 * gm) / (C * C);
  return { rHorizon: r, ...tidalAccelerationSI(gm, r, lengthM) };
}

export function horizonTidalForBody(id: string, lengthM = 2) {
  const b = BODIES.find((q) => q.id === id);
  if (!b) throw new Error(`unknown body ${id}`);
  return horizonTidalSI(b.gm, lengthM);
}

export { G };
