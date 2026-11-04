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
  /** Spanish display name */
  nameEs?: string;
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
  /** true where the chart degenerates (|∂_u×∂_v| ≈ 0) or the embedding is not finite; Γ and K are NaN there */
  singularAt?(u: number, v: number): boolean;
  /** Euler characteristic when the surface is closed (sphere 2, torus 0); absent for open surfaces */
  euler?: number;
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

/** Riemann tensor of a 2-surface, riemann[k][l][i][j] = R^k_{lij} (convention R(∂_i,∂_j)∂_l = R^k_{lij} ∂_k). */
export type Riemann2 = number[][][][];

export interface CurvatureAt {
  /** intrinsic: from g only, K = R_{1212} / det g */
  Kintrinsic: number;
  /** extrinsic: det(S) = det(II)/det(I) = κ1 κ2 */
  Kextrinsic: number;
  /** mean curvature H = (κ1 + κ2)/2, sign w.r.t. unit normal ∂_u × ∂_v */
  H: number;
  /** principal curvatures κ1 ≤ κ2 */
  kappa: Vec2;
  /** principal directions as tangent components (unit in g), matching kappa */
  dirs: [Vec2, Vec2];
  /** second fundamental form L_ij = ∂_i∂_j r · n */
  II: Mat2;
  riemann: Riemann2;
  /** Ricci tensor R_ij = R^k_{ikj}; equals K g_ij in 2D */
  ricci: Mat2;
  /** scalar curvature g^ij R_ij = 2K in 2D */
  scalar: number;
}

export interface GeodesicCircle {
  rho: number;
  /** closed polyline of geodesic-circle points in R^3 */
  points: Vec3[];
  circumference: number;
  /** Bertrand–Diquet–Puiseux estimate K ≈ 3(2πρ − C)/(πρ³) */
  Kestimate: number;
}

/** An exactly known zero of a preset vector field. */
export interface FieldZero {
  name: string; // e.g. 'north pole (max)'
  nameEs?: string;
  /** point on the surface in R^3 */
  point: Vec3;
  /** small closed loop in the chart encircling the zero once, counter-clockwise w.r.t. the outward/∂u×∂v orientation */
  loop: ParamCurve;
  /** index predicted analytically (tests compare the numeric winding number to this) */
  expectedIndex: number;
}

/** Tangent vector field X = X^u ∂_u + X^v ∂_v on a surface (components in the surface's chart). */
export interface VectorField {
  id: string;
  name: string;
  nameEs?: string;
  /** KaTeX for the components, e.g. 'X = \\partial_\\varphi' */
  latex: string;
  X(u: number, v: number): Vec2;
  /** all zeros on the surface (or in the shown domain for graphs) */
  zeros: FieldZero[];
  /** true if the field is Killing (L_X g = 0); tests verify */
  killing: boolean;
}

export interface FlowLine {
  /** chart samples along the integral curve, t ∈ [0, T] */
  samples: { t: number; uv: Vec2 }[];
  stopped?: 'boundary';
}
