import { describe, expect, it } from 'vitest';
import {
  gravRedshift, redshiftWeakSI, shapiroDelaySI, shapiroRoundTripSI, shapiroGammaFactor,
  geodeticPrecessionSI, lenseThirringPolarSI,
} from './grEffects';
import { AU, GM_SUN, YEAR } from '../data/celestial';

const MAS_PER_YR = (r: number) => r * YEAR * (180 / Math.PI) * 3.6e6;
const GM_E = 3.986004418e14;

describe('grEffects', () => {
  it('gravRedshift', () => {
    expect(gravRedshift(6)).toBeCloseTo(1 / Math.sqrt(2 / 3) - 1, 12);
    expect(gravRedshift(6, 6)).toBeCloseTo(0, 12);
  });
  it('Pound–Rebka 22.5 m tower ≈ 2.46e-15', () => {
    const R = 6.371e6;
    expect(Math.abs(redshiftWeakSI(GM_E, R, R + 22.5)) / 2.46e-15).toBeCloseTo(1, 2);
    // and agrees with exact Schwarzschild formula
    const rs = (2 * GM_E) / 299792458 ** 2;
    expect(gravRedshift(R / (rs / 2), (R + 22.5) / (rs / 2)) / Math.abs(redshiftWeakSI(GM_E, R, R + 22.5))).toBeCloseTo(1, 6);
  });
  it('Shapiro: Earth–Mars superior conjunction ≈ 250 μs round trip', () => {
    const rt = shapiroRoundTripSI(GM_SUN, AU, 1.524 * AU, 6.957e8);
    expect(rt).toBeGreaterThan(200e-6);
    expect(rt).toBeLessThan(300e-6);
    expect(rt).toBeCloseTo(2 * shapiroDelaySI(GM_SUN, AU, 1.524 * AU, 6.957e8), 15);
    expect(shapiroGammaFactor(1)).toBe(1);
    expect(shapiroDelaySI(GM_SUN, AU, 1.524 * AU, 6.957e8, 0)).toBeCloseTo(rt / 4, 15);
  });
  it('Gravity Probe B', () => {
    const a = 7027.4e3;
    expect(MAS_PER_YR(geodeticPrecessionSI(GM_E, a)) / 6606).toBeCloseTo(1, 2);
    const lt = MAS_PER_YR(lenseThirringPolarSI(5.86e33, a));
    expect(lt / 40.8).toBeCloseTo(1, 2);          // formula value
    expect(Math.abs(lt / 39.2 - 1)).toBeLessThan(0.05); // GP-B quoted 39.2 (guide-star projection, ~cos 16°)
  });
});
