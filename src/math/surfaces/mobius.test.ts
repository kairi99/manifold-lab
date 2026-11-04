import { describe, expect, it } from 'vitest';
import { geodesic } from '../geodesic';
import { foldSample, holonomyAngle, transport } from '../transport';
import { makeCustomSurface } from './custom';
import { PRESETS } from './presets';

const s = makeCustomSurface(PRESETS.find((p) => p.id === 'mobius')!.spec);
const centre = (n: number) => ({ point: (t: number): [number, number] => [2 * Math.PI * n * t, 0], velocity: (): [number, number] => [2 * Math.PI * n, 0] });

describe('Möbius seam', () => {
  it('position is continuous across the twisted identification', () => {
    const a = s.position(2 * Math.PI, 0.4), b = s.position(0, -0.4);
    a.forEach((x, i) => expect(x).toBeCloseTo(b[i], 12));
  });
  it('a geodesic crosses the seam without stopping and stays C¹ in R³', () => {
    // note: the centre circle is not a geodesic (its curvature vector lies in the tangent plane at u = 0)
    const g = geodesic(s, [5.9, 0.1], [1, 0], 0.8, 0.01);
    expect(g.stopped).toBeUndefined();
    const k = g.samples.findIndex((q, i) => i > 0 && q.uv[0] < g.samples[i - 1].uv[0]);
    expect(k).toBeGreaterThan(0);
    const w3 = (q: (typeof g.samples)[number]) => {
      const a = s.du(q.uv[0], q.uv[1]), b = s.dv(q.uv[0], q.uv[1]);
      return [0, 1, 2].map((i) => a[i] * q.vel[0] + b[i] * q.vel[1]);
    };
    const p0 = s.position(...g.samples[k - 1].uv), p1 = s.position(...g.samples[k].uv);
    expect(Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])).toBeLessThan(0.02);
    const a = w3(g.samples[k - 1]), b = w3(g.samples[k]);
    expect(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])).toBeLessThan(0.05);
    expect(g.samples[k].uv[1] * g.samples[k - 1].uv[1]).toBeLessThan(0); // v mirrored
  });
  it('transport round the core reverses e_v; twice round restores it', () => {
    const V0: [number, number] = [0, 1 / Math.sqrt(s.metric(0, 0)[1][1])];
    const one = transport(s, centre(1), V0, 600);
    const f1 = foldSample(s, one[600]);
    expect(Math.abs(Math.abs(holonomyAngle(s, [0, 0], V0, f1.V)) - Math.PI)).toBeLessThan(1e-4);
    const two = transport(s, centre(2), V0, 1200);
    const f2 = foldSample(s, two[1200]);
    expect(Math.abs(holonomyAngle(s, [0, 0], V0, f2.V))).toBeLessThan(1e-4);
  });
});
