// Willmore energy W = ∫ H² dA and umbilics of the ellipsoid. Pure numerics, no React.
export type V3 = [number, number, number];
export type Surf = (u: number, v: number) => V3;

const TAU = 2 * Math.PI;
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3) => Math.hypot(a[0], a[1], a[2]);

// ---------------------------------------------------------------- torus of revolution

/** Torus with ratio c = R/r and outer radius R + r = 1 (fixed overall size). Axis along y. */
export function torusParams(c: number) {
  const r = 1 / (1 + c);
  return { R: c * r, r };
}
export const torusSurf = (R: number, r: number): Surf => (u, v): V3 => {
  const q = R + r * Math.cos(v);
  return [q * Math.cos(u), r * Math.sin(v), q * Math.sin(u)];
};

/** Closed form W = π² c² / √(c² − 1), c = R/r > 1. */
export const torusWClosed = (c: number) => (Math.PI * Math.PI * c * c) / Math.sqrt(c * c - 1);

/** 1-D quadrature of ∫∫ ((κ₁+κ₂)/2)² r (R + r cos v) du dv with κ₁ = 1/r, κ₂ = cos v/(R + r cos v). */
export function torusWQuad(c: number, n = 4000) {
  const r = 1, R = c; // W is scale invariant
  let s = 0;
  for (let i = 0; i < n; i++) {
    const v = ((i + 0.5) * TAU) / n, q = R + r * Math.cos(v);
    const H = (1 / r + Math.cos(v) / q) / 2;
    s += H * H * r * q;
  }
  return TAU * s * (TAU / n);
}

// ---------------------------------------------------------------- inversion

/** x ↦ c + ρ²(x − c)/|x − c|² (c must be off the surface). */
export const invert = (p: V3, c: V3, rho2: number): V3 => {
  const d = sub(p, c), k = rho2 / dot(d, d);
  return [c[0] + k * d[0], c[1] + k * d[1], c[2] + k * d[2]];
};

/**
 * Inversion family for the torus: centre (0, h, 0) on the axis (never touches the torus), ρ² = h² + R² − r².
 * s = 0 is the torus itself; s → 1 moves the centre to the torus centre, where ρ² = R² − r² maps the
 * torus to itself. In between (and for any other centre) the image is a Dupin cyclide.
 */
export function invertedTorus(c: number, s: number): { f: Surf; centre: V3; rho2: number } {
  const { R, r } = torusParams(c), base = torusSurf(R, r);
  const h = s < 1e-3 ? 1e3 : (0.4 * (1 - s)) / s + 0.05;
  const centre: V3 = [0, h, 0], rho2 = h * h + R * R - r * r;
  return { f: s < 1e-3 ? base : (u, v) => invert(base(u, v), centre, rho2), centre, rho2 };
}

// ---------------------------------------------------------------- generic closed parametrised surface

export type Sampled = {
  nu: number; nv: number;
  pos: Float32Array; normal: Float32Array; H2: Float32Array;
  W: number; intK: number; area: number;
};

/**
 * Samples f on a periodic nu × nv grid of [0,2π)². E, F, G, L, M, N from central finite differences
 * (step hs), H = (EN − 2FM + GL) / (2(EG − F²)), K = (LN − M²)/(EG − F²), dA = |f_u × f_v|.
 * The periodic trapezoid rule is spectrally accurate for these smooth integrands.
 */
export function sampleSurface(f: Surf, nu = 96, nv = 64, hs = 1e-3, off = 0): Sampled {
  const n = nu * nv;
  const pos = new Float32Array(3 * n), normal = new Float32Array(3 * n), H2 = new Float32Array(n);
  let W = 0, intK = 0, area = 0;
  const du = TAU / nu, dv = TAU / nv;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const u = (i + off) * du, v = (j + off) * dv;
    const p = f(u, v);
    const up = f(u + hs, v), um = f(u - hs, v), vp = f(u, v + hs), vm = f(u, v - hs);
    const a = f(u + hs, v + hs), b = f(u + hs, v - hs), c = f(u - hs, v + hs), d = f(u - hs, v - hs);
    const fu = sub(up, um).map((x) => x / (2 * hs)) as V3, fv = sub(vp, vm).map((x) => x / (2 * hs)) as V3;
    const fuu: V3 = [0, 0, 0], fvv: V3 = [0, 0, 0], fuv: V3 = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      fuu[k] = (up[k] - 2 * p[k] + um[k]) / (hs * hs);
      fvv[k] = (vp[k] - 2 * p[k] + vm[k]) / (hs * hs);
      fuv[k] = (a[k] - b[k] - c[k] + d[k]) / (4 * hs * hs);
    }
    const nn = cross(fu, fv), dA = norm(nn), nrm: V3 = [nn[0] / dA, nn[1] / dA, nn[2] / dA];
    const E = dot(fu, fu), F = dot(fu, fv), G = dot(fv, fv);
    const L = dot(fuu, nrm), M = dot(fuv, nrm), N = dot(fvv, nrm);
    const det = E * G - F * F;
    const H = (E * N - 2 * F * M + G * L) / (2 * det), K = (L * N - M * M) / det;
    const idx = i * nv + j;
    pos.set(p, 3 * idx); normal.set(nrm, 3 * idx); H2[idx] = H * H;
    W += H * H * dA * du * dv; intK += K * dA * du * dv; area += dA * du * dv;
  }
  return { nu, nv, pos, normal, H2, W, intK, area };
}

