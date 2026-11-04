// Pure helpers shared by PenroseScene and PenrosePanel (probe event, infalling observer, units).
import {
  diagramToKruskal, infallKruskal, kruskalToDiagram, lightConeAtDiagram, regionOf, rOfUV, tOfUV,
  type LightCone, type Pt, type Region,
} from '../math/penrose';
import { BODIES, C } from '../data/celestial';

const PI = Math.PI;
export type Space = 'minkowski' | 'schwarzschild';
export interface Probe { region: Region | null; r: number; t: number; U: number | null; V: number | null; cone: LightCone }

const inside = (r: number, t: number) => r >= -1e-9 && Math.abs(t) + r < PI;
/** Straight null segment from (r,t) moving (d, dt) until it hits the origin R = 0 (if d < 0) or the boundary |T|+R = pi. */
function reach(r: number, t: number, d: number, dt: number): Pt {
  let s = 0;
  while (inside(r + d * (s + 0.002), t + dt * (s + 0.002)) && s < 8) s += 0.002;
  return [r + d * s, t + dt * s];
}
/** Radial null rays through a Minkowski diagram point (R, T); rays reaching the origin reflect outward. */
function minkCone(R: number, T: number): LightCone {
  const ray = (dr: number, dt: number): Pt[] => {
    const a = reach(R, T, dr, dt), out: Pt[] = [[R, T], a];
    if (dr < 0 && a[0] < 1e-2) out.push(reach(a[0], a[1], 1, dt));
    return out;
  };
  return { futureRight: ray(1, 1), futureLeft: ray(-1, 1), pastRight: ray(1, -1), pastLeft: ray(-1, -1) };
}

/** Probe event at diagram point (X, T): Schwarzschild/Kruskal (M = 1) or Minkowski (X = R). null if outside the diagram or beyond the singularity. */
export function probeAt(space: Space, X: number, T: number): Probe | null {
  if (space === 'minkowski') {
    if (!inside(X, T)) return null;
    const u = Math.tan((T - X) / 2), v = Math.tan((T + X) / 2);
    return { region: null, r: (v - u) / 2, t: (u + v) / 2, U: null, V: null, cone: minkCone(X, T) };
  }
  const k = diagramToKruskal(X, T);
  if (!k || k[0] * k[1] >= 1) return null;
  const [U, V] = k;
  return { region: regionOf(U, V), r: rOfUV(U, V), t: tOfUV(U, V), U, V, cone: lightConeAtDiagram(X, T)! };
}

/** Infalling observer from rest at r0 (M = 1) at cycloid parameter eta in [0, pi]. */
export function infallState(r0: number, progress: number) {
  const eta = Math.min(1, Math.max(0, progress)) * PI;
  const k = Math.sqrt(r0 ** 3 / 8);
  const [U, V] = infallKruskal(eta, r0);
  return { eta, tau: k * (eta + Math.sin(eta)), r: (r0 / 2) * (1 + Math.cos(eta)), U, V, pt: kruskalToDiagram(U, V), t: tOfUV(U, V) };
}

/** Mass of a black hole in seconds: GM/c^3. */
export const BLACK_HOLES = BODIES.filter((b) => b.kind === 'black hole');
export const massSeconds = (id: string) => { const b = BLACK_HOLES.find((x) => x.id === id); return b ? b.gm / C ** 3 : null; };
export function fmtDuration(s: number, es = false): string {
  const a = Math.abs(s);
  if (a < 1e-3) return `${(s * 1e6).toPrecision(3)} µs`;
  if (a < 1) return `${(s * 1e3).toPrecision(3)} ms`;
  if (a < 120) return `${s.toPrecision(3)} s`;
  if (a < 7200) return `${(s / 60).toPrecision(3)} min`;
  if (a < 172800) return `${(s / 3600).toPrecision(3)} h`;
  if (a < 3.15576e7 * 2) return `${(s / 86400).toPrecision(3)} ${es ? 'días' : 'days'}`;
  return `${(s / 3.15576e7).toPrecision(3)} ${es ? 'años' : 'years'}`;
}
