// Schwarzschild geodesics, G = c = 1, lengths in units of M (r_s = 2), equatorial plane θ=π/2.
export const R_S = 2, ISCO = 6, MARGINALLY_BOUND = 4, PHOTON_SPHERE = 3, B_CRIT = 3 * Math.sqrt(3);

/** Compared against E²: (dr/dλ)² = E² − Veff. */
export function Veff(r: number, L: number, kind: 'timelike' | 'null'): number {
  const f = 1 - 2 / r;
  return kind === 'timelike' ? f * (1 + (L * L) / (r * r)) : (f * L * L) / (r * r);
}

export function circular(r: number): { E: number; L: number; omega: number; stable: boolean } | null {
  if (!(r > PHOTON_SPHERE)) return null;
  return {
    E: (1 - 2 / r) / Math.sqrt(1 - 3 / r),
    L: r / Math.sqrt(r - 3),
    omega: Math.pow(r, -1.5),
    stable: r >= ISCO,
  };
}

/** Solve Veff(rp)=Veff(ra)=E² (linear in L²), then check Veff ≤ E² on [rp,ra] (no barrier between). */
export function orbitFromApsides(rp: number, ra: number): { E: number; L: number } | null {
  if (!(rp > R_S) || !(ra >= rp)) return null;
  if (ra - rp < 1e-12) { const c = circular(rp); return c && c.stable ? { E: c.E, L: c.L } : null; }
  const fp = 1 - 2 / rp, fa = 1 - 2 / ra;
  const L2 = (fa - fp) / (fp / (rp * rp) - fa / (ra * ra));
  if (!(L2 > 0)) return null;
  const L = Math.sqrt(L2), E2 = Veff(rp, L, 'timelike');
  for (let i = 1; i < 400; i++) {
    if (Veff(rp + ((ra - rp) * i) / 400, L, 'timelike') > E2 * (1 + 1e-12)) return null;
  }
  return E2 > 0 && E2 < 1 ? { E: Math.sqrt(E2), L } : null;
}

export interface OrbitSample {
  tau: number; t: number; r: number; phi: number;
  /** velocities w.r.t. the affine parameter (extra, for diagnostics) */
  tdot: number; rdot: number; phidot: number;
}

type S6 = [number, number, number, number, number, number]; // t, r, φ, ṫ, ṙ, φ̇

/**
 * Geodesic equation ẍ^a = −Γ^a_bc ẋ^b ẋ^c with the nonzero Schwarzschild Γ (f = 1−2/r):
 * Γ^t_tr = 1/(r(r−2)), Γ^r_tt = (r−2)/r³, Γ^r_rr = −1/(r(r−2)), Γ^r_φφ = −(r−2), Γ^φ_rφ = 1/r.
 */
