import type { CustomSpec } from './custom';

export interface CustomPreset { id: string; label: string; note: string; spec: CustomSpec }

const P = (
  id: string, label: string, note: string,
  x: string, y: string, z: string,
  uRange: [string, string], vRange: [string, string],
  extra: Partial<CustomSpec> = {},
): CustomPreset => ({
  id, label, note,
  spec: {
    name: label, mode: 'parametric', x, y, z, f: '0', uRange, vRange,
    periodicU: false, periodicV: false, coords: ['u', 'v'], params: { a: 1, b: 0 }, ...extra,
  },
});

export const PRESETS: CustomPreset[] = [
  P('catenoid', 'Catenoid', 'Minimal surface (H = 0), K = -1/cosh⁴u. Locally isometric to the helicoid below.',
    'cosh(u)*cos(v)', 'cosh(u)*sin(v)', 'u', ['-1.5', '1.5'], ['0', '2*pi'], { periodicV: true }),
  P('helicoid', 'Helicoid', 'Parametrised so that g is identical to the catenoid’s: same (u,v) gives the same K = -1/cosh⁴u (Bour). Bending one into the other is an isometry.',
    'sinh(u)*cos(v)', 'sinh(u)*sin(v)', 'v', ['-1.5', '1.5'], ['0', '2*pi']),
  P('pseudosphere', 'Pseudosphere', 'Tractroid of revolution: constant K = -1. The rim u = 0 is a cusp edge, so the range starts at 0.2.',
    'cos(v)/cosh(u)', 'sin(v)/cosh(u)', 'u-tanh(u)', ['0.2', '3'], ['0', '2*pi'], { periodicV: true }),
  P('ellipsoid', 'Ellipsoid', 'Semi-axes a, b, 1 (sliders). K > 0 everywhere; the (θ,φ)-type chart degenerates at the poles u = 0, π.',
    'a*sin(u)*cos(v)', 'b*sin(u)*sin(v)', 'cos(u)', ['0', 'pi'], ['0', '2*pi'], { periodicV: true, coords: ['\\theta', '\\varphi'], params: { a: 1.5, b: 1 } }),
  P('enneper', 'Enneper', 'Self-intersecting minimal surface, K = -4/(1+u²+v²)⁴ (H = 0).',
    'u-u^3/3+u*v^2', 'v-v^3/3+v*u^2', 'u^2-v^2', ['-1.3', '1.3'], ['-1.3', '1.3']),
  {
    id: 'monkey', label: 'Monkey saddle', note: 'Graph z = u³ - 3uv²: a triple saddle with a flat point (K = 0) at the origin, which is a zero of the gradient of index -2.',
    spec: { name: 'Monkey saddle', mode: 'graph', x: 'u', y: 'v', z: '0', f: 'u^3-3*u*v^2', uRange: ['-1', '1'], vRange: ['-1', '1'], periodicU: false, periodicV: false, coords: ['x', 'y'], params: { a: 1, b: 0 } },
  },
  P('mobius', 'Möbius band', 'Non-orientable: the unit normal flips sign after one trip around the loop. The seam u = 0 ≡ 2π is glued with v → -v, so geodesics and transport stop there and loops that cross it do not close.',
    '(1+v/2*cos(u/2))*cos(u)', '(1+v/2*cos(u/2))*sin(u)', 'v/2*sin(u/2)', ['0', '2*pi'], ['-1', '1']),
  P('dini', 'Dini’s surface', 'Twisted pseudosphere with constant K = -1/(a²+b²) (sliders: a = 1, b = 0.2 gives -0.96).',
    'a*cos(u)*sin(v)', 'a*sin(u)*sin(v)', 'a*(cos(v)+log(tan(v/2)))+b*u', ['0', '4*pi'], ['0.1', '2'], { params: { a: 1, b: 0.2 } }),
  P('bumpy', 'Bumpy sphere', 'Sphere of radius 1 + 0.3a·sin3θ·cos2φ: a = 0 is the round sphere. Watch K change sign.',
    '(1+0.3*a*sin(3*u)*cos(2*v))*sin(u)*cos(v)', '(1+0.3*a*sin(3*u)*cos(2*v))*sin(u)*sin(v)', '(1+0.3*a*sin(3*u)*cos(2*v))*cos(u)',
    ['0', 'pi'], ['0', '2*pi'], { periodicV: true, coords: ['\\theta', '\\varphi'], params: { a: 0.6, b: 0 } }),
];

export const DEFAULT_CUSTOM: CustomSpec = PRESETS[0].spec;
