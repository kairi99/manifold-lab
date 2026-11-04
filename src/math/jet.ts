// Second-order truncated Taylor jets in n variables: value, gradient, Hessian.
// Forward-mode "automatic differentiation" so curvature needs no finite differences.

export interface Jet {
  n: number;
  v: number;
  g: Float64Array; // length n
  h: Float64Array; // n*n, row-major, symmetric
}
export type J = Jet | number;

export const constant = (n: number, c: number): Jet => ({ n, v: c, g: new Float64Array(n), h: new Float64Array(n * n) });

export function variable(n: number, i: number, x: number): Jet {
  const j = constant(n, x);
  j.g[i] = 1;
  return j;
}

const nOf = (a: J, b: J): number => (typeof a !== 'number' ? a.n : typeof b !== 'number' ? b.n : 0);
const lift = (a: J, n: number): Jet => (typeof a === 'number' ? constant(n, a) : a);

/** Chain rule: f(a) given f, f', f'' evaluated at a.v. */
function chain(a: Jet, f: number, d1: number, d2: number): Jet {
  const n = a.n, r = constant(n, f);
  for (let i = 0; i < n; i++) r.g[i] = d1 * a.g[i];
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) r.h[i * n + k] = d1 * a.h[i * n + k] + d2 * a.g[i] * a.g[k];
  return r;
}

export function add(a: J, b: J): Jet {
  const n = nOf(a, b), x = lift(a, n), y = lift(b, n), r = constant(n, x.v + y.v);
  for (let i = 0; i < n; i++) r.g[i] = x.g[i] + y.g[i];
  for (let i = 0; i < n * n; i++) r.h[i] = x.h[i] + y.h[i];
  return r;
}
export const neg = (a: Jet): Jet => scale(a, -1);
export const sub = (a: J, b: J): Jet => add(a, typeof b === 'number' ? -b : neg(b));

export function scale(a: Jet, s: number): Jet {
  const r = constant(a.n, a.v * s);
  for (let i = 0; i < a.n; i++) r.g[i] = a.g[i] * s;
  for (let i = 0; i < a.n * a.n; i++) r.h[i] = a.h[i] * s;
  return r;
}

export function mul(a: J, b: J): Jet {
  const n = nOf(a, b), x = lift(a, n), y = lift(b, n), r = constant(n, x.v * y.v);
  for (let i = 0; i < n; i++) r.g[i] = x.v * y.g[i] + y.v * x.g[i];
  for (let i = 0; i < n; i++)
    for (let k = 0; k < n; k++)
      r.h[i * n + k] = x.v * y.h[i * n + k] + y.v * x.h[i * n + k] + x.g[i] * y.g[k] + x.g[k] * y.g[i];
  return r;
}

export function pow(a: Jet, p: number): Jet {
  const v = a.v;
  return chain(a, v ** p, p * v ** (p - 1), p === 1 ? 0 : p * (p - 1) * v ** (p - 2));
}
export const div = (a: J, b: J): Jet => mul(a, typeof b === 'number' ? 1 / b : pow(b, -1));

export const sqrt = (a: Jet): Jet => { const s = Math.sqrt(a.v); return chain(a, s, 0.5 / s, -0.25 / (s * a.v)); };
export const exp = (a: Jet): Jet => { const e = Math.exp(a.v); return chain(a, e, e, e); };
export const log = (a: Jet): Jet => chain(a, Math.log(a.v), 1 / a.v, -1 / (a.v * a.v));
export const sin = (a: Jet): Jet => chain(a, Math.sin(a.v), Math.cos(a.v), -Math.sin(a.v));
export const cos = (a: Jet): Jet => chain(a, Math.cos(a.v), -Math.sin(a.v), -Math.cos(a.v));
export const tan = (a: Jet): Jet => { const t = Math.tan(a.v), s = 1 + t * t; return chain(a, t, s, 2 * t * s); };
export const sinh = (a: Jet): Jet => chain(a, Math.sinh(a.v), Math.cosh(a.v), Math.sinh(a.v));
export const cosh = (a: Jet): Jet => chain(a, Math.cosh(a.v), Math.sinh(a.v), Math.cosh(a.v));
export const tanh = (a: Jet): Jet => { const t = Math.tanh(a.v), s = 1 - t * t; return chain(a, t, s, -2 * t * s); };
export const atan = (a: Jet): Jet => { const d = 1 + a.v * a.v; return chain(a, Math.atan(a.v), 1 / d, (-2 * a.v) / (d * d)); };
export const asin = (a: Jet): Jet => { const d = 1 - a.v * a.v; return chain(a, Math.asin(a.v), d ** -0.5, a.v * d ** -1.5); };
export const acos = (a: Jet): Jet => { const d = 1 - a.v * a.v; return chain(a, Math.acos(a.v), -(d ** -0.5), -a.v * d ** -1.5); };
export const abs = (a: Jet): Jet => chain(a, Math.abs(a.v), Math.sign(a.v), 0);
