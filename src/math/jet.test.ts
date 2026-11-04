import { describe, expect, it } from 'vitest';
import * as J from './jet';

const vars = (xs: number[]) => xs.map((x, i) => J.variable(xs.length, i, x));

/** Central-difference gradient and Hessian of a scalar function of numbers, via value-only jets. */
function fd(f: (x: J.Jet[]) => J.Jet, x: number[], h = 1e-4) {
  const n = x.length, val = (y: number[]) => f(vars(y)).v;
  const grad = x.map((_, i) => { const p = [...x], m = [...x]; p[i] += h; m[i] -= h; return (val(p) - val(m)) / (2 * h); });
  const hess = x.map((_, i) => x.map((_, k) => {
    const s = (a: number, b: number) => { const y = [...x]; y[i] += a * h; y[k] += b * h; return val(y); };
    return (s(1, 1) - s(1, -1) - s(-1, 1) + s(-1, -1)) / (4 * h * h);
  }));
  return { grad, hess, n };
}

function check(f: (x: J.Jet[]) => J.Jet, x: number[], tol = 1e-5) {
  const j = f(vars(x)), { grad, hess, n } = fd(f, x);
  for (let i = 0; i < n; i++) {
    expect(j.g[i]).toBeCloseTo(grad[i], 5);
    for (let k = 0; k < n; k++) expect(Math.abs(j.h[i * n + k] - hess[i][k])).toBeLessThan(tol * (1 + Math.abs(hess[i][k])));
  }
}

describe('jet', () => {
  it('polynomial is exact', () => {
    // f = 3x²y − y³ + 2xy + 5 at (2,3)
    const [x, y] = vars([2, 3]);
    const f = J.add(J.sub(J.mul(J.scale(J.mul(x, x), 3), y), J.pow(y, 3)), J.add(J.scale(J.mul(x, y), 2), 5));
    expect(f.v).toBe(3 * 4 * 3 - 27 + 12 + 5);
    expect([f.g[0], f.g[1]]).toEqual([6 * 2 * 3 + 2 * 3, 3 * 4 - 3 * 9 + 2 * 2]);
    expect(Array.from(f.h)).toEqual([6 * 3, 6 * 2 + 2, 6 * 2 + 2, -6 * 3]);
  });
  it('number operands are lifted', () => {
    const [x] = vars([4]);
    const f = J.div(1, x); // 1/x
    expect(f.g[0]).toBeCloseTo(-1 / 16, 14);
    expect(f.h[0]).toBeCloseTo(2 / 64, 14);
  });
  it('composites match finite differences', () => {
    const p = [0.7, 1.3, -0.4];
    check(([x, y, z]) => J.mul(J.sin(J.mul(x, y)), J.exp(J.sub(z, J.cos(x)))), p);
    check(([x, y, z]) => J.div(J.sqrt(J.add(J.mul(x, x), J.add(J.mul(y, y), 1))), J.add(2, J.cosh(z))), p);
    check(([x, y]) => J.log(J.add(J.pow(x, 2.5), J.mul(y, y))), p);
    check(([x, y]) => J.add(J.tan(J.scale(x, 0.5)), J.tanh(J.mul(x, y))), p);
    check(([x, y]) => J.add(J.atan(J.mul(x, y)), J.sinh(y)), p);
    check(([x, y]) => J.add(J.asin(J.scale(x, 0.5)), J.acos(J.scale(y, 0.3))), p);
    check(([x, y]) => J.mul(J.abs(J.sub(x, y)), J.neg(y)), p);
  });
});
