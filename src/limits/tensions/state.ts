import { create } from 'zustand';

export type TensionMode = 'h0' | 's8' | 'de';
export interface TensionState {
  mode: TensionMode; a: string; b: string; w0: number; wa: number; z: number;
  set: (p: Partial<TensionState>) => void;
}
export const useTensions = create<TensionState>((set) => ({ mode: 'h0', a: 'planck', b: 'h0dn', w0: -0.75, wa: -0.86, z: 0.5, set: (p) => set(p) }));
