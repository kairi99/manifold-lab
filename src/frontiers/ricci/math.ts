// Rotationally symmetric Ricci flow on S^{n+1}: g = ds^2 + psi(s)^2 g_{S^n}, fixed coordinate x in [-1,1], ds = phi(x) dx.
//   d_t phi = n (psi_ss / psi) phi
//   d_t psi = psi_ss - (n-1)(1 - psi_s^2)/psi            (Angenent-Knopf 2004)
// n = 1: surface, n = 2: 3-sphere. Explicit Euler with dt tied to the smallest cell (phi dx)^2.

export type Kind = 'round' | 'peanut' | 'dumbbell';
export type Status = 'running' | 'extinct' | 'singular';
export const N = 121; // odd: node N>>1 is the equator / neck at x = 0
export const DX = 2 / (N - 1);
const REC_DT = 0.002;
const NECK_FRAC = 0.02;

export type Profile = { phi: Float64Array; psi: Float64Array };

/** Initial data: an embedded surface of revolution. Meridian rho(z) = sqrt(1 - zeta^2) h(zeta), zeta = z/H, meets the axis at right angles;
 *  psi = rho sampled at equal arclength s along it, so |psi_s| <= 1 and the 2D side is an exact isometric embedding at t = 0. */
export function profile(kind: Kind, depth = 0.8, r0 = 1): Profile {
  const [H, b, d, w] = kind === 'round' ? [1, 0, 0, 1] : kind === 'peanut' ? [1.3, 0.35, 0.25, 0.5] : [1.7, 0.9, depth, 0.25];
  const rho = (z: number) => {
    const q = z / H;
    return Math.sqrt(Math.max(0, 1 - q * q)) * (1 + b * 4 * q * q * (1 - q * q)) * (1 - d * Math.exp(-((q / w) ** 2)));
  };
  const K = 6000, zs = new Float64Array(K + 1), ss = new Float64Array(K + 1), rs = new Float64Array(K + 1);
  for (let k = 0; k <= K; k++) { zs[k] = -H * Math.cos((Math.PI * k) / K); rs[k] = rho(zs[k]); }
  for (let k = 1; k <= K; k++) ss[k] = ss[k - 1] + Math.hypot(zs[k] - zs[k - 1], rs[k] - rs[k - 1]);
  const L = ss[K], psi = new Float64Array(N);
  for (let i = 1, k = 0; i < N - 1; i++) {
    const s = (L * i) / (N - 1);
    while (ss[k + 1] < s) k++;
    psi[i] = r0 * (rs[k] + ((rs[k + 1] - rs[k]) * (s - ss[k])) / (ss[k + 1] - ss[k]));
  }
  return { phi: new Float64Array(N).fill((r0 * L) / 2), psi };
}

/** psi_ss, K_rad = -psi_ss/psi, K_tan = (1 - psi_s^2)/psi^2 on the grid (pole values copied from the neighbour). */
export function curvatures(phi: Float64Array, psi: Float64Array) {
  const kr = new Float64Array(N), kt = new Float64Array(N), pss = new Float64Array(N);
  const half = new Float64Array(N - 1);
  for (let i = 0; i < N - 1; i++) half[i] = (psi[i + 1] - psi[i]) / (DX * 0.5 * (phi[i] + phi[i + 1]));
  for (let i = 1; i < N - 1; i++) {
    pss[i] = (half[i] - half[i - 1]) / (DX * phi[i]);
    const ps = (psi[i + 1] - psi[i - 1]) / (2 * DX * phi[i]);
    kr[i] = -pss[i] / psi[i];
    kt[i] = (1 - ps * ps) / (psi[i] * psi[i]);
  }
  kr[0] = kr[1]; kr[N - 1] = kr[N - 2]; kt[0] = kt[1]; kt[N - 1] = kt[N - 2];
  return { kr, kt, pss, half };
}

/** Interior local minima of psi (necks); smallest one, or null. */
export function neck(psi: Float64Array): number | null {
  let m: number | null = null;
  for (let i = 1; i < N - 1; i++) if (psi[i] < psi[i - 1] && psi[i] <= psi[i + 1] && (m === null || psi[i] < m)) m = psi[i];
  return m;
}

export type Frame = {
  t: number; phi: Float64Array; psi: Float64Array;
  neck: number | null; psiMax: number; maxK: number; kMax: number; kMin: number;
  size: number;   // area (n = 1) or volume (n = 2)
  gb: number;     // integral of K dA (meaningful for n = 1)
  scalar: Float64Array; // scalar curvature per node, for colouring
};

export function measure(n: number, t: number, phi: Float64Array, psi: Float64Array): Frame {
  const { kr, kt } = curvatures(phi, psi);
  let psiMax = 0, maxK = 0, kMax = -Infinity, kMin = Infinity, size = 0, gb = 0;
  const scalar = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    psiMax = Math.max(psiMax, psi[i]);
    maxK = Math.max(maxK, Math.abs(kr[i]), n === 2 ? Math.abs(kt[i]) : 0);
    kMax = Math.max(kMax, kr[i]); kMin = Math.min(kMin, kr[i]);
    const wgt = (i === 0 || i === N - 1 ? 0.5 : 1) * DX * phi[i];
    size += n === 1 ? 2 * Math.PI * psi[i] * wgt : 4 * Math.PI * psi[i] * psi[i] * wgt;
    gb += kr[i] * 2 * Math.PI * psi[i] * wgt;
    scalar[i] = n === 1 ? 2 * kr[i] : 4 * kr[i] + 2 * kt[i];
  }
  return { t, phi: phi.slice(), psi: psi.slice(), neck: neck(psi), psiMax, maxK, kMax, kMin, size, gb, scalar };
}

