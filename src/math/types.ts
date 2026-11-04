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
