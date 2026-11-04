// 4D spacetime metrics (signature −+++, MTW conventions, G = c = 1) and exact curvature from 2-jets of g.
// Γ^ρ_μν = ½ g^{ρλ}(∂_μ g_λν + ∂_ν g_λμ − ∂_λ g_μν);  R^ρ_σμν = ∂_μΓ^ρ_νσ − ∂_νΓ^ρ_μσ + Γ^ρ_μλΓ^λ_νσ − Γ^ρ_νλΓ^λ_μσ.
import * as J from './jet';
import type { Jet } from './jet';

export type Mat4 = number[][];
export type Vec4 = number[];

export interface MetricParam { key: string; label: string; min: number; max: number; step: number; value: number }

export interface SpacetimeMetric {
  id: string;
  name: string;
  coords: [string, string, string, string]; // LaTeX
  params: MetricParam[];
  lineElement: string; // LaTeX
  defaultEvent(p: Record<string, number>): Vec4;
  /** Metric components as jets in the 4 coordinates (x are the coordinate variables). */
  g(x: Jet[], p: Record<string, number>): Jet[][];
  /** Covariant stress-energy T_μν at x; omitted = vacuum. */
  source?: (x: number[], p: Record<string, number>) => Mat4;
  domainNote?: string;
}

const Z = () => J.constant(4, 0);
const zeros4 = (): Jet[][] => Array.from({ length: 4 }, () => Array.from({ length: 4 }, Z));
const pv = (p: Record<string, number>, k: string, d: number) => p[k] ?? d;
const mat = (f: (i: number, j: number) => number): Mat4 => Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => f(i, j)));

export const minkowskiSpherical: SpacetimeMetric = {
  id: 'minkowski', name: 'Minkowski (spherical coordinates)',
  coords: ['t', 'r', '\\theta', '\\varphi'], params: [],
  lineElement: 'ds^2=-dt^2+dr^2+r^2d\\theta^2+r^2\\sin^2\\theta\\,d\\varphi^2',
  defaultEvent: () => [0, 5, Math.PI / 2, 0],
  g([, r, th]) {
    const m = zeros4(), s = J.sin(th);
    m[0][0] = J.constant(4, -1); m[1][1] = J.constant(4, 1);
    m[2][2] = J.mul(r, r); m[3][3] = J.mul(m[2][2], J.mul(s, s));
    return m;
  },
  domainNote: 'r > 0, 0 < θ < π. Christoffels are nonzero here, yet Riemann vanishes: curved coordinates, flat space.',
};

export const schwarzschild: SpacetimeMetric = {
  id: 'schwarzschild', name: 'Schwarzschild',
  coords: ['t', 'r', '\\theta', '\\varphi'],
  params: [{ key: 'M', label: 'M', min: 0.1, max: 5, step: 0.1, value: 1 }],
  lineElement: 'ds^2=-f\\,dt^2+f^{-1}dr^2+r^2d\\Omega^2,\; f=1-\\tfrac{2M}{r}',
  defaultEvent: (p) => [0, 6 * pv(p, 'M', 1), Math.PI / 2, 0],
  g([, r, th], p) {
    const M = pv(p, 'M', 1), m = zeros4(), s = J.sin(th);
    const f = J.add(1, J.div(-2 * M, r));
    m[0][0] = J.neg(f); m[1][1] = J.div(1, f);
    m[2][2] = J.mul(r, r); m[3][3] = J.mul(m[2][2], J.mul(s, s));
    return m;
  },
  domainNote: 'r > 2M (Schwarzschild coordinates are singular at the horizon), 0 < θ < π.',
};

