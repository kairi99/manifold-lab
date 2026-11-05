import { TASKS } from '../tour/tasks';

/** Learning path: order and prerequisites, keyed by module id. A module appears only if registered in MODULES. */
export interface PathStep { id: string; needs: string[] }

export const PATH: PathStep[] = [
  { id: 'curves', needs: [] },
  { id: 'metric', needs: ['curves'] },
  { id: 'transport', needs: ['metric'] },
  { id: 'geodesics', needs: ['metric'] },
  { id: 'curvature', needs: ['transport', 'geodesics'] },
  { id: 'fields', needs: ['metric'] },
  { id: 'relativity', needs: ['geodesics', 'curvature'] },
  { id: 'spacetime', needs: ['curvature', 'relativity'] },
  { id: 'cosmos', needs: ['relativity'] },
  { id: 'limits', needs: ['relativity', 'cosmos'] },
  { id: 'frontiers', needs: ['curvature', 'relativity'] },
];

/** Blurb for modules that are not in MODULES' own list yet (rendered only once registered). */
export const EXTRA_COPY: Record<string, { label: string; labelEs: string; blurb: string; blurbEs: string }> = {
  curves: { label: 'Curves & Charts', labelEs: 'Curvas y cartas',
    blurb: 'Walk along a space curve with its Frenet frame, and see how charts give a surface coordinates.',
    blurbEs: 'Recorre una curva alabeada con su triedro de Frenet y mira cómo las cartas dan coordenadas a una superficie.' },
};

/** Short names for the "Needs:" line. */
export const SHORT: Record<string, [string, string]> = {
  curves: ['Curves', 'Curvas'], metric: ['Metric', 'Métrica'], transport: ['Transport', 'Transporte'], geodesics: ['Geodesics', 'Geodésicas'],
  curvature: ['Curvature', 'Curvatura'], fields: ['Fields', 'Campos'], relativity: ['Relativity', 'Relatividad'], spacetime: ['4D curvature', 'Curvatura 4D'], cosmos: ['Cosmos', 'Cosmos'], limits: ['Limits', 'Límites'], frontiers: ['Frontiers', 'Fronteras'],
};

export const TASKS_KEY = 'manifoldlab.tasksDone';

export function loadDone(): string[] {
  try { const v = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Fraction of a module's tasks that are done, plus the counts. */
export function progressOf(module: string, done: string[]) {
  const all = TASKS.filter((t) => (t.module as string) === module);
  const n = all.filter((t) => done.includes(t.id)).length;
  return { n, total: all.length, frac: all.length ? n / all.length : 0 };
}
