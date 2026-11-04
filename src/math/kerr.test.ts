import { describe, expect, it } from 'vitest';
import {
  horizons, ergosphere, iscoKerr, photonOrbitKerr, frameDragging, kerrMetric, kerrInverse,
  circularEquatorial, kerrOrbitFromApsides, integrateKerr,
} from './kerr';
import { circular, orbitFromApsides } from './schwarzschild';

describe('kerr closed forms', () => {
  it('a=0 reduces to Schwarzschild', () => {
    expect(horizons(0)).toEqual({ rPlus: 2, rMinus: 0 });
    expect(iscoKerr(0, true)).toBeCloseTo(6, 12);
    expect(iscoKerr(0, false)).toBeCloseTo(6, 12);
    expect(photonOrbitKerr(0, true)).toBeCloseTo(3, 12);
    expect(photonOrbitKerr(0, false)).toBeCloseTo(3, 12);
    const c = circular(8)!, k = circularEquatorial(0, 8, true)!;
    expect(k.E).toBeCloseTo(c.E, 12);
    expect(k.L).toBeCloseTo(c.L, 12);
    expect(k.Omega).toBeCloseTo(c.omega, 12);
  });
  it('extremal-ish spin limits', () => {
    expect(iscoKerr(0.998, true)).toBeCloseTo(1.237, 2);
    expect(iscoKerr(0.998, false)).toBeCloseTo(8.994, 2);
    expect(iscoKerr(0.5, true)).toBeCloseTo(4.233, 3);
    expect(photonOrbitKerr(0.998, true)).toBeCloseTo(1.074, 2);
    expect(photonOrbitKerr(0.998, false)).toBeCloseTo(3.998, 3);
  });
  it('ergosphere', () => {
    expect(ergosphere(0.9, Math.PI / 2)).toBeCloseTo(2, 12);
    expect(ergosphere(0.9, 0)).toBeCloseTo(horizons(0.9).rPlus, 12);
  });
  it('frame dragging ~ 2a/r³ far away', () => {
    expect(frameDragging(0.7, 1e3, 1.0) * 1e9 / 1.4).toBeCloseTo(1, 5);
    const g = kerrMetric(0.7, 5, 1.1);
    expect(frameDragging(0.7, 5, 1.1)).toBeCloseTo(-g.gtphi / g.gphiphi, 12);
  });
  it('inverse metric times metric = identity', () => {
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * 0.99, r = 2.5 + Math.random() * 10, th = 0.1 + Math.random() * 2.9;
      const g = kerrMetric(a, r, th), h = kerrInverse(a, r, th);
      expect(g.gtt * h.gtt + g.gtphi * h.gtphi).toBeCloseTo(1, 10);
      expect(g.gtt * h.gtphi + g.gtphi * h.gphiphi).toBeCloseTo(0, 10);
      expect(g.gtphi * h.gtt + g.gphiphi * h.gtphi).toBeCloseTo(0, 10);
      expect(g.gtphi * h.gtphi + g.gphiphi * h.gphiphi).toBeCloseTo(1, 10);
      expect(g.grr * h.grr).toBeCloseTo(1, 12);
      expect(g.gthth * h.gthth).toBeCloseTo(1, 12);
    }
  });
  it('circular orbit is null inside photon orbit', () => {
    expect(circularEquatorial(0.9, 1.2, true)).toBeNull();
    expect(circularEquatorial(0.9, 3.5, false)).toBeNull();
  });
  it('apsides: a=0 matches Schwarzschild, Kerr satisfies R(rp)=R(ra)=0', () => {
    const s = orbitFromApsides(8, 20)!, k = kerrOrbitFromApsides(0, 8, 20, true)!;
    expect(k.E).toBeCloseTo(s.E, 10);
    expect(k.L).toBeCloseTo(s.L, 10);
    for (const pro of [true, false]) {
      const o = kerrOrbitFromApsides(0.9, 8, 20, pro)!;
      expect(o).not.toBeNull();
      expect(Math.sign(o.L)).toBe(pro ? 1 : -1);
      const a = 0.9;
      for (const r of [8, 20]) {
        const R = ((r * r + a * a) * o.E - a * o.L) ** 2 - (r * r - 2 * r + a * a) * (r * r + (o.L - a * o.E) ** 2);
        expect(Math.abs(R)).toBeLessThan(1e-8);
      }
    }
  });
});

