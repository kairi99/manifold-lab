import type { ParamCurve, Vec2 } from './types';

export function latitudeLoop(theta0: number): ParamCurve {
  return {
    point: (t) => [theta0, 2 * Math.PI * t],
    velocity: () => [0, 2 * Math.PI],
  };
}

export function polylineLoop(points: Vec2[], closed = true): ParamCurve {
  const n = closed ? points.length : points.length - 1;
  const seg = (t: number) => {
    const s = Math.min(Math.max(t, 0), 1) * n;
    const i = Math.min(Math.floor(s), n - 1);
    return { i, f: s - i, a: points[i], b: points[(i + 1) % points.length] };
  };
  return {
    point: (t) => {
      const { f, a, b } = seg(t);
      return [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])];
    },
    velocity: (t) => {
      const { a, b } = seg(t);
      return [n * (b[0] - a[0]), n * (b[1] - a[1])];
    },
  };
}

/** Closed uniform Catmull-Rom spline through points; analytic velocity. */
export function catmullRomLoop(points: Vec2[]): ParamCurve {
  const n = points.length;
  const P = (i: number) => points[((i % n) + n) % n];
  const eval_ = (t: number, d: boolean): Vec2 => {
    const s = Math.min(Math.max(t, 0), 1) * n;
    const i = Math.min(Math.floor(s), n - 1);
    const f = s - i;
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const out: Vec2 = [0, 0];
    for (let c = 0; c < 2; c++) {
      const a = 2 * p1[c];
      const b = p2[c] - p0[c];
      const cc = 2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c];
      const dd = -p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c];
      out[c] = d
        ? (n * (b + 2 * cc * f + 3 * dd * f * f)) / 2
        : (a + b * f + cc * f * f + dd * f * f * f) / 2;
    }
    return out;
  };
  return { point: (t) => eval_(t, false), velocity: (t) => eval_(t, true) };
}

/**
 * "Lune-ish" triangle on the unit sphere in (θ, φ): equator φ 0→π/2, meridian φ=π/2 up to
 * θ=0.05 (near the singular pole), a tiny arc at θ=0.05, and back down meridian φ=0.
 * Enclosed area = (π/2)(cos 0.05 - cos(π/2)) ≈ π/2.
 */
export function geodesicTriangleSphere(): ParamCurve {
  return polylineLoop([[Math.PI / 2, 0], [Math.PI / 2, Math.PI / 2], [0.05, Math.PI / 2], [0.05, 0]]);
}
