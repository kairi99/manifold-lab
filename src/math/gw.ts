// Gravitational waves: TT-gauge ring of free particles and the leading-order (Newtonian quadrupole) chirp.
// Masses in M_sun, distances in Mpc, times in s unless stated otherwise.
import { C, GM_SUN, PC } from '../data/celestial';

/** G M_sun / c^3, seconds. */
export const T_SUN = GM_SUN / C ** 3;
const MPC = 1e6 * PC;

// ---------- TT-gauge plane wave along z ----------

/** First-order displacement of a free particle at (x0,y0): dx = (h+ x0 + hx y0)/2, dy = (hx x0 - h+ y0)/2. */
export function ringDisplacement(x0: number, y0: number, hPlus: number, hCross: number): [number, number] {
  return [0.5 * (hPlus * x0 + hCross * y0), 0.5 * (hCross * x0 - hPlus * y0)];
}

/**
 * Exact position for constant h: x = exp(H/2) x0 with H = [[h+, hx],[hx, -h+]] (traceless, H^2 = |h|^2 I),
 * so exp = cosh(s) I + sinh(s)/s * H/2, s = |h|/2. det = 1 exactly (area preserved to all orders).
 * For visualisation of exaggerated h; the physical wave is first order (|h| ~ 1e-21).
 */
export function ringPositionExact(x0: number, y0: number, hPlus: number, hCross: number): [number, number] {
  const s = 0.5 * Math.hypot(hPlus, hCross);
  const ch = Math.cosh(s);
  const k = s < 1e-12 ? 0.5 : Math.sinh(s) / s / 2;
  return [ch * x0 + k * (hPlus * x0 + hCross * y0), ch * y0 + k * (hCross * x0 - hPlus * y0)];
}

// ---------- Masses ----------

export const chirpMass = (m1: number, m2: number) => (m1 * m2) ** 0.6 / (m1 + m2) ** 0.2;
/** Detector-frame (redshifted) mass (1+z) m. Chirp mass and total mass redshift the same way. */
export const detectorFrameMass = (m: number, z: number) => (1 + z) * m;

// ---------- Leading-order inspiral ----------

/** GW frequency (Hz) a time tau (s) before coalescence, for chirp mass mc (M_sun). */
export const fGW = (mc: number, tau: number) => (1 / Math.PI) * (5 / (256 * tau)) ** 0.375 * (mc * T_SUN) ** -0.625;
/** Inverse of fGW: time before coalescence (s) at GW frequency f. */
export const tauAtFrequency = (mc: number, f: number) => (5 / 256) * (Math.PI * f) ** (-8 / 3) * (mc * T_SUN) ** (-5 / 3);
/** GW frequency (Hz) at the Schwarzschild ISCO for total mass M (M_sun): c^3 / (6^{3/2} pi G M). */
export const fIsco = (mTotal: number) => 1 / (6 ** 1.5 * Math.PI * mTotal * T_SUN);
/** Chirp mass (M_sun) from observed f (Hz) and df/dt (Hz/s): Mc = (c^3/G)[(5/96) pi^{-8/3} f^{-11/3} fdot]^{3/5}. */
export const chirpMassFromFdot = (f: number, fdot: number) =>
  ((5 / 96) * Math.PI ** (-8 / 3) * f ** (-11 / 3) * fdot) ** 0.6 / T_SUN;
/** GW phase (rad), Phi = phiC - 2 (tau / (5 G Mc/c^3))^{5/8}. */
export const inspiralPhase = (mc: number, tau: number, phiC = 0) => phiC - 2 * (tau / (5 * mc * T_SUN)) ** 0.625;

/**
 * Polarisation amplitudes for a circular binary. a = (4/D)(G Mc/c^2)^{5/3}(pi f/c)^{2/3}.
 * h+ = a (1+cos^2 i)/2 cos Phi, hx = a cos i sin Phi. mcDet is detector-frame chirp mass, dMpc the luminosity distance.
 */
export function polarisations(amp: number, phase: number, inclination: number): { hPlus: number; hCross: number } {
  const ci = Math.cos(inclination);
  return { hPlus: amp * 0.5 * (1 + ci * ci) * Math.cos(phase), hCross: amp * ci * Math.sin(phase) };
}
export function inspiralAmplitude(mcDet: number, f: number, dMpc: number): number {
  // (G Mc/c^2) = Mc*T_SUN*c ; (pi f / c)^{2/3}
  return (4 / (dMpc * MPC)) * (mcDet * T_SUN * C) ** (5 / 3) * ((Math.PI * f) / C) ** (2 / 3);
}

export interface ChirpParams {
  /** detector-frame chirp mass, M_sun */ mcDet: number;
  /** luminosity distance, Mpc */ dMpc: number;
  /** inclination of orbital axis to line of sight, rad */ inclination: number;
  phiC?: number;
}

/** Pure inspiral strain at tau = t_c - t > 0. Diverges as tau -> 0; callers should cut at fIsco. */
export function inspiralStrain(p: ChirpParams, tau: number) {
  const f = fGW(p.mcDet, tau);
  return { f, ...polarisations(inspiralAmplitude(p.mcDet, f, p.dMpc), inspiralPhase(p.mcDet, tau, p.phiC), p.inclination) };
}

// ---------- Ringdown (ILLUSTRATIVE) ----------

/**
 * Dominant l=m=2, n=0 Kerr QNM, Berti-Cardoso-Will (2006) fits (coefficients recalled, not re-verified):
 * f = [1.5251 - 1.1568 (1-a)^0.1292]/(2 pi) * c^3/(G M), Q = 0.7000 + 1.4187 (1-a)^-0.4990, tau = Q/(pi f).
 */
export function kerrQnm22(mFinal: number, spin: number) {
  const f = ((1.5251 - 1.1568 * (1 - spin) ** 0.1292) / (2 * Math.PI)) / (mFinal * T_SUN);
  const q = 0.7 + 1.4187 * (1 - spin) ** -0.499;
  return { f, q, tauDamp: q / (Math.PI * f) };
}

export interface ChirpRingdownParams extends ChirpParams {
  /** detector-frame remnant mass, M_sun */ mFinalDet: number;
  finalSpin: number;
}

/**
 * ILLUSTRATIVE merger-ringdown, not a fit to numerical relativity: leading-order inspiral until its frequency reaches
 * the remnant's ringdown frequency (frequency-continuous switch), then an exponentially damped sinusoid at f_ring
 * with the amplitude and phase of the inspiral at the switch. t is time relative to the formal coalescence time t_c.
 * Returns zero strain before tMin.
 */
export function chirpStrain(p: ChirpRingdownParams, t: number) {
  const { f: fRing, tauDamp } = kerrQnm22(p.mFinalDet, p.finalSpin);
  const tauSwitch = tauAtFrequency(p.mcDet, fRing);
  if (t < -tauSwitch) return inspiralStrain(p, -t);
  const f = fRing;
  const a0 = inspiralAmplitude(p.mcDet, fRing, p.dMpc);
  const ph0 = inspiralPhase(p.mcDet, tauSwitch, p.phiC);
  const dt = t + tauSwitch;
  const env = Math.exp(-dt / tauDamp);
  return { f, ...polarisations(a0 * env, ph0 + 2 * Math.PI * fRing * dt, p.inclination) };
}
