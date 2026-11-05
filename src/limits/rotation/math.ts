import type { Galaxy } from './data';

/** G in kpc (km/s)^2 / Msun. */
export const G = 4.30091e-6;
const KPC_M = 3.0856775814e19;
/** (km/s)^2 / kpc expressed in m/s^2. */
export const ACC_UNIT = 1e6 / KPC_M;
export const A0_DEFAULT = 1.2e-10;

export const sgnSq = (v: number) => v * Math.abs(v);

/** SPARC convention: Vgas, Vdisk, Vbul are given at Upsilon = 1; negative values mean repulsive contribution. */
export function vBar2(g: Galaxy, i: number, yd: number, yb: number): number {
  return sgnSq(g.vGas[i]) + yd * sgnSq(g.vDisk[i]) + yb * sgnSq(g.vBul[i]);
}

/** Point mass: V = sqrt(GM/r). */
export const vPoint = (M: number, r: number) => Math.sqrt((G * M) / r);

/** Pseudo-isothermal halo: rho = rho0 / (1 + (r/rc)^2), rho0 in Msun/kpc^3. */
export const v2Iso = (rho0: number, rc: number, r: number) => 4 * Math.PI * G * rho0 * rc * rc * (1 - (rc / r) * Math.atan(r / rc));
export const vInfIso = (rho0: number, rc: number) => Math.sqrt(4 * Math.PI * G * rho0 * rc * rc);

/** NFW halo: rho = rho_s / (x (1+x)^2), x = r/rs. */
export function v2Nfw(rhoS: number, rs: number, r: number): number {
  const x = r / rs;
  return (4 * Math.PI * G * rhoS * rs ** 3 * (Math.log1p(x) - x / (1 + x))) / r;
}
export const nfwDensity = (rhoS: number, rs: number, r: number) => rhoS / ((r / rs) * (1 + r / rs) ** 2);

/** NFW V^2 from M(<r) by Simpson integration of 4 pi rho r^2 (independent check of the closed form). */
export function v2NfwNumeric(rhoS: number, rs: number, r: number, n = 2000): number {
  const f = (s: number) => 4 * Math.PI * nfwDensity(rhoS, rs, s) * s * s;
  const h = r / n;
  let sum = f(1e-12) + f(r);
  for (let k = 1; k < n; k++) sum += f(k * h) * (k % 2 ? 4 : 2);
  return (G * ((sum * h) / 3)) / r;
}

/** Radial acceleration relation (McGaugh, Lelli & Schombert 2016): g_obs = g_bar / (1 - exp(-sqrt(g_bar/a0))). SI units. */
export const rar = (gBar: number, a0: number) => (gBar <= 0 ? 0 : gBar / (1 - Math.exp(-Math.sqrt(gBar / a0))));

/** MOND speed from the baryonic V^2 (km/s)^2 at radius r kpc. a0 in m/s^2. */
export function vMond(vb2: number, r: number, a0: number): number {
  if (vb2 <= 0) return 0;
  const gBar = (vb2 / r) * ACC_UNIT;
  return Math.sqrt((rar(gBar, a0) / ACC_UNIT) * r);
}

export type HaloKind = 'iso' | 'nfw';
export const v2Halo = (k: HaloKind, rho: number, rs: number, r: number) => (k === 'iso' ? v2Iso(rho, rs, r) : v2Nfw(rho, rs, r));

export interface Params { yd: number; yb: number; halo: HaloKind; logRho: number; rs: number; a0: number }
export type Model = 'obs' | 'bar' | 'halo' | 'mond';

export const vBarAt = (g: Galaxy, i: number, p: Params) => Math.sqrt(Math.max(0, vBar2(g, i, p.yd, p.yb)));
export const vHaloTotAt = (g: Galaxy, i: number, p: Params) => Math.sqrt(Math.max(0, vBar2(g, i, p.yd, p.yb) + v2Halo(p.halo, 10 ** p.logRho, p.rs, g.r[i])));
export const vMondAt = (g: Galaxy, i: number, p: Params) => vMond(vBar2(g, i, p.yd, p.yb), g.r[i], p.a0);

/** Linear interpolation of a per-point series at radius r (0 at r=0, flat beyond the last point). */
export function interp(rs: number[], ys: number[], r: number): number {
  if (r <= rs[0]) return (ys[0] * r) / rs[0];
  const n = rs.length;
  if (r >= rs[n - 1]) return ys[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rs[m] <= r) lo = m; else hi = m; }
  return ys[lo] + ((ys[hi] - ys[lo]) * (r - rs[lo])) / (rs[hi] - rs[lo]);
}

