import { create } from 'zustand';

export type QMode = 'hawking' | 'lambda' | 'scales';
interface QState { mode: QMode; logM: number; logE: number; logM3: number; set: (p: Partial<Omit<QState, 'set'>>) => void }

/** logM: log10 of mass in kg (Hawking); logE: log10 of cutoff in eV; logM3: mass for the curvature dial. */
export const useQuantum = create<QState>((set) => ({ mode: 'hawking', logM: 30.3, logE: 28.09, logM3: 30.3, set: (p) => set(p) }));
