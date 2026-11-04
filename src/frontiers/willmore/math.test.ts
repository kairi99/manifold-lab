import { describe, expect, it } from 'vitest';
import {
  ellipsoidCurv, ellipsoidPt, ellipsoidUmbilics, invert, invertedTorus, orderAxes, sampleSurface,
  torusParams, torusSurf, torusWClosed, torusWQuad, type Ax, type Surf, type V3,
} from './math';

describe('torus W', () => {
  it('quadrature matches the closed form', () => {
    for (const c of [1.05, 1.3, Math.SQRT2, 2, 4]) {
      const q = torusWQuad(c), f = torusWClosed(c);
      expect(Math.abs(q - f) / f).toBeLessThan(1e-6);
    }
  });
  it('generic finite-difference W matches the closed form', () => {
    for (const c of [1.2, Math.SQRT2, 3]) {
      const { R, r } = torusParams(c);
      const s = sampleSurface(torusSurf(R, r));
      expect(Math.abs(s.W - torusWClosed(c)) / torusWClosed(c)).toBeLessThan(1e-4);
      expect(Math.abs(s.intK)).toBeLessThan(1e-4);
    }
  });
  it('minimum at c = √2 equals 2π²', () => {
    expect(torusWClosed(Math.SQRT2)).toBeCloseTo(2 * Math.PI ** 2, 10);
    let best = 1e9, at = 0;
    for (let c = 1.01; c < 5; c += 0.001) { const w = torusWClosed(c); if (w < best) { best = w; at = c; } }
    expect(at).toBeCloseTo(Math.SQRT2, 2);
    expect(torusWClosed(1.3)).toBeGreaterThan(2 * Math.PI ** 2);
    expect(torusWClosed(1.6)).toBeGreaterThan(2 * Math.PI ** 2);
  });
});

describe('sphere and inversion', () => {
  it('round sphere has W = 4π for any radius', () => {
    for (const rad of [0.5, 1, 3]) {
      // θ = v/2 covers the sphere once; half-cell offset keeps the grid off the singular poles
      const sph: Surf = (u, v) => [rad * Math.sin(v / 2) * Math.cos(u), rad * Math.cos(v / 2), rad * Math.sin(v / 2) * Math.sin(u)];
      const s = sampleSurface(sph, 64, 64, 1e-4, 0.5);
      expect(Math.abs(s.W - 4 * Math.PI) / (4 * Math.PI)).toBeLessThan(2e-3);
    }
  });
  it('inversion is an involution and keeps W = 2π² for the √2 torus', () => {
    const c0: V3 = [0.3, 0.2, 0.1];
    const p: V3 = [1, 2, 3];
    const q = invert(invert(p, c0, 2.5), c0, 2.5);
    expect(Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])).toBeLessThan(1e-12);
    const { R, r } = torusParams(Math.SQRT2), base = torusSurf(R, r);
    for (const centre of [[0, 0.7, 0], [0, 1.6, 0], [0.2, 0.5, 0.3]] as V3[]) {
      // [0.2,0.5,0.3] lies in the hole region off the surface: |(x,z)| = 0.36 < R − r
      const s = sampleSurface((u, v) => invert(base(u, v), centre, 0.6 + centre[1] ** 2), 128, 96);
      expect(Math.abs(s.W - 2 * Math.PI ** 2) / (2 * Math.PI ** 2)).toBeLessThan(0.005);
      expect(Math.abs(s.intK)).toBeLessThan(0.05);
    }
  });
  it('the app inversion family keeps W', () => {
    for (const s of [0, 0.3, 0.8]) {
      const w = sampleSurface(invertedTorus(Math.SQRT2, s).f, 128, 96).W;
      expect(Math.abs(w - 2 * Math.PI ** 2) / (2 * Math.PI ** 2)).toBeLessThan(0.005);
    }
  });
});

describe('ellipsoid umbilics', () => {
  const ax: Ax = [1.6, 1.1, 0.7];
  it('closed-form positions are on the surface with κ₁ = κ₂', () => {
    const us = ellipsoidUmbilics(ax);
    expect(us.length).toBe(4);
    for (const p of us) {
      expect(Math.abs((p[0] / ax[0]) ** 2 + (p[1] / ax[1]) ** 2 + (p[2] / ax[2]) ** 2 - 1)).toBeLessThan(1e-12);
      const k = ellipsoidCurv(ax, p);
      expect(k.diff / (k.k1 + k.k2)).toBeLessThan(1e-6);
    }
  });
  it('curvature product matches K = 1/(a²b²c² (x²/a⁴+y²/b⁴+z²/c⁴)²)', () => {
    const p = ellipsoidPt(ax, 0.9, 2.2), k = ellipsoidCurv(ax, p);
    const K = 1 / ((ax[0] * ax[1] * ax[2]) ** 2 * ((p[0] / ax[0] ** 2) ** 2 + (p[1] / ax[1] ** 2) ** 2 + (p[2] / ax[2] ** 2) ** 2) ** 2);
    expect(Math.abs(k.k1 * k.k2 - K) / K).toBeLessThan(1e-12);
  });
  it('random non-umbilic points are not umbilic', () => {
    let s = 7;
    const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const us = ellipsoidUmbilics(ax);
    for (let i = 0; i < 30; i++) {
      const p = ellipsoidPt(ax, 0.3 + 2.5 * rnd(), TAU_(rnd()));
      if (us.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 0.15)) continue;
      const k = ellipsoidCurv(ax, p);
      expect(k.diff / (k.k1 + k.k2)).toBeGreaterThan(1e-3);
    }
  });
  it('spheroid has 2 umbilics (poles), sphere has all points umbilic', () => {
    const sp = ellipsoidUmbilics([1.5, 1.5, 0.8]);
    expect(sp.length).toBe(2);
    expect(Math.abs(sp[0][2])).toBeCloseTo(0.8, 12);
    expect(ellipsoidUmbilics([1.5, 0.8, 0.8]).length).toBe(2);
    expect(ellipsoidUmbilics([1, 1, 1]).length).toBe(0);
    const k = ellipsoidCurv([1, 1, 1], ellipsoidPt([1, 1, 1], 1, 1));
    expect(k.diff).toBeLessThan(1e-12);
  });
  it('orderAxes keeps a ≥ b ≥ c', () => {
    expect(orderAxes([1, 1.5, 0.7], 1)).toEqual([1.5, 1.5, 0.7]);
    expect(orderAxes([1.5, 1.2, 0.7], 2)).toEqual([1.5, 1.2, 0.7]);
    expect(orderAxes([1.5, 1.2, 1.4], 2)).toEqual([1.5, 1.4, 1.4]);
    expect(orderAxes([0.5, 1.2, 0.7], 0)).toEqual([0.5, 0.5, 0.5]);
  });
});

const TAU_ = (x: number) => 2 * Math.PI * x;