export function chi2(g: Galaxy, v: (i: number) => number): number {
  let s = 0;
  for (let i = 0; i < g.r.length; i++) s += ((v(i) - g.vObs[i]) / g.err[i]) ** 2;
  return s;
}
export const chi2Dof = (g: Galaxy, k: number, v: (i: number) => number) => chi2(g, v) / (g.r.length - k);

/** 2-D Nelder-Mead minimiser. */
export function nelderMead(f: (x: number[]) => number, x0: number[], step: number[], iters = 200): number[] {
  let s = [x0, [x0[0] + step[0], x0[1]], [x0[0], x0[1] + step[1]]].map((x) => ({ x, v: f(x) }));
  for (let it = 0; it < iters; it++) {
    s.sort((a, b) => a.v - b.v);
    const [b, , w] = s, m = s[1];
    const c = [(b.x[0] + m.x[0]) / 2, (b.x[1] + m.x[1]) / 2];
    const pt = (t: number) => [c[0] + t * (w.x[0] - c[0]), c[1] + t * (w.x[1] - c[1])];
    const xr = pt(-1), fr = f(xr);
    if (fr < b.v) { const xe = pt(-2), fe = f(xe); s[2] = fe < fr ? { x: xe, v: fe } : { x: xr, v: fr }; }
    else if (fr < m.v) s[2] = { x: xr, v: fr };
    else {
      const xc = pt(fr < w.v ? -0.5 : 0.5), fc = f(xc);
      if (fc < Math.min(fr, w.v)) s[2] = { x: xc, v: fc };
      else s = s.map((q, k) => (k === 0 ? q : (() => { const x = [(q.x[0] + b.x[0]) / 2, (q.x[1] + b.x[1]) / 2]; return { x, v: f(x) }; })()));
    }
  }
  s.sort((a, b) => a.v - b.v);
  return s[0].x;
}

/** Fit (log10 rho, r_s) of the chosen halo with Upsilons fixed: coarse grid, then Nelder-Mead. */
export function fitHalo(g: Galaxy, p: Params): { logRho: number; rs: number; chi2Dof: number } {
  const cost = (lr: number, lrs: number) => chi2(g, (i) => vHaloTotAt(g, i, { ...p, logRho: lr, rs: 10 ** lrs }));
  let best = { lr: 7, lrs: 0.5, c: Infinity };
  for (let lr = 4; lr <= 11; lr += 0.25) for (let lrs = -0.5; lrs <= 2; lrs += 0.1) {
    const c = cost(lr, lrs);
    if (c < best.c) best = { lr, lrs, c };
  }
  const x = nelderMead(([a, b]) => (b < -1 || b > 2.5 || a < 3 || a > 12 ? 1e30 : cost(a, b)), [best.lr, best.lrs], [0.3, 0.1]);
  return { logRho: x[0], rs: 10 ** x[1], chi2Dof: cost(x[0], x[1]) / (g.r.length - 2) };
}

/** First radius (kpc) where V_bar drops below half of V_obs, linearly interpolated; null if never. */
export function halfRadius(g: Galaxy, p: Params): number | null {
  for (let i = 0; i < g.r.length; i++) {
    const d = (j: number) => vBarAt(g, j, p) - 0.5 * g.vObs[j];
    if (d(i) < 0 && g.r[i] > 0.3 * g.r[g.r.length - 1]) {
      if (i === 0 || d(i - 1) < 0) continue;
      const t = d(i - 1) / (d(i - 1) - d(i));
      return g.r[i - 1] + t * (g.r[i] - g.r[i - 1]);
    }
  }
  return null;
}

/** Rough baryonic mass inside the last point, Newtonian spherical estimate V_bar^2 R / G (Msun). */
export const baryonMass = (g: Galaxy, p: Params) => {
  const i = g.r.length - 1;
  return (Math.max(0, vBar2(g, i, p.yd, p.yb)) * g.r[i]) / G;
};

/** Curve (km/s) driving the animation at radius r. */
export function modelSpeed(g: Galaxy, p: Params, m: Model, r: number): number {
  if (m === 'obs') return interp(g.r, g.vObs, r);
  const vb2 = interp(g.r, g.r.map((_, i) => vBar2(g, i, p.yd, p.yb)), r);
  if (m === 'bar') return Math.sqrt(Math.max(0, vb2));
  if (m === 'mond') return vMond(vb2, Math.max(r, 1e-3), p.a0);
  return Math.sqrt(Math.max(0, vb2 + v2Halo(p.halo, 10 ** p.logRho, p.rs, Math.max(r, 1e-3))));
}
