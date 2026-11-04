import { describe, expect, it } from 'vitest';
import {
  curvatureAt, defaultParams, deSitter, flrwLCDM, kerr, lcdmScaleFactor, metricAt, minkowskiSpherical, nonzeroComponents,
  reissnerNordstrom, schwarzschild, invert4, SPACETIMES, type SpacetimeMetric, type Mat4,
} from './spacetime';

const R4 = [0, 1, 2, 3];
const close = (a: number, b: number, rel = 1e-9, abs = 1e-13) => expect(Math.abs(a - b)).toBeLessThanOrEqual(abs + rel * Math.max(Math.abs(a), Math.abs(b)));
const allZero = (t: number[][][][], tol = 1e-12) => t.flat(3).forEach((v) => expect(Math.abs(v)).toBeLessThan(tol));

/** Independent reference: Γ from central differences of g, Riemann from central differences of that Γ. */
function fdGamma(m: SpacetimeMetric, x: number[], p: Record<string, number>, h: number) {
  const g = metricAt(m, x, p), gi = invert4(g);
  const dg = R4.map((k) => {
    const xp = [...x], xm = [...x]; xp[k] += h; xm[k] -= h;
    const a = metricAt(m, xp, p), b = metricAt(m, xm, p);
    return a.map((r, i) => r.map((v, j) => (v - b[i][j]) / (2 * h)));
  });
  return R4.map((r) => R4.map((mu) => R4.map((nu) =>
    R4.reduce((s, l) => s + 0.5 * gi[r][l] * (dg[mu][l][nu] + dg[nu][l][mu] - dg[l][mu][nu]), 0))));
}
function fdCheck(m: SpacetimeMetric, x: number[], p: Record<string, number>) {
  const c = curvatureAt(m, x, p), h1 = 1e-5, h2 = 1e-3;
  const G = fdGamma(m, x, p, h1);
  const dG = R4.map((k) => {
    const xp = [...x], xm = [...x]; xp[k] += h2; xm[k] -= h2;
    const a = fdGamma(m, xp, p, h1), b = fdGamma(m, xm, p, h1);
    return a.map((A, r) => A.map((B, mu) => B.map((v, nu) => (v - b[r][mu][nu]) / (2 * h2))));
  });
  let scale = 0;
  for (const r of R4) for (const s of R4) for (const mu of R4) for (const nu of R4) scale = Math.max(scale, Math.abs(c.Riemann[r][s][mu][nu]));
  for (const r of R4) for (const mu of R4) for (const nu of R4) close(c.Gamma[r][mu][nu], G[r][mu][nu], 1e-5, 1e-7);
  for (const r of R4) for (const s of R4) for (const mu of R4) for (const nu of R4) {
    const ref = dG[mu][r][nu][s] - dG[nu][r][mu][s] + R4.reduce((a, l) => a + G[r][mu][l] * G[l][nu][s] - G[r][nu][l] * G[l][mu][s], 0);
    expect(Math.abs(c.Riemann[r][s][mu][nu] - ref)).toBeLessThan(1e-4 * (scale + 0.1));
  }
}

const sch = (M = 1) => ({ M });

describe('Minkowski spherical', () => {
  const x = [0, 3, 0.8, 0.2], c = curvatureAt(minkowskiSpherical, x, {});
  it('Gamma nonzero, Riemann zero', () => {
    close(c.Gamma[1][2][2], -3); close(c.Gamma[2][1][2], 1 / 3);
    close(c.Gamma[1][3][3], -3 * Math.sin(0.8) ** 2);
    close(c.Gamma[2][3][3], -Math.sin(0.8) * Math.cos(0.8));
    allZero(c.Riemann);
    expect(c.kretschmann).toBeCloseTo(0, 12);
    expect(nonzeroComponents(c.Riemann, 1e-12)).toHaveLength(0);
    expect(nonzeroComponents(c.Gamma, 1e-12, [{ a: 1, b: 2, sign: 1 }]).length).toBeGreaterThan(0);
  });
  it('matches finite differences', () => fdCheck(minkowskiSpherical, x, {}));
});

describe('Schwarzschild', () => {
  const M = 1.3, r = 5.1, th = 0.9, p = sch(M), x = [0, r, th, 0.3], c = curvatureAt(schwarzschild, x, p);
  it('vacuum, Kretschmann, Weyl', () => {
    c.Ricci.flat().forEach((v) => expect(Math.abs(v)).toBeLessThan(1e-12));
    close(c.kretschmann, (48 * M * M) / r ** 6);
    close(c.weylSq, c.kretschmann);
    close(c.scalar, 0, 1, 1e-12);
  });
  it('closed-form components', () => {
    const f = 1 - (2 * M) / r;
    close(c.Riemann[2][3][2][3], (2 * M * Math.sin(th) ** 2) / r);
    close(c.Riemann[0][1][0][1], (2 * M) / (r ** 3 * f)); // R^t_rtr
    close(c.RiemannLow[0][1][0][1], (-2 * M) / r ** 3);
    close(c.RiemannLow[0][2][0][2], (M * f) / r);            // R_tθtθ = M f / r
    close(c.RiemannLow[1][2][1][2], (-M) / (r * f));         // R_rθrθ = −M/(r f)
  });
  it('matches finite differences', () => fdCheck(schwarzschild, x, p));
  it('lists independent components', () => {
    const l = nonzeroComponents(c.RiemannLow, 1e-12, [{ a: 0, b: 1, sign: -1 }, { a: 2, b: 3, sign: -1 }], undefined, true);
    expect(l.map((q) => q.label).sort()).toEqual(['trtr', 'tθtθ', 'tφtφ', 'rθrθ', 'rφrφ', 'θφθφ'].sort());
  });
});

