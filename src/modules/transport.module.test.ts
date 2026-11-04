import { describe, expect, it } from 'vitest';
import { getSurface } from '../math';
import { geodesicTriangleSphere, latitudeLoop } from '../math/curves';
import { holonomyAngle, transport } from '../math/transport';

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const sphere = getSurface('sphere');
const run = (curve: ReturnType<typeof latitudeLoop>) => {
  const V0: [number, number] = [0.5, 0.2];
  const s = transport(sphere, curve, V0, 1200);
  return holonomyAngle(sphere, s[0].uv, V0, s[1200].V);
};

describe('sphere holonomy', () => {
  it('latitude 60 deg = pi (mod 2pi)', () => {
    const m = run(latitudeLoop(Math.PI / 3));
    expect(Math.abs(wrap(m - Math.PI))).toBeLessThan(1e-3);
  });
  it.each([0.5, 1.0, 2.0])('latitude %f matches 2pi(1-cos)', (t) => {
    expect(Math.abs(wrap(run(latitudeLoop(t)) - 2 * Math.PI * (1 - Math.cos(t))))).toBeLessThan(1e-3);
  });
  it('triangle matches (pi/2)cos(0.05)', () => {
    expect(Math.abs(wrap(run(geodesicTriangleSphere()) - (Math.PI / 2) * Math.cos(0.05)))).toBeLessThan(2e-2);
  });
});
