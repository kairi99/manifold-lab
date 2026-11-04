import { create } from 'zustand';
import { qMax } from './math';

export type PenroseMode = 'kn' | 'slice';

interface PenroseState {
  mode: PenroseMode; a: number; Q: number; m1: number; m2: number;
  set: (p: Partial<Omit<PenroseState, 'set'>>) => void;
}

/** a = a/m, Q = Q/m. `set` keeps a² + Q² ≤ 1 by clamping Q after any change. */
export const usePenrose = create<PenroseState>((set) => ({
  mode: 'kn', a: 0.6, Q: 0.4, m1: 36, m2: 29,
  set: (p) => set((s) => {
    const n = { ...s, ...p };
    return { ...p, Q: Math.min(n.Q, qMax(n.a)) };
  }),
}));
