import { create } from 'zustand';

export type FrontierView = 'problems' | 'csf' | 'ricci' | 'willmore' | 'penrose' | 'gauge';

/** Which Frontiers view is open. Each demo keeps its own state in its own folder. */
export const useFrontiers = create<{ view: FrontierView; set: (p: { view: FrontierView }) => void }>((set) => ({
  view: 'problems',
  set: (p) => set(p),
}));
