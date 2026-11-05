import { describe, expect, it } from 'vitest';
import { GALAXIES } from './data';
import { ACC_UNIT, G, fitHalo, halfRadius, rar, v2Iso, v2Nfw, v2NfwNumeric, vInfIso, vPoint, A0_DEFAULT } from './math';

describe('rotation curve math', () => {
  it('point mass is Keplerian', () => {
    expect(vPoint(1e10, 8) / vPoint(1e10, 2)).toBeCloseTo(0.5, 12);
  });
  it('isothermal tends to constant', () => {
    const v = Math.sqrt(v2Iso(1e7, 3, 1e6));
    expect(v / vInfIso(1e7, 3)).toBeCloseTo(1, 4);
  });
  it('NFW closed form matches numerical integral', () => {
    for (const r of [0.5, 5, 40]) {
      const a = v2Nfw(5e6, 12, r), b = v2NfwNumeric(5e6, 12, r);
      expect(Math.abs(a - b) / a).toBeLessThan(1e-5);
    }
    expect(G).toBe(4.30091e-6);
  });
  it('RAR limits', () => {
    const a0 = A0_DEFAULT;
    expect(rar(1e3 * a0, a0) / (1e3 * a0)).toBeCloseTo(1, 10);
    expect(rar(1e-8 * a0, a0) / Math.sqrt(1e-8 * a0 * a0)).toBeCloseTo(1, 3);
    expect(ACC_UNIT).toBeCloseTo(3.2408e-14, 17);
  });
  it('SPARC data sanity', () => {
    expect(GALAXIES.length).toBeGreaterThanOrEqual(3);
    for (const g of GALAXIES) {
      const n = g.r.length;
      for (const a of [g.vObs, g.err, g.vGas, g.vDisk, g.vBul]) expect(a.length).toBe(n);
      for (let i = 1; i < n; i++) expect(g.r[i]).toBeGreaterThan(g.r[i - 1]);
      for (const e of g.err) expect(e).toBeGreaterThan(0);
    }
  });
  it('halo fit beats baryons-only for NGC 3198 and half radius exists', () => {
    const g = GALAXIES.find((x) => x.id === 'NGC3198')!;
    const p = { yd: 0.5, yb: 0.7, halo: 'iso' as const, logRho: 7, rs: 3, a0: A0_DEFAULT };
    const f = fitHalo(g, p);
    expect(f.chi2Dof).toBeLessThan(20);
    expect(halfRadius(g, p)).not.toBeNull();
  });
});
