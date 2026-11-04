import { create } from 'zustand';
import { orderAxes, type V3 } from './math';

export type WillmoreMode = 'energy' | 'umbilics';

type S = {
  mode: WillmoreMode;
  c: number;       // torus ratio R/r
  inv: number;     // inversion slider, 0 = no inversion
  ax: V3;          // ellipsoid semi-axes, always a ≥ b ≥ c
  set: (p: Partial<Pick<S, 'mode' | 'c' | 'inv'>>) => void;
  setAxis: (k: 0 | 1 | 2, v: number) => void;
};

export const useWillmore = create<S>((set) => ({
  mode: 'energy',
  c: 1.8,
  inv: 0,
  ax: [1.5, 1.1, 0.7],
  set: (p) => set(p),
  setAxis: (k, v) => set((s) => { const a: V3 = [...s.ax]; a[k] = v; return { ax: orderAxes(a, k) }; }),
}));
