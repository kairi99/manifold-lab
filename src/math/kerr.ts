// Kerr geometry and geodesics, G = c = M = 1, Boyer–Lindquist (t, r, θ, φ), spin a ∈ [0, 1).
// Σ = r² + a²cos²θ, Δ = r² − 2r + a². Refs: Bardeen, Press & Teukolsky 1972 (ApJ 178, 347); MTW §33.

export function horizons(a: number): { rPlus: number; rMinus: number } {
  const s = Math.sqrt(Math.max(0, 1 - a * a));
  return { rPlus: 1 + s, rMinus: 1 - s };
}
export const ergosphere = (a: number, theta: number): number =>
  1 + Math.sqrt(Math.max(0, 1 - a * a * Math.cos(theta) ** 2));

/** BPT 1972 eq. 2.21: r = 3 + Z2 ∓ sqrt((3−Z1)(3+Z1+2Z2)), upper sign prograde. */
export function iscoKerr(a: number, prograde: boolean): number {
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const d = Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
  return prograde ? 3 + z2 - d : 3 + z2 + d;
}
/** BPT eq. 2.18: r = 2(1 + cos(2/3 arccos(∓a))), upper sign prograde. */
export const photonOrbitKerr = (a: number, prograde: boolean): number =>
  2 * (1 + Math.cos((2 / 3) * Math.acos(prograde ? -a : a)));

/** ZAMO angular velocity ω = −g_tφ/g_φφ = 2ar / ((r²+a²)² − a²Δ sin²θ). */
export function frameDragging(a: number, r: number, theta: number): number {
  const s2 = Math.sin(theta) ** 2, D = r * r - 2 * r + a * a;
  return (2 * a * r) / ((r * r + a * a) ** 2 - a * a * D * s2);
}

export interface MetricComps { gtt: number; gtphi: number; gphiphi: number; grr: number; gthth: number }

export function kerrMetric(a: number, r: number, theta: number): MetricComps {
  const s2 = Math.sin(theta) ** 2, c2 = Math.cos(theta) ** 2;
  const S = r * r + a * a * c2, D = r * r - 2 * r + a * a;
  return {
    gtt: -(1 - (2 * r) / S),
    gtphi: (-2 * a * r * s2) / S,
    gphiphi: (r * r + a * a + (2 * a * a * r * s2) / S) * s2,
    grr: S / D,
    gthth: S,
  };
}
export function kerrInverse(a: number, r: number, theta: number): MetricComps {
  const s2 = Math.sin(theta) ** 2, c2 = Math.cos(theta) ** 2;
  const S = r * r + a * a * c2, D = r * r - 2 * r + a * a;
  return {
    gtt: -((r * r + a * a) ** 2 - a * a * D * s2) / (S * D),
    gtphi: (-2 * a * r) / (S * D),
    gphiphi: (D - a * a * s2) / (S * D * s2),
    grr: D / S,
    gthth: 1 / S,
  };
}

/** BPT eq. 2.12–2.13 (retrograde = a → −a, L sign flipped). null inside the photon orbit. */
export function circularEquatorial(a: number, r: number, prograde: boolean): { E: number; L: number; Omega: number } | null {
  const s = prograde ? 1 : -1, q = Math.sqrt(r);
  const arg = r * q - 3 * q + 2 * s * a;
  if (!(arg > 0) || !(r > 0)) return null;
  const den = Math.pow(r, 0.75) * Math.sqrt(arg);
  return {
    E: (r * q - 2 * q + s * a) / den,
    L: (s * (r * r - 2 * s * a * q + a * a)) / den,
    Omega: s / (r * q + s * a),
  };
}

/**
 * Equatorial bound timelike orbit with turning points rp ≤ ra. With x = L − aE the radial potential is
 * R(r)/r = (E²−1)r³ + 2r² − (2aEx + a² + x²) r + 2x²; solve R(rp)=R(ra)=0 by Newton in (E, x),
 * continued in a from the Schwarzschild solution (a=0) so the branch is the right one.
 */
