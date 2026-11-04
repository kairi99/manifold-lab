import { describe, expect, it } from 'vitest';
import { frameAt, simulate } from './math';

describe('Ricci flow on rotationally symmetric spheres', () => {
  for (const n of [1, 2] as const) {
    it(`round S^${n + 1}: r^2 = r0^2 - 2 n t within 1 % up to 0.7 of extinction`, () => {
      const run = simulate(n, 'round');
      const tExt = 1 / (2 * n);
      expect(run.status).toBe('extinct');
      for (const f of run.frames.filter((g) => g.t <= 0.7 * tExt)) {
        const exact = 1 - 2 * n * f.t;
        expect(Math.abs(f.psiMax ** 2 - exact) / exact).toBeLessThan(0.01);
      }
      expect(frameAt(run, 0.7 * tExt).t).toBeGreaterThan(0.6 * tExt);
    });
  }

  it('n = 1: Gauss-Bonnet integral of K dA stays 4 pi (within 1 %) along the dumbbell flow', () => {
    const run = simulate(1, 'dumbbell', 0.8);
    for (const f of run.frames) expect(Math.abs(f.gb / (4 * Math.PI) - 1)).toBeLessThan(0.01);
  });

  it('n = 1: the deep dumbbell rounds out (Kmax/Kmin -> 1) with no neck pinch', () => {
    const run = simulate(1, 'dumbbell', 0.8);
    expect(run.status).toBe('extinct');
    const f0 = run.frames[0], f = run.frames[run.frames.length - 1];
    expect(f0.kMin).toBeLessThan(0.1 * f0.kMax); // starts far from round
    expect(f.kMin).toBeGreaterThan(0);
    expect(f.kMax / f.kMin).toBeLessThan(1.05);
    for (const g of run.frames) expect(g.neck === null || g.neck > 0.02 * g.psiMax).toBe(true);
  });

  it('n = 2: the deep dumbbell pinches at the neck while the bulbs are still large', () => {
    const run = simulate(2, 'dumbbell', 0.8);
    const f = run.frames[run.frames.length - 1];
    expect(run.status).toBe('singular');
    expect(f.neck).not.toBeNull();
    expect(f.neck!).toBeLessThan(0.02 * f.psiMax);
    expect(f.psiMax).toBeGreaterThan(0.4 * run.frames[0].psiMax); // bulbs far from vanishing
    expect(f.maxK * f.psiMax ** 2).toBeGreaterThan(100); // curvature blow-up
  });

  it('n = 2: the mild peanut does not pinch, it shrinks rounded', () => {
    const run = simulate(2, 'peanut');
    const f = run.frames[run.frames.length - 1];
    expect(run.status).toBe('extinct');
    expect(f.kMin).toBeGreaterThan(0);
    expect(f.kMax / f.kMin).toBeLessThan(1.25);
    for (const g of run.frames) expect(g.neck === null || g.neck > 0.02 * g.psiMax).toBe(true);
  });
});