export const kerr: SpacetimeMetric = {
  id: 'kerr', name: 'Kerr (Boyer–Lindquist)',
  coords: ['t', 'r', '\\theta', '\\varphi'],
  params: [
    { key: 'M', label: 'M', min: 0.1, max: 5, step: 0.1, value: 1 },
    { key: 'a', label: 'a', min: 0, max: 0.998, step: 0.001, value: 0.7 },
  ],
  lineElement: 'ds^2=-(1-\\tfrac{2Mr}{\\Sigma})dt^2-\\tfrac{4Mar\\sin^2\\theta}{\\Sigma}dt\\,d\\varphi+\\tfrac{\\Sigma}{\\Delta}dr^2+\\Sigma d\\theta^2+(r^2+a^2+\\tfrac{2Ma^2r\\sin^2\\theta}{\\Sigma})\\sin^2\\theta\\,d\\varphi^2',
  defaultEvent: (p) => [0, 6 * pv(p, 'M', 1), Math.PI / 3, 0],
  g([, r, th], p) {
    const M = pv(p, 'M', 1), a = pv(p, 'a', 0.7), m = zeros4();
    const s2 = J.pow(J.sin(th), 2), c2 = J.pow(J.cos(th), 2), r2 = J.mul(r, r);
    const sig = J.add(r2, J.scale(c2, a * a));
    const del = J.add(J.sub(r2, J.scale(r, 2 * M)), a * a);
    const x = J.div(J.scale(r, 2 * M), sig); // 2Mr/Σ
    m[0][0] = J.sub(x, 1);
    m[0][3] = m[3][0] = J.neg(J.scale(J.mul(x, s2), a));
    m[1][1] = J.div(sig, del); m[2][2] = sig;
    m[3][3] = J.mul(J.add(J.add(r2, a * a), J.scale(J.mul(x, s2), a * a)), s2);
    return m;
  },
  domainNote: 'Outside the outer horizon r₊ = M + √(M²−a²); ring singularity at r=0, θ=π/2.',
};

export const reissnerNordstrom: SpacetimeMetric = {
  id: 'rn', name: 'Reissner–Nordström',
  coords: ['t', 'r', '\\theta', '\\varphi'],
  params: [
    { key: 'M', label: 'M', min: 0.1, max: 5, step: 0.1, value: 1 },
    { key: 'Q', label: 'Q', min: 0, max: 1, step: 0.01, value: 0.6 },
  ],
  lineElement: 'ds^2=-f\\,dt^2+f^{-1}dr^2+r^2d\\Omega^2,\; f=1-\\tfrac{2M}{r}+\\tfrac{Q^2}{r^2}',
  defaultEvent: (p) => [0, 6 * pv(p, 'M', 1), Math.PI / 2, 0],
  g([, r, th], p) {
    const M = pv(p, 'M', 1), Q = pv(p, 'Q', 0.6), m = zeros4(), s = J.sin(th);
    const f = J.add(J.add(1, J.div(-2 * M, r)), J.div(Q * Q, J.mul(r, r)));
    m[0][0] = J.neg(f); m[1][1] = J.div(1, f);
    m[2][2] = J.mul(r, r); m[3][3] = J.mul(m[2][2], J.mul(s, s));
    return m;
  },
  // Radial electric field: T^t_t = T^r_r = −Q²/(8πr⁴), T^θ_θ = T^φ_φ = +Q²/(8πr⁴)  (G^t_t = −Q²/r⁴).
  source([, r, th], p) {
    const M = pv(p, 'M', 1), Q = pv(p, 'Q', 0.6), f = 1 - (2 * M) / r + (Q * Q) / (r * r);
    const e = (Q * Q) / (8 * Math.PI * r ** 4), T = mat(() => 0);
    T[0][0] = f * e; T[1][1] = -e / f; T[2][2] = r * r * e; T[3][3] = r * r * Math.sin(th) ** 2 * e;
    return T;
  },
  domainNote: 'r > r₊ = M + √(M²−Q²); need |Q| ≤ M for a black hole.',
};

const flatScaled = (a: Jet): Jet[][] => {
  const m = zeros4(), a2 = J.mul(a, a);
  m[0][0] = J.constant(4, -1); m[1][1] = a2; m[2][2] = J.mul(a2, 1); m[3][3] = J.mul(a2, 1);
  return m;
};

export const deSitter: SpacetimeMetric = {
  id: 'desitter', name: 'de Sitter (flat slicing)',
  coords: ['t', 'x', 'y', 'z'],
  params: [{ key: 'H', label: 'H', min: 0.1, max: 2, step: 0.05, value: 1 }],
  lineElement: 'ds^2=-dt^2+e^{2Ht}(dx^2+dy^2+dz^2)',
  defaultEvent: () => [0, 0, 0, 0],
  g([t], p) { return flatScaled(J.exp(J.scale(t, pv(p, 'H', 1)))); },
  // Λ-fluid: T_μν = −ρ_Λ g_μν, ρ_Λ = 3H²/8π.
  source([t], p) {
    const H = pv(p, 'H', 1), a2 = Math.exp(2 * H * t), rho = (3 * H * H) / (8 * Math.PI);
    return mat((i, j) => (i !== j ? 0 : i === 0 ? rho : -rho * a2));
  },
};

/** Flat ΛCDM scale factor, H0 = 1: a = (Ωm/ΩΛ)^{1/3} sinh^{2/3}(1.5 √ΩΛ t). */
export const lcdmScaleFactor = (t: number, Om: number) => (Om / (1 - Om)) ** (1 / 3) * Math.sinh(1.5 * Math.sqrt(1 - Om) * t) ** (2 / 3);

