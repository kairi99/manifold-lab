import { create } from 'zustand';
import { GALAXIES } from './data';
import { A0_DEFAULT, fitHalo, type HaloKind, type Model, type Params } from './math';

// fit the default galaxy at creation so the first draw already shows the best-fit halo
const P0: Params = { yd: 0.5, yb: 0.7, halo: 'iso', logRho: 7.5, rs: 3, a0: A0_DEFAULT };
const F0 = fitHalo(GALAXIES[0], P0);

export interface RotState {
  gal: string; yd: number; yb: number; halo: HaloKind; logRho: number; rs: number; a0: number;
  drive: Model; playing: boolean; resetTick: number;
  fits: Partial<Record<HaloKind, { logRho: number; rs: number; chi2Dof: number }>>;
  set: (p: Partial<RotState>) => void;
}

export const useRot = create<RotState>((set) => ({
  gal: 'NGC3198', yd: 0.5, yb: 0.7, halo: 'iso', logRho: F0.logRho, rs: F0.rs, a0: A0_DEFAULT,
  drive: 'obs', playing: !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, resetTick: 0, fits: { iso: F0 },
  set: (p) => set(p),
}));
