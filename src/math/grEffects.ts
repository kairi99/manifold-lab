// Schwarzschild weak-field effects. Dimensionless helpers use G = c = M = 1; "SI" helpers take
// gm = GM [m³/s²], lengths [m], J [kg m²/s] and return seconds / rad/s / fractions.
import { C, G } from '../data/celestial';

/** z = sqrt((1 − 2/rObs)/(1 − 2/rEmit)) − 1 for static emitter/observer; rObs = ∞ is a far observer. */
export function gravRedshift(rEmit: number, rObs = Infinity): number {
  return Math.expm1(0.5 * (Math.log1p(-2 / rObs) - Math.log1p(-2 / rEmit))); // stable for weak fields
}

/** Weak-field redshift z ≈ Δν/ν (magnitude convention of the spec): (GM/c²)(1/r1 − 1/r2) for emission at r1, reception at r2; >0 = redshift (r2 > r1), <0 = blueshift. */
export const redshiftWeakSI = (gm: number, r1: number, r2: number): number => (gm / (C * C)) * (1 / r1 - 1 / r2);

/**
 * One-way excess coordinate-time delay (Shapiro 1964), PPN: (1+γ)/2 · (2GM/c³) ln(4 r1 r2 / b²), with
 * r1, r2 distances of the endpoints from the mass on opposite sides, b the closest approach (b ≪ r1, r2).
 * Defaults to GR (γ = 1). Returns seconds.
 */
export const shapiroDelaySI = (gm: number, r1: number, r2: number, b: number, gamma = 1): number =>
  shapiroGammaFactor(gamma) * ((2 * gm) / C ** 3) * Math.log((4 * r1 * r2) / (b * b));
export const shapiroRoundTripSI = (gm: number, r1: number, r2: number, b: number, gamma = 1): number =>
  2 * shapiroDelaySI(gm, r1, r2, b, gamma);
/** PPN scaling of the delay relative to GR. */
export const shapiroGammaFactor = (gamma: number): number => (1 + gamma) / 2;

/** de Sitter (geodetic) precession of a gyroscope in a circular orbit: Ω = (3/2)(GM)^{3/2}/(c² a^{5/2}) [rad/s]. */
export const geodeticPrecessionSI = (gm: number, a: number): number => (1.5 * gm ** 1.5) / (C * C * a ** 2.5);

/**
 * Lense–Thirring (Schiff) gyroscope precession Ω = (G/(c²r³))[3(J·r̂)r̂ − J]. Averaged over a polar orbit
 * (r̂ sweeps a great circle containing J, ⟨r̂r̂⟩ = ½ in-plane) this gives ⟨Ω⟩ = (3/2 − 1)GJ/(c²a³) = GJ/(2c²a³) [rad/s],
 * directed along J. (GP-B's quoted 39.2 mas/yr is this ≈40.8 projected on the guide-star direction, ~cos 16°.)
 */
export const lenseThirringPolarSI = (J: number, a: number): number => (G * J) / (2 * C * C * a ** 3);
