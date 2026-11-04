import { describe, it, expect } from 'vitest';
import { shadowBoundary } from './shadow';
import { tracePixel, traceRow, iscoRadius, type TraceParams } from './raytrace';

const B = 3 * Math.sqrt(3);
const base = (o: Partial<TraceParams> = {}): TraceParams => ({
  a: 0, inclinationDeg: 90, distance: 1000, fov: 12, width: 8, height: 8, disk: false, sky: true, diskOuter: 20, ...o,
});

describe('shadowBoundary', () => {
  it('a=0 is a circle of radius 3√3', () => {
    for (const [x, y] of shadowBoundary(0, 60)) expect(Math.hypot(x, y)).toBeCloseTo(B, 3);
  });
  it('a=0.99 edge-on is a closed D-shape, prograde (α<0) side flattened', () => {
    const c = shadowBoundary(0.99, 90);
    const al = c.map((q) => q[0]);
    const amin = Math.min(...al), amax = Math.max(...al);
    expect(c[0][0]).toBeCloseTo(c[c.length - 1][0], 9);
    expect(c[0][1]).toBeCloseTo(c[c.length - 1][1], 9);
    expect(amin).toBeGreaterThan(-3); expect(amin).toBeLessThan(-1.5); // ≈ −2.0 (prograde edge)
    expect(amax).toBeGreaterThan(6.5); expect(amax).toBeLessThan(7.5); // ≈ +7.0 (retrograde edge)
  });
});

describe('tracePixel', () => {
  it('a=0: b<3√3 hits horizon, b>3√3 escapes', () => {
    for (const ang of [0, 0.7, 2, 3.5, 5]) {
      const c = Math.cos(ang), s = Math.sin(ang);
      expect(tracePixel(base(), (B - 0.05) * c, (B - 0.05) * s).hit).toBe('horizon');
      const out = tracePixel(base(), (B + 0.05) * c, (B + 0.05) * s);
      expect(out.hit).toBe('sky');
    }
  });
  it('a=0.9 edge-on: bisected shadow edges match shadowBoundary', () => {
    const p = base({ a: 0.9 });
    const cur = shadowBoundary(0.9, 90).map((q) => q[0]);
    const edge = (sgn: number) => {
      let lo = 0, hi = 10; // lo captured, hi escapes
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        if (tracePixel(p, sgn * m, 0).hit === 'horizon') lo = m; else hi = m;
      }
      return sgn * lo;
    };
    expect(edge(-1)).toBeCloseTo(Math.min(...cur), 1);
    expect(Math.abs(edge(-1) - Math.min(...cur))).toBeLessThan(0.05);
    expect(Math.abs(edge(1) - Math.max(...cur))).toBeLessThan(0.05);
  });
  it('disk: direct and lensed images; α<0 approaches (g>1), α>0 recedes (g<1)', () => {
    const p = base({ inclinationDeg: 80, disk: true });
    expect(tracePixel(p, 0, 8).hit).toBe('disk');
    expect(tracePixel(p, 0, -8).hit).toBe('disk');
    const l = tracePixel(p, -8, 0), r = tracePixel(p, 8, 0);
    expect(l.hit).toBe('disk'); expect(r.hit).toBe('disk');
    expect(l.g!).toBeGreaterThan(1); expect(r.g!).toBeLessThan(1);
  });
  it('ISCO sanity', () => {
    expect(iscoRadius(0)).toBeCloseTo(6, 9);
    expect(iscoRadius(0.999)).toBeLessThan(1.5);
  });
  it('40x40 smoke: all pixels finite', () => {
    const p = base({ a: 0.7, inclinationDeg: 75, disk: true, width: 40, height: 40 });
    const row = new Uint8ClampedArray(160);
    for (let y = 0; y < 40; y++) { traceRow(p, y, row); for (const v of row) expect(Number.isFinite(v)).toBe(true); }
  });
});
