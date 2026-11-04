import type { Surface } from './types';
import { makeSphere } from './surfaces/sphere';
import { makeTorus } from './surfaces/torus';
import { saddle, paraboloid } from './surfaces/graph';

export * from './vec';
export * from './metric';
export { makeSphere, makeTorus, makeGraph, saddle, paraboloid } from './surfaces';

export const SURFACES: Record<string, Surface> = {
  sphere: makeSphere(),
  torus: makeTorus(),
  saddle,
  paraboloid,
};

export const getSurface = (id: string): Surface => {
  const s = SURFACES[id];
  if (!s) throw new Error(`unknown surface: ${id}`);
  return s;
};
