import { describe, expect, it } from 'vitest';
import { clairaut, geodesic, geodesicAccel, speed, unitVelocity } from './geodesic';
import { cross, dot, norm, normalize, add, scale } from './vec';
import { makeSphere, makeTorus, saddle } from './surfaces';
import type { Vec2 } from './types';

const sphere = makeSphere();
const torus = makeTorus();
const toWorld = (s: typeof sphere, uv: Vec2, v: Vec2) =>
  add(scale(s.du(uv[0], uv[1]), v[0]), scale(s.dv(uv[0], uv[1]), v[1]));

describe('geodesic', () => {
  const uv0: Vec2 = [Math.PI / 2, 0.3];
  const p0 = sphere.position(...uv0);
  for (const a of [0.2, 0.7, 1.2, Math.PI / 2]) {
    it(`sphere great circle, angle ${a}`, () => {
      const v0 = unitVelocity(sphere, uv0, a);
      const n = normalize(cross(p0, toWorld(sphere, uv0, v0)));
      const path = geodesic(sphere, uv0, v0, 2 * Math.PI);
      expect(path.stopped).toBeUndefined();
      for (const smp of path.samples) expect(Math.abs(dot(sphere.position(...smp.uv), n))).toBeLessThan(1e-4);
      const end = sphere.position(...path.samples.at(-1)!.uv);
      expect(norm(add(end, scale(p0, -1)))).toBeLessThan(1e-3);
      const half = geodesic(sphere, uv0, v0, Math.PI).samples.at(-1)!;
      expect(norm(add(sphere.position(...half.uv), p0))).toBeLessThan(1e-3);
    });
  }

  it('meridian passes over the pole', () => {
    const p = geodesic(sphere, [1, 0.3], [-1, 0], 2);
    expect(p.stopped).toBeUndefined();
    const e = p.samples.at(-1)!;
    expect(e.uv[0]).toBeGreaterThan(0);
    expect(Math.cos(e.uv[1] - 0.3 - Math.PI)).toBeCloseTo(1, 9);
    expect(e.uv[0]).toBeCloseTo(1, 6);
  });

  it('unit speed conserved', () => {
    for (const [s, uv] of [[sphere, [1, 0.5]], [torus, [0.2, 0.7]], [saddle, [0.1, -0.2]]] as [typeof sphere, Vec2][]) {
      const v0 = unitVelocity(s, uv, 0.9);
      for (const smp of geodesic(s, uv, v0, 3).samples) expect(Math.abs(speed(s, smp.uv, smp.vel) - 1)).toBeLessThan(1e-6);
    }
  });

  it('Clairaut conserved', () => {
    for (const [s, uv] of [[sphere, [1, 0.5]], [torus, [0.2, 0.7]]] as [typeof sphere, Vec2][]) {
      const v0 = unitVelocity(s, uv, 0.9);
      const c0 = clairaut(s, uv, v0)!;
      for (const smp of geodesic(s, uv, v0, 10).samples) expect(Math.abs(clairaut(s, smp.uv, smp.vel)! - c0)).toBeLessThan(1e-6);
    }
    expect(clairaut(saddle, [0, 0], [1, 0])).toBeNull();
  });

  it('torus outer equator is a geodesic', () => {
    const v0 = unitVelocity(torus, [0, 0], 0);
    for (const smp of geodesic(torus, [0, 0], v0, 5).samples) expect(Math.abs(smp.uv[1])).toBeLessThan(1e-9);
  });

  it('saddle: straight line on y=0, then boundary stop', () => {
    const p = geodesic(saddle, [0, 0], unitVelocity(saddle, [0, 0], 0), 5);
    for (const smp of p.samples) expect(Math.abs(smp.uv[1])).toBeLessThan(1e-9);
    expect(p.stopped).toBe('boundary');
  });
});

describe('pole regression', () => {
  it('geodesicAccel is finite exactly at a pole for a meridian (cot θ · 0)', () => {
    const a = geodesicAccel(makeSphere(), [0, 0.3], [1, 0]);
    expect(Number.isFinite(a[0]) && Number.isFinite(a[1])).toBe(true);
  });
});

describe('near-pole accuracy', () => {
  it('geodesics grazing the pole stay on their great circle', () => {
    const s = makeSphere();
    const uv: Vec2 = [1.2, 0.5];
    for (const eps of [0, 1e-12, 1e-9, 1e-6, 1e-4, 1e-3]) {
      const p = geodesic(s, uv, unitVelocity(s, uv, Math.PI + eps), 2);
      const end = p.samples[p.samples.length - 1];
      // heading north from θ=1.2 for arc 2 passes (near) the pole and ends at θ ≈ 0.8 on the far side
      expect(Number.isFinite(end.uv[0] + end.uv[1])).toBe(true);
      expect(Math.abs(end.uv[0] - 0.8)).toBeLessThan(1e-5);
    }
  });
});
