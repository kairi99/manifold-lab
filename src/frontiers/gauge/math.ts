// SU(2) as unit quaternions q = [w, x, y, z]. The basis T_a = -(i/2)σ_a of su(2) corresponds to the pure
// quaternion q_a/2 (e1=i, e2=j, e3=k), so [T_1,T_2] = T_3 and the bracket of su(2) vectors is the cross product.
// Verified: T_1 T_2 - T_2 T_1 = (1/4)(ij - ji) = (1/2)k = T_3.
export type Q = [number, number, number, number];
export type V3 = [number, number, number];
/** A connection: Lie-algebra coefficients (a_1,a_2,a_3) of A_x and A_y at (x,y), A_μ = a_μ^a T_a. */
export type Field = (x: number, y: number) => [V3, V3];

export const ID: Q = [1, 0, 0, 0];
export const qmul = (a: Q, b: Q): Q => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
export const qconj = (a: Q): Q => [a[0], -a[1], -a[2], -a[3]];
export const qnorm = (a: Q) => Math.hypot(a[0], a[1], a[2], a[3]);
export const qsub = (a: Q, b: Q): Q => [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
const qunit = (a: Q): Q => { const n = qnorm(a); return [a[0] / n, a[1] / n, a[2] / n, a[3] / n]; };

/** exp(a·T) = cos(|a|/2) + sin(|a|/2) â. */
export function expSu2(a: V3): Q {
  const n = Math.hypot(a[0], a[1], a[2]);
  if (n < 1e-14) return [1, a[0] / 2, a[1] / 2, a[2] / 2];
  const s = Math.sin(n / 2) / n;
  return [Math.cos(n / 2), a[0] * s, a[1] * s, a[2] * s];
}
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Adjoint action g (a·T) g⁻¹ = (R(g) a)·T: the SU(2) → SO(3) rotation. */
export function adj(q: Q, a: V3): V3 {
  const r = qmul(qmul(q, [0, a[0], a[1], a[2]]), qconj(q));
  return [r[1], r[2], r[3]];
}
/** Holonomy → rotation angle in [0, π] and unit axis (q and −q are the same rotation). */
export function axisAngle(q: Q): { angle: number; axis: V3 } {
  const s = q[0] < 0 ? -1 : 1, n = Math.hypot(q[1], q[2], q[3]);
  const angle = 2 * Math.atan2(n, s * q[0]);
  return { angle, axis: n < 1e-12 ? [0, 0, 1] : [s * q[1] / n, s * q[2] / n, s * q[3] / n] };
}
/** Wilson loop W = ½ tr Hol = w. */
export const wilson = (q: Q) => q[0];

// ---- the connection family -------------------------------------------------------------------
/** A_x = −(B/2) y T_3 + λ T_1,  A_y = (B/2) x T_3 + λ T_2.  λ = 0 is abelian (all in span T_3). */
export const family = (B: number, lam: number): Field => (x, y) => [[lam, 0, -B * y / 2], [0, lam, B * x / 2]];
/** F_xy = ∂_x A_y − ∂_y A_x + [A_x, A_y] = (λBy/2, −λBx/2, B + λ²) in the T_a basis. */
export const familyF = (B: number, lam: number) => (x: number, y: number): V3 => [lam * B * y / 2, -lam * B * x / 2, B + lam * lam];
/** Same F from the Field by central differences: a check on familyF and on any transformed field. */
export function curvatureFD(A: Field, x: number, y: number, h = 1e-5): V3 {
  const Ay1 = A(x + h, y)[1], Ay0 = A(x - h, y)[1], Ax1 = A(x, y + h)[0], Ax0 = A(x, y - h)[0];
  const [ax, ay] = A(x, y), br = cross(ax, ay);
  return [0, 1, 2].map((i) => (Ay1[i] - Ay0[i]) / (2 * h) - (Ax1[i] - Ax0[i]) / (2 * h) + br[i]) as V3;
}

// ---- parallel transport ---------------------------------------------------------------------
/** dU/dt = −A_μ ẋ^μ U as a quaternion derivative: −½ (a·ẋ) U. */
function rate(A: Field, x: number, y: number, dx: number, dy: number, U: Q): Q {
  const [ax, ay] = A(x, y);
  const w: Q = [0, -(ax[0] * dx + ay[0] * dy) / 2, -(ax[1] * dx + ay[1] * dy) / 2, -(ax[2] * dx + ay[2] * dy) / 2];
  return qmul(w, U);
}
const addq = (a: Q, b: Q, s: number): Q => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2], a[3] + s * b[3]];
/** RK4 step along the straight segment p→q (constant velocity q−p over parameter [0,1]); renormalised to SU(2). */
function step(A: Field, p: [number, number], q: [number, number], U: Q): Q {
  const dx = q[0] - p[0], dy = q[1] - p[1];
  const at = (s: number) => [p[0] + s * dx, p[1] + s * dy] as const;
  const k1 = rate(A, p[0], p[1], dx, dy, U);
  const m = at(0.5), k2 = rate(A, m[0], m[1], dx, dy, addq(U, k1, 0.5));
  const k3 = rate(A, m[0], m[1], dx, dy, addq(U, k2, 0.5));
  const k4 = rate(A, q[0], q[1], dx, dy, addq(U, k3, 1));
  return qunit([0, 1, 2, 3].map((i) => U[i] + (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6) as Q);
}
const SUB = 4;
const lerp = (p: [number, number], q: [number, number], s: number): [number, number] => [p[0] + s * (q[0] - p[0]), p[1] + s * (q[1] - p[1])];
/** Transport along a polyline: U at every vertex (U[0] = 1). A closed loop repeats its first point at the end. */
export function transport(A: Field, pts: readonly [number, number][]): Q[] {
  const out: Q[] = [ID];
  for (let i = 1; i < pts.length; i++) {
    // 4 RK4 substeps per segment: the gauge-transformed field varies fast, and W must agree to ~1e-9
    let U = out[i - 1];
    for (let k = 0; k < SUB; k++) U = step(A, lerp(pts[i - 1], pts[i], k / SUB), lerp(pts[i - 1], pts[i], (k + 1) / SUB), U);
    out.push(U);
  }
  return out;
}
export const holonomy = (A: Field, pts: readonly [number, number][]): Q => transport(A, pts).at(-1)!;

/** Circle through `base` (a point on it), centre base + (sign·r, 0), traversed counter-clockwise; n+1 points, closed. */
export function circleLoop(base: [number, number], r: number, side: 1 | -1, n = 96): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const th = (2 * Math.PI * i) / n;
    // side −1: centre at base − (r,0), start θ=0 at base. side +1: centre at base + (r,0), start at angle π.
    return side < 0 ? [base[0] - r + r * Math.cos(th), base[1] + r * Math.sin(th)] : [base[0] + r - r * Math.cos(th), base[1] - r * Math.sin(th)];
  }) as [number, number][];
}
/** Counter-clockwise square of side ε with corner at (x,y). */
export const squareLoop = (x: number, y: number, e: number): [number, number][] =>
  [[x, y], [x + e, y], [x + e, y + e], [x, y + e], [x, y]];
