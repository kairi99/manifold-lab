import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Vec3 } from '../math/types';

export type P2 = [number, number];
/** Diagram -> scene transform: x' = ox + sx x, y' = oy + sy y (flat diagram in the z = 0 plane). */
export interface Xf { sx: number; sy: number; ox: number; oy: number }
export const apply = (f: Xf, p: P2): Vec3 => [f.ox + f.sx * p[0], f.oy + f.sy * p[1], 0];

/** Polyline of diagram points; renders nothing for fewer than 2 points. */
export function CosmoLine({ pts, xf, color, width = 1.5, dashed = false, opacity = 1 }:
  { pts: P2[]; xf: Xf; color: string; width?: number; dashed?: boolean; opacity?: number }) {
  const { sx, sy, ox, oy } = xf;
  const p3 = useMemo(() => pts.filter((p) => isFinite(p[0]) && isFinite(p[1])).map((p) => apply({ sx, sy, ox, oy }, p)), [pts, sx, sy, ox, oy]);
  if (p3.length < 2) return null;
  return <Line points={p3} color={color} lineWidth={width} dashed={dashed} dashSize={0.06} gapSize={0.04} transparent={opacity < 1} opacity={opacity} />;
}