export const flrwLCDM: SpacetimeMetric = {
  id: 'flrw', name: 'Flat ΛCDM FLRW',
  coords: ['t', 'x', 'y', 'z'],
  params: [{ key: 'Om', label: '\\Omega_m', min: 0.05, max: 0.95, step: 0.01, value: 0.3 }],
  lineElement: 'ds^2=-dt^2+a(t)^2(dx^2+dy^2+dz^2),\; a=(\\Omega_m/\\Omega_\\Lambda)^{1/3}\\sinh^{2/3}(\\tfrac32\\sqrt{\\Omega_\\Lambda}H_0t)',
  defaultEvent: () => [0.9, 0, 0, 0],
  g([t], p) {
    const Om = pv(p, 'Om', 0.3), OL = 1 - Om;
    const a = J.scale(J.pow(J.sinh(J.scale(t, 1.5 * Math.sqrt(OL))), 2 / 3), (Om / OL) ** (1 / 3));
    return flatScaled(a);
  },
  // Dust + Λ: T_tt = ρ_m + ρ_Λ, T_ij = −ρ_Λ a² δ_ij  (8πρ_m = 3Ωm/a³, 8πρ_Λ = 3ΩΛ, H0 = 1).
  source([t], p) {
    const Om = pv(p, 'Om', 0.3), a = lcdmScaleFactor(t, Om);
    const rm = (3 * Om) / (8 * Math.PI * a ** 3), rl = (3 * (1 - Om)) / (8 * Math.PI);
    return mat((i, j) => (i !== j ? 0 : i === 0 ? rm + rl : -rl * a * a));
  },
  domainNote: 't > 0 (big-bang singularity at t = 0). Units H0 = 1.',
};

export const SPACETIMES: SpacetimeMetric[] = [minkowskiSpherical, schwarzschild, kerr, reissnerNordstrom, deSitter, flrwLCDM];

export const defaultParams = (m: SpacetimeMetric): Record<string, number> => Object.fromEntries(m.params.map((q) => [q.key, q.value]));

/** Metric values (numbers) at x. */
export function metricAt(m: SpacetimeMetric, x: number[], p: Record<string, number>): Mat4 {
  return m.g(x.map((v, i) => J.variable(4, i, v)), p).map((row) => row.map((e) => e.v));
}

export function invert4(a: Mat4): Mat4 {
  const n = 4, m = a.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (m[piv][c] === 0) throw new Error('singular metric');
    [m[c], m[piv]] = [m[piv], m[c]];
    const d = m[c][c];
    for (let k = 0; k < 2 * n; k++) m[c][k] /= d;
    for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c]; if (f) for (let k = 0; k < 2 * n; k++) m[r][k] -= f * m[c][k]; }
  }
  return m.map((r) => r.slice(n));
}

const R4 = [0, 1, 2, 3];
const t3 = (f: (a: number, b: number, c: number) => number) => R4.map((a) => R4.map((b) => R4.map((c) => f(a, b, c))));

export interface Curvature {
  g: Mat4; ginv: Mat4;
  Gamma: number[][][];       // Γ^ρ_μν  [ρ][μ][ν]
  Riemann: number[][][][];   // R^ρ_σμν [ρ][σ][μ][ν]
  RiemannLow: number[][][][]; // R_ρσμν
  Ricci: Mat4; scalar: number;
  Einstein: Mat4;            // G_μν
  EinsteinMixed: Mat4;       // G^μ_ν
  kretschmann: number; weylSq: number;
}

