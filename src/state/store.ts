import { create } from 'zustand';
import type { Vec2 } from '../math/types';

export type ModuleId = 'metric' | 'transport' | 'geodesics' | 'curvature' | 'fields';
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
  // geodesics
  geoCount: number; // geodesics in the fan (1 = single)
  geoSpread: number; // total fan opening angle, radians
  geoLength: number; // arc length to integrate
  geoProgress: number; // 0..1 reveal along the length
  geoPlaying: boolean;
  // curvature
  curvRho: number; // geodesic-circle radius
  curvShow: { heatmap: boolean; principal: boolean; circle: boolean };
  // vector fields
  fieldId: string; // primary field X ('' = first preset for the surface)
  fieldId2: string; // second field Y for the Lie bracket
  showFibers: boolean; // draw tangent-plane discs (fibres of TM)
  flowPlaying: boolean;
  flowPhase: number; // particle animation phase in [0,1)
  commT: number; // flow-commutator parameter t
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
  geoCount: 9,
  geoSpread: Math.PI / 6,
  geoLength: Math.PI,
  geoProgress: 1,
  geoPlaying: false,
  curvRho: 0.5,
  curvShow: { heatmap: true, principal: true, circle: true },
  fieldId: '',
  fieldId2: '',
  showFibers: false,
  flowPlaying: true,
  flowPhase: 0,
  commT: 0.3,
  set: (p) => set(p),
}));
