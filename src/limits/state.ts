import { create } from 'zustand';

export type LimitsView = 'status' | 'rotation' | 'tensions' | 'tests' | 'quantum';

/** Which Limits view is open. Each view keeps its own state in its own folder. */
export const useLimits = create<{ view: LimitsView; set: (p: { view: LimitsView }) => void }>((set) => ({
  view: 'status',
  set: (p) => set(p),
}));
