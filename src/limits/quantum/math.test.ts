import { describe, it, expect } from 'vitest';
import * as m from './math';
import { M_SUN, G, C } from '../../data/celestial';
import { schwarzschild, curvatureAt } from '../../math/spacetime';

const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('Hawking', () => {
  it('T_H(1 Msun) ~ 6.17e-8 K, T*M constant', () => {
    expect(rel(m.hawkingT(M_SUN), 6.17e-8)).toBeLessThan(1e-3);
    expect(rel(m.hawkingT(3e12) * 3e12, m.hawkingT(7e33) * 7e33)).toBeLessThan(1e-12);
  });
  it('crossover mass gives T_CMB and is ~4.5e22 kg', () => {
    const M = m.crossoverMass();
    expect(rel(m.hawkingT(M), m.T_CMB)).toBeLessThan(1e-12);
    expect(rel(M, 4.5e22)).toBeLessThan(0.02);
  });
  it('entropy of 1 Msun, independent 4 pi G M^2/(hbar c)', () => {
    const indep = (4 * Math.PI * G * M_SUN ** 2) / (m.HBAR * C);
    expect(rel(m.bhEntropy(M_SUN), indep)).toBeLessThan(1e-12);
    expect(rel(m.bhEntropy(M_SUN), 1.05e77)).toBeLessThan(0.01);
  });
  it('photon-only evaporation time of 5e11 kg is of order the age of the universe', () => {
    const yr = m.evapTime(5e11) / (365.25 * 86400);
    expect(yr).toBeGreaterThan(1e9); expect(yr).toBeLessThan(1e12);
  });
});

describe('Planck units (CODATA 2018)', () => {
  it('values', () => {
    expect(rel(m.L_P, 1.616255e-35)).toBeLessThan(1e-4);
    expect(rel(m.T_P, 5.391247e-44)).toBeLessThan(1e-4);
    expect(rel(m.M_P, 2.176434e-8)).toBeLessThan(1e-4);
    expect(rel(m.E_P_EV, 1.220890e28)).toBeLessThan(1e-4);
    expect(rel(m.RHO_P, 5.15500e96)).toBeLessThan(1e-4);
  });
});

describe('cosmological constant', () => {
  it('rho_Lambda ~ 5.8e-27 kg/m^3', () => expect(rel(m.rhoLambda(), 5.8e-27)).toBeLessThan(0.05));
  it('rho_L^(1/4) ~ 2.2-2.4 meV; with the 1/(16 pi^2) convention the matching cutoff is (16 pi^2)^(1/4) larger', () => {
    const q = m.lambdaFourthRootEv(); expect(q).toBeGreaterThan(2.2e-3); expect(q).toBeLessThan(2.4e-3);
    const e = m.lambdaScaleEv(); expect(rel(e / q, (16 * Math.PI ** 2) ** 0.25)).toBeLessThan(1e-9);
    expect(Math.abs(m.logMismatch(e))).toBeLessThan(1e-9);
  });
  it('mismatch monotonic; ~120 at Planck cutoff', () => {
    let prev = -Infinity;
    for (let l = -3; l <= 28; l += 0.5) { const v = m.logMismatch(10 ** l); expect(v).toBeGreaterThan(prev); prev = v; }
    const p = m.logMismatch(m.E_P_EV); expect(p).toBeGreaterThan(118); expect(p).toBeLessThan(124);
  });
});

describe('curvature', () => {
  it('Kretschmann matches repo implementation (geometric units)', () => {
    const M = 1.7, r = 4.2;
    const k = curvatureAt(schwarzschild, [0, r, Math.PI / 2, 0], { M }).kretschmann;
    const L = (G * M_SUN) / C ** 2; // any length unit: K scales as L^-4
    expect(rel(m.kretschmann((M * L * C ** 2) / G, r * L) * L ** 4, k)).toBeLessThan(1e-9);
  });
  it('Planck-curvature radius: sqrt(K) l_P^2 = 1 there; closed ratio', () => {
    const M = 3e30, rp = m.planckCurvatureRadius(M);
    expect(rel(m.curvaturePlanck(M, rp), 1)).toBeLessThan(1e-9);
    expect(rel(rp / m.schwarzschildR(M), 12 ** (1 / 6) * (m.L_P / m.schwarzschildR(M)) ** (2 / 3))).toBeLessThan(1e-9);
    expect(m.curvaturePlanck(M_SUN, m.schwarzschildR(M_SUN))).toBeLessThan(1e-30);
  });
});
