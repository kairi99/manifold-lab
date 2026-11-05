import { describe, expect, it } from 'vitest';
import { DE_MEAS, H0_MEAS, OM_PLANCK, PLANCK_AGE_GYR, S8_MEAS } from './data';
import { ageFlat, ageFlatNumeric, rhoDE, rhoDENumeric, tension, wCpl } from './math';
import { age } from '../../math/cosmology';

describe('tension', () => {
  it('matches hand values', () => {
    expect(tension({ value: 73, plus: 1, minus: 1 }, { value: 67, plus: 0.5, minus: 0.5 })).toBeCloseTo(6 / Math.sqrt(1.25), 12);
    expect(tension({ value: 5, plus: 3, minus: 1 }, { value: 3, plus: 4, minus: 2 })).toBeCloseTo(2 / Math.hypot(1, 4), 12);
  });
  it('is symmetric and zero for equal values', () => {
    const [p, h] = H0_MEAS;
    expect(tension(p, h)).toBe(tension(h, p));
    expect(tension(p, p)).toBe(0);
  });
  it('H0DN vs Planck is a ~6 sigma gap', () => {
    const p = H0_MEAS.find((m) => m.id === 'planck')!, h = H0_MEAS.find((m) => m.id === 'h0dn')!;
    expect(tension(p, h)).toBeGreaterThan(5.5);
    expect(tension(p, h)).toBeLessThan(7);
  });
  it('KiDS-Legacy is within 1 sigma of Planck (paper: 0.73)', () => {
    const p = S8_MEAS[0], k = S8_MEAS.find((m) => m.id === 'kidsleg')!;
    expect(tension(p, k)).toBeLessThan(1);
  });
});

describe('flat LCDM age', () => {
  it('closed form equals numerical integral and the shared cosmology module', () => {
    for (const [H0, Om] of [[67.36, 0.3153], [73.5, 0.3153], [70, 0.25]] as const) {
      const a = ageFlat(H0, Om);
      expect(Math.abs(ageFlatNumeric(H0, Om) - a) / a).toBeLessThan(1e-6);
      expect(Math.abs(age(0, { H0, Om, Or: 0, OL: 1 - Om }) - a) / a).toBeLessThan(1e-5);
    }
  });
  it('Planck parameters give 13.79 Gyr within 0.5%', () => {
    const t = ageFlat(67.36, OM_PLANCK.value);
    expect(Math.abs(t - PLANCK_AGE_GYR.value) / PLANCK_AGE_GYR.value).toBeLessThan(0.005);
    expect(Math.abs(t - 13.79) / 13.79).toBeLessThan(0.005);
  });
  it('scales as 1/H0', () => expect(ageFlat(70, 0.3) * 70).toBeCloseTo(ageFlat(35, 0.3) * 35, 10));
});

describe('CPL dark energy', () => {
  it('w(1) = w0 and rho(1) = 1', () => {
    expect(wCpl(1, -0.8, -0.7)).toBe(-0.8);
    expect(rhoDE(1, -0.8, -0.7)).toBe(1);
  });
  it('closed form matches the continuity-equation integral', () => {
    for (const [w0, wa] of [[-1, 0], [-0.75, -0.86], [-0.42, -1.75], [-1.2, 0.5]] as const)
      for (const a of [0.25, 0.5, 0.9]) {
        const c = rhoDE(a, w0, wa);
        expect(Math.abs(rhoDENumeric(a, w0, wa) - c) / c).toBeLessThan(1e-8);
      }
  });
  it('Lambda has constant density', () => expect(rhoDE(0.3, -1, 0)).toBeCloseTo(1, 12));
});

describe('data sanity', () => {
  const all = [...H0_MEAS, ...S8_MEAS].map((m) => ({ ...m, ps: [m.plus, m.minus] }));
  it('positive sigmas, https sources, checked stamp', () => {
    for (const m of all) { expect(m.ps.every((x) => x > 0)).toBe(true); expect(m.source.url.startsWith('https://')).toBe(true); expect(m.checked).toBe('2026-11'); }
    for (const m of DE_MEAS) { expect([m.w0p, m.w0m, m.wap, m.wam].every((x) => x > 0)).toBe(true); expect(m.source.url.startsWith('https://')).toBe(true); expect(m.sigma).toBeGreaterThan(0); }
  });
  it('unique ids', () => {
    for (const l of [H0_MEAS, S8_MEAS, DE_MEAS]) expect(new Set(l.map((m) => m.id)).size).toBe(l.length);
  });
});
