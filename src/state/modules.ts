import type { ModuleId } from './store';

/** Modules that work on the selected 2D surface (point p, vector V, keyboard control). */
export const SURFACE_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>(['metric', 'transport', 'geodesics', 'curvature', 'fields']);

export interface ModuleInfo { id: ModuleId; label: string; blurb: string; group: 'surfaces' | 'spacetime' }

/** Nav order; `blurb` is the one-line description on the start page. */
export const MODULES: ModuleInfo[] = [
  { id: 'metric', label: 'Metric & Tangent Spaces', group: 'surfaces',
    blurb: 'Drag a point over a surface and watch its tangent plane, the metric and the Christoffel symbols change.' },
  { id: 'transport', label: 'Parallel Transport', group: 'surfaces',
    blurb: 'Carry a vector around a closed loop and measure how far it turns: holonomy and Gauss–Bonnet.' },
  { id: 'geodesics', label: 'Geodesics', group: 'surfaces',
    blurb: 'Shoot the straightest curves from a point and see curvature focus or spread them.' },
  { id: 'curvature', label: 'Curvature', group: 'surfaces',
    blurb: 'Paint Gaussian curvature on the surface and check the Theorema Egregium live.' },
  { id: 'fields', label: 'Vector Fields & TM', group: 'surfaces',
    blurb: 'Flows, Killing fields, Lie brackets and the Poincaré–Hopf theorem on the tangent bundle.' },
  { id: 'relativity', label: 'Relativity: Schwarzschild & Kerr', group: 'spacetime',
    blurb: 'Orbits, light bending and black-hole shadows, compared with Mercury, S2, M87* and more.' },
  { id: 'spacetime', label: 'Curvature in 4D', group: 'spacetime',
    blurb: 'Exact Riemann, Ricci and Einstein tensors, tidal forces and the GW150914 gravitational wave.' },
  { id: 'cosmos', label: 'Causal Structure & Cosmology', group: 'spacetime',
    blurb: 'Penrose diagrams, a fall through the horizon, and the conformal diagram of our universe.' },
];

/** `#metric` → 'metric'; anything else (including no hash) means the start page. */
export function moduleFromHash(hash: string): ModuleId | null {
  const id = hash.replace(/^#/, '');
  return MODULES.some((m) => m.id === id) ? (id as ModuleId) : null;
}