let cache: { key: string; val: Sampled } | null = null;
/** Single-entry cache so the scene and the panel share one computation per (c, s). */
export function torusData(c: number, s: number): Sampled {
  const key = `${c}|${s}`;
  if (cache?.key !== key) cache = { key, val: sampleSurface(invertedTorus(c, s).f) };
  return cache.val;
}

// ---------------------------------------------------------------- ellipsoid x²/a² + y²/b² + z²/c² = 1

export type Ax = readonly [number, number, number];

/**
 * Principal curvatures of the ellipsoid at a point p on it, from the shape operator P ∇²F P / |∇F|.
 * Returns κ₁ ≥ κ₂ > 0 and the unit max-curvature direction.
 */
export function ellipsoidCurv(ax: Ax, p: V3) {
  const g: V3 = [2 * p[0] / ax[0] ** 2, 2 * p[1] / ax[1] ** 2, 2 * p[2] / ax[2] ** 2];
  const gn = norm(g), n: V3 = [g[0] / gn, g[1] / gn, g[2] / gn];
  const Hs = (x: V3): V3 => [2 * x[0] / ax[0] ** 2, 2 * x[1] / ax[1] ** 2, 2 * x[2] / ax[2] ** 2];
  // orthonormal tangent basis
  const w: V3 = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let e1 = cross(n, w); const l = norm(e1); e1 = [e1[0] / l, e1[1] / l, e1[2] / l];
  const e2 = cross(n, e1);
  const s11 = dot(e1, Hs(e1)) / gn, s22 = dot(e2, Hs(e2)) / gn, s12 = dot(e1, Hs(e2)) / gn;
  const mean = (s11 + s22) / 2, half = Math.hypot((s11 - s22) / 2, s12); // stable at umbilics
  const th = 0.5 * Math.atan2(2 * s12, s11 - s22);
  const dir: V3 = [0, 1, 2].map((k) => Math.cos(th) * e1[k] + Math.sin(th) * e2[k]) as unknown as V3;
  return { k1: mean + half, k2: mean - half, diff: 2 * half, dir, normal: n };
}

/** Umbilics of a ≥ b ≥ c as distinct points: 4 (triaxial), 2 (spheroid), 0 listed for the sphere (all points). */
export function ellipsoidUmbilics(ax: Ax): V3[] {
  const [a, b, c] = ax, tol = 1e-9 * a;
  if (a - c < tol) return []; // sphere
  const x = a * Math.sqrt(Math.max(0, (a * a - b * b) / (a * a - c * c)));
  const z = c * Math.sqrt(Math.max(0, (b * b - c * c) / (a * a - c * c)));
  const out: V3[] = [];
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    const q: V3 = [sx * x, 0, sz * z];
    if (!out.some((o) => norm(sub(o, q)) < tol)) out.push(q);
  }
  return out;
}

/** Point of the ellipsoid at colatitude θ about the y axis and longitude φ. */
export const ellipsoidPt = (ax: Ax, th: number, ph: number): V3 =>
  [ax[0] * Math.sin(th) * Math.cos(ph), ax[1] * Math.cos(th), ax[2] * Math.sin(th) * Math.sin(ph)];

/** Enforce a ≥ b ≥ c after changing one entry (the changed entry wins, the others are pushed). */
export function orderAxes(ax: V3, changed: 0 | 1 | 2): V3 {
  const v: V3 = [...ax];
  for (let k = changed - 1; k >= 0; k--) v[k] = Math.max(v[k], v[k + 1]);
  for (let k = changed + 1; k < 3; k++) v[k] = Math.min(v[k], v[k - 1]);
  return v;
}
