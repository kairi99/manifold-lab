// Bardeen (1973) critical curve (black-hole shadow edge) in observer screen coords (α, β), units of M.
// α>0 is the receding (retrograde) side, α<0 the approaching side (see raytrace.ts conventions).
const B_CRIT = 3 * Math.sqrt(3);

export function shadowBoundary(a: number, inclinationDeg: number, n = 400): [number, number][] {
  if (a < 1e-4) {
    const c: [number, number][] = [];
    for (let k = 0; k <= n; k++) c.push([B_CRIT * Math.cos((2 * Math.PI * k) / n), B_CRIT * Math.sin((2 * Math.PI * k) / n)]);
    return c;
  }
  // clamp away from the pole where ξ/sinθo and cotθo blow up
  const th = Math.min(Math.max((inclinationDeg * Math.PI) / 180, 0.01), Math.PI - 0.01);
  const so = Math.sin(th), co = Math.cos(th), a2 = a * a;
  const xi = (r: number) => (r * r * (3 - r) - a2 * (r + 1)) / (a * (r - 1));
  const eta = (r: number) => (r ** 3 * (4 * a2 - r * (r - 3) ** 2)) / (a2 * (r - 1) ** 2);
  const b2 = (r: number) => eta(r) + a2 * co * co - (xi(r) * co / so) ** 2;
  const rLo = 2 * (1 + Math.cos((2 / 3) * Math.acos(-a))); // prograde photon orbit
  const rHi = 2 * (1 + Math.cos((2 / 3) * Math.acos(a))); // retrograde
  const M = 4000;
  let i0 = -1, i1 = -1;
  for (let k = 0; k <= M; k++) {
    if (b2(rLo + ((rHi - rLo) * k) / M) >= 0) { if (i0 < 0) i0 = k; i1 = k; }
  }
  if (i0 < 0) return [];
  const at = (k: number) => rLo + ((rHi - rLo) * k) / M;
  const refine = (bad: number, good: number) => {
    for (let it = 0; it < 60; it++) { const m = (bad + good) / 2; if (b2(m) >= 0) good = m; else bad = m; }
    return good;
  };
  const r0 = i0 > 0 ? refine(at(i0 - 1), at(i0)) : at(i0);
  const r1 = i1 < M ? refine(at(i1 + 1), at(i1)) : at(i1);
  const up: [number, number][] = [];
  const h = n >> 1;
  for (let k = 0; k <= h; k++) { // sine spacing resolves the sqrt endpoints
    const r = (r0 + r1) / 2 + ((r1 - r0) / 2) * Math.sin(-Math.PI / 2 + (Math.PI * k) / h);
    up.push([-xi(r) / so, Math.sqrt(Math.max(0, b2(r)))]);
  }
  const out = up.slice();
  for (let k = up.length - 2; k >= 1; k--) out.push([up[k][0], -up[k][1]]);
  out.push(up[0]);
  return out;
}