describe('Kerr', () => {
  const cases: [number, number, number, number][] = [[1, 4, 0.5, 0.6], [1, 2.5, 1.2, 0.9], [2, 9, 2.4, 1.1], [1, 3, Math.PI / 2, 0.3]];
  it('Ricci = 0 and Kretschmann closed form', () => {
    for (const [M, r, th, a] of cases) {
      const c = curvatureAt(kerr, [0, r, th, 0], { M, a }), co = Math.cos(th);
      const K = (48 * M * M * (r ** 6 - 15 * a * a * r ** 4 * co ** 2 + 15 * a ** 4 * r * r * co ** 4 - a ** 6 * co ** 6)) / (r * r + a * a * co * co) ** 6;
      close(c.kretschmann, K, 1e-9, 1e-12);
      close(c.weylSq, K, 1e-9, 1e-12);
      const s = Math.max(1e-6, ...c.RiemannLow.flat(3).map(Math.abs));
      c.Ricci.flat().forEach((v) => expect(Math.abs(v)).toBeLessThan(1e-10 * s));
    }
  });
  it('reduces to Schwarzschild at a = 0', () => {
    const a = curvatureAt(kerr, [0, 5, 1, 0], { M: 1, a: 0 }), b = curvatureAt(schwarzschild, [0, 5, 1, 0], { M: 1 });
    close(a.Riemann[2][3][2][3], b.Riemann[2][3][2][3]);
  });
  it('matches finite differences', () => fdCheck(kerr, [0, 4, 0.8, 0.2], { M: 1, a: 0.7 }));
});

describe('Reissner-Nordstrom', () => {
  const M = 1, Q = 0.7, r = 3.3, th = 1.0, p = { M, Q }, x = [0, r, th, 0], c = curvatureAt(reissnerNordstrom, x, p);
  it('R=0, Kretschmann, Einstein = 8πT', () => {
    close(c.scalar, 0, 1, 1e-12);
    close(c.kretschmann, (8 * (6 * M * M * r * r - 12 * M * Q * Q * r + 7 * Q ** 4)) / r ** 8);
    close(c.EinsteinMixed[0][0], -(Q * Q) / r ** 4);
    const T = reissnerNordstrom.source!(x, p);
    for (const i of R4) for (const j of R4) close(c.Einstein[i][j], 8 * Math.PI * T[i][j], 1e-9, 1e-14);
  });
  it('matches finite differences', () => fdCheck(reissnerNordstrom, x, p));
});

describe('de Sitter', () => {
  const H = 0.8, x = [0.4, 0.1, -0.2, 0.3], p = { H }, c = curvatureAt(deSitter, x, p);
  it('maximally symmetric', () => {
    for (const i of R4) for (const j of R4) close(c.Ricci[i][j], 3 * H * H * c.g[i][j], 1e-9, 1e-13);
    close(c.scalar, 12 * H * H); close(c.kretschmann, 24 * H ** 4); close(c.weylSq, 0, 1, 1e-10);
    const T = deSitter.source!(x, p);
    for (const i of R4) for (const j of R4) close(c.Einstein[i][j], 8 * Math.PI * T[i][j], 1e-9, 1e-13);
  });
  it('matches finite differences', () => fdCheck(deSitter, x, p));
});

describe('FLRW LCDM', () => {
  for (const Om of [0.3, 0.7]) {
    it(`Friedmann equations, Om=${Om}`, () => {
      const t = 0.9, x = [t, 0, 0, 0], p = { Om }, c = curvatureAt(flrwLCDM, x, p), a = lcdmScaleFactor(t, Om);
      close(c.g[1][1], a * a);
      const rm = (3 * Om) / (8 * Math.PI * a ** 3), rl = (3 * (1 - Om)) / (8 * Math.PI);
      close(c.EinsteinMixed[0][0], -8 * Math.PI * (rm + rl));
      for (const i of [1, 2, 3]) { close(c.EinsteinMixed[i][i], -8 * Math.PI * rl); close(c.EinsteinMixed[i][0], 0, 1, 1e-12); }
      close(c.weylSq, 0, 1, 1e-9);
      const T = flrwLCDM.source!(x, p);
      for (const i of R4) for (const j of R4) close(c.Einstein[i][j], 8 * Math.PI * T[i][j], 1e-9, 1e-12);
    });
  }
  it('matches finite differences', () => fdCheck(flrwLCDM, [0.9, 0, 0, 0], { Om: 0.3 }));
});

describe('registry', () => {
  it('default events evaluate without NaN', () => {
    for (const m of SPACETIMES) {
      const c = curvatureAt(m, m.defaultEvent(defaultParams(m)), defaultParams(m));
      expect(Number.isFinite(c.kretschmann)).toBe(true);
    }
  });
});

export type { Mat4 };
