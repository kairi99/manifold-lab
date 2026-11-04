import { describe, expect, it } from 'vitest';
import { detJ, fromStereo, gSph, jacobian, pullbackStereo, sphPoint, stereoPoint, toStereo } from './charts';

const rnd = (i: number) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
const pts = Array.from({ length: 30 }, (_, i) => [0.1 + rnd(i) * (Math.PI - 0.2), rnd(i + 99) * 2 * Math.PI - Math.PI] as const);

describe('charts', () => {
  it('transition ∘ inverse = id and both charts give the same sphere point', () => {
    for (const [th, ph] of pts) {
      const [x, y] = toStereo(th, ph), [t2, p2] = fromStereo(x, y);
      expect(t2).toBeCloseTo(th, 10); expect(p2).toBeCloseTo(ph, 10);
      const a = sphPoint(th, ph), b = stereoPoint(x, y);
      a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 10));
    }
  });
  it('Jacobian matches finite differences, det formula holds', () => {
    const h = 1e-6;
    for (const [th, ph] of pts) {
      const J = jacobian(th, ph);
      const dth = toStereo(th + h, ph).map((v, i) => (v - toStereo(th - h, ph)[i]) / (2 * h));
      const dph = toStereo(th, ph + h).map((v, i) => (v - toStereo(th, ph - h)[i]) / (2 * h));
      expect(J[0][0]).toBeCloseTo(dth[0], 5); expect(J[1][0]).toBeCloseTo(dth[1], 5);
      expect(J[0][1]).toBeCloseTo(dph[0], 5); expect(J[1][1]).toBeCloseTo(dph[1], 5);
      expect(J[0][0] * J[1][1] - J[0][1] * J[1][0]).toBeCloseTo(detJ(th), 8);
    }
  });
  it('Jᵀ g_stereo J = g_spherical', () => {
    for (const [th, ph] of pts) {
      const P = pullbackStereo(th, ph), G = gSph(th);
      for (const i of [0, 1]) for (const j of [0, 1]) expect(P[i][j]).toBeCloseTo(G[i][j], 9);
    }
  });
});
