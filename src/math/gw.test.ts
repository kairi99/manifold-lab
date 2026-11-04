import { describe, expect, it } from 'vitest';
import {
  T_SUN, chirpMass, chirpMassFromFdot, chirpStrain, detectorFrameMass, fGW, fIsco, inspiralPhase, inspiralStrain,
  kerrQnm22, ringDisplacement, ringPositionExact, tauAtFrequency,
} from './gw';
import { C, G, GM_SUN } from '../data/celestial';

const ring = (n: number) => Array.from({ length: n }, (_, k) => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)]);
const area = (pts: number[][]) => {
  let s = 0;
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; s += p[0] * q[1] - q[0] * p[1]; });
  return Math.abs(s) / 2;
};

describe('ring', () => {
  it('plus stretches x, squeezes y', () => {
    expect(ringDisplacement(1, 0, 0.1, 0)).toEqual([0.05, 0]);
    expect(ringDisplacement(0, 1, 0.1, 0)).toEqual([0, -0.05]);
  });
  it('cross = plus rotated 45 deg', () => {
    const h = 0.1, c = Math.SQRT1_2;
    for (const [x, y] of ring(7)) {
      // rotate point into the 45-degree frame, apply +, rotate back
      const [u, v] = [c * (x + y), c * (-x + y)];
      const [du, dv] = ringDisplacement(u, v, h, 0);
      const back = [c * (du - dv), c * (du + dv)];
      const [dx, dy] = ringDisplacement(x, y, 0, h);
      // + along (u,v) axes is x-stretch along (1,1)/sqrt2 i.e. a cross pattern in x,y, sign-checked below
      expect(back[0]).toBeCloseTo(dx, 12);
      expect(back[1]).toBeCloseTo(dy, 12);
    }
  });
  it('helicity 2: invariant under 180 deg rotation, not 90', () => {
    const [dx, dy] = ringDisplacement(0.3, 0.8, 0.1, 0.07);
    const [ex, ey] = ringDisplacement(-0.3, -0.8, 0.1, 0.07);
    expect([ex, ey]).toEqual([-dx, -dy]); // displacement field rotates with the ring
    const [fx, fy] = ringDisplacement(-0.8, 0.3, 0.1, 0.07); // 90 deg: pattern flips sign (spin-2, not spin-1)
    expect(fx).not.toBeCloseTo(-dy, 6);
    expect(fy).not.toBeCloseTo(dx, 6);
  });
  it('area preserved to first order; exact map has det 1', () => {
    const h = 1e-3;
    const pts = ring(400).map(([x, y]) => { const [dx, dy] = ringDisplacement(x, y, h, 0.4 * h); return [x + dx, y + dy]; });
    expect(Math.abs(area(pts) / area(ring(400)) - 1)).toBeLessThan(2 * h * h);
    const ex = ring(400).map(([x, y]) => ringPositionExact(x, y, 1.3, 0.8));
    expect(area(ex) / area(ring(400))).toBeCloseTo(1, 10);
    const [a, b] = ringPositionExact(1, 0, 1e-8, 0);
    expect(a).toBeCloseTo(1 + 0.5e-8, 12);
    expect(b).toBe(0);
  });
});

