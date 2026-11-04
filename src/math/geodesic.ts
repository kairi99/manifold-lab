import type { GeodesicPath, GeodesicSample, Surface, Vec2 } from './types';

/** ü^k = −Γ^k_ij u̇^i u̇^j */
export function geodesicAccel(s: Surface, uv: Vec2, vel: Vec2): Vec2 {
  const G = s.christoffel(uv[0], uv[1]);
  const out: Vec2 = [0, 0];
  for (let k = 0; k < 2; k++) {
    let a = 0;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) a += G[k][i][j] * vel[i] * vel[j];
    out[k] = -a;
  }
  return out;
}

export function speed(s: Surface, uv: Vec2, vel: Vec2): number {
  const g = s.metric(uv[0], uv[1]);
  return Math.sqrt(g[0][0] * vel[0] * vel[0] + 2 * g[0][1] * vel[0] * vel[1] + g[1][1] * vel[1] * vel[1]);
}

/** Unit vector at `angle` from e1=∂_u/|∂_u| toward e2 (Gram–Schmidt of ∂_v). */
export function unitVelocity(s: Surface, uv: Vec2, angle: number): Vec2 {
  const g = s.metric(uv[0], uv[1]);
  const e1: Vec2 = [1 / Math.sqrt(g[0][0]), 0];
  const wn = Math.sqrt(g[1][1] - (g[0][1] * g[0][1]) / g[0][0]);
  const e2: Vec2 = [-g[0][1] / g[0][0] / wn, 1 / wn];
  const c = Math.cos(angle), sn = Math.sin(angle);
  return [c * e1[0] + sn * e2[0], c * e1[1] + sn * e2[1]];
}

/** Conserved Clairaut quantity for sphere / torus, else null. */
export function clairaut(s: Surface, uv: Vec2, vel: Vec2): number | null {
  const g = s.metric(uv[0], uv[1]);
  if (s.id === 'sphere') return g[1][1] * vel[1]; // R² sin²θ φ̇
  if (s.id === 'torus') return g[0][0] * vel[0]; // (R+r cos v)² u̇
  return null;
}

type State = [number, number, number, number];

function rk4(s: Surface, y: State, h: number): State {
  const f = (q: State): State => {
    const a = geodesicAccel(s, [q[0], q[1]], [q[2], q[3]]);
    return [q[2], q[3], a[0], a[1]];
  };
  const add = (q: State, k: State, c: number): State => [q[0] + c * k[0], q[1] + c * k[1], q[2] + c * k[2], q[3] + c * k[3]];
  const k1 = f(y);
  const k2 = f(add(y, k1, h / 2));
  const k3 = f(add(y, k2, h / 2));
  const k4 = f(add(y, k3, h));
  return [0, 1, 2, 3].map((i) => y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as State;
}

const MAX_COORD_STEP = 0.02;

export function geodesic(s: Surface, uv0: Vec2, vel0: Vec2, length: number, ds = 0.01): GeodesicPath {
  const n0 = speed(s, uv0, vel0);
  let y: State = [uv0[0], uv0[1], vel0[0] / n0, vel0[1] / n0];
  const samples: GeodesicSample[] = [];
  const emit = (arc: number) => samples.push({ s: arc, uv: [y[0], y[1]], vel: [y[2], y[3]] });
  const { domain: d } = s;
  const inside = (q: State) =>
    q[0] >= d.u[0] && q[0] <= d.u[1] && q[1] >= d.v[0] && q[1] <= d.v[1];
  const wrapPeriodic = (q: State): State => {
    const r: State = [...q];
    if (d.periodicU) { const p = d.u[1] - d.u[0]; r[0] -= p * Math.floor((r[0] - d.u[0]) / p); }
    if (d.periodicV) { const p = d.v[1] - d.v[0]; r[1] -= p * Math.floor((r[1] - d.v[0]) / p); }
    return r;
  };

  emit(0);
  const nIntervals = Math.max(1, Math.ceil(length / ds - 1e-9));
  let arc = 0;
  for (let n = 0; n < nIntervals; n++) {
    const target = Math.min(length, (n + 1) * ds);
    while (target - arc > 1e-12) {
      const cmax = Math.max(Math.abs(y[2]), Math.abs(y[3]), 1e-12);
      const h = Math.min(target - arc, Math.max(MAX_COORD_STEP / cmax, 1e-9));
      let next = rk4(s, y, h);
      if (!inside(next)) {
        const w = s.chartWrap?.({ uv: [next[0], next[1]], vel: [next[2], next[3]] });
        if (s.chartWrap) {
          if (!w) return { samples, stopped: 'boundary' };
          next = [w.uv[0], w.uv[1], w.vel[0], w.vel[1]];
        }
        next = wrapPeriodic(next);
        if (!inside(next) && !s.chartWrap) return { samples, stopped: 'boundary' };
      }
      y = next;
      arc += h;
    }
    arc = target;
    emit(arc);
  }
  return { samples };
}
