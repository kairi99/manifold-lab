import { create } from 'zustand';

type S = {
  B: number; lam: number; ra: number; rb: number;
  order: 'ab' | 'ba'; gauge: boolean;
  playing: boolean; t: number; // t is published by the scene at ~10 Hz while playing
  set: (p: Partial<S>) => void;
};
export const useGauge = create<S>((set) => ({
  B: 1.5, lam: 0.8, ra: 0.8, rb: 0.6, order: 'ab', gauge: false, playing: false, t: 0,
  set: (p) => set(p),
}));
