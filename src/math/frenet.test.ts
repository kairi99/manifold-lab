import { describe, expect, it } from 'vitest';
import { CURVES, arcLength, fdVec, frenet, type CurveId } from './frenet';

describe('frenet', () => {
  it('helix: κ = a/(a²+b²), τ = b/(a²+b²)', () => {
    for (const [a, b] of [[1, 0.3], [2, 1], [0.5, 2]]) for (const t of [0, 1.3, 5]) {
      const f = frenet(CURVES.helix.jet(t, a, b));
      expect(f.kappa).toBeCloseTo(a / (a * a + b * b), 12);
      expect(f.tau).toBeCloseTo(b / (a * a + b * b), 12);
    }
  });
  it('circle: κ = 1/R, τ = 0; ellipse is planar', () => {
    const f = frenet(CURVES.circle.jet(0.7, 1.7, 0));
    expect(f.kappa).toBeCloseTo(1 / 1.7, 12);
    expect(f.tau).toBeCloseTo(0, 12);
    expect(frenet(CURVES.ellipse.jet(1, 2, 0)).tau).toBeCloseTo(0, 12);
  });
  it('inflection: frame undefined at t=0', () => {
    expect(frenet(CURVES.inflect.jet(0, 1, 1)).defined).toBe(false);
    expect(frenet(CURVES.inflect.jet(0.8, 1, 1)).defined).toBe(true);
  });
  it('closed-form derivatives match finite differences', () => {
    for (const id of Object.keys(CURVES) as CurveId[]) for (const t of [0.4, 1.1]) {
      const j = (x: number) => CURVES[id].jet(x, 1.3, 0.7);
      const d1 = fdVec((x) => j(x).r, t), d2 = fdVec((x) => j(x).d1, t), d3 = fdVec((x) => j(x).d2, t);
      d1.forEach((v, i) => expect(v).toBeCloseTo(j(t).d1[i], 6));
      d2.forEach((v, i) => expect(v).toBeCloseTo(j(t).d2[i], 6));
      d3.forEach((v, i) => expect(v).toBeCloseTo(j(t).d3[i], 6));
    }
  });
  it('trefoil κ, τ match finite-difference derivatives of r', () => {
    const r = (x: number) => CURVES.trefoil.jet(x, 0, 0).r;
    for (const t of [0.3, 2, 4.4]) {
      const h = 1e-3;
      const d1 = fdVec(r, t, h), d1f = (x: number) => fdVec(r, x, h);
      const d2 = fdVec(d1f, t, h), d3 = fdVec((x) => fdVec(d1f, x, h), t, h);
      const fd = frenet({ r: r(t), d1, d2, d3 }), ex = frenet(CURVES.trefoil.jet(t, 0, 0));
      expect(fd.kappa).toBeCloseTo(ex.kappa, 4);
      expect(fd.tau).toBeCloseTo(ex.tau, 3);
    }
  });
  it('frame is orthonormal and arc length of circle is 2πR', () => {
    const f = frenet(CURVES.twisted.jet(0.5, 1, 1));
    expect(f.T[0] * f.N[0] + f.T[1] * f.N[1] + f.T[2] * f.N[2]).toBeCloseTo(0, 12);
    expect(arcLength(CURVES.circle, 2, 0, 2 * Math.PI)).toBeCloseTo(4 * Math.PI, 8);
  });
});
