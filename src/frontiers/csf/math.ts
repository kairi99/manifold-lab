// Discrete curve-shortening flow on a closed polygon: dγ/dt = κN (N inward for a CCW curve).
export const N_PTS = 160;
export type PresetId = 'circle' | 'ellipse' | 'flower' | 'horseshoe';
export const PRESET_IDS: PresetId[] = ['circle', 'ellipse', 'flower', 'horseshoe'];

/** Interleaved x,y. */
export type Poly = Float64Array;
const n = (p: Poly) => p.length / 2;

export function signedArea(p: Poly): number {
  let a = 0;
  for (let i = 0, m = n(p); i < m; i++) { const j = (i + 1) % m; a += p[2 * i] * p[2 * j + 1] - p[2 * j] * p[2 * i + 1]; }
  return a / 2;
}
export function length(p: Poly): number {
  let L = 0;
  for (let i = 0, m = n(p); i < m; i++) { const j = (i + 1) % m; L += Math.hypot(p[2 * j] - p[2 * i], p[2 * j + 1] - p[2 * i + 1]); }
  return L;
}
export const isoperimetric = (p: Poly) => (4 * Math.PI * Math.abs(signedArea(p))) / length(p) ** 2;

/** Curvature vector κN at each vertex: (t_i − t_{i−1}) / ((l_{i−1}+l_i)/2), t = unit edge tangents. */
export function curvatureVectors(p: Poly): Float64Array {
  const m = n(p), tx = new Float64Array(m), ty = new Float64Array(m), l = new Float64Array(m), k = new Float64Array(2 * m);
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m, dx = p[2 * j] - p[2 * i], dy = p[2 * j + 1] - p[2 * i + 1];
    l[i] = Math.hypot(dx, dy) || 1e-300; tx[i] = dx / l[i]; ty[i] = dy / l[i];
  }
  for (let i = 0; i < m; i++) {
    const h = (i + m - 1) % m, w = (l[h] + l[i]) / 2;
    k[2 * i] = (tx[i] - tx[h]) / w; k[2 * i + 1] = (ty[i] - ty[h]) / w;
  }
  return k;
}
/** Signed curvature per vertex (positive = turning left, i.e. convex for a CCW curve). */
export function curvatures(p: Poly): Float64Array {
  const m = n(p), kv = curvatureVectors(p), out = new Float64Array(m);
  for (let i = 0; i < m; i++) {
    const a = (i + m - 1) % m, b = (i + 1) % m;
    const sgn = Math.sign((p[2 * i] - p[2 * a]) * (p[2 * b + 1] - p[2 * i + 1]) - (p[2 * i + 1] - p[2 * a + 1]) * (p[2 * b] - p[2 * i]));
    out[i] = sgn * Math.hypot(kv[2 * i], kv[2 * i + 1]);
  }
  return out;
}
export const maxAbsCurvature = (p: Poly) => { let m = 0; for (const k of curvatures(p)) m = Math.max(m, Math.abs(k)); return m; };

/** CCW polygon is convex iff every turn is left (small tolerance for round-off). */
export function isConvex(p: Poly, tol = 1e-9): boolean {
  const m = n(p);
  for (let i = 0; i < m; i++) {
    const a = (i + m - 1) % m, b = (i + 1) % m;
    if ((p[2 * i] - p[2 * a]) * (p[2 * b + 1] - p[2 * i + 1]) - (p[2 * i + 1] - p[2 * a + 1]) * (p[2 * b] - p[2 * i]) < -tol) return false;
  }
  return true;
}

/** True when no two non-adjacent edges cross (O(N²)). */
export function isEmbedded(p: Poly): boolean {
  const m = n(p);
  const cr = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let i = 0; i < m; i++) {
    const i2 = (i + 1) % m;
    for (let j = i + 2; j < m; j++) {
      const j2 = (j + 1) % m;
      if (j2 === i) continue;
      const [ax, ay, bx, by, cx, cy, dx, dy] = [p[2 * i], p[2 * i + 1], p[2 * i2], p[2 * i2 + 1], p[2 * j], p[2 * j + 1], p[2 * j2], p[2 * j2 + 1]];
      if (cr(ax, ay, bx, by, cx, cy) * cr(ax, ay, bx, by, dx, dy) < 0 && cr(cx, cy, dx, dy, ax, ay) * cr(cx, cy, dx, dy, bx, by) < 0) return false;
    }
  }
  return true;
}

/** Resample a closed polygon to m vertices equally spaced in arc length. `smooth`: Catmull–Rom between vertices instead of chords (chords cut corners and bleed area; assumes near-uniform spacing). */
export function resample(p: Poly, m = n(p), smooth = false): Poly {
  const c = n(p), cum = new Float64Array(c + 1);
  for (let i = 0; i < c; i++) { const j = (i + 1) % c; cum[i + 1] = cum[i] + Math.hypot(p[2 * j] - p[2 * i], p[2 * j + 1] - p[2 * i + 1]); }
  const out = new Float64Array(2 * m), L = cum[c];
  let e = 0;
  for (let k = 0; k < m; k++) {
    const s = (k * L) / m;
    while (e < c - 1 && cum[e + 1] <= s) e++;
    const j = (e + 1) % c, u = (s - cum[e]) / (cum[e + 1] - cum[e] || 1);
    if (smooth) {
      const a = (e + c - 1) % c, b = (e + 2) % c, u2 = u * u, u3 = u2 * u;
      for (let d = 0; d < 2; d++) out[2 * k + d] = 0.5 * (2 * p[2 * e + d] + (p[2 * j + d] - p[2 * a + d]) * u + (2 * p[2 * a + d] - 5 * p[2 * e + d] + 4 * p[2 * j + d] - p[2 * b + d]) * u2 + (3 * p[2 * e + d] - p[2 * a + d] - 3 * p[2 * j + d] + p[2 * b + d]) * u3);
    } else { out[2 * k] = p[2 * e] + u * (p[2 * j] - p[2 * e]); out[2 * k + 1] = p[2 * e + 1] + u * (p[2 * j + 1] - p[2 * e + 1]); }
  }
  return out;
}
const ccw = (p: Poly): Poly => {
  if (signedArea(p) >= 0) return p;
  const m = n(p), q = new Float64Array(2 * m);
  for (let i = 0; i < m; i++) { q[2 * i] = p[2 * (m - 1 - i)]; q[2 * i + 1] = p[2 * (m - 1 - i) + 1]; }
  return q;
};

