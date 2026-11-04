import type { Vec3 } from './types';
import { cross, dot, norm, scale, sub } from './vec';

/** Position and first three derivatives of a space curve at parameter t (closed forms, hand-derived). */
export interface Jet3 { r: Vec3; d1: Vec3; d2: Vec3; d3: Vec3 }
export type CurveId = 'circle' | 'helix' | 'trefoil' | 'viviani' | 'ellipse' | 'twisted' | 'inflect';

export interface CurveDef {
  id: CurveId; en: string; es: string;
  range: [number, number];
  closed: boolean;
  planar: boolean;
  /** (t, a, b): a = radius / x-semi-axis, b = pitch (helix only) */
  jet: (t: number, a: number, b: number) => Jet3;
}

const { sin, cos } = Math;

export const CURVES: Record<CurveId, CurveDef> = {
  circle: { id: 'circle', en: 'Circle', es: 'Círculo', range: [0, 2 * Math.PI], closed: true, planar: true,
    jet: (t, a) => ({ r: [a * cos(t), a * sin(t), 0], d1: [-a * sin(t), a * cos(t), 0], d2: [-a * cos(t), -a * sin(t), 0], d3: [a * sin(t), -a * cos(t), 0] }) },
  helix: { id: 'helix', en: 'Helix', es: 'Hélice', range: [0, 4 * Math.PI], closed: false, planar: false,
    jet: (t, a, b) => ({ r: [a * cos(t), a * sin(t), b * t], d1: [-a * sin(t), a * cos(t), b], d2: [-a * cos(t), -a * sin(t), 0], d3: [a * sin(t), -a * cos(t), 0] }) },
  trefoil: { id: 'trefoil', en: 'Trefoil knot', es: 'Nudo trébol', range: [0, 2 * Math.PI], closed: true, planar: false,
    jet: (t) => ({
      r: [sin(t) + 2 * sin(2 * t), cos(t) - 2 * cos(2 * t), -sin(3 * t)],
      d1: [cos(t) + 4 * cos(2 * t), -sin(t) + 4 * sin(2 * t), -3 * cos(3 * t)],
      d2: [-sin(t) - 8 * sin(2 * t), -cos(t) + 8 * cos(2 * t), 9 * sin(3 * t)],
      d3: [-cos(t) - 16 * cos(2 * t), sin(t) - 16 * sin(2 * t), 27 * cos(3 * t)],
    }) },
  viviani: { id: 'viviani', en: "Viviani's curve", es: 'Curva de Viviani', range: [0, 4 * Math.PI], closed: true, planar: false,
    jet: (t) => ({
      r: [1 + cos(t), sin(t), 2 * sin(t / 2)],
      d1: [-sin(t), cos(t), cos(t / 2)],
      d2: [-cos(t), -sin(t), -0.5 * sin(t / 2)],
      d3: [sin(t), -cos(t), -0.25 * cos(t / 2)],
    }) },
  ellipse: { id: 'ellipse', en: 'Ellipse', es: 'Elipse', range: [0, 2 * Math.PI], closed: true, planar: true,
    jet: (t, a) => ({ r: [a * cos(t), sin(t), 0], d1: [-a * sin(t), cos(t), 0], d2: [-a * cos(t), -sin(t), 0], d3: [a * sin(t), -cos(t), 0] }) },
  twisted: { id: 'twisted', en: 'Twisted cubic', es: 'Cúbica alabeada', range: [-1.5, 1.5], closed: false, planar: false,
    jet: (t) => ({ r: [t, t * t, t ** 3], d1: [1, 2 * t, 3 * t * t], d2: [0, 2, 6 * t], d3: [0, 0, 6] }) },
  // y = x^3: planar with an inflection at t = 0 where κ = 0 and the frame is undefined
  inflect: { id: 'inflect', en: 'Inflection (y = x³)', es: 'Inflexión (y = x³)', range: [-1.5, 1.5], closed: false, planar: true,
    jet: (t) => ({ r: [t, t ** 3, 0], d1: [1, 3 * t * t, 0], d2: [0, 6 * t, 0], d3: [0, 6, 0] }) },
};

export interface Frame { speed: number; kappa: number; tau: number; defined: boolean; T: Vec3; N: Vec3; B: Vec3 }

/** κ below this: the curve is straight to working precision, so N, B and τ are undefined. */
export const KAPPA_EPS = 1e-3;

/** κ = |r'×r''|/|r'|³, τ = (r'×r'')·r'''/|r'×r''|², T = r'/|r'|, B = r'×r''/|r'×r''|, N = B×T. */
export function frenet({ d1, d2, d3 }: Jet3): Frame {
  const speed = norm(d1);
  const c = cross(d1, d2), cn = norm(c);
  const T = scale(d1, 1 / speed);
  const kappa = cn / speed ** 3;
  if (kappa < KAPPA_EPS) return { speed, kappa, tau: NaN, defined: false, T, N: [0, 0, 0], B: [0, 0, 0] };
  const B = scale(c, 1 / cn);
  return { speed, kappa, tau: dot(c, d3) / (cn * cn), defined: true, T, N: cross(B, T), B };
}

/** Arc length from range[0] to t (composite Simpson). */
export function arcLength(def: CurveDef, a: number, b: number, t: number, n = 400): number {
  const t0 = def.range[0];
  if (t <= t0) return 0;
  const h = (t - t0) / n, sp = (x: number) => norm(def.jet(x, a, b).d1);
  let s = sp(t0) + sp(t);
  for (let i = 1; i < n; i++) s += sp(t0 + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Central-difference check helper (used by tests): derivative of a vector function. */
export const fdVec = (f: (t: number) => Vec3, t: number, h = 1e-5): Vec3 => scale(sub(f(t + h), f(t - h)), 1 / (2 * h));