/** Shoelace area (counter-clockwise positive). */
export function polyArea(pts: readonly [number, number][]) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1];
  return s / 2;
}
/** Concatenate closed loops sharing a base point (drops the repeated joint). */
export const concat = (a: readonly [number, number][], b: readonly [number, number][]) => [...a, ...b.slice(1)];

/** (1 − Hol)/ε² read as a Lie-algebra vector: for Hol = exp(−ε²F·T) the imaginary part is −ε²F/2, so F ≈ 2·Im(1−Hol)/ε². */
export function smallLoopF(A: Field, x: number, y: number, e: number): V3 {
  const h = holonomy(A, squareLoop(x, y, e));
  return [2 * -h[1] / (e * e), 2 * -h[2] / (e * e), 2 * -h[3] / (e * e)];
}

// ---- gauge transformation g = exp(f(x,y) n·T) --------------------------------------------------
export interface Gauge { axis: V3; amp: number; cx: number; cy: number; s2: number }
export const DEFAULT_GAUGE: Gauge = { axis: [1, 1, 0].map((c) => c / Math.SQRT2) as V3, amp: 2.2, cx: 0.2, cy: 0.5, s2: 0.9 };
const bump = (g: Gauge, x: number, y: number) => g.amp * Math.exp(-((x - g.cx) ** 2 + (y - g.cy) ** 2) / g.s2);
export const gaugeAt = (g: Gauge, x: number, y: number): Q => expSu2(g.axis.map((c) => c * bump(g, x, y)) as V3);
/** A ↦ g A g⁻¹ − (dg) g⁻¹; for g = exp(f n·T) we have (∂_μ g) g⁻¹ = ∂_μ f · n·T exactly. */
export function gaugeField(A: Field, g: Gauge): Field {
  return (x, y) => {
    const f = bump(g, x, y), dfx = (-2 * (x - g.cx) / g.s2) * f, dfy = (-2 * (y - g.cy) / g.s2) * f;
    const q = expSu2(g.axis.map((c) => c * f) as V3), [ax, ay] = A(x, y), rx = adj(q, ax), ry = adj(q, ay);
    return [rx.map((c, i) => c - dfx * g.axis[i]) as V3, ry.map((c, i) => c - dfy * g.axis[i]) as V3];
  };
}
/** F ↦ g F g⁻¹ */
export const gaugeF = (F: (x: number, y: number) => V3, g: Gauge) => (x: number, y: number): V3 => adj(gaugeAt(g, x, y), F(x, y));
