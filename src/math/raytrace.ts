// Backward ray tracer for Kerr (G = c = 1, M = 1), Boyer–Lindquist coordinates.
//
// Method: null geodesics from the Hamiltonian H̃ = Σ·H = ½F,
//   F = Δ p_r² + p_θ² − (r²+a²−aL)²/Δ + (L − a sin²θ)²/sin²θ   (E = 1, null ⇒ F = 0),
// i.e. a reparametrised affine parameter. Hamilton's first-order equations in (r, θ, φ, p_r, p_θ) are
// integrated with RK4; no sqrt turning points. The received photon is started at r = distance with
// p_θ = β, L = −α sinθo, p_r from F = 0 (p_r > 0: moving outward to the observer) and stepped with negative dλ.
//
// Conventions: observer at φ = 0, polar angle θo. Screen x → +α (right), screen up → +β.
// The disk and hole spin about +z (a > 0 prograde = +φ). With the observer above the equator at φ = 0,
// +α is the RECEDING side (matter moving away); the approaching (g > 1) side is α < 0 (left of screen).
// Inclination is clamped to [0.01, π−0.01] rad (BL coordinate axis singularity).
// Step: dλ = ε / (|dr/dλ|/min(r, 4(r−r+)) + |dθ/dλ| + |dφ/dλ|), so steps are ∝ r far away, fine near the hole
// and near the axis.

export interface TraceParams {
  a: number; inclinationDeg: number; distance: number; fov: number;
  width: number; height: number; disk: boolean; sky: boolean; diskOuter: number;
}
export interface PixelResult { hit: 'disk' | 'sky' | 'horizon'; r?: number; g?: number; skyTheta?: number; skyPhi?: number }

const TWO_PI = 2 * Math.PI;
const EPS = 0.1, MAX_STEPS = 4000;

/** Prograde ISCO radius (Bardeen–Press–Teukolsky). */
export function iscoRadius(a: number): number {
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2));
}

// Derivative scratch (module scope ⇒ no allocation in the inner loop).
let D0 = 0, D1 = 0, D2 = 0, D3 = 0, D4 = 0;
function deriv(r: number, th: number, pr: number, pth: number, L: number, a: number): void {
  const s = Math.sin(th), c = Math.cos(th), s2 = s * s, r2 = r * r;
  const del = r2 - 2 * r + a * a, R = r2 + a * a - a * L, q = L / s - a * s;
  D0 = del * pr;
  D1 = pth;
  D2 = (L - a * s2) / s2 + (a * R) / del;
  D3 = -(r - 1) * pr * pr + (2 * r * R) / del - (R * R * (r - 1)) / (del * del);
  D4 = q * c * (L / s2 + a);
}

export function tracePixel(p: TraceParams, alpha: number, beta: number): PixelResult {
  const a = p.a, a2 = a * a;
  const thO = Math.min(Math.max((p.inclinationDeg * Math.PI) / 180, 0.01), Math.PI - 0.01);
  const so = Math.sin(thO), L = -alpha * so;
  const rp = 1 + Math.sqrt(1 - a2), rHor = rp * (1 + 1e-4);
  const rIn = iscoRadius(a), rEsc = Math.min(500, 1.2 * p.distance);

  let r = p.distance, th = thO, ph = 0, pth = beta;
  const del0 = r * r - 2 * r + a2, R0 = r * r + a2 - a * L;
  let pr = Math.sqrt(Math.max(0, (R0 * R0) / del0 - pth * pth - ((L - a * so * so) ** 2) / (so * so)) / del0);

  for (let n = 0; n < MAX_STEPS; n++) {
    deriv(r, th, pr, pth, L, a);
    const dmin = Math.min(r, 4 * (r - rp));
    const h = -EPS / (Math.abs(D0) / dmin + Math.abs(D1) + Math.abs(D2) + 1e-12);
    const k0 = D0, k1 = D1, k2 = D2, k3 = D3, k4 = D4;
    deriv(r + 0.5 * h * k0, th + 0.5 * h * k1, pr + 0.5 * h * k3, pth + 0.5 * h * k4, L, a);
    const b0 = D0, b1 = D1, b2 = D2, b3 = D3, b4 = D4;
    deriv(r + 0.5 * h * b0, th + 0.5 * h * b1, pr + 0.5 * h * b3, pth + 0.5 * h * b4, L, a);
    const c0 = D0, c1 = D1, c2 = D2, c3 = D3, c4 = D4;
    deriv(r + h * c0, th + h * c1, pr + h * c3, pth + h * c4, L, a);
    const f = h / 6;
    const r1 = r + f * (k0 + 2 * b0 + 2 * c0 + D0);
    const th1 = th + f * (k1 + 2 * b1 + 2 * c1 + D1);
    const ph1 = ph + f * (k2 + 2 * b2 + 2 * c2 + D2);
    const pr1 = pr + f * (k3 + 2 * b3 + 2 * c3 + D3);
    const pth1 = pth + f * (k4 + 2 * b4 + 2 * c4 + D4);

    if (!(r1 > rHor)) return { hit: 'horizon' };
    if (p.disk) {
      const d0 = Math.cos(th), d1 = Math.cos(th1); // cos: also catches the equator after a pole fold (θ<0)
      if (d0 * d1 < 0) {
        const rc = r + (r1 - r) * (d0 / (d0 - d1));
        if (rc >= rIn && rc <= p.diskOuter) return { hit: 'disk', r: rc, g: redshift(rc, a, L) };
      }
    }
    r = r1; th = th1; ph = ph1; pr = pr1; pth = pth1;
    if ((pr < 0 && r > rEsc) || r > 1.2 * p.distance) break;
  }
  if (r < rEsc) return { hit: 'horizon' }; // step budget exhausted near the photon sphere: treat as captured
  let t = th % TWO_PI; if (t < 0) t += TWO_PI;
  if (t > Math.PI) { t = TWO_PI - t; ph += Math.PI; } // fold θ through a pole: φ shifts by π
  let phi = ph % TWO_PI; if (phi < 0) phi += TWO_PI;
  return { hit: 'sky', skyTheta: t, skyPhi: phi };
}

