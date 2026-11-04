// Shared cosmology state -> numbers/diagram for CosmoScene and CosmoPanel.
import { useStore } from '../state/store';
import { COSMO_OBJECTS, COSMO_SETS } from '../data/cosmology';
import {
  age, angularDiameterDistance, comovingDistance, conformalDiagram, curvature, distanceModulus, hubbleRate, luminosityDistance,
  lookbackTime, mpcToGly, C_KMS, type ConformalDiagram, type CosmoParams,
} from '../math/cosmology';

export const setById = (id: string) => COSMO_SETS.find((s) => s.id === id) ?? COSMO_SETS[0];
export const objById = (id: string) => COSMO_OBJECTS.find((o) => o.id === id) ?? COSMO_OBJECTS[0];

/** Slider values with the radiation density of the chosen set. */
export function useCosmoParams(): CosmoParams {
  const set = useStore((s) => s.csSet), H0 = useStore((s) => s.csH0), Om = useStore((s) => s.csOm), OL = useStore((s) => s.csOL);
  return { H0, Om, Or: setById(set).params.Or, OL };
}

/** Message if the model has no big bang or recollapses within a < 1000 (scale-factor scan), else null. */
export function validity(p: CosmoParams): string | null {
  if (!(p.H0 > 0) || p.Om + p.Or <= 0) return 'Needs H0 > 0 and some matter or radiation.';
  const ok = curvature(p);
  for (let i = 0; i <= 600; i++) {
    const a = 1e-4 * 1e7 ** (i / 600);
    if (p.Or + p.Om * a + ok * a * a + p.OL * a ** 4 <= 0) {
      return a < 1
        ? `No big bang: this model bounces at a ≈ ${a.toPrecision(2)} (H² = 0 before the present), so there is no finite age. Lower Ω_Λ or raise Ω_m.`
        : `This model recollapses (H = 0 at a ≈ ${a.toPrecision(2)}, a Big Crunch). The conformal diagram and event horizon assume expansion forever; lower Ω_m or raise Ω_Λ.`;
    }
  }
  return null;
}

let cache: { key: string; d: ConformalDiagram } | null = null;
export const REDSHIFTS = [...new Set(COSMO_OBJECTS.map((o) => o.z))].sort((a, b) => a - b);
/** Conformal diagram (Gly, Gyr), memoised on the last parameter set so Scene and Panel share one computation. */
export function diagramFor(p: CosmoParams, time: 'conformal' | 'cosmic'): ConformalDiagram {
  const key = `${p.H0}|${p.Om}|${p.Or}|${p.OL}|${time}`;
  if (cache?.key !== key) cache = { key, d: conformalDiagram(p, { redshifts: REDSHIFTS, time, n: 120 }) };
  return cache.d;
}

export function objectNumbers(z: number, p: CosmoParams) {
  const a = 1 / (1 + z), dC = comovingDistance(z, p);
  const vNow = (p.H0 * dC) / C_KMS;                  // v = H0 D_C today, in c
  const vThen = (hubbleRate(a, p) * a * dC) / C_KMS; // v = H(a_e) a_e D_C at emission, in c
  return {
    ageNow: age(0, p), ageThen: age(z, p), lookback: lookbackTime(z, p),
    dC, dL: luminosityDistance(z, p), dA: angularDiameterDistance(z, p), mu: distanceModulus(z, p), vNow, vThen, dCgly: mpcToGly(dC),
  };
}
