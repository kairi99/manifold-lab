import { describe, expect, it } from 'vitest';
import { SURFACES } from './index';
import { christoffelFD, fromWorld, metricFromEmbedding, toWorld } from './metric';
import { makeSphere } from './surfaces/sphere';
import { makeTorus } from './surfaces/torus';

const near = (a: number, b: number, tol: number) =>
  expect(Math.abs(a - b)).toBeLessThanOrEqual(tol * (1 + Math.abs(b)));

function samples(id: string): [number, number][] {
  const s = SURFACES[id];
  const out: [number, number][] = [];
  for (let n = 0; n < 12; n++) {
    const a = ((n * 0.6180339887) % 1) * 0.8 + 0.1, b = ((n * 0.7548776662 + 0.3) % 1) * 0.8 + 0.1;
    out.push([s.domain.u[0] + a * (s.domain.u[1] - s.domain.u[0]), s.domain.v[0] + b * (s.domain.v[1] - s.domain.v[0])]);
  }
  return out;
}

describe.each(Object.keys(SURFACES))('%s', (id) => {
  const s = SURFACES[id];
  const pts = samples(id);
  it('metric matches embedding', () => {
    for (const [u, v] of pts) {
      const g = s.metric(u, v), e = metricFromEmbedding(s, u, v);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) near(g[i][j], e[i][j], 1e-9);
    }
  });
  it('christoffel matches FD and is symmetric', () => {
    for (const [u, v] of pts) {
      const G = s.christoffel(u, v), F = christoffelFD(s, u, v);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        near(G[k][i][j], F[k][i][j], 1e-5);
        expect(G[k][i][j]).toBe(G[k][j][i]);
      }
    }
  });
  it('du/dv match finite differences of position', () => {
    const h = 1e-6;
    for (const [u, v] of pts) {
      const pu = s.position(u + h, v), mu = s.position(u - h, v), pv = s.position(u, v + h), mv = s.position(u, v - h);
      const du = s.du(u, v), dv = s.dv(u, v);
      for (let c = 0; c < 3; c++) {
        near(du[c], (pu[c] - mu[c]) / (2 * h), 1e-6);
        near(dv[c], (pv[c] - mv[c]) / (2 * h), 1e-6);
      }
    }
  });
  it('toWorld/fromWorld roundtrip', () => {
    for (const [u, v] of pts) {
      const r = fromWorld(s, u, v, toWorld(s, u, v, [0.7, -1.3]));
      near(r[0], 0.7, 1e-9);
      near(r[1], -1.3, 1e-9);
    }
  });
});

describe('curvature', () => {
  it('sphere K = 1/R^2', () => {
    near(makeSphere(2).gaussK(1, 1), 0.25, 1e-12);
  });
  it('torus K at v=0 = 1/(r(R+r))', () => {
    near(makeTorus(1, 0.4).gaussK(0.3, 0), 1 / (0.4 * 1.4), 1e-12);
  });
});
