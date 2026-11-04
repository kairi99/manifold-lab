import type { Vec3 } from './types';

/** Unit sphere, two charts: spherical (θ colatitude, φ longitude) and stereographic from the north pole (x, y). */
export const sphPoint = (th: number, ph: number): Vec3 => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];

/** (θ,φ) → (x,y) = cot(θ/2)(cos φ, sin φ). Infinite at θ = 0 (north pole). */
export const toStereo = (th: number, ph: number): [number, number] => {
  const c = 1 / Math.tan(th / 2);
  return [c * Math.cos(ph), c * Math.sin(ph)];
};
/** (x,y) → (θ,φ): θ = 2 atan(1/r), φ = atan2(y,x) (φ undefined at the origin = south pole; returns 0). */
export const fromStereo = (x: number, y: number): [number, number] => [2 * Math.atan2(1, Math.hypot(x, y)), Math.atan2(y, x)];
/** Inverse stereographic projection: plane point to the sphere. */
export const stereoPoint = (x: number, y: number): Vec3 => {
  const q = 1 + x * x + y * y;
  return [(2 * x) / q, (2 * y) / q, (x * x + y * y - 1) / q];
};

/** J = ∂(x,y)/∂(θ,φ); det J = −cot(θ/2) / (2 sin²(θ/2)). */
export function jacobian(th: number, ph: number): [[number, number], [number, number]] {
  const s = Math.sin(th / 2), c = 1 / Math.tan(th / 2), k = -0.5 / (s * s);
  return [[k * Math.cos(ph), -c * Math.sin(ph)], [k * Math.sin(ph), c * Math.cos(ph)]];
}
export const detJ = (th: number) => -1 / (2 * Math.sin(th / 2) ** 2 * Math.tan(th / 2));

/** Metric in the spherical chart: diag(1, sin²θ). */
export const gSph = (th: number): [[number, number], [number, number]] => [[1, 0], [0, Math.sin(th) ** 2]];
/** Conformal factor of the stereographic chart: g = λ (dx² + dy²), λ = 4/(1+x²+y²)². */
export const lambdaStereo = (x: number, y: number) => 4 / (1 + x * x + y * y) ** 2;
/** Jᵀ g_stereo J, expressed in (θ,φ): must equal g_spherical. */
export function pullbackStereo(th: number, ph: number): [[number, number], [number, number]] {
  const [x, y] = toStereo(th, ph), l = lambdaStereo(x, y), J = jacobian(th, ph);
  const e = (i: number, j: number) => l * (J[0][i] * J[0][j] + J[1][i] * J[1][j]);
  return [[e(0, 0), e(0, 1)], [e(1, 0), e(1, 1)]];
}
