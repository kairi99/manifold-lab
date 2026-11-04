// Penrose / Kruskal diagrams. G = c = 1; Schwarzschild mass M (default 1, horizon r = 2M).
// All curves are polylines of [x, y] = [X, T] (horizontal, vertical) in diagram coordinates.
//
// Conventions
//  Minkowski:  u = t-r, v = t+r, T = atan v + atan u, R = atan v - atan u (not halved).
//              So R in [0, pi], T in (-pi, pi), |T| + R < pi. i0 = (R,T) = (pi, 0), i+ = (0, pi), i- = (0, -pi),
//              scri+ : T = pi - R, scri- : T = R - pi.
//  Schwarzschild: Ũ = atan U, Ṽ = atan V, T = Ũ + Ṽ, X = Ṽ - Ũ.
//              Region I (exterior, right): U<0<V, X>0.  II (black hole, top): U,V>0.
//              III (other exterior, left): V<0<U, X<0.  IV (white hole, bottom): U,V<0.
//              Horizons are the 45 deg lines U=0 and V=0; singularities UV=1 -> T = ±pi/2 (X in (-pi/2, pi/2)).
//              i0 = (±pi, 0), i+ = (±pi/2, pi/2), i- = (±pi/2, -pi/2) (right/left exterior).
export type Pt = [number, number];
export type Region = 'I' | 'II' | 'III' | 'IV';
const PI = Math.PI, HP = Math.PI / 2;

// ---------- Minkowski ----------
export function minkowskiMap(t: number, r: number): Pt {
  const u = Math.atan(t - r), v = Math.atan(t + r);
  return [v - u, v + u];
}
/** r = r0 worldline from i- to i+. */
export function minkowskiConstR(r0: number, n = 120): Pt[] {
  const pts: Pt[] = [[0, -PI]];
  for (let i = 1; i < n; i++) pts.push(minkowskiMap((r0 + 1) * Math.tan(-HP + (PI * i) / n), r0));
  return [...pts, [0, PI]];
}
/** t = t0 slice from the origin to i0. */
export function minkowskiConstT(t0: number, n = 120): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) pts.push(minkowskiMap(t0, (1 + Math.abs(t0)) * Math.tan((HP * i) / n)));
  return [...pts, [PI, 0]];
}

// ---------- Lambert W (principal branch) ----------
export function lambertW0(z: number): number {
  if (Number.isNaN(z) || z < -1 / Math.E) return z === -1 / Math.E ? -1 : NaN;
  if (z === 0) return 0;
  if (z === Infinity) return Infinity;
  let w: number;
  if (z < -0.25) { const p = Math.sqrt(Math.max(0, 2 * (Math.E * z + 1))); w = -1 + p - (p * p) / 3 + (11 / 72) * p ** 3; }
  else if (z < 3) w = Math.log1p(z) * (z > 0 ? 0.8 : 1);
  else { const l = Math.log(z); w = l - Math.log(l); }
  for (let i = 0; i < 60; i++) { // Halley
    const ew = Math.exp(w), f = w * ew - z;
    if (f === 0) break;
    const dw = f / (ew * (w + 1) - ((w + 2) * f) / (2 * w + 2));
    if (!Number.isFinite(dw)) break;
    w -= dw;
    if (Math.abs(dw) <= 1e-15 * (1 + Math.abs(w))) break;
  }
  return w;
}