export type Run = { n: number; frames: Frame[]; status: Status; tEnd: number; clamped: boolean };

/** One explicit step in the arclength-proportional gauge: grid uniform in s, total length L(t), points slide along the flow by
 *  V(s) = integral of n psi_ss/psi ds, so d_t psi|_sigma = psi_ss - (n-1)(1-psi_s^2)/psi - psi_s (V - sigma V(L)) and L' = V(L). */
function step(n: number, phi: Float64Array, psi: Float64Array, dt: number) {
  const { pss, half } = curvatures(phi, psi);
  const h = DX * phi[0];
  const rr = new Float64Array(N); // psi_ss / psi, smooth at the poles
  for (let i = 1; i < N - 1; i++) rr[i] = pss[i] / psi[i];
  rr[0] = rr[1]; rr[N - 1] = rr[N - 2];
  const V = new Float64Array(N);
  for (let i = 1; i < N; i++) V[i] = V[i - 1] + n * 0.5 * (rr[i] + rr[i - 1]) * h;
  const dpsi = new Float64Array(N);
  for (let i = 1; i < N - 1; i++) {
    // K_tan = (1 - psi_s^2)/psi^2 is an even smooth function of s, but its discrete value is off by O(1) within 3 cells of a pole:
    // there use the value 4 cells in (error O(h^2))
    const j = Math.min(Math.max(i, 4), N - 5);
    const kt = (1 - 0.5 * (half[j] ** 2 + half[j - 1] ** 2)) / psi[j] ** 2;
    const ps = 0.5 * (half[i] + half[i - 1]);
    dpsi[i] = pss[i] - (n - 1) * kt * psi[i] - ps * (V[i] - (i / (N - 1)) * V[N - 1]);
  }
  for (let i = 1; i < N - 1; i++) psi[i] += dt * dpsi[i];
  // Smoothness at a pole means psi = s + b s^3 + ..., i.e. psi_s = 1 there. Dirichlet psi = 0 alone lets a cone angle drift in (unstable for n = 2),
  // so the 3 cells nearest each pole are slaved to that form, fitted to the 4th node.
  for (const [p, dir] of [[0, 1], [N - 1, -1]]) {
    const q = p + 4 * dir, sq = 4 * h, b = (psi[q] - sq) / sq ** 3;
    for (let k = 1; k < 4; k++) psi[p + k * dir] = k * h + b * (k * h) ** 3;
  }
  phi.fill(phi[0] + 0.5 * dt * V[N - 1]);
}

let cache: { key: string; run: Run } | null = null;

/** Run the flow from the profile until the sphere is nearly gone or a neck pinches (psi_min < 2 % of max psi). */
export function simulate(n: 1 | 2, kind: Kind, depth = 0.8, tCap = 3): Run {
  const key = `${n}|${kind}|${depth}|${tCap}`;
  if (cache?.key === key) return cache.run;
  const { phi, psi } = profile(kind, depth);
  const frames = [measure(n, 0, phi, psi)];
  const psi0 = frames[0].psiMax;
  let t = 0, nextRec = REC_DT, status: Status = 'running', lastNeck = frames[0].neck;
  for (let it = 0; it < 400000 && t < tCap; it++) {
    let minPhi = Infinity, pMax = 0;
    for (let i = 0; i < N; i++) minPhi = Math.min(minPhi, phi[i]);
    const dt = 0.2 * (minPhi * DX) ** 2;
    step(n, phi, psi, dt);
    t += dt;
    const nk = neck(psi);
    for (let i = 0; i < N; i++) pMax = Math.max(pMax, psi[i]);
    if (nk !== null && nk < NECK_FRAC * pMax) status = 'singular';
    else if (pMax < 0.12 * psi0) status = 'extinct';
    if (status !== 'running' || t >= nextRec || (nk !== null && lastNeck !== null && nk < 0.92 * lastNeck)) {
      frames.push(measure(n, t, phi, psi));
      nextRec = t + REC_DT; lastNeck = nk;
    }
    if (status !== 'running') break;
  }
  const maxSlope = Math.max(...frames.map((f) => { let m = 0; for (let i = 1; i < N - 1; i++) m = Math.max(m, Math.abs((f.psi[i + 1] - f.psi[i - 1]) / (2 * DX * f.phi[i]))); return m; }));
  const run = { n, frames, status, tEnd: t, clamped: maxSlope > 1.02 };
  cache = { key, run };
  return run;
}

/** Frame at time t (last recorded frame not after t). */
export function frameAt(run: Run, t: number): Frame {
  const f = run.frames;
  let lo = 0, hi = f.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (f[m].t <= t) lo = m; else hi = m - 1; }
  return f[lo];
}

/** Surface-of-revolution profile: radius psi, height z = integral of sqrt(1 - psi_s^2) ds (slope clamped to 1). */
export function embed(f: Frame): { r: Float64Array; z: Float64Array; clamped: boolean } {
  const z = new Float64Array(N);
  let clamped = false;
  for (let i = 1; i < N; i++) {
    const ps = (f.psi[i] - f.psi[i - 1]) / (DX * 0.5 * (f.phi[i] + f.phi[i - 1]));
    if (Math.abs(ps) > 1) clamped = true;
    z[i] = z[i - 1] + Math.sqrt(Math.max(0, 1 - ps * ps)) * DX * 0.5 * (f.phi[i] + f.phi[i - 1]);
  }
  const mid = z[N - 1] / 2;
  for (let i = 0; i < N; i++) z[i] -= mid;
  return { r: f.psi, z, clamped };
}
