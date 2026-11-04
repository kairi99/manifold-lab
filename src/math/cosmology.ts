// FLRW cosmology: LCDM with radiation and spatial curvature. Distances in Mpc, times in Gyr unless noted.
// Conventions: a = 1/(1+z); E(z) = H/H0; Ok = 1 - Om - Or - OL; c = 1 inside quadratures.
// All integrals use a = s^2 style substitutions so the radiation/matter era at a -> 0 is smooth.
import { C, PC, YEAR } from '../data/celestial';

export interface CosmoParams { H0: number; Om: number; Or: number; OL: number } // H0 in km/s/Mpc
export type Pt = [number, number];

// ---- units ----
export const MPC_M = PC * 1e6;
export const GPC_M = PC * 1e9;
export const GYR_S = YEAR * 1e9;
export const GLY_M = C * YEAR * 1e9;
export const C_KMS = C / 1000;
export const mpcToGly = (d: number) => (d * MPC_M) / GLY_M;
export const mpcToGpc = (d: number) => d / 1000;
export const glyToMpc = (d: number) => (d * GLY_M) / MPC_M;

export const curvature = (p: CosmoParams) => 1 - p.Om - p.Or - p.OL;
/** Hubble time 1/H0 in Gyr. */
export const hubbleTimeGyr = (p: CosmoParams) => MPC_M / 1000 / p.H0 / GYR_S;
/** Hubble distance c/H0 in Mpc. */
export const hubbleDistance = (p: CosmoParams) => C_KMS / p.H0;

/** a^2 E: sqrt(Or + Om a + Ok a^2 + OL a^4); H = H0 * Ea(a) / a^2. */
export function Ea(a: number, p: CosmoParams): number {
  return Math.sqrt(p.Or + p.Om * a + curvature(p) * a * a + p.OL * a ** 4);
}
export function E(z: number, p: CosmoParams): number {
  const a = 1 / (1 + z);
  return Ea(a, p) / (a * a);
}
export const hubbleRate = (a: number, p: CosmoParams) => (p.H0 * Ea(a, p)) / (a * a); // km/s/Mpc
/** Proper Hubble radius c/H(a) in Mpc. Comoving version is hubbleRadius(a)/a. */
export const hubbleRadius = (a: number, p: CosmoParams) => C_KMS / hubbleRate(a, p);

/** Adaptive Simpson. */
export function integrate(f: (x: number) => number, a: number, b: number, tol = 1e-11): number {
  if (a === b) return 0;
  const simp = (fa: number, fm: number, fb: number, h: number) => (h / 6) * (fa + 4 * fm + fb);
  const rec = (x0: number, x1: number, f0: number, fm: number, f1: number, whole: number, eps: number, d: number): number => {
    const m = (x0 + x1) / 2, lm = (x0 + m) / 2, rm = (m + x1) / 2;
    const flm = f(lm), frm = f(rm);
    const l = simp(f0, flm, fm, m - x0), r = simp(fm, frm, f1, x1 - m);
    if (d <= 0 || Math.abs(l + r - whole) <= 15 * eps) return l + r + (l + r - whole) / 15;
    return rec(x0, m, f0, flm, fm, l, eps / 2, d - 1) + rec(m, x1, fm, frm, f1, r, eps / 2, d - 1);
  };
  const N = 8, h = (b - a) / N;
  let sum = 0;
  const est = Math.abs(simp(f(a), f((a + b) / 2), f(b), b - a)) || 1;
  for (let i = 0; i < N; i++) {
    const x0 = a + i * h, x1 = x0 + h, xm = (x0 + x1) / 2, f0 = f(x0), fm = f(xm), f1 = f(x1);
    sum += rec(x0, x1, f0, fm, f1, simp(f0, fm, f1, h), (tol * est) / N, 40);
  }
  return sum;
}

/** Dimensionless cosmic time H0*t(a) = ∫0^a x dx / Ea(x), via x = s^2. */
const tInt = (a: number, p: CosmoParams) => integrate((s) => (2 * s ** 3) / Ea(Math.max(s, 1e-70) ** 2, p), 0, Math.sqrt(a));
/** Dimensionless conformal time H0*eta(a)/1 (c=1) = ∫0^a dx / Ea(x). */
const etaInt = (a: number, p: CosmoParams) => integrate((s) => (2 * s) / Ea(Math.max(s, 1e-70) ** 2, p), 0, Math.sqrt(a));

/** Cosmic time since the big bang at scale factor a, Gyr. */
export const cosmicTime = (a: number, p: CosmoParams) => hubbleTimeGyr(p) * tInt(a, p);
export const age = (z: number, p: CosmoParams) => cosmicTime(1 / (1 + z), p);
export const lookbackTime = (z: number, p: CosmoParams) => age(0, p) - age(z, p);

