import { describe, it, expect } from 'vitest';
import { BODIES, ORBITS, LIGHT, G, C, GM_SUN, M_SUN, PC, YEAR, bodyById, massInGeometricUnits } from './celestial';

const ARCSEC = Math.PI / 180 / 3600;
const m = (id: string) => massInGeometricUnits(bodyById(id)!.gm);
const orbit = (id: string) => ORBITS.find((o) => o.id === id)!;
const precessPerOrbit = (o: { aM: number; e: number }, M: number) => 6 * Math.PI * M / (o.aM * (1 - o.e ** 2));

describe('celestial data', () => {
  it('constants', () => { expect(M_SUN).toBeCloseTo(1.98841e30, -26); expect(GM_SUN / G / M_SUN).toBe(1); });
  it('r_s Sun ~2953 m, Earth ~8.87 mm', () => {
    expect(2 * m('sun')).toBeCloseTo(2953, 0);
    expect(2 * m('earth') * 1e3).toBeCloseTo(8.87, 2);
  });
  it('Mercury ~42.98"/century', () => {
    const o = orbit('mercury');
    const v = precessPerOrbit(o, m('sun')) * (100 * YEAR / o.periodS) / ARCSEC;
    expect(Math.abs(v - 42.98)).toBeLessThan(0.05);
  });
  it('S2 ~12 arcmin/orbit; P ~16 yr', () => {
    const o = orbit('s2');
    expect(Math.abs(precessPerOrbit(o, m('sgr-a')) / ARCSEC / 60 - 12)).toBeLessThan(0.5);
    expect(o.periodS / YEAR).toBeCloseTo(16.05, 1);
  });
  it('grazing Sun 1.75"', () => {
    const l = LIGHT.find((x) => x.id === 'sun-graze')!;
    expect(Math.abs(4 * m('sun') / l.impactParameterM / ARCSEC - 1.75)).toBeLessThan(0.01);
  });
  it('M87* shadow ~40 uas, within EHT 42+/-3; Sgr A* within 51.8+/-2.3 x2', () => {
    const d = (2 * LIGHT.find((x) => x.id === 'm87-shadow')!.impactParameterM) / bodyById('m87')!.distanceM! / ARCSEC * 1e6;
    expect(d).toBeCloseTo(40, 0); expect(Math.abs(d - 42)).toBeLessThan(3);
    const s = (2 * LIGHT.find((x) => x.id === 'sgra-shadow')!.impactParameterM) / bodyById('sgr-a')!.distanceM! / ARCSEC * 1e6;
    expect(Math.abs(s - 51.8)).toBeLessThan(2 * 2.3);
  });
  it('GPS gravitational +45.7 and velocity -7.2 us/day', () => {
    const o = orbit('gps'), e = bodyById('earth')!;
    const grav = massInGeometricUnits(e.gm) * (1 / e.radiusM! - 1 / o.aM) * 86400 * 1e6;
    const vel = -(e.gm / o.aM) / (2 * C ** 2) * 86400 * 1e6;
    expect(Math.abs(grav - 45.7)).toBeLessThan(0.3);
    expect(Math.abs(vel + 7.2)).toBeLessThan(0.2);
  });
  it('Hulse-Taylor 1PN periastron advance ~4.2266 deg/yr', () => {
    const o = orbit('hulse-taylor'), M = m('psr-b1913') / C; // GM/c^3 in s
    const w = 3 * (2 * Math.PI / o.periodS) ** (5 / 3) * M ** (2 / 3) / (1 - o.e ** 2); // rad/s
    expect(Math.abs(w * YEAR * 180 / Math.PI - 4.226598)).toBeLessThan(0.05);
  });
  it('ids unique and references resolve', () => {
    expect(new Set(BODIES.map((b) => b.id)).size).toBe(BODIES.length);
    for (const x of [...ORBITS, ...LIGHT]) expect(bodyById(x.centralId)).toBeDefined();
    expect(PC).toBeGreaterThan(3e16);
  });
});
