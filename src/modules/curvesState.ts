import { create } from 'zustand';
import type { CurveId } from '../math/frenet';

export interface CurvesState {
  view: 'curves' | 'charts';
  preset: CurveId;
  a: number; b: number;
  /** curve parameter as a fraction of the range, 0..1 */
  u: number;
  playing: boolean;
  /** sphere point in the spherical chart */
  th: number; ph: number;
  set: (p: Partial<Omit<CurvesState, 'set'>>) => void;
}

export const useCurves = create<CurvesState>((set) => ({
  view: 'curves', preset: 'helix', a: 1, b: 0.4, u: 0.25, playing: false, th: 1.1, ph: 0.8,
  set: (p) => set(p),
}));