/** Scale factor at cosmic time t [Gyr] (bisection on t(a)); NaN if the model never reaches t. Needs Om+Or>0. */
export function scaleFactorAt(t: number, p: CosmoParams): number {
  let hi = 1, n = 0;
  while (cosmicTime(hi, p) < t) { hi *= 2; if (++n > 60 || !isFinite(cosmicTime(hi, p))) return NaN; }
  let lo = hi / 2 > 1e-14 ? Math.min(1e-12, hi / 2) : 1e-14;
  for (let i = 0; i < 100 && hi / lo > 1 + 1e-12; i++) {
    const mid = Math.sqrt(lo * hi);
    if (cosmicTime(mid, p) < t) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// ---- distances (Mpc) ----
export const comovingDistance = (z: number, p: CosmoParams) =>
  hubbleDistance(p) * integrate((x) => 1 / E(x, p), 0, z);

export function transverseComovingDistance(z: number, p: CosmoParams): number {
  const dc = comovingDistance(z, p), dh = hubbleDistance(p), ok = curvature(p);
  if (Math.abs(ok) < 1e-12) return dc;
  const q = Math.sqrt(Math.abs(ok));
  return ok > 0 ? (dh / q) * Math.sinh((q * dc) / dh) : (dh / q) * Math.sin((q * dc) / dh);
}
export const luminosityDistance = (z: number, p: CosmoParams) => (1 + z) * transverseComovingDistance(z, p);
export const angularDiameterDistance = (z: number, p: CosmoParams) => transverseComovingDistance(z, p) / (1 + z);
export const distanceModulus = (z: number, p: CosmoParams) => 5 * Math.log10(luminosityDistance(z, p)) + 25;

/** Recession velocity km/s of a galaxy at proper distance `properMpc` when the scale factor is a: v = H(a) D. */
export const recessionVelocity = (properMpc: number, a: number, p: CosmoParams) => hubbleRate(a, p) * properMpc;

// ---- horizons (comoving, Mpc, c*eta) ----
/** Conformal time times c, i.e. comoving particle horizon at scale factor a, Mpc. */
export const conformalTime = (a: number, p: CosmoParams) => hubbleDistance(p) * etaInt(a, p);
export const particleHorizon = (a: number, p: CosmoParams) => conformalTime(a, p);
export const particleHorizonToday = (p: CosmoParams) => particleHorizon(1, p);
/** Comoving event horizon at scale factor a (Mpc); Infinity when OL <= 0 (no accelerated end). */
export function eventHorizon(a: number, p: CosmoParams): number {
  if (!(p.OL > 0)) return Infinity;
  // x = 1/a': ∫ da'/Ea = ∫0^{1/a} dx / sqrt(OL + Ok x^2 + Om x^3 + Or x^4)
  const ok = curvature(p);
  return hubbleDistance(p) * integrate((x) => 1 / Math.sqrt(p.OL + ok * x * x + p.Om * x ** 3 + p.Or * x ** 4), 0, 1 / a);
}
export const eventHorizonToday = (p: CosmoParams) => eventHorizon(1, p);

// ---- Davis & Lineweaver (2004) conformal diagram ----
export interface ConformalDiagramOptions {
  /** Redshifts of comoving galaxy worldlines. */
  redshifts?: number[];
  /** 'conformal' (default): vertical axis c*eta in Gly; 'cosmic': cosmic time in Gyr. */
  time?: 'conformal' | 'cosmic';
  aMin?: number; aMax?: number; n?: number;
}
export interface ConformalDiagram {
  /** All polylines are [x, y]: x = comoving distance from the observer [Gly] (today's proper distance), y per `time`. */
  observer: Pt[]; lightCone: Pt[]; particleHorizon: Pt[]; eventHorizon: Pt[]; hubbleSphere: Pt[];
  galaxies: { z: number; pts: Pt[] }[];
  /** Observer 'now' as [0, y]. */
  now: Pt;
  /** Total age at the end of the grid per axis choice (for axis ranges). */
  yMax: number;
}

export function conformalDiagram(p: CosmoParams, opts: ConformalDiagramOptions = {}): ConformalDiagram {
  const { redshifts = [0.5, 1, 2, 3, 5, 10, 1089], time = 'conformal', aMin = 1e-3, aMax = 30, n = 160 } = opts;
  const dh = mpcToGly(hubbleDistance(p)), th = hubbleTimeGyr(p);
  const grid = Array.from({ length: n + 1 }, (_, i) => aMin * (aMax / aMin) ** (i / n));
  if (!grid.includes(1)) grid.push(1), grid.sort((x, y) => x - y);
  const eta = grid.map((a) => dh * etaInt(a, p)); // c*eta in Gly
  const tt = time === 'cosmic' ? grid.map((a) => th * tInt(a, p)) : eta;
  const iNow = grid.indexOf(1), eta0 = eta[iNow];
  const etaEnd = p.OL > 0 ? eta0 + mpcToGly(eventHorizon(1, p)) : Infinity;
  const ehAt = (a: number) => mpcToGly(eventHorizon(a, p)); // x_eh(a) in Gly (comoving)
  const lightCone: Pt[] = [], ph: Pt[] = [], eh: Pt[] = [], hs: Pt[] = [], obs: Pt[] = [];
  grid.forEach((a, i) => {
    obs.push([0, tt[i]]);
    ph.push([eta[i], tt[i]]);
    if (i <= iNow) lightCone.push([eta0 - eta[i], tt[i]]);
    if (isFinite(etaEnd)) eh.push([ehAt(a), tt[i]]);
    hs.push([(dh * a) / Ea(a, p), tt[i]]);
  });
  const galaxies = redshifts.map((z) => {
    const x = mpcToGly(comovingDistance(z, p));
    return { z, pts: grid.map((_, i): Pt => [x, tt[i]]) };
  });
  return { observer: obs, lightCone, particleHorizon: ph, eventHorizon: eh, hubbleSphere: hs, galaxies, now: [0, tt[iNow]], yMax: tt[tt.length - 1] };
}
