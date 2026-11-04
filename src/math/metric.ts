import type { Christoffel, Mat2, Surface, Vec2, Vec3 } from './types';
import { add, cross, dot, inv2, mulMat2Vec2, normalize, scale } from './vec';

export function metricFromEmbedding(s: Surface, u: number, v: number): Mat2 {
  const a = s.du(u, v), b = s.dv(u, v);
  return [[dot(a, a), dot(a, b)], [dot(b, a), dot(b, b)]];
}

export const inverseMetric = (g: Mat2): Mat2 => inv2(g);

export function christoffelFD(s: Surface, u: number, v: number, h = 1e-5): Christoffel {
  // dg[m] = ∂_m g
  const gp = [s.metric(u + h, v), s.metric(u, v + h)];
  const gm = [s.metric(u - h, v), s.metric(u, v - h)];
  const dg = [0, 1].map((m) =>
    [0, 1].map((i) => [0, 1].map((j) => (gp[m][i][j] - gm[m][i][j]) / (2 * h))),
  );
  const gi = inv2(s.metric(u, v));
  const G = (k: number): Mat2 => {
    const m: Mat2 = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        for (let l = 0; l < 2; l++)
          m[i][j] += 0.5 * gi[k][l] * (dg[i][j][l] + dg[j][i][l] - dg[l][i][j]);
    return m;
  };
  return [G(0), G(1)];
}

export const innerProduct = (g: Mat2, a: Vec2, b: Vec2): number =>
  a[0] * (g[0][0] * b[0] + g[0][1] * b[1]) + a[1] * (g[1][0] * b[0] + g[1][1] * b[1]);

export const normalVector = (s: Surface, u: number, v: number): Vec3 =>
  normalize(cross(s.du(u, v), s.dv(u, v)));

export const toWorld = (s: Surface, u: number, v: number, V: Vec2): Vec3 =>
  add(scale(s.du(u, v), V[0]), scale(s.dv(u, v), V[1]));

export function fromWorld(s: Surface, u: number, v: number, w: Vec3): Vec2 {
  return mulMat2Vec2(inv2(s.metric(u, v)), [dot(w, s.du(u, v)), dot(w, s.dv(u, v))]);
}
