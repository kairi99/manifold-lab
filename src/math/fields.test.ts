import { describe, expect, it } from 'vitest';
import { EULER_CHARACTERISTIC, divergence, fieldIndex, fieldsFor, flow, flowCommutator, lieBracket, lieDerivativeMetric } from './fields';
import { toWorld } from './metric';
import { norm } from './vec';
import { SURFACES } from './index';
import type { Vec2 } from './types';

const ids = ['sphere', 'torus', 'saddle', 'paraboloid'];
const F = (sid: string, id: string) => fieldsFor(sid).find((f) => f.id === id)!;
const sphere = SURFACES.sphere, torus = SURFACES.torus;
const pts: Vec2[] = Array.from({ length: 10 }, (_, i) => [0.5 + 0.23 * i, 0.3 + 0.61 * i]);

describe('index', () => {
  for (const sid of ids) for (const X of fieldsFor(sid)) for (const z of X.zeros)
    it(`${sid}/${X.id}/${z.name}`, () => expect(fieldIndex(SURFACES[sid], X, z)).toBe(z.expectedIndex));
  for (const sid of ['sphere', 'torus'])
    it(`Poincare-Hopf ${sid}`, () => {
      for (const X of fieldsFor(sid)) {
        if (X.zeros.length === 0) continue;
        const sum = X.zeros.reduce((a, z) => a + fieldIndex(SURFACES[sid], X, z), 0);
        expect(sum).toBe(EULER_CHARACTERISTIC[sid]);
      }
    });
});

describe('zeros are zeros', () => {
  for (const sid of ids) for (const X of fieldsFor(sid)) for (const z of X.zeros)
    it(`${sid}/${X.id}/${z.name}`, () => {
      const s = SURFACES[sid];
      let c: Vec2;
      if (sid === 'sphere' && Math.abs(z.point[1]) > 0.999) c = [z.point[1] > 0 ? 1e-4 : Math.PI - 1e-4, 0.3];
      else {
        const p = [0, 0.25, 0.5, 0.75].map((t) => z.loop.point(t));
        c = [(p[0][0] + p[2][0]) / 2 + 1e-4, (p[1][1] + p[3][1]) / 2];
      }
      expect(norm(toWorld(s, c[0], c[1], X.X(c[0], c[1])))).toBeLessThan(1e-3);
    });
});

describe('Killing', () => {
  for (const sid of ids) for (const X of fieldsFor(sid)) it(`${sid}/${X.id}`, () => {
    const s = SURFACES[sid];
    const m = Math.max(...pts.map(([u, v]) => {
      const q: Vec2 = sid.endsWith('boloid') || sid === 'saddle' ? [u / 3 - 0.5, v / 3 - 1] : [u, v];
      return Math.max(...lieDerivativeMetric(s, X, q[0], q[1]).flat().map(Math.abs));
    }));
    if (X.killing) expect(m).toBeLessThan(1e-6); else expect(m).toBeGreaterThan(1e-3);
  });
});

describe('algebra', () => {
  const [Lx, Ly, Lz] = ['Lx', 'Ly', 'Lz'].map((i) => F('sphere', i));
  it('so(3)', () => {
    const triples = [[Lx, Ly, Lz], [Ly, Lz, Lx], [Lz, Lx, Ly]];
    let eps = 0;
    for (const [u, v] of pts) for (const [A, B, C] of triples) {
      const b = lieBracket(A, B, u, v), c = C.X(u, v);
      const e = Math.sign(b[0] * c[0] + b[1] * c[1]);
      expect(Math.abs(b[0] - e * c[0]) + Math.abs(b[1] - e * c[1])).toBeLessThan(1e-6);
      if (eps === 0) eps = e;
      expect(e).toBe(eps);
    }
    console.log('so(3) epsilon =', eps);
  });
  it('torus commute', () => {
    for (const [u, v] of pts) expect(lieBracket(F('torus', 'du'), F('torus', 'dv'), u, v)).toEqual([0, 0]);
  });
});

describe('divergence', () => {
  it('Killing ~ 0', () => {
    for (const i of ['Lx', 'Ly', 'Lz']) for (const [u, v] of pts) expect(Math.abs(divergence(sphere, F('sphere', i), u, v))).toBeLessThan(1e-6);
  });
  it('div grad cos = -2cos', () => {
    for (const [u, v] of pts) expect(divergence(sphere, F('sphere', 'gradHeight'), u, v)).toBeCloseTo(-2 * Math.cos(u), 6);
  });
});

describe('flowCommutator', () => {
  const t = 0.05, uv0: Vec2 = [1.1, 0.7];
  it('sphere Lx,Ly ~ t^2 [X,Y]', () => {
    const X = F('sphere', 'Lx'), Y = F('sphere', 'Ly');
    const { gap, path } = flowCommutator(sphere, X, Y, uv0, t);
    const b = lieBracket(X, Y, uv0[0], uv0[1]);
    expect(Math.hypot(gap[0] / t ** 2 - b[0], gap[1] / t ** 2 - b[1]) / Math.hypot(b[0], b[1])).toBeLessThan(0.05);
    expect(path.length).toBeGreaterThanOrEqual(5);
  });
  it('torus gap ~ 0', () => {
    const { gap } = flowCommutator(torus, F('torus', 'du'), F('torus', 'dv'), [1, 2], 0.5);
    expect(Math.hypot(...gap)).toBeLessThan(1e-9);
  });
});

describe('flow', () => {
  it('Lz full turn', () => {
    const fl = flow(sphere, F('sphere', 'Lz'), [1.2, 0.4], 2 * Math.PI);
    const e = fl.samples[fl.samples.length - 1].uv;
    expect(e[0]).toBeCloseTo(1.2, 8);
    expect(e[1]).toBeCloseTo(0.4, 8);
  });
  it('gradHeight from south goes to north', () => {
    const fl = flow(sphere, F('sphere', 'gradHeight'), [2.8, 1], 5);
    expect(fl.samples[fl.samples.length - 1].uv[0]).toBeLessThan(0.1);
  });
});
