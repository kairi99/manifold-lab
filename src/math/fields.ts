import type { FieldZero, FlowLine, Mat2, ParamCurve, Surface, Vec2, Vec3, VectorField } from './types';
import { cross, dot, normalize, scale, sub, det2 } from './vec';
import { toWorld } from './metric';
import { makeSphere, makeTorus, saddle, paraboloid } from './surfaces';

const TAU = 2 * Math.PI;
const sphere = makeSphere();
const torus = makeTorus();

/* ---------- presets ---------- */

/** chart circle of radius rho around c, CCW in the chart */
const circle = (c: Vec2, rho = 0.15, dir = 1): ParamCurve => ({
  point: (t) => [c[0] + rho * Math.cos(TAU * t), c[1] + dir * rho * Math.sin(TAU * t)],
  velocity: (t) => [-rho * TAU * Math.sin(TAU * t), dir * rho * TAU * Math.cos(TAU * t)],
});

/** latitude loop theta=th, phi running with sign dir */
const latitude = (th: number, dir: number): ParamCurve => ({
  point: (t) => [th, dir * TAU * t],
  velocity: () => [0, dir * TAU],
});

const zero = (s: Surface, name: string, c: Vec2, expectedIndex: number, loop?: ParamCurve): FieldZero => ({
  name, point: s.position(c[0], c[1]), loop: loop ?? circle(c), expectedIndex,
});

const POLE = 0.15;
// With normal ∂θ×∂φ (inward on this sphere), φ increasing is CCW at the north cap, clockwise at the south cap.
const poleN = (): FieldZero => zero(sphere, 'north pole', [0, 0], 1, latitude(POLE, 1));
const poleS = (): FieldZero => zero(sphere, 'south pole', [Math.PI, 0], 1, latitude(Math.PI - POLE, -1));

const sphereFields = (): VectorField[] => {
  const h = Math.PI / 2;
  return [
    { id: 'Lz', name: 'L_z: rotation about the polar (vertical) axis', latex: String.raw`X=\partial_\varphi`, killing: true,
      X: () => [0, 1], zeros: [poleN(), poleS()] },
    { id: 'Lx', name: 'L_x: rotation about an equatorial axis (x)', latex: String.raw`X=-\sin\varphi\,\partial_\theta-\cot\theta\cos\varphi\,\partial_\varphi`, killing: true,
      X: (t, p) => [-Math.sin(p), -Math.cos(p) / Math.tan(t)],
      zeros: [zero(sphere, '+x axis', [h, 0], 1), zero(sphere, '-x axis', [h, Math.PI], 1)] },
    { id: 'Ly', name: 'L_y: rotation about the other equatorial axis (y)', latex: String.raw`X=\cos\varphi\,\partial_\theta-\cot\theta\sin\varphi\,\partial_\varphi`, killing: true,
      X: (t, p) => [Math.cos(p), -Math.sin(p) / Math.tan(t)],
      zeros: [zero(sphere, '+z axis', [h, h], 1), zero(sphere, '-z axis', [h, 3 * h], 1)] },
    { id: 'gradHeight', name: 'gradient of height', latex: String.raw`X=\nabla\cos\theta=-\sin\theta\,\partial_\theta`, killing: false,
      X: (t) => [-Math.sin(t), 0], zeros: [poleN(), poleS()] },
    { id: 'dipole', name: 'dipole (stereographic ∂ₓ)', latex: String.raw`X=-2\sin^2\tfrac\theta2\cos\varphi\,\partial_\theta-\tan\tfrac\theta2\sin\varphi\,\partial_\varphi`, killing: false,
      X: (t, p) => [-2 * Math.sin(t / 2) ** 2 * Math.cos(p), -Math.sin(p) * Math.tan(t / 2)],
      zeros: [zero(sphere, 'north pole (double zero)', [0, 0], 2, latitude(POLE, 1))] },
  ];
};