// ---------- Kruskal-Szekeres ----------
/** (U,V) from Schwarzschild (t,r). Region defaults to I for r>2M and II for r<2M; pass III/IV for the mirror regions. */
export function kruskal(t: number, r: number, region?: Region, M = 1): Pt {
  const reg = region ?? (r > 2 * M ? 'I' : 'II');
  const x = r / (2 * M), s = Math.sqrt(Math.abs(x - 1));
  const eU = Math.exp((r - t) / (4 * M)), eV = Math.exp((r + t) / (4 * M));
  switch (reg) {
    case 'I': return [-s * eU, s * eV];
    case 'II': return [s * eU, s * eV];
    case 'III': return [s * eU, -s * eV];
    default: return [-s * eU, -s * eV];
  }
}
/** Areal radius from UV = (1 - r/2M) e^{r/2M}: r = 2M (1 + W0(-UV/e)). */
export const rOfUV = (U: number, V: number, M = 1) => 2 * M * (1 + lambertW0(-(U * V) / Math.E));
/** Schwarzschild t = 2M ln|V/U| (±Infinity on the horizons). */
export const tOfUV = (U: number, V: number, M = 1) => 2 * M * Math.log(Math.abs(V / U));
export function regionOf(U: number, V: number): Region {
  if (U * V < 0) return V > 0 ? 'I' : 'III';
  return V > 0 ? 'II' : 'IV';
}
/** Compactified diagram coordinates [X, T] of Kruskal (U,V). */
export function kruskalToDiagram(U: number, V: number): Pt {
  const a = Math.atan(U), b = Math.atan(V);
  return [b - a, b + a];
}
/** Inverse of kruskalToDiagram; null outside |Ũ|,|Ṽ| < pi/2. */
export function diagramToKruskal(X: number, T: number): Pt | null {
  const a = (T - X) / 2, b = (T + X) / 2;
  return Math.abs(a) < HP && Math.abs(b) < HP ? [Math.tan(a), Math.tan(b)] : null;
}
/** Diagram point of Schwarzschild (t,r) in the given region. */
export function schwarzschildMap(t: number, r: number, region?: Region, M = 1): Pt {
  const [U, V] = kruskal(t, r, region, M);
  return kruskalToDiagram(U, V);
}

// ---------- Curve generators ----------
/** Constant-r curve. Exterior (I/III): worldline i- to i+. Interior (II/IV): spacelike curve between the side corners. */
export function constR(r: number, region?: Region, M = 1, n = 240, tMax = 60 * M): Pt[] {
  const reg = region ?? (r > 2 * M ? 'I' : 'II');
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) pts.push(schwarzschildMap(tMax * (2 * i / n - 1), r, reg, M));
  const ext = reg === 'I' || reg === 'III', sx = reg === 'III' ? -1 : 1;
  const top = reg === 'IV' ? -1 : 1;
  const ends: [Pt, Pt] = ext ? [[sx * HP, -HP], [sx * HP, HP]] : [[-HP, top * HP], [HP, top * HP]];
  return [ends[0], ...pts, ends[1]];
}
/** Constant-t slice. I/III: bifurcation point to i0. II/IV: bifurcation point to the singularity. */
export function constT(t: number, region: Region = 'I', M = 1, n = 200): Pt[] {
  const pts: Pt[] = [];
  if (region === 'I' || region === 'III') {
    for (let i = 0; i < n; i++) { const q = i / n; pts.push(schwarzschildMap(t, 2 * M * (1 + (q / (1 - q)) ** 2 * 4), region, M)); }
    pts.push([region === 'I' ? PI : -PI, 0]);
  } else {
    for (let i = 0; i < n; i++) pts.push(schwarzschildMap(t, 2 * M * (1 - i / n), region, M));
    pts.push(schwarzschildMap(t, 1e-12 * M, region, M));
  }
  return pts;
}
/** Horizons U=0 (rising to the right) and V=0 (falling to the right) as full 45 deg lines. */
export const horizons = (): { U0: Pt[]; V0: Pt[] } => ({ U0: [[-HP, -HP], [HP, HP]], V0: [[HP, -HP], [-HP, HP]] });
export const singularities = (): { future: Pt[]; past: Pt[] } => ({ future: [[-HP, HP], [HP, HP]], past: [[-HP, -HP], [HP, -HP]] });
/** Null infinities: right exterior (I) and left exterior (III), plus the special points. */
export const nullInfinities = () => ({
  scriPlusRight: [[PI, 0], [HP, HP]] as Pt[], scriMinusRight: [[PI, 0], [HP, -HP]] as Pt[],
  scriPlusLeft: [[-PI, 0], [-HP, HP]] as Pt[], scriMinusLeft: [[-PI, 0], [-HP, -HP]] as Pt[],
  i0Right: [PI, 0] as Pt, i0Left: [-PI, 0] as Pt, iPlusRight: [HP, HP] as Pt, iMinusRight: [HP, -HP] as Pt,
  iPlusLeft: [-HP, HP] as Pt, iMinusLeft: [-HP, -HP] as Pt,
});

