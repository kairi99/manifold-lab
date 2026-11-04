import type { Surface } from './types';
import { makeSphere } from './surfaces/sphere';
import { makeTorus } from './surfaces/torus';
import { saddle, paraboloid } from './surfaces/graph';
import { makeCustomSurface, type CustomSpec } from './surfaces/custom';
import { DEFAULT_CUSTOM } from './surfaces/presets';

export * from './vec';
export * from './metric';
export { makeSphere, makeTorus, makeGraph, saddle, paraboloid } from './surfaces';

export const SURFACES: Record<string, Surface> = {
  sphere: makeSphere(),
  torus: makeTorus(),
  saddle,
  paraboloid,
};

/** The user's surface ('custom'); the store keeps this in sync and getSurface memoises per spec object. */
let custom: { spec: CustomSpec; surface: Surface | null } = { spec: DEFAULT_CUSTOM, surface: null };
export const setCustomSpec = (spec: CustomSpec) => { if (custom.spec !== spec) custom = { spec, surface: null }; };

export const getSurface = (id: string): Surface => {
  if (id === 'custom') return (custom.surface ??= makeCustomSurface(custom.spec));
  const s = SURFACES[id];
  if (!s) throw new Error(`unknown surface: ${id}`);
  return s;
};
