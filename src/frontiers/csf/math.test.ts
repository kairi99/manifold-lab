import { describe, expect, it } from 'vitest';
import { PRESET_IDS, advance, extinct, extinctionTime, fromFreehand, isConvex, isEmbedded, length, makeFlow, preset, signedArea, step } from './math';

describe('curve shortening flow', () => {
  it('circle: r² = r0² − 2t within 1% up to 0.8 T', () => {
    const f = makeFlow(preset('circle'));
    const r0 = Math.hypot(f.p[0], f.p[1]);
    while (f.t < 0.8 * f.T0) {
      step(f);
      const r2 = signedArea(f.p) / Math.PI;
      expect(Math.abs(r2 - (r0 * r0 - 2 * f.t)) / (r0 * r0 - 2 * f.t)).toBeLessThan(0.01);
    }
  });
  it('presets are embedded CCW', () => {
    for (const id of PRESET_IDS) { const p = preset(id); expect(signedArea(p)).toBeGreaterThan(0); expect(isEmbedded(p)).toBe(true); }
    expect(isConvex(preset('ellipse'))).toBe(true);
    expect(isConvex(preset('flower'))).toBe(false);
    expect(isConvex(preset('horseshoe'))).toBe(false);
  });
  for (const id of ['flower', 'horseshoe'] as const) {
    it(`${id}: dA/dt ≈ −2π, length non-increasing, embedded, convex before 5% area, extinction ≈ A0/2π`, () => {
      const f = makeFlow(preset(id));
      let L = f.L0, convexAt = -1, a05: { t: number; A: number } | null = null;
      while (!extinct(f)) {
        step(f);
        const Lnew = length(f.p);
        expect(Lnew).toBeLessThanOrEqual(L + 1e-9); L = Lnew;
        if (convexAt < 0 && isConvex(f.p)) convexAt = signedArea(f.p) / f.A0;
        if (!a05 && f.t >= 0.5 * f.T0) a05 = { t: f.t, A: signedArea(f.p) };
      }
      expect(isEmbedded(f.p)).toBe(true);
      const rate = (a05!.A - f.A0) / a05!.t;
      expect(Math.abs(rate / (-2 * Math.PI) - 1)).toBeLessThan(0.02);
      expect(convexAt).toBeGreaterThan(0.05);
      expect(Math.abs(extinctionTime(f) / f.T0 - 1)).toBeLessThan(0.03);
    });
  }
  it('advance respects extinction; freehand validation', () => {
    const f = makeFlow(preset('ellipse')); advance(f, 100, 1e6);
    expect(extinct(f)).toBe(true);
    const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]].flatMap(([x, y], i, a) => { const [x2, y2] = a[(i + 1) % 4]; return [0, 1, 2, 3].map((k) => [x + ((x2 - x) * k) / 4, y + ((y2 - y) * k) / 4] as [number, number]); });
    expect(fromFreehand(sq)).not.toBeNull();
    const bow: [number, number][] = [[0, 0], [1, 1], [1, 0], [0, 1], [0.1, 0.5], [0.2, 0.5], [0.3, 0.5], [0.4, 0.5]];
    expect(fromFreehand(bow)).toBeNull();
  });
});
