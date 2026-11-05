// PPN predictions for the solar-system tests. G = c = 1 elsewhere in the app; here SI so the arcsecond value is checkable.
export const GM_SUN = 1.32712440018e20; // m^3/s^2, IAU 2015 B3 nominal
export const C = 299792458; // m/s
export const R_SUN = 6.957e8; // m, IAU 2015 B3 nominal (same as src/data/grTests.ts)
export const ARCSEC = 206264.80624709636; // arcsec per rad
export const MERCURY_GR = 42.98; // arcsec/century, GR value (Will 2014 / Park et al. 2017 quote ~42.98)

/** Deflection of GR at the solar limb, arcsec. */
export const limbDeflectionGR = () => (4 * GM_SUN) / (C * C * R_SUN) * ARCSEC;
export const deflection = (gamma: number) => ((1 + gamma) / 2) * limbDeflectionGR();
export const shapiroFactor = (gamma: number) => (1 + gamma) / 2;
export const mercuryAdvance = (gamma: number, beta: number) => ((2 + 2 * gamma - beta) / 3) * MERCURY_GR;
export const nordtvedt = (gamma: number, beta: number) => 4 * beta - gamma - 3;
/** Brans-Dicke: gamma = (1+omega)/(2+omega), beta = 1. */
export const bdGamma = (omega: number) => (1 + omega) / (2 + omega);
/** omega such that bdGamma(omega) = gamma (gamma < 1). */
export const omegaOfGamma = (gamma: number) => (1 - 2 * gamma) / (gamma - 1);
/** Brans-Dicke bound from a measured gamma-1 = m +- s: omega > 1/(2s - m) - 2 at 2 sigma (gamma - 1 = -1/(2+omega) < 0). */
export const omegaBound = (m: number, s: number) => 1 / (2 * s - m) - 2;

export interface Meas { value: number; sigma: number }
// Measured values, all dimensionless offsets from GR unless noted. Sources are in index.tsx.
export const CASSINI: Meas = { value: 2.1e-5, sigma: 2.3e-5 }; // gamma - 1, Bertotti et al. 2003
export const VLBI: Meas = { value: -1.6e-4, sigma: 1.5e-4 }; // gamma - 1, Lambert & Le Poncin-Lafitte 2009 (as quoted by Will 2014)
export const LLR: Meas = { value: 4.4e-4, sigma: 4.5e-4 }; // eta_N, Williams, Turyshev & Boggs 2004
export const BETA_LIMIT = 8e-5; // |beta - 1| from Mercury, Will 2014 Table 4
/** Mercury: the measurement is consistent with GR, so the centre is the GR value and the width follows the PPN limits. */
export const mercuryMeas = (): Meas => ({ value: MERCURY_GR, sigma: (MERCURY_GR / 3) * Math.hypot(2 * CASSINI.sigma, BETA_LIMIT) });
export const pull = (pred: number, m: Meas) => (pred - m.value) / m.sigma;
