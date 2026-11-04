import type { ModuleId } from './store';

/** Modules that work on the selected 2D surface (point p, vector V, keyboard control). */
export const SURFACE_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>(['metric', 'transport', 'geodesics', 'curvature', 'fields']);
