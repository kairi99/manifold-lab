import { describe, expect, it } from 'vitest';
import { adj, axisAngle, circleLoop, concat, cross, curvatureFD, DEFAULT_GAUGE, expSu2, family, familyF, gaugeAt, gaugeField, holonomy, ID, polyArea, qconj, qmul, qnorm, qsub, smallLoopF, wilson, type Q } from './math';

const base: [number, number] = [0, 0];
const dist = (a: number[], b: number[]) => Math.hypot(...a.map((x, i) => x - b[i]));

describe('su(2) conventions', () => {
  it('[T1,T2] = T3 (quaternion form T_a = q_a/2)', () => {
    const T = (i: number): Q => { const q: Q = [0, 0, 0, 0]; q[i] = 0.5; return q; };
    const c = qsub(qmul(T(1), T(2)), qmul(T(2), T(1)));
    expect(dist(c, T(3))).toBeLessThan(1e-15);
  });
  it('adjoint of exp(θ T3) rotates e1 by θ about e3', () => {
    const r = adj(expSu2([0, 0, 0.7]), [1, 0, 0]);
    expect(dist(r, [Math.cos(0.7), Math.sin(0.7), 0])).toBeLessThan(1e-14);
  });
});

describe('abelian case (λ = 0)', () => {
  const A = family(1.3, 0);
  const a = circleLoop(base, 0.8, -1, 96), b = circleLoop(base, 0.5, 1, 96);
  it('holonomies commute', () => {
    expect(qnorm(qsub(holonomy(A, concat(a, b)), holonomy(A, concat(b, a))))).toBeLessThan(1e-12);
  });
  it('Hol = exp(−B·area·T3)', () => {
    const h = holonomy(A, a);
    expect(dist(h, expSu2([0, 0, -1.3 * polyArea(a)]))).toBeLessThan(1e-9);
    expect(Math.abs(polyArea(a) - Math.PI * 0.64)).toBeLessThan(0.01); // polygon ≈ disc
  });
});

describe('non-abelian case', () => {
  const A = family(1.3, 0.8);
  const a = circleLoop(base, 0.8, -1), b = circleLoop(base, 0.6, 1);
  it('αβ ≠ βα', () => {
    expect(qnorm(qsub(holonomy(A, concat(a, b)), holonomy(A, concat(b, a))))).toBeGreaterThan(1e-3);
  });
  it('Hol(αβ) = Hol(β) Hol(α)', () => {
    const lhs = holonomy(A, concat(a, b)), rhs = qmul(holonomy(A, b), holonomy(A, a));
    expect(dist(lhs, rhs)).toBeLessThan(1e-9);
  });
  it('F formula matches finite differences', () => {
    const F = familyF(1.3, 0.8);
    for (const [x, y] of [[0.3, -0.7], [1.1, 0.4]]) expect(dist(F(x, y), curvatureFD(A, x, y))).toBeLessThan(1e-8);
  });
  it('Hol stays in SU(2)', () => {
    const h = holonomy(A, concat(a, b));
    expect(Math.abs(qnorm(h) - 1)).toBeLessThan(1e-10);
    expect(Math.abs(qnorm(qmul(h, qconj(h))) - 1)).toBeLessThan(1e-10);
  });
  it('small loop: (1 − Hol)/ε² → F with first-order convergence', () => {
    const F = familyF(1.3, 0.8)(0.6, 0.4);
    const e1 = dist(smallLoopF(A, 0.6, 0.4, 1e-2), F), e2 = dist(smallLoopF(A, 0.6, 0.4, 5e-3), F);
    expect(e1).toBeLessThan(0.05);
    expect(e2).toBeLessThan(e1 * 0.6);
  });
});

describe('gauge covariance', () => {
  const A = family(1.3, 0.8), G = DEFAULT_GAUGE, A2 = gaugeField(A, G);
  const loop = concat(circleLoop(base, 0.8, -1), circleLoop(base, 0.6, 1));
  it('Wilson loop invariant, Hol conjugated by g(x0)', () => {
    const h = holonomy(A, loop), h2 = holonomy(A2, loop), g0 = gaugeAt(G, 0, 0);
    expect(Math.abs(wilson(h) - wilson(h2))).toBeLessThan(1e-9);
    expect(dist(h2, qmul(qmul(g0, h), qconj(g0)))).toBeLessThan(1e-9);
    expect(axisAngle(h).angle).toBeCloseTo(axisAngle(h2).angle, 8);
    expect(qnorm(qsub(h, h2))).toBeGreaterThan(1e-3);
  });
  it('F ↦ g F g⁻¹ (finite differences of the transformed A)', () => {
    const F = familyF(1.3, 0.8), x = 0.4, y = 0.3;
    expect(dist(curvatureFD(A2, x, y), adj(gaugeAt(G, x, y), F(x, y)))).toBeLessThan(1e-7);
  });
  it('identity holonomy of trivial loop', () => { expect(dist(holonomy(A, [[0, 0], [0, 0]]), ID)).toBe(0); });
  it('cross is the su(2) bracket', () => { expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]); });
});
