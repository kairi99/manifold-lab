// Contract shared by math, scene and module code. Index convention: 0 = u, 1 = v.
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Mat2 = [[number, number], [number, number]];
/** Christoffel symbols of the 2nd kind: gamma[k][i][j] = Γ^k_ij, symmetric in i,j. */
export type Christoffel = [Mat2, Mat2];

export interface SurfaceParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface Surface {
  id: string;
  name: string;
  /** coordinate names for UI/LaTeX, e.g. ['\\theta', '\\varphi'] */
  coords: [string, string];
  /** parameter domain; periodic flags allow wrapping */
  domain: { u: [number, number]; v: [number, number]; periodicU: boolean; periodicV: boolean };
  position(u: number, v: number): Vec3;
  /** ∂_u r and ∂_v r in R^3 */
  du(u: number, v: number): Vec3;
  dv(u: number, v: number): Vec3;
  metric(u: number, v: number): Mat2;
  christoffel(u: number, v: number): Christoffel;
  gaussK(u: number, v: number): number;
  latex: { param: string; metric: string; christoffel: string };
  /** see ChartWrap; absent → periodic coords wrap, others stop at the boundary */
  chartWrap?: ChartWrap;
}

/** A closed or open curve in parameter space, t in [0,1]. */
export interface ParamCurve {
  point(t: number): Vec2;
  velocity(t: number): Vec2; // d(u,v)/dt
}

export interface TransportSample {
  t: number;
  uv: Vec2;
  V: Vec2; // components V^u, V^v
}

/** Point + coordinate velocity (u̇, v̇) of a curve in the chart. */
export interface ChartState { uv: Vec2; vel: Vec2 }

export interface GeodesicSample { s: number; uv: Vec2; vel: Vec2 }
export interface GeodesicPath {
  samples: GeodesicSample[];
  /** why integration ended early, if it did */
  stopped?: 'boundary';
}

/**
 * Optional chart identification for surfaces whose chart has coordinate singularities.
 * Given a state that has left the nominal domain, return the same point/velocity in-domain,
 * or null if the curve has truly left the surface. Sphere: (θ,φ) → (−θ, φ+π) through a pole.
 */
export type ChartWrap = (st: ChartState) => ChartState | null;