/** g = ν_obs/ν_emit for a prograde Keplerian emitter; L = photon's L/E (E = 1). */
function redshift(r: number, a: number, L: number): number {
  const omega = 1 / (r * Math.sqrt(r) + a);
  const ut = (r * Math.sqrt(r) + a) / (Math.pow(r, 0.75) * Math.sqrt(r * Math.sqrt(r) - 3 * Math.sqrt(r) + 2 * a));
  return 1 / (ut * (1 - omega * L));
}

// ---- shading --------------------------------------------------------------------------------------------
const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
// dark red → orange → yellow-white
const STOPS: [number, number, number][] = [[10, 0, 0], [120, 20, 5], [235, 100, 15], [255, 190, 90], [255, 250, 235]];
function palette(t: number): [number, number, number] {
  const x = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1), i = Math.min(Math.floor(x), STOPS.length - 2), f = x - i;
  return [lerp(STOPS[i][0], STOPS[i + 1][0], f), lerp(STOPS[i][1], STOPS[i + 1][1], f), lerp(STOPS[i][2], STOPS[i + 1][2], f)];
}

/** sRGB 0..255. Disk: I = g⁴·r⁻³(1−√(rin/r)) normalised to its peak (r = 49/36 rin), log-mapped through the palette
 *  (brightness only; blue-/red-shift shows through g⁴, no extra tint). Sky: 12×24 (θ×φ) checkerboard. */
export function shade(p: TraceParams, px: PixelResult): [number, number, number] {
  if (px.hit === 'horizon') return [0, 0, 0];
  if (px.hit === 'sky') {
    if (!p.sky) return [0, 0, 0];
    const i = Math.floor(((px.skyTheta ?? 0) / Math.PI) * 12), j = Math.floor(((px.skyPhi ?? 0) / TWO_PI) * 24);
    return (i + j) & 1 ? [46, 58, 92] : [84, 70, 62];
  }
  const r = px.r ?? 0, g = px.g ?? 1, rin = iscoRadius(p.a);
  const emis = (x: number) => Math.pow(x, -3) * (1 - Math.sqrt(rin / x));
  const I = (g ** 4 * emis(r)) / emis((49 / 36) * rin);
  const t = (Math.log10(Math.max(I, 1e-9)) + 2.2) / 2.6;
  const c = palette(t);
  return [c[0], c[1], c[2]];
}

export function traceRow(p: TraceParams, row: number, out: Uint8ClampedArray): void {
  const beta = p.fov - ((row + 0.5) / p.height) * 2 * p.fov;
  for (let x = 0; x < p.width; x++) {
    const c = shade(p, tracePixel(p, -p.fov + ((x + 0.5) / p.width) * 2 * p.fov, beta));
    const o = 4 * x;
    out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = 255;
  }
}
