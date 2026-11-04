import { describe, it, expect } from 'vitest';
import * as K from './cosmology';
import { PLANCK_2018 } from '../data/cosmology';

const H0 = 70, DH = K.C_KMS / H0;
const eds = { H0, Om: 1, Or: 0, OL: 0 };
const milne = { H0, Om: 0, Or: 0, OL: 0 };
const dS = { H0, Om: 0, Or: 0, OL: 1 };
const rel = (a: number, b: number) => Math.abs(a - b) / Math.abs(b);

describe('analytic limits', () => {
  it('EdS age = 2/(3H0), D_C closed form, t(a) ~ a^1.5', () => {
    expect(rel(K.age(0, eds), (2 / 3) * K.hubbleTimeGyr(eds))).toBeLessThan(1e-8);
    for (const z of [0.5, 3, 1000]) expect(rel(K.comovingDistance(z, eds), 2 * DH * (1 - 1 / Math.sqrt(1 + z)))).toBeLessThan(1e-8);
    expect(rel(K.scaleFactorAt(K.age(0, eds) / 2, eds), 0.5 ** (2 / 3))).toBeLessThan(1e-8);
  });
  it('Milne: D_L = (c/H0) z(1+z/2), age = 1/H0', () => {
    for (const z of [0.1, 1, 5]) expect(rel(K.luminosityDistance(z, milne), DH * z * (1 + z / 2))).toBeLessThan(1e-8);
    expect(rel(K.age(0, milne), K.hubbleTimeGyr(milne))).toBeLessThan(1e-6);
  });
  it('de Sitter: D_C = cz/H0, event horizon = c/H0, hubble radius constant', () => {
    expect(rel(K.comovingDistance(2, dS), (2 * DH))).toBeLessThan(1e-9);
    expect(rel(K.eventHorizon(1, dS), DH)).toBeLessThan(1e-9);
    expect(rel(K.hubbleRadius(0.3, dS), DH)).toBeLessThan(1e-12);
  });
  it('event horizon infinite without Lambda; mu at z=0.01 sane', () => {
    expect(K.eventHorizon(1, eds)).toBe(Infinity);
    expect(K.distanceModulus(0.01, eds)).toBeCloseTo(5 * Math.log10(K.luminosityDistance(0.01, eds)) + 25, 12);
  });
});

describe('Planck 2018', () => {
  const p = PLANCK_2018.params;
  it('radiation Or ~ 9.1e-5 and flat', () => {
    expect(p.Or).toBeGreaterThan(9.0e-5); expect(p.Or).toBeLessThan(9.3e-5);
    expect(Math.abs(K.curvature(p))).toBeLessThan(1e-12);
  });
  it('age 13.787 Gyr +/- 0.02', () => expect(Math.abs(K.age(0, p) - 13.787)).toBeLessThan(0.02));
  it('D_A peaks near z ~ 1.6', () => {
    let best = 0, zb = 0;
    for (let z = 0.5; z < 4; z += 0.05) { const d = K.angularDiameterDistance(z, p); if (d > best) { best = d; zb = z; } }
    expect(zb).toBeGreaterThan(1.4); expect(zb).toBeLessThan(1.8);
  });
  it('particle horizon ~46 Gly, event horizon 16-17 Gly', () => {
    expect(rel(K.mpcToGly(K.particleHorizonToday(p)), 46.3)).toBeLessThan(0.02);
    const eh = K.mpcToGly(K.eventHorizonToday(p));
    expect(eh).toBeGreaterThan(16); expect(eh).toBeLessThan(17.2);
  });
  it('a(t) inverts t(a); lookback consistent', () => {
    expect(rel(K.scaleFactorAt(K.cosmicTime(0.4, p), p), 0.4)).toBeLessThan(1e-8);
    expect(K.lookbackTime(1, p)).toBeCloseTo(K.age(0, p) - K.age(1, p), 12);
  });
  it('conformal diagram: light cone meets horizon at big bang, galaxy lines are vertical', () => {
    const d = K.conformalDiagram(p, { redshifts: [1] });
    const eta0 = d.particleHorizon.find((q) => Math.abs(q[1] - d.now[1]) < 1e-9)![0];
    expect(d.lightCone[d.lightCone.length - 1][0]).toBeCloseTo(0, 6);
    expect(d.lightCone[0][0]).toBeGreaterThan(eta0 * 0.97);
    expect(new Set(d.galaxies[0].pts.map((q) => q[0])).size).toBe(1);
    expect(K.conformalDiagram(eds, { time: 'cosmic' }).eventHorizon).toHaveLength(0);
  });
});
