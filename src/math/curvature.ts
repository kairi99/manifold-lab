import { geodesic, unitVelocity } from './geodesic';
import { innerProduct, normalVector } from './metric';
import type { CurvatureAt, GeodesicCircle, Mat2, Riemann2, Surface, Vec2, Vec3 } from './types';
import { det2, inv2, norm, sub } from './vec';

/** R^k_{lij} = ∂_iΓ^k_{jl} − ∂_jΓ^k_{il} + Γ^k_{im}Γ^m_{jl} − Γ^k_{jm}Γ^m_{il}; Γ differentiated by central differences. */
export function riemann(s: Surface, u: number, v: number, h = 1e-4): Riemann2 {
  const G = s.christoffel(u, v);
  const gp = [s.christoffel(u + h, v), s.christoffel(u, v + h)];
  const gm = [s.christoffel(u - h, v), s.christoffel(u, v - h)];
  const dG = (i: number, k: number, a: number, b: number) => (gp[i][k][a][b] - gm[i][k][a][b]) / (2 * h);
  const R: Riemann2 = [0, 1].map(() => [0, 1].map(() => [0, 1].map(() => [0, 0])));
  for (let k = 0; k < 2; k++)
    for (let l = 0; l < 2; l++)
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++) {
          let r = dG(i, k, j, l) - dG(j, k, i, l);
          for (let m = 0; m < 2; m++) r += G[k][i][m] * G[m][j][l] - G[k][j][m] * G[m][i][l];
          R[k][l][i][j] = r;
        }
  return R;
}

/** L_ij = ∂_i∂_j r · n, n = unit(∂_u × ∂_v). */
export function secondFundamentalForm(s: Surface, u: number, v: number, h = 1e-5): Mat2 {
  const n = normalVector(s, u, v);
  const d = (a: Vec3, b: Vec3): Vec3 => sub(a, b);
  const dot3 = (a: Vec3) => a[0] * n[0] + a[1] * n[1] + a[2] * n[2];
  const ruu = dot3(d(s.du(u + h, v), s.du(u - h, v))) / (2 * h);
  const rvv = dot3(d(s.dv(u, v + h), s.dv(u, v - h))) / (2 * h);
  const ruv = 0.5 * (dot3(d(s.du(u, v + h), s.du(u, v - h))) + dot3(d(s.dv(u + h, v), s.dv(u - h, v)))) / (2 * h);
  return [[ruu, ruv], [ruv, rvv]];
}

export function curvatureAt(s: Surface, u: number, v: number): CurvatureAt {
  const g = s.metric(u, v);
  const gi = inv2(g);
  const detg = det2(g);
  const R = riemann(s, u, v);
  // R_{uvuv} = g_{uk} R^k_{vuv}
  const R1212 = g[0][0] * R[0][1][0][1] + g[0][1] * R[1][1][0][1];
  const ricci: Mat2 = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) ricci[i][j] += R[k][i][k][j];
  let scalar = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) scalar += gi[i][j] * ricci[i][j];

  const II = secondFundamentalForm(s, u, v);
  const S: Mat2 = [[0, 0], [0, 0]]; // S = g^{-1} II
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) S[i][j] = gi[i][0] * II[0][j] + gi[i][1] * II[1][j];
  const tr = S[0][0] + S[1][1];
  const dS = det2(S);
  const half = Math.sqrt(Math.max(0, (tr * tr) / 4 - dS));
  const kappa: Vec2 = [tr / 2 - half, tr / 2 + half];

  let dirs: [Vec2, Vec2];
  if (2 * half < 1e-6 * (1 + Math.abs(tr))) {
    // umbilic: any g-orthonormal frame works; use ∂_u/|∂_u| and its g-orthogonal complement
    dirs = [unitVelocity(s, [u, v], 0), unitVelocity(s, [u, v], Math.PI / 2)];
  } else {
    const eig = (lam: number): Vec2 => {
      const a: Vec2 = [S[0][1], lam - S[0][0]];
      const b: Vec2 = [lam - S[1][1], S[1][0]];
      const w = Math.hypot(...a) >= Math.hypot(...b) ? a : b;
      const nn = Math.sqrt(innerProduct(g, w, w));
      return [w[0] / nn, w[1] / nn];
    };
    dirs = [eig(kappa[0]), eig(kappa[1])];
  }
  return {
    Kintrinsic: R1212 / detg,
    Kextrinsic: dS,
    H: tr / 2,
    kappa,
    dirs,
    II,
    riemann: R,
    ricci,
    scalar,
  };
}

/**
 * Geodesic circle of radius rho. If a geodesic stops early (boundary) its last
 * available sample is used, so the circumference is that of the polyline through
 * the points actually reached (an underestimate; Kestimate is then unreliable).
 */
export function geodesicCircle(s: Surface, uv: Vec2, rho: number, n = 96): GeodesicCircle {
  const points: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const path = geodesic(s, uv, unitVelocity(s, uv, (2 * Math.PI * k) / n), rho);
    const e = path.samples[path.samples.length - 1].uv;
    points.push(s.position(e[0], e[1]));
  }
  const loop = (step: number) => {
    let L = 0;
    for (let k = 0; k < n; k += step) L += norm(sub(points[(k + step) % n], points[k]));
    return L;
  };
  // Chord length undershoots by O(1/n²); for even n, Richardson-extrapolate with the half-resolution polygon.
  const L = loop(1);
  const circumference = n % 2 === 0 && n >= 8 ? (4 * L - loop(2)) / 3 : L;
  const Kestimate = (3 * (2 * Math.PI * rho - circumference)) / (Math.PI * rho ** 3);
  return { rho, points, circumference, Kestimate };
}

export function curvatureRange(s: Surface, nu = 48, nv = 48): { min: number; max: number } {
  let min = Infinity, max = -Infinity;
  const { u, v } = s.domain;
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const k = s.gaussK(u[0] + ((u[1] - u[0]) * i) / (nu - 1), v[0] + ((v[1] - v[0]) * j) / (nv - 1));
      if (!Number.isFinite(k)) continue; // degenerate chart points
      if (k < min) min = k;
      if (k > max) max = k;
    }
  return { min, max };
}
