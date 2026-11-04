import { describe, expect, it } from 'vitest';
import { kn, knIdentityResidual, mergerMaxRadiated, rPlusKN, rPlusKerr } from './math';

describe('Penrose inequality on Kerr–Newman', () => {
  it('Schwarzschild is equality', () => {
    for (const m of [0.5, 1, 7.3]) {
      const k = kn(m, 0, 0);
      expect(Math.abs(k.sqrtA16pi - m)).toBeLessThan(1e-12);
      expect(Math.abs(k.ratio - 1)).toBeLessThan(1e-12);
    }
  });
  it('holds on a dense (a, Q) grid, equality only at the origin', () => {
    const N = 80;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const a = i / N, Q = j / N;
      if (a * a + Q * Q > 1) continue;
      const k = kn(1, a, Q);
      expect(Math.abs(knIdentityResidual(1, a, Q))).toBeLessThan(1e-14);
      if (i === 0 && j === 0) expect(k.margin).toBeLessThan(1e-12);
      else expect(k.margin).toBeGreaterThan(0);
      expect(k.ratio).toBeLessThanOrEqual(1 + 1e-15);
    }
  });
  it('extremal values', () => {
    expect(Math.abs(kn(1, 1, 0).ratio - 1 / Math.SQRT2)).toBeLessThan(1e-12);
    expect(Math.abs(kn(1, 0, 1).ratio - 0.5)).toBeLessThan(1e-12);
    expect(Math.abs(kn(3, 3, 0).sqrtA16pi - 3 / Math.SQRT2)).toBeLessThan(1e-12);
  });
  it('r₊ agrees with kerr.ts horizons for Q = 0', () => {
    for (const a of [0, 0.3, 0.9, 1]) expect(Math.abs(rPlusKN(1, a, 0) - rPlusKerr(1, a))).toBeLessThan(1e-14);
    expect(Math.abs(rPlusKN(2, 1, 0) - rPlusKerr(2, 1))).toBeLessThan(1e-14);
  });
  it('merger bound: equal masses radiate at most 1 − 1/√2 of M', () => {
    expect(Math.abs(mergerMaxRadiated(1, 1) / 2 - (1 - 1 / Math.SQRT2))).toBeLessThan(1e-14);
  });
});
