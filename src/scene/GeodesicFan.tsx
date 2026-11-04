import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSurface } from '../math';
import { geodesic, unitVelocity } from '../math/geodesic';
import type { GeodesicPath, Surface, Vec2, Vec3 } from '../math/types';
import { useStore } from '../state/store';
import { useTr } from '../i18n';
import DraggablePoint from './DraggablePoint';
import { Label } from './Label';
import SurfaceMesh from './SurfaceMesh';
import VectorArrow from './VectorArrow';
import { frame } from './TransportPath';
import { unitNormal } from './geom';

const SECONDS = 4;
const OFFSET = 0.012;

/** Angle of V from e1 toward e2 (orthonormal frame at uv). */
export function vectorAngle(s: Surface, uv: Vec2, V: Vec2): number {
  const g = s.metric(uv[0], uv[1]);
  const [e1, e2] = frame(s, uv);
  const ip = (a: Vec2, b: Vec2) => a[0] * (g[0][0] * b[0] + g[0][1] * b[1]) + a[1] * (g[1][0] * b[0] + g[1][1] * b[1]);
  return Math.atan2(ip(V, e2), ip(V, e1));
}

export interface GeoFan { surface: Surface; paths: GeodesicPath[]; angle0: number; mid: number }

export function useGeoFan(): GeoFan {
  const { surfaceId, customSpec, uv, vector, geoCount, geoSpread, geoLength } = useStore();
  return useMemo(() => {
    const surface = getSurface(surfaceId);
    const angle0 = vectorAngle(surface, uv, vector);
    const mid = (geoCount - 1) / 2;
    const paths = Array.from({ length: geoCount }, (_, i) => {
      const a = geoCount === 1 ? angle0 : angle0 + geoSpread * (i / (geoCount - 1) - 0.5);
      return geodesic(surface, uv, unitVelocity(surface, uv, a), geoLength);
    });
    return { surface, paths, angle0, mid: Math.floor(mid) };
  }, [surfaceId, customSpec, uv, vector, geoCount, geoSpread, geoLength]);
}

/** Number of samples with s <= target (at least 1). */
export const revealCount = (p: GeodesicPath, target: number) => {
  let n = 1;
  while (n < p.samples.length && p.samples[n].s <= target + 1e-9) n++;
  return n;
};

const lift = (s: Surface, uv: Vec2): Vec3 => {
  const p = s.position(uv[0], uv[1]), n = unitNormal(s, uv[0], uv[1]);
  return [p[0] + n[0] * OFFSET, p[1] + n[1] * OFFSET, p[2] + n[2] * OFFSET];
};

export default function GeodesicFan() {
  const { surface, paths, mid, angle0 } = useGeoFan();
  const { uv, geoCount, geoLength, geoProgress, surfaceId, set } = useStore();
  const t = useTr();
  const target = geoProgress * geoLength;
  const color = (i: number) => new THREE.Color().setHSL(0.55 + 0.45 * (geoCount === 1 ? 0 : i / (geoCount - 1)), 0.9, 0.62).getStyle();

  const lines = useMemo(() => paths.map((p) => p.samples.map((q) => lift(surface, q.uv))), [paths, surface]);
  const center = paths[geoCount === 1 ? 0 : mid];
  const end = center.samples[revealCount(center, target) - 1];
  const p3 = surface.position(uv[0], uv[1]);
  const unit = unitVelocity(surface, uv, angle0);

  useFrame((_, dt) => {
    const st = useStore.getState();
    if (!st.geoPlaying) return;
    const p = st.geoProgress + Math.min(dt, 0.1) / SECONDS;
    st.set(p >= 1 ? { geoProgress: 1, geoPlaying: false } : { geoProgress: p });
  });

  return (
    <group>
      <SurfaceMesh surface={surface} onPointerDown={(u) => set({ uv: u })} />
      {paths.map((p, i) => {
        const pts = lines[i].slice(0, revealCount(p, target));
        return pts.length > 1 ? <Line key={i} points={pts} color={color(i)} lineWidth={2} /> : null;
      })}
      <mesh position={lift(surface, end.uv)}>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      {surfaceId === 'sphere' && (
        <>
          <mesh position={[-p3[0], -p3[1], -p3[2]]}>
            <torusGeometry args={[0.06, 0.012, 8, 24]} />
            <meshBasicMaterial color="#ff6b9d" />
          </mesh>
          <Label text={t('−p (conjugate point)', '−p (punto conjugado)')} position={[-p3[0] * 1.12, -p3[1] * 1.12 - 0.1, -p3[2] * 1.12]} color="#ff9dbd" />
        </>
      )}
      {/* only the direction matters (geodesics are unit speed); draw short so it does not dominate */}
      <VectorArrow surface={surface} uv={uv} V={[0.4 * unit[0], 0.4 * unit[1]]} editable color="#ffb347"
        onChange={(W) => set({ vector: W })} />
      <DraggablePoint surface={surface} uv={uv} onChange={(u) => set({ uv: u })} />
    </group>
  );
}