export function kerrOrbitFromApsides(a: number, rp: number, ra: number, prograde: boolean): { E: number; L: number } | null {
  const { rPlus } = horizons(a);
  if (!(rp > rPlus) || !(ra >= rp)) return null;
  const s = prograde ? 1 : -1;
  const f = (E: number, x: number, aa: number, r: number) =>
    (E * E - 1) * r ** 3 + 2 * r * r - (2 * aa * E * x + aa * aa + x * x) * r + 2 * x * x;
  if (ra - rp < 1e-12) {
    const c = circularEquatorial(a, rp, prograde);
    return c && rp >= iscoKerr(a, prograde) ? { E: c.E, L: c.L } : null;
  }
  // Schwarzschild start
  const fp = 1 - 2 / rp, fa = 1 - 2 / ra;
  const L2 = (fa - fp) / (fp / (rp * rp) - fa / (ra * ra));
  if (!(L2 > 0)) return null;
  let L = s * Math.sqrt(L2), E = Math.sqrt(fp * (1 + L2 / (rp * rp)));
  let x = L;
  const K = 20;
  for (let k = 1; k <= K; k++) {
    const aa = (a * k) / K;
    for (let it = 0; it < 60; it++) {
      const f1 = f(E, x, aa, rp), f2 = f(E, x, aa, ra);
      const hE = 1e-7, hx = 1e-7;
      const a11 = (f(E + hE, x, aa, rp) - f1) / hE, a12 = (f(E, x + hx, aa, rp) - f1) / hx;
      const a21 = (f(E + hE, x, aa, ra) - f2) / hE, a22 = (f(E, x + hx, aa, ra) - f2) / hx;
      const det = a11 * a22 - a12 * a21;
      if (!Number.isFinite(det) || det === 0) return null;
      const dE = (a22 * f1 - a12 * f2) / det, dx = (-a21 * f1 + a11 * f2) / det;
      E -= dE; x -= dx;
      if (Math.abs(dE) + Math.abs(dx) < 1e-15) break;
    }
  }
  L = x + a * E;
  if (!(E > 0 && E < 1) || !Number.isFinite(L) || (L * s) <= 0) return null;
  // no forbidden region between the turning points
  for (let i = 1; i < 400; i++) {
    const r = rp + ((ra - rp) * i) / 400;
    if (f(E, x, a, r) < -1e-9 * r * r * r) return null;
  }
  return { E, L };
}

export interface KerrSample { lambda: number; t: number; r: number; theta: number; phi: number }

type S6 = [number, number, number, number, number, number]; // t, r, θ, φ, p_r, p_θ

