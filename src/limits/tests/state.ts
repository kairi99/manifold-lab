import { create } from 'zustand';

export type TestsMode = 'history' | 'ppn';
interface S { mode: TestsMode; gamma: number; beta: number; useBD: boolean; omega: number; sel: string | null; set: (p: Partial<Omit<S, 'set'>>) => void }
export const useTests = create<S>((set) => ({ mode: 'history', gamma: 1, beta: 1, useBD: false, omega: 1000, sel: null, set: (p) => set(p) }));
