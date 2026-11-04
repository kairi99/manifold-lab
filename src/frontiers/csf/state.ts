import { create } from 'zustand';
import { makeFlow, preset, type Flow, type PresetId } from './math';

type S = {
  preset: PresetId | 'free'; playing: boolean; speed: number; draw: boolean; warn: boolean;
  flow: Flow; rev: number; // `flow` mutates in place; `rev` is bumped (~10 Hz) so the panel re-renders
  load: (p: PresetId | 'free', poly?: Float64Array) => void; set: (p: Partial<S>) => void;
};
export const useCsf = create<S>((set, get) => ({
  preset: 'flower', playing: false, speed: 1, draw: false, warn: false,
  flow: makeFlow(preset('flower')), rev: 0,
  load: (p, poly) => set({ preset: p, flow: makeFlow(poly ?? preset(p as PresetId)), playing: false, warn: false, rev: get().rev + 1 }),
  set: (p) => set(p),
}));
