import type { CustomSpec } from './custom';

export interface CustomPreset { id: string; label: string; note: string; labelEs: string; noteEs: string; spec: CustomSpec;
  /** range of slider `a` for presets that demonstrate isometric bending (shows the Bending section in the Curvature module) */
  bend?: [number, number] }


const ES: Record<string, [string, string]> = {
  catenoid: ['Catenoide', 'Superficie mínima (H = 0), K = -1/cosh⁴u. Localmente isométrica al helicoide de más abajo.'],
  helicoid: ['Helicoide', 'Parametrizado de modo que g coincide con la del catenoide: el mismo (u,v) da el mismo K = -1/cosh⁴u (Bour). Deformar una en la otra es una isometría.'],
  pseudosphere: ['Pseudoesfera', 'Tractroide de revolución: K = -1 constante. El borde u = 0 es una arista de retroceso, por eso el rango empieza en 0.2.'],
  ellipsoid: ['Elipsoide', 'Semiejes a, b, 1 (deslizadores). K > 0 en todas partes; la carta de tipo (θ,φ) degenera en los polos u = 0, π.'],
  enneper: ['Superficie de Enneper', 'Superficie mínima con autointersecciones, K = -4/(1+u²+v²)⁴ (H = 0).'],
  monkey: ['Silla de mono', 'Gráfica z = u³ - 3uv²: una silla triple con un punto plano (K = 0) en el origen, que es un cero del gradiente de índice -2.'],
  mobius: ['Banda de Möbius', 'No orientable: la normal unitaria cambia de signo tras una vuelta completa. La costura u = 0 ≡ 2π se pega con v → -v: las geodésicas la cruzan, y un vector transportado una vez alrededor del núcleo vuelve con su componente v invertida (dos vueltas lo devuelven igual).'],
  dini: ['Superficie de Dini', 'Pseudoesfera retorcida con K = -1/(a²+b²) constante (deslizadores: a = 1, b = 0.2 da -0.96).'],
  'bend-cat': ['Catenoide ↔ helicoide', 'Familia asociada: la métrica es cosh²v(du²+dv²) para todo a, así que K = -1/cosh⁴v no cambia mientras a recorre de 0 (helicoide) a π/2 (catenoide). Es una flexión isométrica.'],
  'bend-roll': ['Hoja que se enrolla', 'Un plano (K = 0) enrollado sobre un cilindro de radio 1/a: la métrica sigue siendo du²+dv² para todo a. Se dobla sin estirar.'],
  bumpy: ['Esfera abollada', 'Esfera de radio 1 + 0.3a·sin²θ·cos2φ: a = 0 es la esfera redonda. Observa cómo K cambia de signo.'],
};

const P = (
  id: string, label: string, note: string,
  x: string, y: string, z: string,
  uRange: [string, string], vRange: [string, string],
  extra: Partial<CustomSpec> = {},
): CustomPreset => ({
  id, label, note, labelEs: ES[id][0], noteEs: ES[id][1],
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
    'a*sin(u)*cos(v)', 'b*sin(u)*sin(v)', 'cos(u)', ['0', 'pi'], ['0', '2*pi'], { periodicV: true, coords: ['\\theta', '\\varphi'], params: { a: 1.5, b: 1 }, euler: 2 }),
  P('enneper', 'Enneper', 'Self-intersecting minimal surface, K = -4/(1+u²+v²)⁴ (H = 0).',
    'u-u^3/3+u*v^2', 'v-v^3/3+v*u^2', 'u^2-v^2', ['-1.3', '1.3'], ['-1.3', '1.3']),
  {
    id: 'monkey', labelEs: ES.monkey[0], noteEs: ES.monkey[1], label: 'Monkey saddle', note: 'Graph z = u³ - 3uv²: a triple saddle with a flat point (K = 0) at the origin, which is a zero of the gradient of index -2.',
    spec: { name: 'Monkey saddle', mode: 'graph', x: 'u', y: 'v', z: '0', f: 'u^3-3*u*v^2', uRange: ['-1', '1'], vRange: ['-1', '1'], periodicU: false, periodicV: false, coords: ['x', 'y'], params: { a: 1, b: 0 } },
  },
  P('mobius', 'Möbius band', 'Non-orientable: the unit normal flips sign after one trip around the loop. The seam u = 0 ≡ 2π is glued with v → -v: geodesics cross it, and a vector transported once around the core returns with its v-component reversed (two trips restore it).',
    '(1+v/2*cos(u/2))*cos(u)', '(1+v/2*cos(u/2))*sin(u)', 'v/2*sin(u/2)', ['0', '2*pi'], ['-1', '1'], { twistU: true }),
  P('dini', 'Dini’s surface', 'Twisted pseudosphere with constant K = -1/(a²+b²) (sliders: a = 1, b = 0.2 gives -0.96).',
    'a*cos(u)*sin(v)', 'a*sin(u)*sin(v)', 'a*(cos(v)+log(tan(v/2)))+b*u', ['0', '4*pi'], ['0.1', '2'], { params: { a: 1, b: 0.2 } }),
  P('bumpy', 'Bumpy sphere', 'Sphere of radius 1 + 0.3a·sin²θ·cos2φ: a = 0 is the round sphere. Watch K change sign.',
    '(1+0.3*a*sin(u)^2*cos(2*v))*sin(u)*cos(v)', '(1+0.3*a*sin(u)^2*cos(2*v))*sin(u)*sin(v)', '(1+0.3*a*sin(u)^2*cos(2*v))*cos(u)',
    ['0', 'pi'], ['0', '2*pi'], { periodicV: true, coords: ['\\theta', '\\varphi'], params: { a: 1.2, b: 0 }, euler: 2 }),
  {
    ...P('bend-cat', 'Catenoid ↔ helicoid', 'Associate family: the metric is cosh²v(du²+dv²) for every a, so K = -1/cosh⁴v is unchanged while a sweeps from 0 (helicoid) to π/2 (catenoid). An isometric bending.',
      'cos(a)*sinh(v)*sin(u)+sin(a)*cosh(v)*cos(u)', '-cos(a)*sinh(v)*cos(u)+sin(a)*cosh(v)*sin(u)', 'u*cos(a)+v*sin(a)',
      ['-pi', 'pi'], ['-1.5', '1.5'], { params: { a: 0.8, b: 0 } }),
    bend: [0, Math.PI / 2],
  },
  {
    ...P('bend-roll', 'Rolling sheet', 'A flat sheet (K = 0) rolled onto a cylinder of radius 1/a: the metric stays du²+dv² for every a. Bending without stretching.',
      'sin(a*u)/a', 'v', '(1-cos(a*u))/a', ['-2', '2'], ['-1', '1'], { params: { a: 0.5, b: 0 } }),
    bend: [0.05, 1.5],
  },
];

export const DEFAULT_CUSTOM: CustomSpec = PRESETS[0].spec;
