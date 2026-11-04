import { describe, expect, it } from 'vitest';
import { makeFlamm, rOfZ, zOfR } from './flamm';
import { metricFromEmbedding, christoffelFD } from './metric';
import { curvatureAt } from './curvature';
import {
  B_CRIT, ISCO, PHOTON_SPHERE, Veff, circular, orbitFromApsides, integrateOrbit, perihelionShift,
  deflection, staticClockRate, circularClockRate, shadowAngularRadius,
} from './schwarzschild';

const dV = (r: number, L: number, k: 'timelike' | 'null') => (Veff(r + 1e-5, L, k) - Veff(r - 1e-5, L, k)) / 2e-5;

describe('flamm', () => {
  const s = makeFlamm();
  for (const [z, p] of [[0, 0.3], [1.5, 1], [-3, 2], [6, 4]] as const) {
    it(`geometry at z=${z}`, () => {
      const g = s.metric(z, p), ge = metricFromEmbedding(s, z, p);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) expect(g[i][j]).toBeCloseTo(ge[i][j], 9);
      const G = s.christoffel(z, p), Gf = christoffelFD(s, z, p);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++)
        expect(G[k][i][j]).toBeCloseTo(Gf[k][i][j], 5);
      expect(s.gaussK(z, p)).toBeCloseTo(-1 / rOfZ(z) ** 3, 12);
      expect(curvatureAt(s, z, p).Kintrinsic).toBeCloseTo(-1 / rOfZ(z) ** 3, 4);
    });
  }
  it('g_zz dz² = dr²/(1−2/r)', () => {
    for (const z of [0.5, 2, 5]) {
      const r = rOfZ(z), drdz = z / 4;
      expect(s.metric(z, 0)[0][0]).toBeCloseTo(drdz ** 2 / (1 - 2 / r), 12);
      expect(zOfR(r)).toBeCloseTo(z, 12);
    }
  });
});

describe('effective potential', () => {
  it('circular orbits and ISCO', () => {
    for (const r of [4, 6, 10, 50]) {
      const c = circular(r)!;
      expect(dV(r, c.L, 'timelike')).toBeCloseTo(0, 6);
      expect(Veff(r, c.L, 'timelike')).toBeCloseTo(c.E * c.E, 12);
    }
    expect(circular(6.5)!.stable).toBe(true);
    expect(circular(5.5)!.stable).toBe(false);
    expect(circular(ISCO)!.E).toBeCloseTo(Math.sqrt(8 / 9), 12);
    expect(circular(3)).toBeNull();
  });
  it('photon sphere and critical impact parameter', () => {
    expect(dV(PHOTON_SPHERE, 1, 'null')).toBeCloseTo(0, 8);
    expect(B_CRIT ** 2).toBeCloseTo(27, 12);
    expect(1 / Veff(3, 1, 'null')).toBeCloseTo(27, 10);
  });
  it('apsides', () => {
    const o = orbitFromApsides(10, 30)!;
    expect(Veff(10, o.L, 'timelike')).toBeCloseTo(o.E ** 2, 12);
    expect(Veff(30, o.L, 'timelike')).toBeCloseTo(o.E ** 2, 12);
    expect(orbitFromApsides(3, 30)).toBeNull();
  });
});

describe('integrateOrbit', () => {
  it('conserves constraint, E, L on an eccentric orbit', () => {
    const o = orbitFromApsides(10, 30)!;
    const { samples, fate, maxConstraintDrift } = integrateOrbit({ kind: 'timelike', ...o, r0: 10, lambdaMax: 1200 });
    expect(fate).toBe('bound');
    expect(maxConstraintDrift).toBeLessThan(1e-8);
    for (const q of samples) {
      expect((1 - 2 / q.r) * q.tdot).toBeCloseTo(o.E, 9);
      expect(q.r * q.r * q.phidot).toBeCloseTo(o.L, 9);
    }
  });
  it('circular orbit stays circular', () => {
    const c = circular(10)!;
    const { samples } = integrateOrbit({ kind: 'timelike', E: c.E, L: c.L, r0: 10, lambdaMax: 500 });
    for (const q of samples) expect(q.r).toBeCloseTo(10, 8);
  });
  it('radial infall is captured; null b=5 captured, b=6 escapes', () => {
    expect(integrateOrbit({ kind: 'timelike', E: Math.sqrt(0.8), L: 0, r0: 10, lambdaMax: 200 }).fate).toBe('capture');
    expect(integrateOrbit({ kind: 'null', E: 1, L: 5, r0: 10, inward: true, lambdaMax: 100 }).fate).toBe('capture');
    expect(integrateOrbit({ kind: 'null', E: 1, L: 6, r0: 10, inward: true, lambdaMax: 1500 }).fate).toBe('escape');
  });
});

describe('perihelionShift', () => {
  it('matches integrated geodesic', () => {
    const o = orbitFromApsides(10, 30)!;
    const { samples } = integrateOrbit({ kind: 'timelike', ...o, r0: 10, lambdaMax: 900, nSamples: 60000 });
    let k = 1;
    while (!(samples[k].r < samples[k - 1].r && samples[k].r <= samples[k + 1].r && samples[k].r < 15)) k++;
    const [a, b, c] = [samples[k - 1], samples[k], samples[k + 1]];
    // vertex of parabola r(φ)
    const d1 = (c.r - a.r) / (c.phi - a.phi), d2 = (c.r - 2 * b.r + a.r) / ((c.phi - a.phi) / 2) ** 2;
    const phiMin = b.phi - d1 / d2;
    expect(phiMin - 2 * Math.PI).toBeCloseTo(perihelionShift(10, 30).numeric, 4);
  });
  it('weak field limit', () => {
    const w = perihelionShift(0.9e4, 1.1e4);
    expect(Math.abs(w.numeric / w.weakField - 1)).toBeLessThan(1e-3);
    const a = 5.79e10 / 1476.6, e = 0.2056;
    const m = perihelionShift(a * (1 - e), a * (1 + e));
    expect(Math.abs(m.numeric / m.weakField - 1)).toBeLessThan(1e-4);
    expect(m.numeric).toBeGreaterThan(4e-7);
  });
});

describe('deflection', () => {
  it('weak field', () => {
    const b = 1e4, d = deflection(b).numeric!;
    expect(Math.abs(d / (4 / b) - 1)).toBeLessThan(1e-3);
    expect(d).toBeCloseTo(4 / b + (15 * Math.PI) / (4 * b * b), 9);
  });
  it('Sun limb 1.75 arcsec', () => {
    const d = deflection(6.957e8 / 1476.6).numeric!;
    expect(Math.abs((d * 206264.806) - 1.75)).toBeLessThan(0.01);
  });
  it('strong field', () => {
    expect(deflection(B_CRIT * (1 + 1e-6)).numeric!).toBeGreaterThan(Math.PI);
    expect(deflection(5).numeric).toBeNull();
  });
});

describe('clocks', () => {
  it('values at r=6', () => {
    expect(staticClockRate(6)).toBeCloseTo(Math.sqrt(2 / 3), 14);
    expect(circularClockRate(6)).toBeCloseTo(Math.sqrt(0.5), 14);
    expect(shadowAngularRadius(1e-3)).toBeCloseTo(B_CRIT * 1e-3, 14);
  });
});