const torusFields = (): VectorField[] => [
  { id: 'du', name: 'longitude flow', latex: String.raw`X=\partial_u`, killing: true, X: () => [1, 0], zeros: [] },
  { id: 'dv', name: 'meridian flow', latex: String.raw`X=\partial_v`, killing: false, X: () => [0, 1], zeros: [] },
  { id: 'gradSide', name: 'gradient of x', latex: String.raw`X=\nabla\big((R+r\cos v)\cos u\big)=-\tfrac{\sin u}{R+r\cos v}\partial_u-\tfrac{\sin v\cos u}{r}\partial_v`, killing: false,
    X: (u, v) => [-Math.sin(u) / (1 + 0.4 * Math.cos(v)), -Math.sin(v) * Math.cos(u) / 0.4],
    zeros: [
      zero(torus, 'max', [0, 0], 1), zero(torus, 'min', [Math.PI, 0], 1),
      zero(torus, 'saddle', [0, Math.PI], -1), zero(torus, 'saddle', [Math.PI, Math.PI], -1),
    ] },
];

const graphFields = (s: Surface, fx: (x: number, y: number) => number, fy: (x: number, y: number) => number, gradIdx: number, rotKilling: boolean): VectorField[] => [
  { id: 'grad', name: 'gradient of f', latex: String.raw`X=g^{-1}df=\frac{(f_x,f_y)}{1+|\nabla f|^2}`, killing: false,
    X: (x, y) => { const a = fx(x, y), b = fy(x, y), w = 1 + a * a + b * b; return [a / w, b / w]; },
    zeros: [zero(s, 'origin', [0, 0], gradIdx)] },
  { id: 'rot', name: 'rotation in the chart', latex: String.raw`X=-y\,\partial_x+x\,\partial_y`, killing: rotKilling,
    X: (x, y) => [-y, x], zeros: [zero(s, 'origin', [0, 0], 1)] },
];

export function fieldsFor(surfaceId: string): VectorField[] {
  switch (surfaceId) {
    case 'sphere': return sphereFields();
    case 'torus': return torusFields();
    case 'saddle': return graphFields(saddle, (x) => x, (_x, y) => -y, -1, false);
    case 'paraboloid': return graphFields(paraboloid, (x) => x, (_x, y) => y, 1, true);
    default: return [];
  }
}

/** Generic presets for a user surface: coordinate fields, gradient of height, and (non-periodic charts) rotation about the chart centre. */
export function customFields(s: Surface): VectorField[] {
  const [cu, cv] = s.coords;
  const { u: [u0, u1], v: [v0, v1], periodicU, periodicV } = s.domain;
  const out: VectorField[] = [
    { id: 'du', name: 'coordinate field ∂ᵤ', latex: String.raw`X=\partial_{${cu}}`, killing: false, X: () => [1, 0], zeros: [] },
    { id: 'dv', name: 'coordinate field ∂ᵥ', latex: String.raw`X=\partial_{${cv}}`, killing: false, X: () => [0, 1], zeros: [] },
    { id: 'grad', name: 'gradient of height z', latex: String.raw`X=\nabla z=g^{ij}\partial_j z\,\partial_i`, killing: false,
      X: (u, v) => { // height is the world-y component of the embedding; zeros (critical points) are not located
        const g = s.metric(u, v), a = s.du(u, v)[1], b = s.dv(u, v)[1], d = det2(g);
        return [(g[1][1] * a - g[0][1] * b) / d, (g[0][0] * b - g[0][1] * a) / d];
      }, zeros: [] },
  ];
  const c: Vec2 = [(u0 + u1) / 2, (v0 + v1) / 2];
  if (!periodicU && !periodicV && !s.singularAt?.(c[0], c[1])) {
    out.push({ id: 'rot', name: 'rotation about the chart centre', latex: String.raw`X=-(${cv}-${cv}_0)\,\partial_{${cu}}+(${cu}-${cu}_0)\,\partial_{${cv}}`, killing: false,
      X: (u, v) => [-(v - c[1]), u - c[0]],
      zeros: [zero(s, 'chart centre', c, 1, circle(c, 0.2 * Math.min(u1 - u0, v1 - v0) / 2))] });
  }
  return out;
}

export const EULER_CHARACTERISTIC: Record<string, number | null> = { sphere: 2, torus: 0, saddle: null, paraboloid: null };

