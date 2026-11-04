import {
  SPACETIMES, curvatureAt, defaultParams, lcdmScaleFactor, type Curvature, type Mat4, type SpacetimeMetric,
} from '../math/spacetime';

export const metricById = (id: string): SpacetimeMetric => SPACETIMES.find((m) => m.id === id) ?? SPACETIMES[1];

export interface EventAxis { axis: number; name: string; min: number; max: number; step: number }

/** Sliders for the coordinates that matter at an event; r is kept outside the (outer) horizon. */
export function eventAxes(m: SpacetimeMetric, p: Record<string, number>): EventAxis[] {
  const M = p.M ?? 1, th = { axis: 2, name: 'θ', min: 0.1, max: Math.PI - 0.1, step: 0.01 };
  const r = (min: number) => ({ axis: 1, name: 'r', min, max: Math.max(30 * M, min + 5), step: 0.05 });
  switch (m.id) {
    case 'minkowski': return [r(0.5), th];
    case 'schwarzschild': return [r(2.02 * M), th];
    case 'kerr': return [r(M + Math.sqrt(Math.max(M * M - (p.a ?? 0.7) ** 2, 0)) + 0.05 * M), th];
    case 'rn': return [r((p.Q ?? 0.6) > M ? 0.3 : M + Math.sqrt(M * M - (p.Q ?? 0.6) ** 2) + 0.05 * M), th];
    case 'desitter': return [{ axis: 0, name: 't', min: -1, max: 2, step: 0.01 }];
    default: return [{ axis: 0, name: 't', min: 0.05, max: 3, step: 0.01 }];
  }
}

export interface StModel {
  metric: SpacetimeMetric; p: Record<string, number>; x: number[]; c: Curvature;
  K: number[][]; // sectional curvature of coordinate planes [a][b]
}

/** Sectional curvature of the plane spanned by ∂_a, ∂_b: R_abab / (g_aa g_bb − g_ab²). */
const sectional = (c: Curvature, a: number, b: number) => {
  const d = c.g[a][a] * c.g[b][b] - c.g[a][b] ** 2;
  return d === 0 ? 0 : c.RiemannLow[a][b][a][b] / d;
};

let cache: { key: string; val: StModel } | null = null;
/** Curvature at the (clamped) event; one-entry cache because scene and panel ask every frame. */
export function stModel(id: string, params: Record<string, number>, event: number[] | null): StModel {
  const metric = metricById(id), p = { ...defaultParams(metric), ...params };
  const x = [...(event ?? metric.defaultEvent(p))];
  for (const ax of eventAxes(metric, p)) x[ax.axis] = Math.min(Math.max(x[ax.axis], ax.min), ax.max);
  const key = `${metric.id}|${JSON.stringify(p)}|${x}`;
  if (cache?.key === key) return cache.val;
  const c = curvatureAt(metric, x, p);
  const K = [0, 1, 2, 3].map((a) => [0, 1, 2, 3].map((b) => (a === b ? 0 : sectional(c, a, b))));
  const val = { metric, p, x, c, K };
  cache = { key, val };
  return val;
}

export const maxAbs = (t: unknown): number => (typeof t === 'number' ? Math.abs(t) : (t as unknown[]).reduce<number>((m, v) => Math.max(m, maxAbs(v)), 0));

export interface Einstein { vacuum: boolean; resid: number; ok: boolean; T: Mat4 | null }
/** G_μν against 8πT_μν (T = 0 in vacuum). */
export function einsteinCheck(m: StModel): Einstein {
  const T = m.metric.source ? m.metric.source(m.x, m.p) : null;
  let resid = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) resid = Math.max(resid, Math.abs(m.c.Einstein[i][j] - (T ? 8 * Math.PI * T[i][j] : 0)));
  const scale = 1 + maxAbs(m.c.Einstein) + (T ? 8 * Math.PI * maxAbs(T) : 0);
  return { vacuum: !T, resid, ok: resid < 1e-9 * scale, T };
}

export interface Closed { name: string; tex: string; value: number; numeric: number }
/** Known closed forms (G = c = 1) next to the computed invariants. */
export function closedForms(m: StModel): Closed[] {
  const { x, p, c } = m, M = p.M ?? 1, r = x[1];
  switch (m.metric.id) {
    case 'minkowski': return [{ name: 'K', tex: 'K=0', value: 0, numeric: c.kretschmann }];
    case 'schwarzschild': return [{ name: 'K', tex: 'K=\\dfrac{48M^2}{r^6}', value: 48 * M * M / r ** 6, numeric: c.kretschmann }];
    case 'kerr': {
      const a = p.a ?? 0.7, ac = a * Math.cos(x[2]), S = r * r + ac * ac;
      return [{ name: 'K', tex: 'K=\\dfrac{48M^2(r^2-a^2\\cos^2\\theta)\\left[(r^2+a^2\\cos^2\\theta)^2-16r^2a^2\\cos^2\\theta\\right]}{(r^2+a^2\\cos^2\\theta)^6}',
        value: 48 * M * M * (r * r - ac * ac) * (S * S - 16 * r * r * ac * ac) / S ** 6, numeric: c.kretschmann }];
    }
    case 'rn': { const Q = p.Q ?? 0.6;
      return [{ name: 'K', tex: 'K=\\dfrac{8(6M^2r^2-12MQ^2r+7Q^4)}{r^8}', value: 8 * (6 * M * M * r * r - 12 * M * Q * Q * r + 7 * Q ** 4) / r ** 8, numeric: c.kretschmann }]; }
    case 'desitter': { const H = p.H ?? 1;
      return [{ name: 'R', tex: 'R=12H^2', value: 12 * H * H, numeric: c.scalar }, { name: 'K', tex: 'K=24H^4', value: 24 * H ** 4, numeric: c.kretschmann }]; }
    default: { const Om = p.Om ?? 0.3, a = lcdmScaleFactor(x[0], Om);
      return [{ name: 'G^t_t', tex: 'G^t{}_t=-8\\pi\\rho=-\\left(\\dfrac{3\\Omega_m}{a^3}+3\\Omega_\\Lambda\\right)', value: -(3 * Om / a ** 3 + 3 * (1 - Om)), numeric: c.EinsteinMixed[0][0] }]; }
  }
}
