import { integrate } from '../../math/cosmology';

export interface Meas { value: number; plus: number; minus: number }

/** n_sigma = |a - b| / sqrt(sa^2 + sb^2): assumes independent Gaussian errors. For asymmetric errors use the side facing the other value. */
export function tension(a: Meas, b: Meas): number {
  const [hi, lo] = a.value >= b.value ? [a, b] : [b, a];
  const sh = hi.minus, sl = lo.plus;
  return (hi.value - lo.value) / Math.hypot(sh, sl);
}

const KMS_MPC_GYR = 977.7922; // 1/(km/s/Mpc) in Gyr
/** Age of a flat LCDM universe (no radiation), Gyr: t0 = 2 asinh(sqrt(OL/Om)) / (3 H0 sqrt(OL)). */
export const ageFlat = (H0: number, Om: number) => (2 * Math.asinh(Math.sqrt((1 - Om) / Om)) * KMS_MPC_GYR) / (3 * H0 * Math.sqrt(1 - Om));
/** Same age by integrating dt = da / (a H), H = H0 sqrt(Om a^-3 + OL), substituting a = s^2. */
export const ageFlatNumeric = (H0: number, Om: number) =>
  (KMS_MPC_GYR / H0) * integrate((s) => (2 * s) / Math.sqrt(Om / (s * s) + (1 - Om) * s ** 4), 1e-9, 1);

/** CPL: w(a) = w0 + wa (1 - a). */
export const wCpl = (a: number, w0: number, wa: number) => w0 + wa * (1 - a);
/** rho_DE(a)/rho_DE,0 closed form. */
export const rhoDE = (a: number, w0: number, wa: number) => a ** (-3 * (1 + w0 + wa)) * Math.exp(-3 * wa * (1 - a));
/** Same from d ln rho / d ln a = -3 (1 + w): ln rho = 3 * int_a^1 (1 + w(x))/x dx. */
export const rhoDENumeric = (a: number, w0: number, wa: number) => Math.exp(3 * integrate((x) => (1 + wCpl(x, w0, wa)) / x, a, 1));