/* ---------- flow ---------- */

const MAX_COORD_STEP = 0.02;
const STEP_TOL = 1e-10;
const MIN_STEP = 1e-13;

export function flow(s: Surface, X: VectorField, uv0: Vec2, T: number, dt = 0.02): FlowLine {
  const sg = T < 0 ? -1 : 1, len = Math.abs(T);
  const f = (q: Vec2): Vec2 => { const x = X.X(q[0], q[1]); return [sg * x[0], sg * x[1]]; };
  const rk4 = (y: Vec2, h: number): Vec2 => {
    const k1 = f(y);
    const k2 = f([y[0] + (h / 2) * k1[0], y[1] + (h / 2) * k1[1]]);
    const k3 = f([y[0] + (h / 2) * k2[0], y[1] + (h / 2) * k2[1]]);
    const k4 = f([y[0] + h * k3[0], y[1] + h * k3[1]]);
    return [0, 1].map((i) => y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as Vec2;
  };
  const d = s.domain;
  const inside = (q: Vec2) => q[0] >= d.u[0] && q[0] <= d.u[1] && q[1] >= d.v[0] && q[1] <= d.v[1];
  const wrapPeriodic = (q: Vec2): Vec2 => {
    const r: Vec2 = [...q];
    if (d.periodicU) { const p = d.u[1] - d.u[0]; r[0] -= p * Math.floor((r[0] - d.u[0]) / p); }
    if (d.periodicV) { const p = d.v[1] - d.v[0]; r[1] -= p * Math.floor((r[1] - d.v[0]) / p); }
    return r;
  };

  let y: Vec2 = [uv0[0], uv0[1]];
  const samples: FlowLine['samples'] = [{ t: 0, uv: [...y] }];
  const nIntervals = Math.max(1, Math.ceil(len / dt - 1e-9));
  let tt = 0;
  for (let n = 0; n < nIntervals; n++) {
    const target = Math.min(len, (n + 1) * dt);
    while (target - tt > 1e-12) {
      const v = f(y);
      const cmax = Math.max(Math.abs(v[0]), Math.abs(v[1]), 1e-12);
      let h = Math.min(target - tt, MAX_COORD_STEP / cmax);
      let next: Vec2;
      for (;;) {
        const full = rk4(y, h);
        const half = rk4(rk4(y, h / 2), h / 2);
        let err = 0;
        for (let i = 0; i < 2; i++) {
          const e = Math.abs(half[i] - full[i]);
          err = Number.isFinite(e) ? Math.max(err, e) : Infinity;
        }
        if (err <= STEP_TOL || h <= MIN_STEP) {
          next = half.map((x, i) => x + (x - full[i]) / 15) as Vec2;
          break;
        }
        h /= 2;
      }
      if (!inside(next)) {
        if (s.chartWrap) {
          const w = s.chartWrap({ uv: next, vel: f(next) });
          if (!w) return { samples, stopped: 'boundary' };
          next = [w.uv[0], w.uv[1]];
        }
        next = wrapPeriodic(next);
        if (!inside(next) && !s.chartWrap) return { samples, stopped: 'boundary' };
      }
      y = next;
      tt += h;
    }
    tt = target;
    samples.push({ t: sg * tt, uv: [...y] });
  }
  return { samples };
}

/* ---------- index ---------- */

export function fieldIndex(s: Surface, X: VectorField, z: FieldZero, n = 256): number {
  const pts = Array.from({ length: n }, (_, i) => z.loop.point(i / n));
  let nrm: Vec3 = [0, 0, 0];
  for (const p of pts) {
    const c = normalize(cross(s.du(p[0], p[1]), s.dv(p[0], p[1])));
    nrm = [nrm[0] + c[0], nrm[1] + c[1], nrm[2] + c[2]];
  }
  nrm = normalize(nrm);
  const a: Vec3 = Math.abs(nrm[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = normalize(sub(a, scale(nrm, dot(a, nrm))));
  const e2 = cross(nrm, e1);
  let prev = 0, total = 0;
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n];
    const w = toWorld(s, p[0], p[1], X.X(p[0], p[1]));
    const ang = Math.atan2(dot(w, e2), dot(w, e1));
    if (i > 0) {
      let da = ang - prev;
      da -= TAU * Math.round(da / TAU);
      total += da;
    }
    prev = ang;
  }
  return Math.round(total / TAU);
}

/* ---------- differential operators ---------- */

export function divergence(s: Surface, X: VectorField, u: number, v: number, h = 1e-5): number {
  const sq = (a: number, b: number) => Math.sqrt(det2(s.metric(a, b)));
  const F = (a: number, b: number): Vec2 => { const x = X.X(a, b), r = sq(a, b); return [r * x[0], r * x[1]]; };
  const d0 = (F(u + h, v)[0] - F(u - h, v)[0]) / (2 * h);
  const d1 = (F(u, v + h)[1] - F(u, v - h)[1]) / (2 * h);
  return (d0 + d1) / sq(u, v);
}

export function lieDerivativeMetric(s: Surface, X: VectorField, u: number, v: number, h = 1e-5): Mat2 {
  const g = s.metric(u, v), x = X.X(u, v);
  const dq = (k: number): [Vec2, Vec2, Mat2] => {
    const e: Vec2 = k === 0 ? [h, 0] : [0, h];
    const xp = X.X(u + e[0], v + e[1]), xm = X.X(u - e[0], v - e[1]);
    const gp = s.metric(u + e[0], v + e[1]), gm = s.metric(u - e[0], v - e[1]);
    return [xp, xm, gp.map((r, i) => r.map((_, j) => (r[j] - gm[i][j]) / (2 * h))) as Mat2];
  };
  const dX: number[][] = [[0, 0], [0, 0]]; // dX[i][k] = ∂_i X^k
  const dg: Mat2[] = [];
  for (let i = 0; i < 2; i++) {
    const [xp, xm, dgi] = dq(i);
    for (let k = 0; k < 2; k++) dX[i][k] = (xp[k] - xm[k]) / (2 * h);
    dg.push(dgi);
  }
  const L: Mat2 = [[0, 0], [0, 0]];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++)
    for (let k = 0; k < 2; k++) L[i][j] += x[k] * dg[k][i][j] + g[k][j] * dX[i][k] + g[i][k] * dX[j][k];
  return L;
}

