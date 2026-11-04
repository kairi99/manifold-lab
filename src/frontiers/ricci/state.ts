import { create } from 'zustand';
import type { Kind } from './math';

type S = { kind: Kind; depth: number; rescale: boolean; playing: boolean; p: number; speed: number; set: (p: Partial<Omit<S, 'set'>>) => void };

/** p in [0,1] is the position along the common time axis [0, max end time of the two flows]. */
export const useRicci = create<S>((set) => ({
  kind: 'dumbbell', depth: 0.8, rescale: true, playing: false, p: 0, speed: 1,
  set: (p) => set(p),
}));
