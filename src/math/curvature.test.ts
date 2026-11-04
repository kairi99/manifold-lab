import { describe, expect, it } from 'vitest';
import { SURFACES } from './index';
import { curvatureAt, geodesicCircle } from './curvature';
import { innerProduct } from './metric';

const pts: Record<string, [number, number][]> = {
  sphere: [[0.5, 0.3], [1.0, 2.0], [1.5, 4.0], [2.0, 1.0], [2.5, 5.5], [0.9, 3.3], [1.9, 0.1], [1.2, 6.0]],
  torus: [[0.3, 0.4], [1.0, 1.5], [2.0, 2.5], [3.0, 3.5], [4.0, 4.5], [5.0, 5.5], [0.7, 0.1], [6.0, 2.0]],
  saddle: [[0, 0], [0.5, 0.3], [-0.4, 0.7], [0.8, -0.6], [-0.7, -0.5], [0.2, 0.9], [-0.9, 0.1], [0.6, 0.6]],
  paraboloid: [[0, 0], [0.5, 0.3], [-0.4, 0.7], [0.8, -0.6], [-0.7, -0.5], [0.2, 0.9], [-0.9, 0.1], [0.6, 0.6]],
};

describe.each(Object.keys(pts))('%s', (id) => {
  const s = SURFACES[id];
  it('Theorema Egregium', () => {
    for (const [u, v] of pts[id]) {
      const c = curvatureAt(s, u, v);
      expect(c.Kintrinsic).toBeCloseTo(s.gaussK(u, v), 4);
      expect(c.Kextrinsic).toBeCloseTo(s.gaussK(u, v), 4);
    }
  });
  it('Riemann symmetries, Ricci, scalar', () => {
    for (const [u, v] of pts[id]) {
      const c = curvatureAt(s, u, v), K = s.gaussK(u, v), g = s.metric(u, v);
      for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++)
        expect(c.riemann[k][l][i][j]).toBeCloseTo(-c.riemann[k][l][j][i], 9);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(c.ricci[i][j]).toBeCloseTo(K * g[i][j], 3);
      expect(c.scalar).toBeCloseTo(2 * K, 3);
    }
  });
  it('principal directions g-orthonormal', () => {
    for (const [u, v] of pts[id]) {
      const c = curvatureAt(s, u, v), g = s.metric(u, v), [a, b] = c.dirs;
      expect(innerProduct(g, a, a)).toBeCloseTo(1, 6);
      expect(innerProduct(g, b, b)).toBeCloseTo(1, 6);
      expect(innerProduct(g, a, b)).toBeCloseTo(0, 5);
    }
  });
});

describe('principal curvatures', () => {
  it('sphere', () => {
    const c = curvatureAt(SURFACES.sphere, 1.0, 2.0);
    expect(Math.abs(c.kappa[0])).toBeCloseTo(1, 5);
    expect(Math.abs(c.kappa[1])).toBeCloseTo(1, 5);
  });
  it('torus', () => {
    const v = 0.9, R = 1, r = 0.4;
    const c = curvatureAt(SURFACES.torus, 1.0, v);
    const a = 1 / r, b = Math.cos(v) / (R + r * Math.cos(v));
    const sg = Math.sign(c.kappa[0] + c.kappa[1]) || 1;
    expect([...c.kappa].sort((x, y) => x - y)[0]).toBeCloseTo(Math.min(sg * a, sg * b), 4);
    expect(c.kappa[1]).toBeCloseTo(Math.max(sg * a, sg * b), 4);
  });
  it('saddle origin', () => {
    const c = curvatureAt(SURFACES.saddle, 0, 0);
    expect(c.kappa[0]).toBeCloseTo(-1, 5);
    expect(c.kappa[1]).toBeCloseTo(1, 5);
    expect(c.H).toBeCloseTo(0, 5);
  });
});

describe('geodesic circle', () => {
  it('sphere circumference', () => {
    for (const rho of [0.3, 1.0, 2.0])
      expect(Math.abs(geodesicCircle(SURFACES.sphere, [1.2, 0.5], rho).circumference - 2 * Math.PI * Math.sin(rho))).toBeLessThan(1e-3);
  });
  it('Kestimate', () => {
    expect(Math.abs(geodesicCircle(SURFACES.sphere, [1.2, 0.5], 0.15).Kestimate - 1)).toBeLessThan(2e-2);
    expect(Math.abs(geodesicCircle(SURFACES.saddle, [0, 0], 0.2).Kestimate + 1)).toBeLessThan(0.1);
  });
});
