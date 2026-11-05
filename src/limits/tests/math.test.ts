import { describe, expect, it } from 'vitest';
import { bdGamma, CASSINI, deflection, limbDeflectionGR, mercuryAdvance, nordtvedt, omegaBound, omegaOfGamma, pull, mercuryMeas, MERCURY_GR } from './math';
import { POINTS, FAMILIES } from './data';

describe('PPN predictions', () => {
  it('limb deflection is 1.7505" for gamma = 1', () => {
    expect(Math.abs(limbDeflectionGR() - 1.7505)).toBeLessThan(1e-3);
    expect(deflection(1)).toBeCloseTo(limbDeflectionGR(), 12);
    expect(deflection(0)).toBeCloseTo(limbDeflectionGR() / 2, 12);
  });
  it('perihelion advance is 42.98"/cy at gamma = beta = 1; eta_N = 0', () => {
    expect(mercuryAdvance(1, 1)).toBeCloseTo(MERCURY_GR, 12);
    expect(nordtvedt(1, 1)).toBe(0);
    expect(pull(mercuryAdvance(1, 1), mercuryMeas())).toBe(0);
  });
  it('Brans-Dicke gamma(omega) and the Cassini bound', () => {
    expect(bdGamma(1e12)).toBeCloseTo(1, 11);
    expect(bdGamma(0)).toBe(0.5);
    expect(omegaOfGamma(bdGamma(123))).toBeCloseTo(123, 8);
    const w = omegaBound(CASSINI.value, CASSINI.sigma);
    expect(w).toBeGreaterThan(3.9e4);
    expect(w).toBeLessThan(4.1e4);
  });
});

describe('data', () => {
  it('years increase within each family (sorted by year), bounds positive, ids unique, https', () => {
    expect(new Set(POINTS.map((p) => p.id)).size).toBe(POINTS.length);
    for (const f of FAMILIES) {
      const ys = POINTS.filter((p) => p.family === f.id).map((p) => p.year);
      expect(ys.length).toBeGreaterThan(0);
      expect([...ys].sort((a, b) => a - b)).toEqual(ys.slice().sort((a, b) => a - b));
      for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1]);
    }
    for (const p of POINTS) {
      if (p.bound !== null) expect(p.bound).toBeGreaterThan(0);
      expect(p.source.url).toMatch(/^https:\/\//);
      expect(p.checked).toBe('2026-11');
    }
  });
});