export function curvatureAt(metric: SpacetimeMetric, x: number[], p: Record<string, number>): Curvature {
  const gj = metric.g(x.map((v, i) => J.variable(4, i, v)), p);
  const g = mat((i, j) => gj[i][j].v);
  const dg = t3((k, i, j) => gj[i][j].g[k]);                         // ∂_k g_ij
  const ddg = R4.map((k) => R4.map((l) => mat((i, j) => gj[i][j].h[k * 4 + l]))); // ∂_k∂_l g_ij
  const ginv = invert4(g);
  // ∂_k g^{ij} = −g^{ia} ∂_k g_ab g^{bj}
  const dginv = R4.map((k) => mat((i, j) => -R4.reduce((s, a) => s + R4.reduce((s2, b) => s2 + ginv[i][a] * dg[k][a][b] * ginv[b][j], 0), 0)));
  const Gl = t3((l, m, n) => 0.5 * (dg[m][l][n] + dg[n][l][m] - dg[l][m][n])); // Γ_{λμν}
  const dGl = R4.map((k) => t3((l, m, n) => 0.5 * (ddg[k][m][l][n] + ddg[k][n][l][m] - ddg[k][l][m][n])));
  const Gamma = t3((r, m, n) => R4.reduce((s, l) => s + ginv[r][l] * Gl[l][m][n], 0));
  const dGamma = R4.map((k) => t3((r, m, n) => R4.reduce((s, l) => s + dginv[k][r][l] * Gl[l][m][n] + ginv[r][l] * dGl[k][l][m][n], 0))); // [k][ρ][μ][ν]
  const Riemann = R4.map((r) => R4.map((s) => R4.map((m) => R4.map((n) =>
    dGamma[m][r][n][s] - dGamma[n][r][m][s] +
    R4.reduce((acc, l) => acc + Gamma[r][m][l] * Gamma[l][n][s] - Gamma[r][n][l] * Gamma[l][m][s], 0)))));
  const RiemannLow = R4.map((r) => R4.map((s) => R4.map((m) => R4.map((n) => R4.reduce((acc, l) => acc + g[r][l] * Riemann[l][s][m][n], 0)))));
  const Ricci = mat((s, n) => R4.reduce((acc, r) => acc + Riemann[r][s][r][n], 0));
  const scalar = R4.reduce((s, a) => s + R4.reduce((s2, b) => s2 + ginv[a][b] * Ricci[a][b], 0), 0);
  const Einstein = mat((i, j) => Ricci[i][j] - 0.5 * scalar * g[i][j]);
  const EinsteinMixed = mat((i, j) => R4.reduce((s, k) => s + ginv[i][k] * Einstein[k][j], 0));
  // Kretschmann: raise all four slots of R_abcd with g^{-1}, then contract with R_abcd.
  let up = RiemannLow;
  for (let slot = 0; slot < 4; slot++) {
    up = R4.map((a) => R4.map((b) => R4.map((c) => R4.map((d) => {
      const idx = [a, b, c, d];
      return R4.reduce((s, e) => { const j = [...idx]; j[slot] = e; return s + ginv[idx[slot]][e] * up[j[0]][j[1]][j[2]][j[3]]; }, 0);
    }))));
  }
  let kretschmann = 0;
  for (const a of R4) for (const b of R4) for (const c of R4) for (const d of R4) kretschmann += RiemannLow[a][b][c][d] * up[a][b][c][d];
  const RicSq = R4.reduce((s, a) => s + R4.reduce((s2, b) => s2 + ricciSqTerm(Ricci, ginv, a, b), 0), 0);
  const weylSq = kretschmann - 2 * RicSq + (scalar * scalar) / 3; // 4D identity
  return { g, ginv, Gamma, Riemann, RiemannLow, Ricci, scalar, Einstein, EinsteinMixed, kretschmann, weylSq };
}

/** Term R_ab g^{ac} g^{bd} R_cd of R_ab R^ab; the caller sums over (a,b). */
function ricciSqTerm(R: Mat4, gi: Mat4, a: number, b: number): number {
  let s = 0;
  for (const c of R4) for (const d of R4) s += gi[a][c] * gi[b][d] * R[c][d];
  return s * R[a][b];
}

export type Symmetry = { a: number; b: number; sign: 1 | -1 };
export interface Component { idx: number[]; label: string; value: number }

/**
 * Independent nonzero components of a nested-array tensor.
 * symmetries: index-slot pairs (a,b) that are (anti)symmetric; only idx[a] <= idx[b] kept.
 * pairExchange: rank-4 only, keeps (idx0,idx1) <= (idx2,idx3) lexicographically (R_abcd = R_cdab).
 */
export function nonzeroComponents(
  tensor: unknown, tol = 1e-12, symmetries: Symmetry[] = [], names: string[] = ['t', 'r', 'θ', 'φ'], pairExchange = false,
): Component[] {
  const out: Component[] = [];
  const walk = (t: unknown, idx: number[]) => {
    if (typeof t === 'number') {
      if (Math.abs(t) <= tol) return;
      if (symmetries.some(({ a, b, sign }) => idx[a] > idx[b] || (sign === -1 && idx[a] === idx[b]))) return;
      if (pairExchange && idx[0] * 4 + idx[1] > idx[2] * 4 + idx[3]) return;
      out.push({ idx, label: idx.map((i) => names[i]).join(''), value: t });
      return;
    }
    (t as unknown[]).forEach((c, i) => walk(c, [...idx, i]));
  };
  walk(tensor, []);
  return out;
}
