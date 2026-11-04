import { create } from 'zustand';
import type { Vec2 } from '../math/types';

export type ModuleId = 'metric' | 'transport';
export type PathKind = 'latitude' | 'triangle' | 'free';

export interface AppState {
  module: ModuleId;
  surfaceId: string;
  /** current point p in parameter coords */
  uv: Vec2;
  /** tangent vector components V^u, V^v at p */
  vector: Vec2;
  // transport
  pathKind: PathKind;
  latitude: number; // θ0 in radians (sphere latitude loop)
  freePoints: Vec2[]; // clicked control points for free loop
  progress: number; // 0..1 along path
  playing: boolean;
  tourOpen: boolean;
  set: (p: Partial<AppState>) => void;
}

export const useStore = create<AppState>((set) => ({
  module: 'metric',
  surfaceId: 'sphere',
  uv: [Math.PI / 3, 0.5],
  vector: [0.5, 0.5],
  pathKind: 'latitude',
  latitude: Math.PI / 3,
  freePoints: [],
  progress: 0,
  playing: false,
  tourOpen: false,
  set: (p) => set(p),
}));
