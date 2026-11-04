import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import type { Surface, Vec2, Vec3 } from '../math/types';
import { buildSurfaceGeometry, uvToDomain, unitNormal } from './geom';

export interface SurfaceMeshProps {
  surface: Surface;
  opacity?: number;
  color?: string;
  showGrid?: boolean;
  /** Called with (u,v) in domain coords of the hit point. */
  onPointerDown?: (uv: Vec2, e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (uv: Vec2, e: ThreeEvent<PointerEvent>) => void;
}

const NLINES = 12, SAMPLES = 96, OFFSET = 0.004;

export default function SurfaceMesh({
  surface: s, opacity = 0.55, color = '#6aa5ff', showGrid = true, onPointerDown, onPointerMove,
}: SurfaceMeshProps) {
  const geometry = useMemo(() => buildSurfaceGeometry(s, 128, 64), [s]);
  const lines = useMemo(() => {
    const { u: du, v: dv } = s.domain;
    const pt = (u: number, v: number): Vec3 => {
      const p = s.position(u, v), n = unitNormal(s, u, v);
      return [p[0] + n[0] * OFFSET, p[1] + n[1] * OFFSET, p[2] + n[2] * OFFSET];
    };
    const out: Vec3[][] = [];
    for (let k = 0; k < NLINES; k++) {
      const a = du[0] + ((k + 0.5) / NLINES) * (du[1] - du[0]);
      const b = dv[0] + ((k + 0.5) / NLINES) * (dv[1] - dv[0]);
      const lu: Vec3[] = [], lv: Vec3[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        lu.push(pt(a, dv[0] + (i / SAMPLES) * (dv[1] - dv[0])));
        lv.push(pt(du[0] + (i / SAMPLES) * (du[1] - du[0]), b));
      }
      out.push(lu, lv);
    }
    return out;
  }, [s]);
  const wrap = (cb?: SurfaceMeshProps['onPointerDown']) =>
    cb && ((e: ThreeEvent<PointerEvent>) => e.uv && cb(uvToDomain(s, e.uv), e));
  return (
    <group>
      <mesh geometry={geometry} onPointerDown={wrap(onPointerDown)} onPointerMove={wrap(onPointerMove)}>
        <meshStandardMaterial
          color={color} side={2} transparent depthWrite={opacity > 0.95}
          opacity={opacity} roughness={0.6} metalness={0.1}
        />
      </mesh>
      {showGrid && lines.map((pts, i) => (
        <Line key={i} points={pts} color="#dfe8ff" lineWidth={1} transparent opacity={0.45} />
      ))}
    </group>
  );
}
