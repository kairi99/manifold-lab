// User-typed surfaces: X(u,v) parsed by ../expr, differentiated exactly with 2nd-order jets (n = 2).
import { evaluate, parse, toLatex, ExprError, type Ast } from '../expr';
import { constant, variable, type J, type Jet } from '../jet';
import type { ChartWrap, Christoffel, Mat2, Surface, Vec3 } from '../types';
import { cross, dot, norm } from '../vec';

export interface CustomSpec {
  name: string;
  /** parametric: X(u,v) = (x, y, z); graph: X = (u, v, f(u,v)) */
  mode: 'parametric' | 'graph';
  x: string; y: string; z: string; f: string;
  /** range endpoints are constant expressions, e.g. '2*pi' */
  uRange: [string, string];
  vRange: [string, string];
  periodicU: boolean;
  periodicV: boolean;
  /** Möbius-type seam: (u + P, v) ~ (u, −v), P = u-range length; needs a v-range symmetric about its centre. Not combined with periodicU. */
  twistU?: boolean;
  /** LaTeX names of the two coordinates (display only; expressions always use u and v) */
  coords: [string, string];
  /** slider-controlled constants a, b usable in expressions */
  params: { a: number; b: number };
  /** Euler characteristic if the surface is closed (enables the Gauss–Bonnet comparison) */
  euler?: number;
}

export interface Compiled { asts: [Ast, Ast, Ast]; u: [number, number]; v: [number, number] }

const FIELDS = { parametric: ['x', 'y', 'z'], graph: ['f'] } as const;

/** Parse everything; `errors` maps a field key (x, y, z, f, uMin, uMax, vMin, vMax, uRange, vRange) to a message with position. */
export function compileSpec(spec: CustomSpec): { c?: Compiled; errors: Record<string, string>; errorsEs: Record<string, string> } {
  const errors: Record<string, string> = {}, errorsEs: Record<string, string> = {};
  const tryParse = (key: string, src: string, names?: string[]): Ast | undefined => {
    try { return parse(src, names); } catch (e) {
      if (e instanceof ExprError) { errors[key] = e.message; errorsEs[key] = e.es; } else throw e;
    }
  };
  const ast: Record<string, Ast | undefined> = {};
  for (const k of FIELDS[spec.mode]) ast[k] = tryParse(k, spec[k]);
  const range = (key: string, r: [string, string]): [number, number] | undefined => {
    const lo = tryParse(`${key}Min`, r[0], []), hi = tryParse(`${key}Max`, r[1], []);
    if (!lo || !hi) return;
    const a = evaluate(lo, {}) as number, b = evaluate(hi, {}) as number;
    if (!(Number.isFinite(a) && Number.isFinite(b) && a < b)) { errors[`${key}Range`] = 'range must satisfy min < max'; errorsEs[`${key}Range`] = 'el rango debe cumplir mín < máx'; return; }
    return [a, b];
  };
  const u = range('u', spec.uRange), v = range('v', spec.vRange);
  if (Object.keys(errors).length) return { errors, errorsEs };
  const asts: [Ast, Ast, Ast] = spec.mode === 'graph' ? [parse('u'), parse('v'), ast.f!] : [ast.x!, ast.y!, ast.z!];
  return { c: { asts, u: u!, v: v! }, errors, errorsEs };
}

const lift = (j: J): Jet => (typeof j === 'number' ? constant(2, j) : j);
// display frame: math z-up -> three.js y-up by a proper rotation (x, y, z) -> (x, z, -y), so orientation is kept
const show = (p: Vec3): Vec3 => [p[0], p[2], -p[1]];

/**
 * Twisted identification (u + P, v) ~ (u, v0 + v1 − v): crossing the seam k times shifts u by kP and,
 * for odd k, reflects v and flips the v-component of the velocity. Leaving through the v edges ends the curve.
 */
