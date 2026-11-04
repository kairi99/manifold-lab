import { describe, expect, it } from 'vitest';
import { tissotEllipse, tissotPoints } from './tissot';
import { innerProduct } from './metric';
import type { Mat2 } from './types';

describe('tissot', () => {
  it('diag(a²,b²): semi-axes eps/a along u, eps/b along v', () => {
    const e = tissotEllipse([[4, 0], [0, 9]], 0.6); // a=2, b=3
    // larger eigenvalue (9) lies along v, so r1 = eps/3 at angle π/2
    expect(e.r1).toBeCloseTo(0.2); expect(e.r2).toBeCloseTo(0.3);
    expect(Math.abs(Math.sin(e.angle))).toBeCloseTo(1);
    const p = tissotPoints([[4, 0], [0, 9]], 0.6, 4).map(([x, y]) => [Math.abs(x), Math.abs(y)]);
    expect(Math.max(...p.map((q) => q[0]))).toBeCloseTo(0.3); // eps/a
    expect(Math.max(...p.map((q) => q[1]))).toBeCloseTo(0.2); // eps/b
  });
  it('sheared g: all points satisfy g(w,w)=eps²', () => {
    const g: Mat2 = [[2, 0.8], [0.8, 1.3]];
    for (const w of tissotPoints(g, 0.37, 24)) expect(innerProduct(g, w, w)).toBeCloseTo(0.37 ** 2, 10);
  });
});