export function lieBracket(X: VectorField, Y: VectorField, u: number, v: number, h = 1e-5): Vec2 {
  const J = (F: VectorField): number[][] => { // J[k][i] = ∂_i F^k
    const a = F.X(u + h, v), b = F.X(u - h, v), c = F.X(u, v + h), d = F.X(u, v - h);
    return [0, 1].map((k) => [(a[k] - b[k]) / (2 * h), (c[k] - d[k]) / (2 * h)]);
  };
  const x = X.X(u, v), y = Y.X(u, v), jx = J(X), jy = J(Y);
  return [0, 1].map((k) => x[0] * jy[k][0] + x[1] * jy[k][1] - y[0] * jx[k][0] - y[1] * jx[k][1]) as Vec2;
}

export function flowCommutator(s: Surface, X: VectorField, Y: VectorField, uv0: Vec2, t: number): { path: Vec2[]; gap: Vec2 } {
  const legs: [VectorField, number][] = [[X, t], [Y, t], [X, -t], [Y, -t]];
  const path: Vec2[] = [[...uv0]];
  let cur: Vec2 = [...uv0];
  for (const [F, T] of legs) {
    const fl = flow(s, F, cur, T, Math.abs(T) / 16);
    for (const smp of fl.samples.slice(1)) path.push(smp.uv);
    cur = fl.samples[fl.samples.length - 1].uv;
  }
  const gap: Vec2 = [cur[0] - uv0[0], cur[1] - uv0[1]];
  const dom = s.domain;
  if (dom.periodicU) { const p = dom.u[1] - dom.u[0]; gap[0] -= p * Math.round(gap[0] / p); }
  if (dom.periodicV) { const p = dom.v[1] - dom.v[0]; gap[1] -= p * Math.round(gap[1] / p); }
  return { path, gap };
}