function sample(f: (t: number) => [number, number], m = 800): Poly {
  const p = new Float64Array(2 * m);
  for (let i = 0; i < m; i++) { const [x, y] = f((2 * Math.PI * i) / m); p[2 * i] = x; p[2 * i + 1] = y; }
  return p;
}
function horseshoe(): Poly {
  const R = 1, w = 0.3, a0 = Math.PI / 4, a1 = (7 * Math.PI) / 4, pts: number[] = [], K = 200;
  const push = (x: number, y: number) => pts.push(x, y);
  for (let i = 0; i <= K; i++) { const f = a0 + ((a1 - a0) * i) / K; push((R + w) * Math.cos(f), (R + w) * Math.sin(f)); }
  for (let i = 1; i < 40; i++) { const s = a1 + (Math.PI * i) / 40; push(R * Math.cos(a1) + w * Math.cos(s), R * Math.sin(a1) + w * Math.sin(s)); }
  for (let i = 0; i <= K; i++) { const f = a1 - ((a1 - a0) * i) / K; push((R - w) * Math.cos(f), (R - w) * Math.sin(f)); }
  for (let i = 1; i < 40; i++) { const s = a0 + Math.PI + (Math.PI * i) / 40; push(R * Math.cos(a0) + w * Math.cos(s), R * Math.sin(a0) + w * Math.sin(s)); }
  return new Float64Array(pts);
}
/** Unit-ish initial curves, CCW, N_PTS equally spaced vertices. */
export function preset(id: PresetId): Poly {
  const raw = id === 'circle' ? sample((t) => [Math.cos(t), Math.sin(t)])
    : id === 'ellipse' ? sample((t) => [1.4 * Math.cos(t), 0.7 * Math.sin(t)])
    : id === 'flower' ? sample((t) => { const r = 1 + 0.3 * Math.cos(5 * t); return [r * Math.cos(t), r * Math.sin(t)]; })
    : horseshoe();
  return resample(ccw(raw), N_PTS);
}

/** Close, resample and validate a freehand polyline. Returns null when it is degenerate or self-intersects. */
export function fromFreehand(pts: [number, number][]): Poly | null {
  if (pts.length < 8) return null;
  const raw = new Float64Array(2 * pts.length);
  pts.forEach(([x, y], i) => { raw[2 * i] = x; raw[2 * i + 1] = y; });
  const p = ccw(resample(raw, N_PTS));
  return Math.abs(signedArea(p)) < 1e-3 || !isEmbedded(p) ? null : p;
}

export type Flow = { p: Poly; t: number; A0: number; L0: number; T0: number; initial: Poly; snaps: Poly[]; nextSnap: number; steps: number; rate: number; mark: { t: number; A: number } };
export function makeFlow(p: Poly): Flow {
  const A0 = signedArea(p);
  return { p, t: 0, A0, L0: length(p), T0: A0 / (2 * Math.PI), initial: p.slice(), snaps: [], nextSnap: 1, steps: 0, rate: -2 * Math.PI, mark: { t: 0, A: A0 } };
}
/** The flow is "extinct" once the area is below this fraction of A₀ (explicit scheme loses accuracy near the point). */
export const STOP_FRACTION = 0.01;
export const extinct = (f: Flow) => signedArea(f.p) < STOP_FRACTION * f.A0;
/** Extinction time estimated from the stop state: t + A/2π (exact for dA/dt = −2π). */
export const extinctionTime = (f: Flow) => f.t + signedArea(f.p) / (2 * Math.PI);

function hMin(p: Poly): number {
  let h = Infinity;
  for (let i = 0, m = n(p); i < m; i++) { const j = (i + 1) % m; h = Math.min(h, Math.hypot(p[2 * j] - p[2 * i], p[2 * j + 1] - p[2 * i + 1])); }
  return h;
}
/** One explicit Euler step, dt = 0.2·h_min²; vertices re-equalised every 10 steps (tangential motion, shape unchanged). */
export function step(f: Flow): void {
  const kv = curvatureVectors(f.p), dt = 0.2 * hMin(f.p) ** 2;
  for (let i = 0; i < f.p.length; i++) f.p[i] += dt * kv[i];
  f.t += dt; f.steps++;
  if (f.steps % 10 === 0) f.p = resample(f.p, n(f.p), true);
  const w = 0.01 * f.T0;
  if (f.t - f.mark.t >= w) { const A = signedArea(f.p); f.rate = (A - f.mark.A) / (f.t - f.mark.t); f.mark = { t: f.t, A }; }
  if (f.snaps.length < 4 && f.t >= (f.nextSnap * f.T0) / 5) { f.snaps.push(f.p.slice()); f.nextSnap++; }
}
/** Advance by simulated time dT (capped by maxSteps); stops at extinction. */
export function advance(f: Flow, dT: number, maxSteps = 400): void {
  const end = f.t + dT;
  for (let s = 0; s < maxSteps && f.t < end && !extinct(f); s++) step(f);
}
