import { create } from 'zustand';
import type { Vec2 } from '../math/types';
import { getSurface, setCustomSpec } from '../math';
import { compileSpec, type CustomSpec } from '../math/surfaces/custom';
import { DEFAULT_CUSTOM } from '../math/surfaces/presets';
import { moduleFromHash } from './modules';

export type ModuleId = 'curves' | 'metric' | 'transport' | 'geodesics' | 'curvature' | 'fields' | 'relativity' | 'spacetime' | 'cosmos' | 'frontiers';
export type Lang = 'en' | 'es';
export type Theme = 'dark' | 'light';
export type InfoPage = 'technical' | 'legal';
export type PathKind = 'latitude' | 'triangle' | 'free';

export interface AppState {
  module: ModuleId;
  /** start page shown instead of a module; mirrors an empty URL hash */
  onHome: boolean;
  surfaceId: string; // 'sphere' | 'torus' | 'saddle' | 'paraboloid' | 'custom'
  customSpec: CustomSpec; // the user's surface, persisted under CUSTOM_KEY
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
  theoryOpen: boolean;
  /** UI language and colour theme, persisted under manifoldlab.lang / manifoldlab.theme */
  lang: Lang;
  theme: Theme;
  infoOpen: InfoPage | null;
  /** linked highlight between equations and the 3D scene: 'du' | 'dv' | 'V' | 'p' | 'g' | null */
  hl: string | null;
  /** chart (u,v) inset visible in surface modules */
  chartOpen: boolean;
  /** write Einstein sums out explicitly in equations */
  expandSums: boolean;
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
  // curvature in 4D (spacetime module); fields prefixed st* / gw* belong to that module
  stView: 'tensors' | 'tidal' | 'waves';
  stMetric: string; // SpacetimeMetric id
  stPlaying: boolean;
  stProgress: number; // 0..1 animation progress (tidal fall, wave phase)
  stParams: Record<string, number>; // metric parameters (missing keys use defaults)
  stEvent: number[] | null; // event coordinates; null = metric's default event
  stBody: string; // tidal view: 'bh10' or a BODIES black-hole id
  stR0: number; // tidal view: release radius r0 / M
  stLen: number; // tidal view: body length, m
  stPol: 'plus' | 'cross' | 'circ'; // waves view polarisation
  stAmp: number; // waves view display amplitude (exaggerated)
  gwDrive: 'mono' | 'gw150914'; // waves view: monochromatic wave or GW150914 NR template
  gwSet: 'prl' | 'gwtc1'; // GW150914 parameter set
  gwRawL1: boolean; // plot L1 unshifted/uninverted
  // causal structure & cosmology (cosmos module); fields prefixed cs* belong to that module
  csView: 'penrose' | 'cosmology';
  csPlaying: boolean;
  csProgress: number; // 0..1 animation progress
  csSpace: 'minkowski' | 'schwarzschild'; // Penrose diagram spacetime
  csPt: [number, number]; // probe event [X, T] in diagram coordinates
  csR0: number; // infall start radius / M
  csBody: string; // black-hole BODIES id for unit conversion ('' = geometric units only)
  csSet: string; // COSMO_SETS id the sliders started from
  csH0: number; // km/s/Mpc
  csOm: number;
  csOL: number;
  csObj: string; // COSMO_OBJECTS id
  csTime: 'conformal' | 'cosmic'; // vertical axis of the conformal diagram
  set: (p: Partial<AppState>) => void;
}

export const CUSTOM_KEY = 'manifoldlab.customSurface';

const isSpec = (o: unknown): o is CustomSpec => {
  const s = o as CustomSpec;
  return !!s && typeof s === 'object' && ['x', 'y', 'z', 'f', 'name'].every((k) => typeof (s as unknown as Record<string, unknown>)[k] === 'string')
    && (s.mode === 'parametric' || s.mode === 'graph') && Array.isArray(s.uRange) && Array.isArray(s.vRange) && Array.isArray(s.coords)
    && typeof s.params?.a === 'number' && typeof s.params?.b === 'number'
    && typeof s.periodicU === 'boolean' && typeof s.periodicV === 'boolean' && (s.twistU === undefined || typeof s.twistU === 'boolean');
};

/** Stored spec, or the default if missing, corrupted or no longer compiles. */
function loadCustom(): CustomSpec {
  try {
    const o: unknown = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? 'null');
    if (isSpec(o) && compileSpec(o).c) return o;
  } catch { /* corrupted or storage blocked */ }
  return DEFAULT_CUSTOM;
}

const initialSpec = loadCustom();
setCustomSpec(initialSpec);

/** Make `spec` the custom surface and select it. `reset` also moves p to a generic interior point. */
export function applyCustomSpec(spec: CustomSpec, reset = true) {
  setCustomSpec(spec);
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(spec)); } catch { /* storage blocked */ }
  const { u, v } = getSurface('custom').domain;
  useStore.setState(reset
    ? { customSpec: spec, surfaceId: 'custom', uv: [u[0] + 0.7 * (u[1] - u[0]), v[0] + 0.43 * (v[1] - v[0])], progress: 0, playing: false, freePoints: [], fieldId: '', fieldId2: '', latitude: 0.5, vector: [0.5, 0] }
    : { customSpec: spec });
}

const stored = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const nav = typeof navigator === 'undefined' ? undefined : navigator;
const startLang: Lang = (stored('manifoldlab.lang') as Lang | null) ?? (nav?.language?.toLowerCase().startsWith('es') ? 'es' : 'en');
const startTheme: Theme = (stored('manifoldlab.theme') as Theme | null)
  ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

const startModule = typeof location === 'undefined' ? null : moduleFromHash(location.hash);

export const useStore = create<AppState>((set) => ({
  module: startModule ?? 'metric',
  onHome: startModule === null,
  surfaceId: 'sphere',
  customSpec: initialSpec,
  uv: [Math.PI / 3, 0.5],
  vector: [0.5, 0.5],
  pathKind: 'latitude',
  latitude: Math.PI / 3,
  freePoints: [],
  progress: 0,
  playing: false,
  tourOpen: false,
  theoryOpen: false,
  lang: startLang === 'es' ? 'es' : 'en',
  theme: startTheme === 'light' ? 'light' : 'dark',
  infoOpen: null,
  hl: null,
  chartOpen: typeof window === 'undefined' || window.innerWidth > 900, // phones: collapsed, it would cover half the 3D view
  expandSums: false,
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
  stView: 'tensors',
  stMetric: 'schwarzschild',
  stPlaying: true,
  stProgress: 0,
  stParams: {},
  stEvent: null,
  stBody: 'bh10',
  stR0: 20,
  stLen: 2,
  stPol: 'plus',
  stAmp: 0.5,
  gwDrive: 'mono',
  gwSet: 'gwtc1',
  gwRawL1: false,
  csView: 'penrose',
  csPlaying: true,
  csProgress: 0,
  csSpace: 'schwarzschild',
  csPt: [1.2, 0.3],
  csR0: 10,
  csBody: 'sgr-a',
  csSet: 'planck2018',
  csH0: 67.66,
  csOm: 0.3111,
  csOL: 0.688809,
  csObj: 'jades-gs-z14-0',
  csTime: 'conformal',
  set: (p) => set(p),
}));