// ---------- Radial infall from rest ----------
export interface Infall {
  /** Diagram points [X,T] (regions I then II). */
  pts: Pt[]; eta: number[]; tau: number[];
  /** Total proper time to r=0, = pi sqrt(r0^3 / 8M). */
  tauSingularity: number;
  /** Cycloid parameter and proper time at the horizon crossing. */
  etaHorizon: number; tauHorizon: number;
  /** Kruskal V at the horizon crossing (finite), and Schwarzschild t from the closed form at eta (diverges there). */
  Vhorizon: number;
}
/** Schwarzschild t(eta) for radial infall from rest at r0 (exterior; diverges at the horizon). */
export function infallT(eta: number, r0: number, M = 1): number {
  const a = Math.sqrt(r0 / (2 * M) - 1), tn = Math.tan(eta / 2);
  return 2 * M * Math.log(Math.abs((a + tn) / (a - tn))) + 2 * M * a * (eta + (r0 / (4 * M)) * (eta + Math.sin(eta)));
}
/**
 * Kruskal (U,V) along the geodesic. Using x = r/2M, a = sqrt(r0/2M - 1): x-1 = (a^2 - tan^2(eta/2)) cos^2(eta/2),
 * so the horizon-singular log in t cancels analytically:
 * V = (a cos(eta/2) + sin(eta/2)) exp[(r + 2M a (eta + (r0/4M)(eta + sin eta)))/4M], U = (1-x) e^x / V.
 */
export function infallKruskal(eta: number, r0: number, M = 1): Pt {
  const a = Math.sqrt(r0 / (2 * M) - 1), r = (r0 / 2) * (1 + Math.cos(eta)), x = r / (2 * M);
  const V = (a * Math.cos(eta / 2) + Math.sin(eta / 2)) * Math.exp((r + 2 * M * a * (eta + (r0 / (4 * M)) * (eta + Math.sin(eta)))) / (4 * M));
  return [((1 - x) * Math.exp(x)) / V, V];
}
export function infallGeodesic(r0: number, M = 1, n = 200): Infall {
  const k = Math.sqrt((r0 ** 3) / (8 * M));
  const etaH = 2 * Math.atan(Math.sqrt(r0 / (2 * M) - 1));
  const eta: number[] = [], pts: Pt[] = [], tau: number[] = [];
  for (let i = 0; i <= n; i++) {
    const e = (PI * i) / n;
    eta.push(e); tau.push(k * (e + Math.sin(e)));
    const [U, V] = infallKruskal(e, r0, M);
    pts.push(kruskalToDiagram(U, V));
  }
  return { pts, eta, tau, tauSingularity: k * PI, etaHorizon: etaH, tauHorizon: k * (etaH + Math.sin(etaH)), Vhorizon: infallKruskal(etaH, r0, M)[1] };
}

// ---------- Light rays / cones ----------
/** Null line with one Kruskal coordinate fixed: `vary` goes from s0 toward ±infinity (dir) or the singularity UV=1. */
function nullLine(fixed: number, s0: number, dir: 1 | -1, asV: boolean, n: number): Pt[] {
  let end = dir * HP;
  if (fixed !== 0) { const sing = 1 / fixed; if (fixed * dir > 0 && (sing - s0) * dir > 0) end = Math.atan(sing); }
  const start = Math.atan(s0), out: Pt[] = [];
  if ((end - start) * dir < 0) return out;
  for (let i = 0; i <= n; i++) {
    const w = Math.tan(start + ((end - start) * i) / n);
    out.push(asV ? kruskalToDiagram(fixed, w) : kruskalToDiagram(w, fixed));
  }
  return out;
}
export interface LightCone { futureRight: Pt[]; futureLeft: Pt[]; pastRight: Pt[]; pastLeft: Pt[] }
/** Radial null rays through Kruskal point (U0,V0), stopped at singularities / null infinity. */
export function lightCone(U0: number, V0: number, n = 60): LightCone {
  return {
    futureRight: nullLine(U0, V0, 1, true, n), // U const, V up
    futureLeft: nullLine(V0, U0, 1, false, n), // V const, U up
    pastLeft: nullLine(U0, V0, -1, true, n), // U const, V down
    pastRight: nullLine(V0, U0, -1, false, n), // V const, U down
  };
}
export function lightConeAtDiagram(X: number, T: number, n = 60): LightCone | null {
  const k = diagramToKruskal(X, T);
  return k ? lightCone(k[0], k[1], n) : null;
}
