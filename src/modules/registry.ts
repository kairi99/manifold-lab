import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ModuleId } from '../state/store';

type View = LazyExoticComponent<ComponentType>;

/** Each module is its own chunk, loaded the first time its tab opens (Scene and Panel share the chunk). */
function load<M>(imp: () => Promise<M>, scene: keyof M, panel: keyof M): { Scene: View; Panel: View } {
  return {
    Scene: lazy(() => imp().then((m) => ({ default: m[scene] as ComponentType }))),
    Panel: lazy(() => imp().then((m) => ({ default: m[panel] as ComponentType }))),
  };
}

export const MODULE_VIEWS: Record<ModuleId, { Scene: View; Panel: View }> = {
  metric: load(() => import('./MetricModule'), 'MetricScene', 'MetricPanel'),
  transport: load(() => import('./TransportModule'), 'TransportScene', 'TransportPanel'),
  geodesics: load(() => import('./GeodesicModule'), 'GeodesicScene', 'GeodesicPanel'),
  curvature: load(() => import('./CurvatureModule'), 'CurvatureScene', 'CurvaturePanel'),
  fields: load(() => import('./FieldsModule'), 'FieldsScene', 'FieldsPanel'),
  relativity: load(() => import('./RelativityModule'), 'RelativityScene', 'RelativityPanel'),
};
