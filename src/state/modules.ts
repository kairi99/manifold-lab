import type { ModuleId } from './store';

/** Modules that work on the selected 2D surface (point p, vector V, keyboard control). */
export const SURFACE_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>(['metric', 'transport', 'geodesics', 'curvature', 'fields']);

export interface ModuleInfo { id: ModuleId; label: string; labelEs: string; blurb: string; blurbEs: string; group: 'surfaces' | 'spacetime' }

/** Nav order; `blurb` is the one-line description on the start page. */
export const MODULES: ModuleInfo[] = [
  { id: 'metric', label: 'Metric & Tangent Spaces', labelEs: 'Métrica y espacios tangentes', group: 'surfaces',
    blurbEs: 'Arrastra un punto sobre una superficie y observa cómo cambian su plano tangente, la métrica y los símbolos de Christoffel.',
    blurb: 'Drag a point over a surface and watch its tangent plane, the metric and the Christoffel symbols change.' },
  { id: 'transport', label: 'Parallel Transport', labelEs: 'Transporte paralelo', group: 'surfaces',
    blurbEs: 'Lleva un vector alrededor de un lazo cerrado y mide cuánto gira: holonomía y Gauss–Bonnet.',
    blurb: 'Carry a vector around a closed loop and measure how far it turns: holonomy and Gauss–Bonnet.' },
  { id: 'geodesics', label: 'Geodesics', labelEs: 'Geodésicas', group: 'surfaces',
    blurbEs: 'Lanza las curvas más rectas desde un punto y mira cómo la curvatura las enfoca o las separa.',
    blurb: 'Shoot the straightest curves from a point and see curvature focus or spread them.' },
  { id: 'curvature', label: 'Curvature', labelEs: 'Curvatura', group: 'surfaces',
    blurbEs: 'Pinta la curvatura de Gauss sobre la superficie y comprueba el Theorema Egregium en vivo.',
    blurb: 'Paint Gaussian curvature on the surface and check the Theorema Egregium live.' },
  { id: 'fields', label: 'Vector Fields & TM', labelEs: 'Campos vectoriales y TM', group: 'surfaces',
    blurbEs: 'Flujos, campos de Killing, corchetes de Lie y el teorema de Poincaré–Hopf sobre el fibrado tangente.',
    blurb: 'Flows, Killing fields, Lie brackets and the Poincaré–Hopf theorem on the tangent bundle.' },
  { id: 'relativity', label: 'Relativity: Schwarzschild & Kerr', labelEs: 'Relatividad: Schwarzschild y Kerr', group: 'spacetime',
    blurbEs: 'Órbitas, curvatura de la luz y sombras de agujeros negros, comparadas con Mercurio, S2, M87* y más.',
    blurb: 'Orbits, light bending and black-hole shadows, compared with Mercury, S2, M87* and more.' },
  { id: 'spacetime', label: 'Curvature in 4D', labelEs: 'Curvatura en 4D', group: 'spacetime',
    blurbEs: 'Tensores exactos de Riemann, Ricci y Einstein, fuerzas de marea y la onda gravitacional GW150914.',
    blurb: 'Exact Riemann, Ricci and Einstein tensors, tidal forces and the GW150914 gravitational wave.' },
  { id: 'cosmos', label: 'Causal Structure & Cosmology', labelEs: 'Estructura causal y cosmología', group: 'spacetime',
    blurbEs: 'Diagramas de Penrose, una caída a través del horizonte y el diagrama conforme de nuestro universo.',
    blurb: 'Penrose diagrams, a fall through the horizon, and the conformal diagram of our universe.' },
];

/** `#metric` → 'metric'; anything else (including no hash) means the start page. */
export function moduleFromHash(hash: string): ModuleId | null {
  const id = hash.replace(/^#/, '');
  return MODULES.some((m) => m.id === id) ? (id as ModuleId) : null;
}
