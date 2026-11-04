import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Surface, Vec2 } from '../math/types';
import { curvatureRange } from '../math/curvature';
import { buildSurfaceGeometry, uvToDomain } from './geom';
import SurfaceMesh from './SurfaceMesh';

const NEG = new THREE.Color('#2f6bff'), MID = new THREE.Color('#b4b8c0'), POS = new THREE.Color('#ff5a1f');
const WARM = new THREE.Color('#ff8a3d');

/** Diverging colour for K in [-scale, scale]: blue (<0) -> grey (0) -> red/orange (>0). */
export function curvatureColor(K: number, scale: number, out = new THREE.Color()): THREE.Color {
  const t = Math.max(-1, Math.min(1, K / scale));
  return out.copy(MID).lerp(t < 0 ? NEG : POS, Math.abs(t));
}

export const constantK = (r: { min: number; max: number }) => r.max - r.min < 1e-9;

export interface CurvatureMeshProps {
  surface: Surface;
  heatmap: boolean;
  onPointerDown?: (uv: Vec2) => void;
}

export default function CurvatureMesh({ surface: s, heatmap, onPointerDown }: CurvatureMeshProps) {
  const geometry = useMemo(() => {
    const nu = 128, nv = 64;
    const g = buildSurfaceGeometry(s, nu, nv);
    const r = curvatureRange(s);
    const scale = Math.max(Math.abs(r.min), Math.abs(r.max), 1e-12);
    const { u: du, v: dv } = s.domain;
    const col = new Float32Array((nu + 1) * (nv + 1) * 3);
    const c = new THREE.Color();
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const K = s.gaussK(du[0] + (i / nu) * (du[1] - du[0]), dv[0] + (j / nv) * (dv[1] - dv[0]));
        // constant K: one warm colour (grey if flat)
        if (constantK(r)) c.copy(Math.abs(r.max) < 1e-9 ? MID : r.max > 0 ? WARM : NEG);
        else if (Number.isFinite(K)) curvatureColor(K, scale, c);
        else c.copy(MID); // degenerate chart point (custom surfaces)
        c.toArray(col, (j * (nu + 1) + i) * 3);
      }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [s]);

  if (!heatmap) return <SurfaceMesh surface={s} onPointerDown={onPointerDown} />;
  const down = (e: ThreeEvent<PointerEvent>) => e.uv && onPointerDown?.(uvToDomain(s, e.uv));
  return (
    <mesh geometry={geometry} onPointerDown={down}>
      {/* polygonOffset pushes the mesh back so curves drawn on the surface (geodesic circle) are not hidden */}
      <meshStandardMaterial vertexColors side={2} roughness={0.55} metalness={0.05} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
    </mesh>
  );
}
