import { describe, expect, it } from 'vitest';
import type { Christoffel, Mat2, Surface, Vec2, Vec3 } from './types';
import { holonomyAngle, normSq, transport } from './transport';
import { latitudeLoop, polylineLoop, catmullRomLoop } from './curves';

const sphere: Surface = {
  id: 'sphere', name: 'sphere', coords: ['\\theta', '\\varphi'],
  domain: { u: [0, Math.PI], v: [0, 2 * Math.PI], periodicU: false, periodicV: true },
  position: (u, v): Vec3 => [Math.sin(u) * Math.cos(v), Math.cos(u), Math.sin(u) * Math.sin(v)],
  du: (u, v): Vec3 => [Math.cos(u) * Math.cos(v), -Math.sin(u), Math.cos(u) * Math.sin(v)],
  dv: (u, v): Vec3 => [-Math.sin(u) * Math.sin(v), 0, Math.sin(u) * Math.cos(v)],
  metric: (u): Mat2 => [[1, 0], [0, Math.sin(u) ** 2]],
  christoffel: (u): Christoffel => {
    const s = Math.sin(u), c = Math.cos(u);
    return [[[0, 0], [0, -s * c]], [[0, c / s], [c / s, 0]]];
  },
  gaussK: () => 1,
  latex: { param: '', metric: '', christoffel: '' },
};

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const end = (s: { uv: Vec2; V: Vec2 }[]) => s[s.length - 1];

describe('transport on unit sphere', () => {
  const V0: Vec2 = [1, 0.3];
  it('latitude holonomy = 2π(1-cosθ0) mod 2π', () => {
    for (const th of [Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3]) {
      const s = transport(sphere, latitudeLoop(th), V0, 2000);
      const h = holonomyAngle(sphere, s[0].uv, V0, end(s).V);
      expect(Math.abs(wrap(h - 2 * Math.PI * (1 - Math.cos(th))))).toBeLessThan(1e-4);
    }
    const s = transport(sphere, latitudeLoop(Math.PI / 2), V0);
    expect(Math.abs(holonomyAngle(sphere, s[0].uv, V0, end(s).V))).toBeLessThan(1e-6);
  });
  it('conserves norm and inner product', () => {
    const c = catmullRomLoop([[1, 0.5], [1.4, 2], [2, 3.5], [1.8, 5], [1.2, 6]]);
    const A = transport(sphere, c, [1, 0.3]);
    const B = transport(sphere, c, [-0.2, 0.9]);
    const n0 = normSq(sphere, A[0].uv, A[0].V);
    const ip = (i: number) => {
      const g = sphere.metric(A[i].uv[0], A[i].uv[1]);
      return g[0][0] * A[i].V[0] * B[i].V[0] + g[1][1] * A[i].V[1] * B[i].V[1];
    };
    for (let i = 0; i < A.length; i++) {
      expect(Math.abs(normSq(sphere, A[i].uv, A[i].V) / n0 - 1)).toBeLessThan(1e-6);
      expect(Math.abs(ip(i) - ip(0))).toBeLessThan(1e-6);
    }
  });
  it('polyline lune holonomy = enclosed area', () => {
    const c = polylineLoop([[Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [0.05, Math.PI / 2], [0.05, 0]]);
    const s = transport(sphere, c, V0, 4000);
    const h = holonomyAngle(sphere, s[0].uv, V0, end(s).V);
    expect(Math.abs(h - (Math.PI / 2) * Math.cos(0.05))).toBeLessThan(1e-3);
  });
});
