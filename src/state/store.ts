import { create } from 'zustand';
import type { Vec2 } from '../math/types';

export type ModuleId = 'metric' | 'transport' | 'geodesics' | 'curvature' | 'fields' | 'relativity';
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
  // relativity (geometric units G=c=1, lengths in units of M)
  grView: 'orbits' | 'light' | 'flamm' | 'kerr' | 'image' | 'clocks';
  grBody: string; // CelestialBody id ('' = generic black hole, M = 1)
  grOrbit: string; // OrbitPreset id or 'custom'
  grRp: number; // custom periapsis r_p / M
  grRa: number; // custom apoapsis r_a / M
  grB: number; // impact parameter b / M for the central light ray
  grShowFlamm: boolean; // draw orbits lifted onto the Flamm paraboloid
  grPlaying: boolean;
  grProgress: number; // 0..1 along the integrated orbit
  // Kerr / imaging (geometric units, M = 1)
  grSpin: number; // a/M in [0, 0.998]
  grRetro: boolean; // retrograde orbit (against the spin)
  grIncl: number; // observer inclination, degrees from the spin axis (0 = face-on)
  grImgRes: number; // ray-traced image width = height, pixels
  grImgTarget: 'disk' | 'sky' | 'both';
  grClockPreset: string; // id of a redshift / Shapiro / frame-dragging preset ('' = none)
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
  grView: 'orbits',
  grBody: '',
  grOrbit: 'custom',
  grRp: 10,
  grRa: 30,
  grB: 6,
  grShowFlamm: true,
  grPlaying: true,
  grProgress: 0,
  grSpin: 0.9,
  grRetro: false,
  grIncl: 75,
  grImgRes: 160,
  grImgTarget: 'both',
  grClockPreset: '',
  set: (p) => set(p),
}));