export function twistWrap(ur: [number, number], vr: [number, number]): ChartWrap {
  const P = ur[1] - ur[0], vs = vr[0] + vr[1];
  return (st) => {
    const k = Math.floor((st.uv[0] - ur[0]) / P);
    let [u, v] = st.uv, [du, dv] = st.vel;
    if (k !== 0) {
      u -= k * P;
      if (Math.abs(k) % 2 === 1) { v = vs - v; dv = -dv; }
    }
    if (v < vr[0] || v > vr[1]) return null;
    return { uv: [u, v], vel: [du, dv] };
  };
}

/** Build a Surface from an already-valid spec; throws on parse errors. */
export function makeCustomSurface(spec: CustomSpec): Surface {
  const { c, errors } = compileSpec(spec);
  if (!c) throw new Error(Object.values(errors)[0]);
  const { a, b } = spec.params;
  const num = (u: number, v: number): Vec3 => c.asts.map((t) => evaluate(t, { u, v, a, b }) as number) as Vec3;
  const jets = (u: number, v: number) => {
    const env = { u: variable(2, 0, u), v: variable(2, 1, v), a, b };
    const J = c.asts.map((t) => lift(evaluate(t, env)));
    const col = (f: (j: Jet) => number): Vec3 => [f(J[0]), f(J[1]), f(J[2])];
    const Xu = col((j) => j.g[0]), Xv = col((j) => j.g[1]);
    const Xuu = col((j) => j.h[0]), Xuv = col((j) => j.h[1]), Xvv = col((j) => j.h[3]);
    const E = dot(Xu, Xu), F = dot(Xu, Xv), G = dot(Xv, Xv);
    const n = cross(Xu, Xv), area = norm(n);
    const singular = !(area > 1e-9 * (1 + Math.sqrt(E * G))) || ![E, F, G, area, ...Xuu, ...Xuv, ...Xvv].every(Number.isFinite);
    return { Xu, Xv, Xuu, Xuv, Xvv, E, F, G, n, area, singular };
  };
  const NAN2: Mat2 = [[NaN, NaN], [NaN, NaN]];
  const names = { u: spec.coords[0], v: spec.coords[1], a: 'a', b: 'b' };
  const tex = (t: Ast) => toLatex(t, names);
  const param = String.raw`\mathbf r(${spec.coords[0]},${spec.coords[1]})=\big(${tex(c.asts[0])},\ ${tex(c.asts[1])},\ ${tex(c.asts[2])}\big)`;
  return {
    id: 'custom',
    name: spec.name || 'Custom',
    coords: spec.coords,
    euler: spec.euler,
    domain: { u: c.u, v: c.v, periodicU: spec.periodicU, periodicV: spec.periodicV },
    chartWrap: spec.twistU && !spec.periodicU ? twistWrap(c.u, c.v) : undefined,
    position: (u, v) => show(num(u, v)),
    du: (u, v) => show(jets(u, v).Xu),
    dv: (u, v) => show(jets(u, v).Xv),
    metric: (u, v) => { const j = jets(u, v); return [[j.E, j.F], [j.F, j.G]]; },
    christoffel: (u, v): Christoffel => {
      const j = jets(u, v);
      if (j.singular) return [NAN2, NAN2];
      const det = j.E * j.G - j.F * j.F;
      const gi = [[j.G / det, -j.F / det], [-j.F / det, j.E / det]];
      const X = [j.Xu, j.Xv], H = [[j.Xuu, j.Xuv], [j.Xuv, j.Xvv]];
      const G = (k: number): Mat2 => {
        const m: Mat2 = [[0, 0], [0, 0]];
        for (let i = 0; i < 2; i++) for (let jj = 0; jj < 2; jj++)
          for (let l = 0; l < 2; l++) m[i][jj] += gi[k][l] * dot(H[i][jj], X[l]);
        return m;
      };
      return [G(0), G(1)];
    },
    gaussK: (u, v) => {
      const j = jets(u, v);
      if (j.singular) return NaN;
      const L = dot(j.Xuu, j.n) / j.area, M = dot(j.Xuv, j.n) / j.area, N = dot(j.Xvv, j.n) / j.area;
      return (L * N - M * M) / (j.E * j.G - j.F * j.F);
    },
    singularAt: (u, v) => jets(u, v).singular || !num(u, v).every(Number.isFinite),
    latex: {
      param,
      metric: String.raw`g_{ij}=\partial_i\mathbf r\cdot\partial_j\mathbf r`,
      christoffel: String.raw`\Gamma^k_{ij}=g^{kl}\,(\partial_i\partial_j\mathbf r\cdot\partial_l\mathbf r)`,
    },
  };
}

