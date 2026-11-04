import { describe, expect, it } from 'vitest';
import { makeCustomSurface, compileSpec, validateSurface, type CustomSpec } from './custom';
import { makeSphere } from './sphere';
import { makeTorus } from './torus';
import { saddle } from './graph';
import { curvatureAt } from '../curvature';
import type { Surface } from '../types';

const base: CustomSpec = {
  name: 't', mode: 'parametric', x: 'u', y: 'v', z: '0', f: '0',
  uRange: ['0', '1'], vRange: ['0', '1'], periodicU: false, periodicV: false,
  coords: ['u', 'v'], params: { a: 1, b: 0 },
};
const P = (x: string, y: string, z: string, uRange: [string, string], vRange: [string, string], extra: Partial<CustomSpec> = {}) =>
  makeCustomSurface({ ...base, x, y, z, uRange, vRange, ...extra });

function sameGeometry(a: Surface, b: Surface, pts: [number, number][]) {
  for (const [u, v] of pts) {
    const ga = a.metric(u, v), gb = b.metric(u, v);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(ga[i][j]).toBeCloseTo(gb[i][j], 10);
    const Ca = a.christoffel(u, v), Cb = b.christoffel(u, v);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(Ca[k][i][j]).toBeCloseTo(Cb[k][i][j], 10);
    expect(a.gaussK(u, v)).toBeCloseTo(b.gaussK(u, v), 10);
  }
}

const pts: [number, number][] = [[0.4, 0.3], [1.2, 2.5], [2.5, 5.1], [0.9, -0.7]];

describe('custom surface vs built-ins', () => {
  it('sphere', () => sameGeometry(P('sin(u)*cos(v)', 'sin(u)*sin(v)', 'cos(u)', ['0', 'pi'], ['0', '2*pi']), makeSphere(), pts));
  it('torus', () => sameGeometry(P('(1+0.4*cos(v))*cos(u)', '(1+0.4*cos(v))*sin(u)', '0.4*sin(v)', ['0', '2*pi'], ['0', '2*pi']), makeTorus(1, 0.4), pts));
  it('graph saddle', () => sameGeometry(makeCustomSurface({ ...base, mode: 'graph', f: '(u^2-v^2)/2', uRange: ['-1.2', '1.2'], vRange: ['-1.2', '1.2'] }), saddle, [[0.3, 0.2], [-0.8, 1.1], [1, -0.4]]));
  it('uses parameters a, b', () => {
    const s = P('a*sin(u)*cos(v)', 'a*sin(u)*sin(v)', 'a*cos(u)', ['0', 'pi'], ['0', '2*pi'], { params: { a: 2, b: 0 } });
    expect(s.gaussK(1, 1)).toBeCloseTo(0.25, 12);
  });
});

describe('classical surfaces: exact K', () => {
  it('catenoid K = -1/cosh^4 u', () => {
    const s = P('cosh(u)*cos(v)', 'cosh(u)*sin(v)', 'u', ['-1.5', '1.5'], ['0', '2*pi']);
    for (const [u, v] of pts) expect(s.gaussK(u - 1, v)).toBeCloseTo(-1 / Math.cosh(u - 1) ** 4, 12);
  });
  it('helicoid K = -1/(1+u^2)^2 and equal to catenoid at same u (Bour, with the right parametrisation)', () => {
    const h = P('u*cos(v)', 'u*sin(v)', 'v', ['-2', '2'], ['0', '2*pi']);
    for (const [u, v] of pts) expect(h.gaussK(u - 1, v)).toBeCloseTo(-1 / (1 + (u - 1) ** 2) ** 2, 12);
    // isometry catenoid(t, φ) <-> helicoid(sinh t, φ): same K at corresponding points
    const c = P('cosh(u)*cos(v)', 'cosh(u)*sin(v)', 'u', ['-1.5', '1.5'], ['0', '2*pi']);
    expect(c.gaussK(0.8, 1)).toBeCloseTo(h.gaussK(Math.sinh(0.8), 2), 12);
  });
  it('tractroid K = -1', () => {
    const s = P('cos(v)/cosh(u)', 'sin(v)/cosh(u)', 'u-tanh(u)', ['0.2', '3'], ['0', '2*pi']);
    for (const [u, v] of pts) expect(s.gaussK(u + 0.3, v)).toBeCloseTo(-1, 10);
  });
  it('Enneper K = -4/(1+u^2+v^2)^4', () => {
    const s = P('u-u^3/3+u*v^2', 'v-v^3/3+v*u^2', 'u^2-v^2', ['-1.5', '1.5'], ['-1.5', '1.5']);
    for (const [u, v] of pts) expect(s.gaussK(u / 2, v / 2)).toBeCloseTo(-4 / (1 + (u / 2) ** 2 + (v / 2) ** 2) ** 4, 10);
  });
  it('intrinsic K from Γ (finite-difference Riemann) agrees with the closed form', () => {
    const s = P('cosh(u)*cos(v)', 'cosh(u)*sin(v)', 'u', ['-1.5', '1.5'], ['0', '2*pi']);
    const ca = curvatureAt(s, 0.6, 1);
    expect(ca.Kintrinsic).toBeCloseTo(-1 / Math.cosh(0.6) ** 4, 6);
    expect(ca.Kextrinsic).toBeCloseTo(-1 / Math.cosh(0.6) ** 4, 6);
  });
});

describe('validation', () => {
  const sphere = P('sin(u)*cos(v)', 'sin(u)*sin(v)', 'cos(u)', ['0', 'pi'], ['0', '2*pi']);
  it('flags the sphere poles', () => {
    expect(sphere.singularAt!(0, 1)).toBe(true);
    expect(sphere.singularAt!(1, 1)).toBe(false);
    expect(sphere.gaussK(0, 1)).toBeNaN();
    const r = validateSurface(sphere);
    expect(r.errors).toEqual([]);
    expect(r.warnings[0]).toMatch(/degenerate at u = 0, π/);
  });
  it('rejects non-finite regions', () => {
    const r = validateSurface(P('u', 'v', 'sqrt(u)', ['-1', '1'], ['0', '1']));
    expect(r.errors[0]).toMatch(/not finite/);
  });
  it('reports parse errors per field with positions', () => {
    const { c, errors } = compileSpec({ ...base, x: 'sin(u', y: 'sni(v)', z: '0', uRange: ['2*pi', '0'] });
    expect(c).toBeUndefined();
    expect(errors.x).toBe("expected ')' at 5");
    expect(errors.y).toBe("unknown function 'sni' at 0");
    expect(errors.uRange).toMatch(/min < max/);
  });
});
