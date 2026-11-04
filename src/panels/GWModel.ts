import { GW150914_H1_TEMPLATE as TPL, GW150914_PRL, GW150914_GWTC1 } from '../data/gw150914';
import { chirpStrain, kerrQnm22, type ChirpRingdownParams } from '../math/gw';

export const T0 = TPL.t[0], T1 = TPL.t[TPL.t.length - 1];
export const TPL_MAX = Math.max(...TPL.h.map(Math.abs));
export const MONO_CYCLES = 3; // wave periods per 0..1 sweep

/** Linear interpolation of a series at t (clamped). */
export function sample(t: number[], h: number[], x: number): number {
  const dt = t[1] - t[0], f = Math.min(Math.max((x - t[0]) / dt, 0), t.length - 1 - 1e-9), i = Math.floor(f);
  return h[i] + (f - i) * (h[i + 1] - h[i]);
}
export const gwTime = (progress: number) => T0 + progress * (T1 - T0);

/** h+ and hx in display units (exaggerated by `amp`): monochromatic polarisation, or the GW150914 template as h+. */
export function gwDisplay(progress: number, drive: 'mono' | 'gw150914', pol: 'plus' | 'cross' | 'circ', amp: number) {
  if (drive === 'gw150914') return { hPlus: amp * sample(TPL.t, TPL.h, gwTime(progress)) / TPL_MAX, hCross: 0 };
  const ph = 2 * Math.PI * MONO_CYCLES * progress;
  return { hPlus: pol === 'cross' ? 0 : amp * Math.cos(ph), hCross: pol === 'plus' ? 0 : amp * (pol === 'circ' ? Math.sin(ph) : Math.cos(ph)) };
}

/** Quantities derived from a parameter set (source-frame masses, redshifted to the detector frame by 1+z). */
export function gwDerived(set: 'prl' | 'gwtc1') {
  const P = set === 'prl' ? GW150914_PRL : GW150914_GWTC1, z = P.z.value;
  const mTot = P.m1.value + P.m2.value, mc = (P.m1.value * P.m2.value) ** 0.6 / mTot ** 0.2;
  const qnm = kerrQnm22(P.mFinal.value * (1 + z), P.spinFinal.value);
  const cp: ChirpRingdownParams = { mcDet: mc * (1 + z), dMpc: P.distance.value, inclination: 0, mFinalDet: P.mFinal.value * (1 + z), finalSpin: P.spinFinal.value };
  return { P, z, mTot, mc, qnm, cp, fChirp: (t: number) => chirpStrain(cp, t).f };
}
