import { describe, it, expect } from 'vitest';
import * as P from './penrose';

const HP = Math.PI / 2;

describe('Lambert W0', () => {
  it('round-trips w e^w', () => {
    for (const w of [-0.999, -0.9, -0.5, -0.1, 0, 0.3, 1, 5, 40]) {
      const z = w * Math.exp(w);
      expect(P.lambertW0(z)).toBeCloseTo(w, 8);
    }
    expect(P.lambertW0(-1 / Math.E)).toBe(-1);
    expect(P.lambertW0(-1)).toBeNaN();
  });
});

describe('Kruskal', () => {
  it('(t,r) -> (U,V) -> (r,t) round-trips in all four regions', () => {
    const cases: [number, number, P.Region][] = [[3, 5, 'I'], [-2, 3.5, 'III'], [1.5, 0.7, 'II'], [-1, 1.3, 'IV'], [0, 40, 'I']];
    for (const [t, r, reg] of cases) {
      const [U, V] = P.kruskal(t, r, reg);
      expect(P.regionOf(U, V)).toBe(reg);
      expect(P.rOfUV(U, V)).toBeCloseTo(r, 9);
      expect(P.tOfUV(U, V)).toBeCloseTo(t, 9);
    }
  });
  it('horizon r=2M is U=0 or V=0 -> 45 deg diagram lines', () => {
    const [U, V] = P.kruskal(0, 2);
    expect(U).toBe(0); expect(V).toBe(0);
    const h = P.horizons();
    for (const line of [h.U0, h.V0]) expect(Math.abs((line[1][1] - line[0][1]) / (line[1][0] - line[0][0]))).toBeCloseTo(1, 12);
    for (const Vk of [0.3, 2, 50]) { const [X, T] = P.kruskalToDiagram(0, Vk); expect(X).toBeCloseTo(T, 12); }
  });
  it('singularity UV=1 maps to T = pi/2', () => {
    for (const U of [0.1, 0.7, 1, 3, 20]) {
      const [X, T] = P.kruskalToDiagram(U, 1 / U);
      expect(T).toBeCloseTo(HP, 12); expect(Math.abs(X)).toBeLessThan(HP);
    }
    expect(P.rOfUV(2, 0.5)).toBeCloseTo(0, 9);
  });
  it('radial null rays are 45 deg lines', () => {
    const c = P.lightCone(-0.4, 0.8);
    for (const ray of [c.futureRight, c.futureLeft, c.pastRight, c.pastLeft]) {
      expect(ray.length).toBeGreaterThan(5);
      for (let i = 1; i < ray.length; i++) {
        const dx = ray[i][0] - ray[i - 1][0], dt = ray[i][1] - ray[i - 1][1];
        expect(Math.abs(Math.abs(dx) - Math.abs(dt))).toBeLessThan(1e-12);
      }
    }
    // a ray from region I with U<0 reaches scri+ (T + X = pi); a ray with U>0 ends on the singularity
    const e = c.futureRight[c.futureRight.length - 1];
    expect(e[0] + e[1]).toBeCloseTo(Math.PI, 9);
    const inner = P.lightCone(0.5, 0.5).futureRight;
    expect(inner[inner.length - 1][1]).toBeCloseTo(HP, 9);
  });
  it('diagram round-trip', () => {
    const [X, T] = P.schwarzschildMap(2, 6);
    const [U, V] = P.diagramToKruskal(X, T)!;
    expect(P.rOfUV(U, V)).toBeCloseTo(6, 9);
    expect(P.diagramToKruskal(HP * 2, 0)).toBeNull();
  });
  it('constant-r curves end at i±; constant-t at i0', () => {
    const r = P.constR(5);
    expect(r[0]).toEqual([HP, -HP]); expect(r[r.length - 1]).toEqual([HP, HP]);
    expect(P.constT(1)[P.constT(1).length - 1]).toEqual([Math.PI, 0]);
    const s = P.constR(1, 'II');
    expect(s[s.length - 1][1]).toBeCloseTo(HP, 1); // ends on the top corner
  });
});

describe('radial infall from rest', () => {
  const r0 = 10, M = 1, g = P.infallGeodesic(r0, M, 400);
  it('proper time to singularity = pi sqrt(r0^3 / 8M)', () => {
    expect(g.tauSingularity).toBeCloseTo(Math.PI * Math.sqrt(1000 / 8), 12);
    expect(g.tau[g.tau.length - 1]).toBeCloseTo(g.tauSingularity, 9);
    expect(g.pts[g.pts.length - 1][1]).toBeCloseTo(HP, 6); // arrives at T = pi/2
  });
  it('closed-form Kruskal agrees with kruskal(t(eta), r(eta)) outside', () => {
    for (const eta of [0, 0.5, 1.5]) {
      const r = (r0 / 2) * (1 + Math.cos(eta));
      const [U, V] = P.kruskal(P.infallT(eta, r0), r, 'I');
      const [U2, V2] = P.infallKruskal(eta, r0);
      expect(U2 / U).toBeCloseTo(1, 8); expect(V2 / V).toBeCloseTo(1, 8);
    }
  });
  it('dt/dtau = E / (1-2M/r)', () => {
    const E = Math.sqrt(1 - 2 / r0), k = Math.sqrt(r0 ** 3 / 8), h = 1e-6, eta = 1;
    const dt = (P.infallT(eta + h, r0) - P.infallT(eta - h, r0)) / (2 * h) / (k * (1 + Math.cos(eta)));
    expect(dt).toBeCloseTo(E / (1 - 2 / ((r0 / 2) * (1 + Math.cos(eta)))), 5);
  });
  it('crosses the horizon at finite V while t -> infinity', () => {
    expect(Number.isFinite(g.Vhorizon)).toBe(true);
    expect(g.Vhorizon).toBeGreaterThan(0);
    const [U, V] = P.infallKruskal(g.etaHorizon, r0);
    expect(Math.abs(U)).toBeLessThan(1e-9 * V);
    expect(P.infallT(g.etaHorizon - 1e-8, r0)).toBeGreaterThan(50);
    expect(P.rOfUV(...P.infallKruskal(g.etaHorizon, r0))).toBeCloseTo(2, 5);
  });
  it('worldline is timelike in the diagram (|dX| < dT) away from the horizon-crossing kink', () => {
    for (let i = 1; i < g.pts.length; i++) expect(g.pts[i][1]).toBeGreaterThan(g.pts[i - 1][1]);
  });
});

describe('Minkowski', () => {
  it('null rays are 45 deg; i0 at (R,T)=(pi,0)', () => {
    const a = P.minkowskiMap(1, 1), b = P.minkowskiMap(5, 5); // u = 0 ray
    expect(b[1] - a[1]).toBeCloseTo(b[0] - a[0], 12);
    const c = P.minkowskiMap(0, 1e9);
    expect(c[0]).toBeCloseTo(Math.PI, 6); expect(c[1]).toBeCloseTo(0, 6);
    const i = P.minkowskiMap(1e9, 1);
    expect(i[1]).toBeCloseTo(Math.PI, 6); expect(i[0]).toBeCloseTo(0, 6);
  });
});
