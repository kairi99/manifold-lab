import { describe, expect, it } from 'vitest';
import { BODIES, C, GM_SUN } from '../data/celestial';
import { schwarzschild } from './spacetime';
import {
  fallFrame, fallState, GM_BH_10, horizonTidalForBody, horizonTidalSI, radialObserver, ringDeformation, ringInitial,
  tidalAccelerationSI, tidalTensor,
} from './tidal';

const close = (a: number, b: number, rel = 1e-9, abs = 1e-14) => expect(Math.abs(a - b)).toBeLessThanOrEqual(abs + rel * Math.max(Math.abs(a), Math.abs(b)));

describe('tidalTensor', () => {
  it('diag(-2M/r^3, M/r^3, M/r^3) for every radial boost', () => {
    const M = 1.7, r = 8;
    for (const ur of [0, -0.3, -0.9, 0.5, 2, -5]) {
      const { u, triad } = radialObserver(r, ur, M, 1.1);
      const E = tidalTensor(schwarzschild, [0, r, 1.1, 0.4], { M }, u, triad);
      const want = [-2 * M / r ** 3, M / r ** 3, M / r ** 3];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) close(E[i][j], i === j ? want[i] : 0, 1e-9, 1e-12);
    }
  });
  it('trace-free (vacuum)', () => {
    const { u, triad } = radialObserver(5, -0.4);
    const E = tidalTensor(schwarzschild, [0, 5, Math.PI / 2, 0], { M: 1 }, u, triad);
    close(E[0][0] + E[1][1] + E[2][2], 0, 1, 1e-14);
  });
});

describe('fallState', () => {
  it('is at rest at r0, lands at singularity, normalised, matches energy', () => {
    const r0 = 10, M = 1, K = Math.sqrt(r0 ** 3 / (8 * M));
    const s0 = fallState(r0, 0, M);
    close(s0.r, r0); close(s0.u[1], 0, 1, 1e-14);
    close(fallState(r0, Math.PI * K, M).r, 0, 1, 1e-9);
    const s = fallState(r0, 0.6 * K, M), f = 1 - 2 / s.r;
    close(-f * s.u[0] ** 2 + s.u[1] ** 2 / f, -1);
    close(f * s.u[0], Math.sqrt(1 - 2 / r0));
    // dr/dτ by finite difference
    const e = 1e-6, d = (fallState(r0, 0.6 * K + e, M).r - fallState(r0, 0.6 * K - e, M).r) / (2 * e);
    close(d, s.u[1], 1e-6);
  });
  it('fall frame is orthonormal and orthogonal to u', () => {
    const { u, triad, r } = fallFrame(12, 5);
    const f = 1 - 2 / r, g = [-f, 1 / f, r * r, r * r];
    const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + g[i] * v * b[i], 0);
    close(dot(u, u), -1);
    triad.forEach((a, i) => { close(dot(a, u), 0, 1, 1e-12); triad.forEach((b, j) => close(dot(a, b), i === j ? 1 : 0, 1e-9, 1e-12)); });
  });
});

describe('ringDeformation', () => {
  const r0 = 20, steps = 400;
  const res = ringDeformation({ r0, xi0: ringInitial(8, 1, 0, 1), tauEnd: 1e9, steps });
  it('stretches radially, squeezes transversally', () => {
    const last = res.offsets[res.offsets.length - 1];
    expect(Math.abs(last[0][0])).toBeGreaterThan(1.5); // particle on +radial axis
    expect(Math.abs(last[2][1])).toBeLessThan(1); // particle on +θ̂ axis
    expect(res.r[res.r.length - 1]).toBeLessThan(2.01);
  });
  it('matches RK4 of the closed-form eigen-equations', () => {
    // independent integration of ξ'' = (2M/r³)ξ_r, ξ'' = −(M/r³)ξ_⊥ using fallState radius, same step grid
    const M = 1, h = res.tau[1], K = Math.sqrt(r0 ** 3 / 8);
    const rAt = (t: number) => fallState(r0, t, M).r;
    const run = (c: number) => {
      let x = 1, v = 0;
      const a = (t: number, y: number) => (c / rAt(t) ** 3) * y;
      for (let s = 0; s < steps; s++) {
        const t = s * h;
        const k1x = v, k1v = a(t, x), k2x = v + h / 2 * k1v, k2v = a(t + h / 2, x + h / 2 * k1x);
        const k3x = v + h / 2 * k2v, k3v = a(t + h / 2, x + h / 2 * k2x), k4x = v + h * k3v, k4v = a(t + h, x + h * k3x);
        x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x); v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
      }
      return x;
    };
    expect(K).toBeGreaterThan(0);
    const last = res.offsets[steps];
    close(last[0][0], run(2), 1e-8); // ring particle 0 on radial axis
    close(last[2][1], run(-1), 1e-8); // particle 2 at φ=π/2 on θ̂ axis
  });
});

describe('SI tidal accelerations', () => {
  it('formula', () => {
    const t = tidalAccelerationSI(GM_SUN, 1.496e11, 2);
    close(t.radial, (2 * GM_SUN * 2) / 1.496e11 ** 3); close(t.transverse, t.radial / 2);
  });
  it('horizon values by order of magnitude', () => {
    const bh10 = horizonTidalSI(GM_BH_10);
    close(bh10.rHorizon, (2 * GM_BH_10) / C ** 2);
    expect(bh10.radial).toBeGreaterThan(1e8); expect(bh10.radial).toBeLessThan(1e9);
    const sgr = horizonTidalForBody('sgr-a'), m87 = horizonTidalForBody('m87');
    expect(sgr.radial).toBeGreaterThan(1e-4); expect(sgr.radial).toBeLessThan(1);
    expect(m87.radial).toBeLessThan(1e-6);
    expect(sgr.radial).toBeGreaterThan(m87.radial);
    expect(BODIES.find((b) => b.id === 'sgr-a')).toBeDefined();
  });
});