/** Hamilton equations for 2H = N/Σ, N = −A²/Δ + B²/sin²θ + Δp_r² + p_θ², A = (r²+a²)E − aL, B = L − aE sin²θ. */
function makeDeriv(a: number, E: number, L: number) {
  return (y: S6): S6 => {
    const r = y[1], th = y[2], pr = y[4], pth = y[5];
    const s = Math.sin(th), c = Math.cos(th), s2 = s * s;
    const S = r * r + a * a * c * c, D = r * r - 2 * r + a * a, Dp = 2 * r - 2;
    const A = (r * r + a * a) * E - a * L, B = L - a * E * s2;
    const N = -(A * A) / D + (B * B) / s2 + D * pr * pr + pth * pth;
    const tdot = (A * (r * r + a * a)) / D + a * B;
    const phidot = (a * A) / D + B / s2;
    const dNr = (-4 * A * r * E) / D + (A * A * Dp) / (D * D) + Dp * pr * pr;
    const dNth = (-4 * a * E * B * c) / s - (2 * B * B * c) / (s2 * s);
    const dSr = 2 * r, dSth = -2 * a * a * s * c;
    return [tdot / S, (D * pr) / S, pth / S, phidot / S, -0.5 * (dNr / S - (N * dSr) / (S * S)), -0.5 * (dNth / S - (N * dSth) / (S * S))];
  };
}
function rk4(d: (y: S6) => S6, y: S6, h: number): S6 {
  const add = (q: S6, k: S6, c: number) => q.map((x, i) => x + c * k[i]) as S6;
  const k1 = d(y), k2 = d(add(y, k1, h / 2)), k3 = d(add(y, k2, h / 2)), k4 = d(add(y, k3, h));
  return y.map((x, i) => x + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as S6;
}

export function integrateKerr(opts: {
  a: number; kind: 'timelike' | 'null'; E: number; L: number;
  r0: number; theta0: number; phi0?: number; pr0?: number; ptheta0?: number;
  prSign?: 1 | -1; lambdaMax: number; rMax?: number; nSamples?: number;
}): { samples: KerrSample[]; fate: 'bound' | 'escape' | 'capture'; carterQ: number; maxConstraintDrift: number } {
  const { a, kind, E, L, r0, theta0, lambdaMax } = opts;
  const mu2 = kind === 'timelike' ? 1 : 0;
  const rMax = opts.rMax ?? Math.max(1e3, 3 * r0);
  const nS = opts.nSamples ?? 2000;
  const rCap = horizons(a).rPlus + 1e-3;
  const s0 = Math.sin(theta0), c0 = Math.cos(theta0);
  const S0 = r0 * r0 + a * a * c0 * c0, D0 = r0 * r0 - 2 * r0 + a * a;
  const pth0 = opts.ptheta0 ?? 0;
  let pr0 = opts.pr0;
  if (pr0 === undefined) {
    const A = (r0 * r0 + a * a) * E - a * L, B = L - a * E * s0 * s0;
    const v = (-mu2 * S0 + (A * A) / D0 - (B * B) / (s0 * s0) - pth0 * pth0) / D0;
    pr0 = (opts.prSign ?? 1) * Math.sqrt(Math.max(0, v));
  }
  const carterQ = pth0 * pth0 + c0 * c0 * (a * a * (mu2 - E * E) + (L * L) / (s0 * s0));
  const deriv = makeDeriv(a, E, L);
  const ham2 = (y: S6) => { // 2H = g^{μν}p_μp_ν
    const g = kerrInverse(a, y[1], y[2]);
    return g.gtt * E * E - 2 * g.gtphi * E * L + g.gphiphi * L * L + g.grr * y[4] * y[4] + g.gthth * y[5] * y[5];
  };
  let y: S6 = [0, r0, theta0, opts.phi0 ?? 0, pr0, pth0];
  let drift = 0;
  const samples: KerrSample[] = [];
  const emit = (lam: number) => {
    samples.push({ lambda: lam, t: y[0], r: y[1], theta: y[2], phi: y[3] });
    drift = Math.max(drift, Math.abs(ham2(y) + mu2) / 2);
  };
  emit(0);
  const dl = lambdaMax / nS;
  let lam = 0, k = 1, fate: 'bound' | 'escape' | 'capture' = 'bound';
  while (k <= nS && fate === 'bound') {
    const target = Math.min(lambdaMax, k * dl);
    const d0 = deriv(y);
    let h = Math.min(
      target - lam,
      (0.02 * y[1]) / (Math.abs(d0[1]) + y[1] * Math.abs(d0[3]) + y[1] * Math.abs(d0[2]) + 1e-3),
      (0.25 * (y[1] - rCap + 1e-3)) / (Math.abs(d0[1]) + 1e-9),
    );
    let next: S6;
    let clipped = h >= target - lam;
    for (;;) {
      const full = rk4(deriv, y, h), half = rk4(deriv, rk4(deriv, y, h / 2), h / 2);
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
    if (y[1] < rCap) fate = 'capture';
    else if (y[1] > rMax) fate = 'escape';
    if (fate !== 'bound' || clipped) {
      emit(lam);
      if (clipped) k++;
    }
  }
  return { samples, fate, carterQ, maxConstraintDrift: drift };
}