/* ---------- validation ---------- */

export interface Report {
  total: number;
  nonFinite: number;
  singular: number;
  errors: string[];
  /** Spanish twins of errors / warnings (same order) */
  errorsEs: string[];
  warningsEs: string[];
  warnings: string[];
}

const pretty = (x: number): string => {
  for (const d of [1, 2, 3, 4, 6]) {
    const k = Math.round((x * d) / Math.PI);
    if (Math.abs(x - (k * Math.PI) / d) < 1e-9 * (1 + Math.abs(x))) {
      if (k === 0) return '0';
      const n = Math.abs(k) === 1 ? '' : String(Math.abs(k));
      return `${k < 0 ? '-' : ''}${n}π${d > 1 ? `/${d}` : ''}`;
    }
  }
  return String(+x.toPrecision(3));
};

/** Sample an N x N grid (endpoints included) for non-finite values and degenerate points. */
export function validateSurface(s: Surface, N = 33): Report {
  const { u: du, v: dv } = s.domain;
  const us = Array.from({ length: N }, (_, i) => du[0] + ((du[1] - du[0]) * i) / (N - 1));
  const vs = Array.from({ length: N }, (_, i) => dv[0] + ((dv[1] - dv[0]) * i) / (N - 1));
  let nonFinite = 0, singular = 0, ex: [number, number] | null = null;
  const rowU = us.map(() => 0), colV = vs.map(() => 0);
  us.forEach((u, i) => vs.forEach((v, j) => {
    if (!s.position(u, v).every(Number.isFinite)) { nonFinite++; ex ??= [u, v]; }
    else if (s.singularAt?.(u, v)) { singular++; rowU[i]++; colV[j]++; }
  }));
  const errors: string[] = [], warnings: string[] = [], errorsEs: string[] = [], warningsEs: string[] = [];
  if (nonFinite) errors.push(`not finite at ${nonFinite} of ${N * N} sample points (first at u = ${pretty(ex![0])}, v = ${pretty(ex![1])}): shrink the ranges or change the expression`);
  if (nonFinite) errorsEs.push(`no es finita en ${nonFinite} de ${N * N} puntos de muestra (el primero en u = ${pretty(ex![0])}, v = ${pretty(ex![1])}): reduce los rangos o cambia la expresión`);
  if (singular) {
    const su = us.filter((_, i) => rowU[i] === N), sv = vs.filter((_, j) => colV[j] === N);
    const where = [
      su.length ? `u = ${su.map(pretty).join(', ')}` : '',
      sv.length ? `v = ${sv.map(pretty).join(', ')}` : '',
    ].filter(Boolean).join(' and ');
    warnings.push(where
      ? `coordinates degenerate at ${where} (∂ᵤr × ∂ᵥr = 0): fine for drawing, avoid placing p there; Γ and K are undefined there`
      : `${singular} of ${N * N} sample points are singular (∂ᵤr × ∂ᵥr ≈ 0); Γ and K are undefined there`);
    warningsEs.push(where
      ? `las coordenadas degeneran en ${where.replace(' and ', ' y ')} (∂ᵤr × ∂ᵥr = 0): sirve para dibujar, evita colocar p ahí; Γ y K no están definidas ahí`
      : `${singular} de ${N * N} puntos de muestra son singulares (∂ᵤr × ∂ᵥr ≈ 0); Γ y K no están definidas ahí`);
  }
  return { total: N * N, nonFinite, singular, errors, warnings, errorsEs, warningsEs };
}