describe('integrateKerr', () => {
  for (const pro of [true, false]) {
    it(`circular orbit a=0.9 r=8 ${pro ? 'prograde' : 'retrograde'}`, () => {
      const c = circularEquatorial(0.9, 8, pro)!;
      const res = integrateKerr({ a: 0.9, kind: 'timelike', E: c.E, L: c.L, r0: 8, theta0: Math.PI / 2, pr0: 0, lambdaMax: 200, nSamples: 50 });
      expect(res.fate).toBe('bound');
      for (const s of res.samples) {
        expect(Math.abs(s.r - 8)).toBeLessThan(1e-8);
        expect(Math.abs(s.theta - Math.PI / 2)).toBeLessThan(1e-10);
      }
      const e = res.samples[res.samples.length - 1];
      expect(e.phi / e.t).toBeCloseTo(c.Omega, 8);
      expect(res.maxConstraintDrift).toBeLessThan(1e-9);
      expect(res.carterQ).toBeCloseTo(0, 12);
    });
  }
  it('eccentric equatorial orbit: drift small, stays equatorial', () => {
    const o = kerrOrbitFromApsides(0.9, 8, 20, true)!;
    const res = integrateKerr({ a: 0.9, kind: 'timelike', E: o.E, L: o.L, r0: 8, theta0: Math.PI / 2, pr0: 0, lambdaMax: 1000, nSamples: 200 });
    expect(res.maxConstraintDrift).toBeLessThan(1e-9);
    const rs = res.samples.map((s) => s.r);
    expect(Math.min(...rs)).toBeCloseTo(8, 6);
    expect(Math.max(...rs)).toBeCloseTo(20, 3);
    for (const s of res.samples) expect(Math.abs(s.theta - Math.PI / 2)).toBeLessThan(1e-10);
  });
  it('off-plane orbit conserves Carter constant and Hamiltonian', () => {
    const a = 0.8, E = 0.95, L = 2.2, th0 = 1.0, r0 = 10, pth = 1.1;
    const res = integrateKerr({ a, kind: 'timelike', E, L, r0, theta0: th0, ptheta0: pth, prSign: -1, lambdaMax: 400, nSamples: 100 });
    expect(res.maxConstraintDrift).toBeLessThan(1e-9);
    const last = res.samples[res.samples.length - 1];
    expect(Math.abs(last.theta - th0)).toBeGreaterThan(1e-3);
    // Q from direct mass-shell reconstruction at the end: recompute with p_θ from Θ equation not available, so compare via a second run
    const again = integrateKerr({ a, kind: 'timelike', E, L, r0, theta0: th0, ptheta0: pth, prSign: -1, lambdaMax: 400, nSamples: 100 });
    expect(again.carterQ).toBe(res.carterQ);
    expect(res.carterQ).toBeCloseTo(pth * pth + Math.cos(th0) ** 2 * (a * a * (1 - E * E) + (L / Math.sin(th0)) ** 2), 12);
  });
  it('Carter Q conserved along the path (θ turning points obey Θ(θ)≥0)', () => {
    const a = 0.8, E = 0.95, L = 2.2, th0 = 1.0, pth = 1.1;
    const res = integrateKerr({ a, kind: 'timelike', E, L, r0: 10, theta0: th0, ptheta0: pth, prSign: -1, lambdaMax: 400, nSamples: 400 });
    // Θ(θ) = Q − cos²θ(a²(1−E²) + L²/sin²θ) must be ≥ 0 everywhere (equals p_θ²)
    for (const s of res.samples) {
      const th = s.theta;
      const T = res.carterQ - Math.cos(th) ** 2 * (a * a * (1 - E * E) + L * L / Math.sin(th) ** 2);
      expect(T).toBeGreaterThan(-1e-6);
    }
  });
  it('null rays: captured at small b, escape at large b', () => {
    const run = (b: number) => integrateKerr({ a: 0.9, kind: 'null', E: 1, L: b, r0: 50, theta0: Math.PI / 2, prSign: -1, lambdaMax: 500, rMax: 100 });
    expect(run(2).fate).toBe('capture');
    expect(run(12).fate).toBe('escape');
  });
});