function deriv(y: S6): S6 {
  const [, r, , td, rd, pd] = y;
  const tdd = -(2 / (r * (r - 2))) * rd * td;
  const rdd = -((r - 2) / (r * r * r)) * td * td + (rd * rd) / (r * (r - 2)) + (r - 2) * pd * pd;
  const pdd = -(2 / r) * rd * pd;
  return [td, rd, pd, tdd, rdd, pdd];
}
function rk4(y: S6, h: number): S6 {
  const add = (q: S6, k: S6, c: number) => q.map((x, i) => x + c * k[i]) as S6;
  const k1 = deriv(y), k2 = deriv(add(y, k1, h / 2)), k3 = deriv(add(y, k2, h / 2)), k4 = deriv(add(y, k3, h));
  return y.map((x, i) => x + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as S6;
}
const constraint = (y: S6) => {
  const r = y[1], f = 1 - 2 / r;
  return -f * y[3] * y[3] + (y[4] * y[4]) / f + r * r * y[5] * y[5];
};

export function integrateOrbit(opts: {
  kind: 'timelike' | 'null'; E: number; L: number; r0: number; phi0?: number; inward?: boolean;
  lambdaMax: number; rMax?: number; nSamples?: number;
}): { samples: OrbitSample[]; fate: 'bound' | 'escape' | 'capture'; maxConstraintDrift: number } {
  const { kind, E, L, r0, lambdaMax } = opts;
  const rMax = opts.rMax ?? Math.max(1e3, 3 * r0);
  const nS = opts.nSamples ?? 2000;
  const f0 = 1 - 2 / r0;
  const rd0 = Math.sqrt(Math.max(0, E * E - Veff(r0, L, kind)));
  let y: S6 = [0, r0, opts.phi0 ?? 0, E / f0, (opts.inward ? -1 : 1) * rd0, L / (r0 * r0)];
  const target0 = kind === 'timelike' ? -1 : 0;
  let drift = 0;
  const samples: OrbitSample[] = [];
  const emit = (lam: number) => {
    samples.push({ tau: lam, t: y[0], r: y[1], phi: y[2], tdot: y[3], rdot: y[4], phidot: y[5] });
    drift = Math.max(drift, Math.abs(constraint(y) - target0));
  };
  emit(0);
  const dl = lambdaMax / nS;
  let lam = 0, k = 1, fate: 'bound' | 'escape' | 'capture' = 'bound';
  while (k <= nS && fate === 'bound') {
    const target = Math.min(lambdaMax, k * dl);
    let h = Math.min(target - lam, (0.02 * y[1]) / (Math.abs(y[4]) + y[1] * Math.abs(y[5]) + 1e-3), (0.25 * (y[1] - 2)) / (Math.abs(y[4]) + 1e-9));
    let next: S6;
    let clipped = h >= target - lam;
    for (;;) {
      const full = rk4(y, h), half = rk4(rk4(y, h / 2), h / 2);
      let err = 0;
      for (let i = 0; i < 6; i++) {
        const e = Math.abs(half[i] - full[i]) / (1 + Math.abs(half[i]));
        err = Number.isFinite(e) ? Math.max(err, e) : Infinity;
      }
      if (err <= 1e-12 || h < 1e-12) { next = half.map((x, i) => x + (x - full[i]) / 15) as S6; break; }
      h /= 2; clipped = false;
    }
    y = next;
    lam = clipped ? target : lam + h;
    if (y[1] < 2.001) fate = 'capture';
    else if (y[1] > rMax) fate = 'escape';
    if (fate !== 'bound' || clipped) {
      emit(lam);
      if (clipped) k++;
    }
  }
  return { samples, fate, maxConstraintDrift: drift };
}

// ---- quadrature helpers -------------------------------------------------------------
const GL_N = 16;
const GL: { x: number[]; w: number[] } = (() => {
  const x: number[] = [], w: number[] = [];
  for (let i = 0; i < GL_N; i++) {
    let z = Math.cos((Math.PI * (i + 0.75)) / (GL_N + 0.5)), dp = 1;
    for (let it = 0; it < 100; it++) {
      let p0 = 1, p1 = z;
      for (let n = 2; n <= GL_N; n++) { const p2 = ((2 * n - 1) * z * p1 - (n - 1) * p0) / n; p0 = p1; p1 = p2; }
      dp = (GL_N * (z * p1 - p0)) / (z * z - 1);
      const dz = p1 / dp; z -= dz;
      if (Math.abs(dz) < 1e-16) break;
    }
    x.push(z); w.push(2 / ((1 - z * z) * dp * dp));
  }
  return { x, w };
})();
function gauss(f: (s: number) => number, a: number, b: number): number {
  let s = 0;
  for (let i = 0; i < GL_N; i++) s += GL.w[i] * f(((b - a) * GL.x[i] + a + b) / 2);
  return ((b - a) / 2) * s;
}

/**
 * Binet: u'² = f(u) = 2(u−u_a)(u_p−u)(u_3−u), u_a=1/ra, u_p=1/rp, u_3 = 1/2 − u_a − u_p (roots sum to 1/2).
 * With u = m + h cos χ the endpoint singularities vanish: Δφ = 2∫_0^π dχ /√(2(u_3−u)) = 2∫_0^π dχ/√(1−ε),
 * ε = 2(u_a+u_p+u). Subtract 2π analytically: Δφ−2π = 2∫ ε/(s(1+s)) dχ, s=√(1−ε) (no cancellation).
 * The integrand is even and 2π-periodic in χ, so the trapezoid rule converges exponentially.
 */
export function perihelionShift(rp: number, ra: number): { numeric: number; weakField: number } {
  const ua = 1 / ra, up = 1 / rp, m = (ua + up) / 2, h = (up - ua) / 2;
  const N = 4000;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const eps = 2 * (ua + up + m + h * Math.cos((Math.PI * i) / N));
    const s = Math.sqrt(1 - eps);
    sum += (i === 0 || i === N ? 0.5 : 1) * (eps / (s * (1 + s)));
  }
  const a = (rp + ra) / 2, e = (ra - rp) / (ra + rp);
  return { numeric: 2 * sum * (Math.PI / N), weakField: (6 * Math.PI) / (a * (1 - e * e)) };
}

/**
 * δ = 2∫_0^{u0} du/√g − π, g = 1/b² − u² + 2u³ = 2(u0−u)(u−u1)(u2−u), u1<0<u0<u2 (u1+u2 = 1/2−u0).
 * Substitute u = u0(1−s²): δ+π = ∫_0^1 2√u0 ds/√(2(u−u1)(u2−u)), smooth. Near b_c the integrand is nearly
 * singular at s=0, so use 16-pt Gauss–Legendre on panels graded geometrically toward s=0.
 */
export function deflection(b: number): { numeric: number | null; weakField: number } {
  const weakField = 4 / b;
  if (!(b > B_CRIT)) return { numeric: null, weakField };
  const g = (u: number) => 1 / (b * b) - u * u + 2 * u * u * u;
  let lo = 0, hi = 1 / 3; // g(0)>0, g(1/3)<0
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
  const u0 = (lo + hi) / 2;
  const S = 0.5 - u0, P = -1 / (2 * b * b * u0);
  const u2 = (S + Math.sqrt(S * S - 4 * P)) / 2, u1 = P / u2;
  const F = (s: number) => {
    const u = u0 * (1 - s * s);
    return (2 * Math.sqrt(u0)) / Math.sqrt(2 * (u - u1) * (u2 - u));
  };
  let tot = gauss(F, 0, 2 ** -40);
  for (let j = 40; j > 0; j--) tot += gauss(F, 2 ** -j, 2 ** -(j - 1));
  return { numeric: 2 * tot - Math.PI, weakField };
}

export const staticClockRate = (r: number): number => Math.sqrt(1 - 2 / r);
export const circularClockRate = (r: number): number => Math.sqrt(1 - 3 / r);
/** Small-angle angular radius of the shadow, 3√3 M/D. */
export const shadowAngularRadius = (massOverDistance: number): number => B_CRIT * massOverDistance;