describe('chirp', () => {
  it('Mc(36,29)', () => {
    expect(chirpMass(36, 29)).toBeCloseTo((36 * 29) ** 0.6 / 65 ** 0.2, 12);
    expect(chirpMass(36, 29)).toBeCloseTo(28.1, 0);
    expect(chirpMass(35.6, 30.6)).toBeCloseTo(28.6, 0);
  });
  it('f_ISCO and redshift', () => {
    const M = 65;
    expect(fIsco(M)).toBeCloseTo(C ** 3 / (6 ** 1.5 * Math.PI * G * M * (GM_SUN / G)), 6);
    expect(fIsco(M)).toBeCloseTo(67.7, 0);
    expect(detectorFrameMass(36, 0.09)).toBeCloseTo(39.24, 10);
  });
  it('f(tau) monotonic and invertible', () => {
    const mc = 30;
    let prev = Infinity;
    for (const tau of [0.5, 0.3, 0.2, 0.1, 0.05, 0.02]) { const f = fGW(mc, tau); expect(f).toBeGreaterThan(prev === Infinity ? 0 : prev); prev = f; }
    expect(tauAtFrequency(mc, fGW(mc, 0.123))).toBeCloseTo(0.123, 12);
    expect(fGW(28.6 * 1.09, 0.15)).toBeGreaterThan(35); // GW150914 enters the 35 Hz band ~0.15 s before merger
  });
  it('Mc recovered from f, fdot of the synthetic phase < 1%', () => {
    const mc = 30, dt = 1e-4, tau0 = 0.1;
    const phi = (tau: number) => inspiralPhase(mc, tau);
    const fOf = (tau: number) => -(phi(tau + dt) - phi(tau - dt)) / (2 * dt) / (2 * Math.PI); // d/dt = -d/dtau
    const f = fOf(tau0);
    const fdot = -(fOf(tau0 + dt) - fOf(tau0 - dt)) / (2 * dt);
    expect(Math.abs(chirpMassFromFdot(f, fdot) / mc - 1)).toBeLessThan(0.01);
  });
  it('strain: order 1e-21 at 410 Mpc, face-on is circular', () => {
    const p = { mcDet: 28.6 * 1.09, dMpc: 440, inclination: 0 };
    const s = inspiralStrain(p, 0.01);
    expect(Math.hypot(s.hPlus, s.hCross)).toBeGreaterThan(1e-22);
    expect(Math.hypot(s.hPlus, s.hCross)).toBeLessThan(1e-20);
    const e = inspiralStrain({ ...p, inclination: Math.PI / 2 }, 0.01);
    expect(Math.abs(e.hCross)).toBeLessThan(1e-30);
  });
  it('QNM for a=0.67, M=62 and continuity of illustrative ringdown', () => {
    const q = kerrQnm22(62, 0.67);
    expect(q.f).toBeGreaterThan(250); expect(q.f).toBeLessThan(300);
    expect(q.tauDamp).toBeGreaterThan(2e-3); expect(q.tauDamp).toBeLessThan(6e-3);
    const p = { mcDet: 28.6 * 1.09, dMpc: 440, inclination: 0.5, mFinalDet: 62 * 1.09, finalSpin: 0.67 };
    const ts = tauAtFrequency(p.mcDet, q.f * (62 / 62)); // f_ring depends on mFinalDet; recompute exactly
    const qq = kerrQnm22(p.mFinalDet, p.finalSpin);
    const t0 = -tauAtFrequency(p.mcDet, qq.f);
    const a = chirpStrain(p, t0 - 1e-9), b = chirpStrain(p, t0 + 1e-9);
    expect(a.hPlus).toBeCloseTo(b.hPlus, 25);
    expect(Math.abs(chirpStrain(p, 0.05).hPlus)).toBeLessThan(1e-25);
    expect(ts).toBeGreaterThan(0); expect(T_SUN).toBeCloseTo(4.9255e-6, 9);
  });
});

import { GW150914_H1, GW150914_H1_TEMPLATE, GW150914_L1 } from '../data/gw150914';
describe('GW150914 data', () => {
  for (const s of [GW150914_H1, GW150914_L1, GW150914_H1_TEMPLATE]) {
    it(s.label, () => {
      expect(s.t.length).toBe(s.h.length);
      expect(s.t.length).toBeGreaterThan(500);
      expect(s.t.length).toBeLessThanOrEqual(1500);
      expect(s.t.every((x, i) => Number.isFinite(x) && Number.isFinite(s.h[i]) && (i === 0 || x > s.t[i - 1]))).toBe(true);
      const peak = Math.max(...s.h.map(Math.abs));
      expect(peak).toBeGreaterThan(0.5); // units of 1e-21
      expect(peak).toBeLessThan(2);
      expect(s.t[0]).toBeLessThan(-0.1);
      expect(s.t[s.t.length - 1]).toBeGreaterThan(0.03);
    });
  }
});
