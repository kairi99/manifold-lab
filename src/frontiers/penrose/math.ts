// Penrose inequality checks on Kerr–Newman, G = c = 1. Penrose 1973; Huisken–Ilmanen 2001; Bray 2001.
import { horizons } from '../../math/kerr';

export interface KN { rPlus: number; area: number; sqrtA16pi: number; ratio: number; margin: number; rA: number }

/** Outer horizon r₊ = m + √(m² − a² − Q²); the radicand is clamped at 0 (extremal) against round-off. */
export const rPlusKN = (m: number, a: number, Q: number): number => m + Math.sqrt(Math.max(0, m * m - a * a - Q * Q));

export function kn(m: number, a: number, Q: number): KN {
  const rPlus = rPlusKN(m, a, Q);
  const area = 4 * Math.PI * (rPlus * rPlus + a * a);
  const sqrtA16pi = Math.sqrt(area / (16 * Math.PI));
  return { rPlus, area, sqrtA16pi, ratio: sqrtA16pi / m, margin: m - sqrtA16pi, rA: Math.sqrt(area / (4 * Math.PI)) };
}

/** Residual of the identity r₊² + a² = 2 m r₊ − Q² (should be ~1e-16). */
export const knIdentityResidual = (m: number, a: number, Q: number): number => {
  const r = rPlusKN(m, a, Q);
  return r * r + a * a - (2 * m * r - Q * Q);
};

/** Same r₊ via the shared Kerr helper (units m = 1), valid for Q = 0. */
export const rPlusKerr = (m: number, a: number): number => m * horizons(a / m).rPlus;

/** Largest |Q|/m allowed at spin a/m: a² + Q² ≤ m². */
export const qMax = (a: number): number => Math.sqrt(Math.max(0, 1 - a * a));

/** Merger of two non-spinning Schwarzschild holes: m_f ≥ √(m₁² + m₂²) (area theorem + Penrose). */
export const mergerMinFinalMass = (m1: number, m2: number): number => Math.hypot(m1, m2);
export const mergerMaxRadiated = (m1: number, m2: number): number => m1 + m2 - mergerMinFinalMass(m1, m2);

/** Flamm slice, G = 1: z = ±√(8m(r − 2m)). */
export const flammZ = (m: number, r: number): number => Math.sqrt(Math.max(0, 8 * m * (r - 2 * m)));
