// Quantum-limits maths, SI units, CODATA 2018 (Tiesinga et al. 2021). Exact: c, h, k_B, e. Measured: G.
import { G, C, M_SUN } from '../../data/celestial';
import { PLANCK_2018 } from '../../data/cosmology';

export const HBAR = 1.054571817e-34;   // J s (exact: h/2pi)
export const KB = 1.380649e-23;        // J/K exact
export const EV = 1.602176634e-19;     // J exact
export const T_CMB = 2.7255;           // K, Fixsen 2009

export const L_P = Math.sqrt((HBAR * G) / C ** 3);
export const T_P = L_P / C;
export const M_P = Math.sqrt((HBAR * C) / G);
export const E_P = M_P * C ** 2;                       // J
export const E_P_EV = E_P / EV;
export const RHO_P = C ** 5 / (HBAR * G ** 2);         // kg/m^3

/** Hawking temperature, K. */
export const hawkingT = (M: number) => (HBAR * C ** 3) / (8 * Math.PI * G * M * KB);
export const schwarzschildR = (M: number) => (2 * G * M) / C ** 2;
/** Bekenstein-Hawking entropy S/k_B = A c^3/(4 G hbar), A = 4 pi r_s^2. */
export const bhEntropy = (M: number) => (4 * Math.PI * schwarzschildR(M) ** 2 * C ** 3) / (4 * G * HBAR);
/** Photon-only (greybody-free) evaporation time, s. Order-of-magnitude only. */
export const evapTime = (M: number) => (5120 * Math.PI * G ** 2 * M ** 3) / (HBAR * C ** 4);
/** Mass where T_H = T_CMB. */
export const crossoverMass = (T = T_CMB) => (HBAR * C ** 3) / (8 * Math.PI * G * KB * T);

/** Dark-energy density Omega_L * 3 H0^2/(8 pi G), kg/m^3 (Planck 2018 set of the repo). */
export function rhoLambda(): number {
  const H0 = (PLANCK_2018.params.H0 * 1000) / 3.085677581491367e22; // km/s/Mpc -> 1/s
  return (PLANCK_2018.params.OL * 3 * H0 ** 2) / (8 * Math.PI * G);
}
/** Naive zero-point energy density with cutoff E_c (J): E^4/(16 pi^2 (hbar c)^3), J/m^3. */
export const rhoVacEnergy = (Ec: number) => Ec ** 4 / (16 * Math.PI ** 2 * (HBAR * C) ** 3);
/** log10(rho_vac / rho_Lambda), E_c in eV. */
export const logMismatch = (EcEv: number) => Math.log10(rhoVacEnergy(EcEv * EV) / (rhoLambda() * C ** 2));
/** Cutoff (eV) at which the naive estimate equals rho_Lambda. */
export const lambdaScaleEv = () => (16 * Math.PI ** 2 * (HBAR * C) ** 3 * rhoLambda() * C ** 2) ** 0.25 / EV;

/** rho_Lambda^(1/4) in natural units, (rho c^2 (hbar c)^3)^(1/4), eV: the familiar ~2.3 meV (no 16 pi^2). */
export const lambdaFourthRootEv = () => (rhoLambda() * C ** 2 * (HBAR * C) ** 3) ** 0.25 / EV;

/** Kretschmann scalar of Schwarzschild, m^-4. */
export const kretschmann = (M: number, r: number) => (48 * G ** 2 * M ** 2) / (C ** 4 * r ** 6);
/** Curvature sqrt(K) in Planck units (1 = l_P^-2). */
export const curvaturePlanck = (M: number, r: number) => Math.sqrt(kretschmann(M, r)) * L_P ** 2;
/** Radius where sqrt(K) = 1/l_P^2: r^6 = 48 G^2 M^2 l_P^4/c^4. */
export const planckCurvatureRadius = (M: number) => ((48 * G ** 2 * M ** 2 * L_P ** 4) / C ** 4) ** (1 / 6);

export { M_SUN };
