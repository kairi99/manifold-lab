import { describe, expect, it } from 'vitest';
import { totalCurvature } from './totalCurvature';
import { makeSphere } from './surfaces/sphere';
import { makeTorus } from './surfaces/torus';
import { makeCustomSurface } from './surfaces/custom';
import { PRESETS } from './surfaces/presets';

const preset = (id: string) => makeCustomSurface(PRESETS.find((p) => p.id === id)!.spec);

describe('Gauss–Bonnet total curvature', () => {
  it('sphere 4π (R irrelevant)', () => {
    expect(totalCurvature(makeSphere())).toBeCloseTo(4 * Math.PI, 3);
    expect(totalCurvature(makeSphere(2.5))).toBeCloseTo(4 * Math.PI, 3);
  });
  it('torus 0', () => expect(totalCurvature(makeTorus())).toBeCloseTo(0, 3));
  it('ellipsoid 4π', () => {
    const s = preset('ellipsoid');
    expect(s.euler).toBe(2);
    expect(Math.abs(totalCurvature(s) - 2 * Math.PI * s.euler!)).toBeLessThan(1e-3);
  });
  it('bumpy sphere 4π', () => {
    const s = preset('bumpy');
    expect(Math.abs(totalCurvature(s) - 4 * Math.PI)).toBeLessThan(1e-3);
  });
  it('euler flags', () => {
    expect(makeSphere().euler).toBe(2);
    expect(makeTorus().euler).toBe(0);
  });
});
