import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { create } from 'zustand';
import { getSurface } from '../math';
import { catmullRomLoop, geodesicTriangleSphere, latitudeLoop } from '../math/curves';
import { transport } from '../math/transport';
import type { ParamCurve, Surface, TransportSample, Vec2, Vec3 } from '../math/types';
import { useStore, type PathKind } from '../state/store';
import VectorArrow from './VectorArrow';
import { PAL } from '../theme/palette';
import { unitNormal } from './geom';
import { markerScale } from './markerScale';

export const STEPS = 1200;
const TRAIL = 24;

/** Draw-mode flag shared between scene and panel. */
export const useDraw = create<{ drawing: boolean; setDrawing: (d: boolean) => void }>((set) => ({
  drawing: false,
  setDrawing: (drawing) => set({ drawing }),
}));

/** Torus: v = const loop, u over [0, 2π]. */
export const torusLoop = (v0: number): ParamCurve => ({
  point: (t) => [2 * Math.PI * t, v0],
  velocity: () => [2 * Math.PI, 0],
});
/** Graph surfaces: circle of radius ρ in (x, y). */
export const circleLoop = (rho: number): ParamCurve => ({
  point: (t) => [rho * Math.cos(2 * Math.PI * t), rho * Math.sin(2 * Math.PI * t)],
  velocity: (t) => [-2 * Math.PI * rho * Math.sin(2 * Math.PI * t), 2 * Math.PI * rho * Math.cos(2 * Math.PI * t)],
});

/**
 * Custom surfaces: a closed coordinate loop when a coordinate is periodic (position f across the other range),
 * else an ellipse about the domain centre with radii f x half-extent.
 */
export function customLoop(s: Surface, f: number): ParamCurve {
  const { u: [u0, u1], v: [v0, v1], periodicU, periodicV } = s.domain;
  const TP = 2 * Math.PI;
  // twisted seam: u-pass at height f closes after two trips; f = ½ is the core, closed after one (end vector then reverses)
  if (s.id === 'custom' && s.chartWrap && !periodicU) {
    const n = Math.abs(f - 0.5) < 1e-9 ? 1 : 2;
    return { point: (t) => [u0 + n * t * (u1 - u0), v0 + f * (v1 - v0)], velocity: () => [n * (u1 - u0), 0] };
  }
  if (periodicU) return { point: (t) => [u0 + t * (u1 - u0), v0 + f * (v1 - v0)], velocity: () => [u1 - u0, 0] };
  if (periodicV) return { point: (t) => [u0 + f * (u1 - u0), v0 + t * (v1 - v0)], velocity: () => [0, v1 - v0] };
  const [cu, cv, ru, rv] = [(u0 + u1) / 2, (v0 + v1) / 2, (f * (u1 - u0)) / 2, (f * (v1 - v0)) / 2];
  return {
    point: (t) => [cu + ru * Math.cos(TP * t), cv + rv * Math.sin(TP * t)],
    velocity: (t) => [-TP * ru * Math.sin(TP * t), TP * rv * Math.cos(TP * t)],
  };
}

export function availableKinds(surfaceId: string): PathKind[] {
  return surfaceId === 'sphere' ? ['latitude', 'triangle', 'free'] : ['latitude', 'free'];
}

/** Range and label of the single loop slider (store.latitude) per surface. */
export function loopSlider(surfaceId: string) {
  if (surfaceId === 'custom') return { label: 'loop position (fraction of range)', labelEs: 'posición del lazo (fracción del rango)', min: 0.1, max: 0.9, deg: false };
  if (surfaceId === 'sphere') return { label: 'θ0 (latitude)', labelEs: 'θ0 (latitud)', min: 0.2, max: Math.PI - 0.2, deg: true };
  if (surfaceId === 'torus') return { label: 'v (tube angle)', labelEs: 'v (ángulo del tubo)', min: 0, max: 2 * Math.PI, deg: true };
  return { label: 'ρ (circle radius)', labelEs: 'ρ (radio del círculo)', min: 0.1, max: 1.1, deg: false };
}

/** Orthonormal frame (e1, e2) of the tangent plane, in coordinate components. */
export function frame(s: Surface, uv: Vec2): [Vec2, Vec2] {
  const g = s.metric(uv[0], uv[1]);
  const e1: Vec2 = [1 / Math.sqrt(g[0][0]), 0];
  const w: Vec2 = [-g[0][1] / g[0][0], 1];
  const wn = Math.sqrt(g[1][1] - (g[0][1] * g[0][1]) / g[0][0]);
  return [e1, [w[0] / wn, w[1] / wn]];
}

export interface TransportData {
  surface: Surface;
  kind: PathKind;
  curve: ParamCurve | null;
  start: Vec2 | null;
  V0: Vec2;
  samples: TransportSample[] | null;
}

export function useTransportData(): TransportData {
  const { surfaceId, pathKind, latitude, freePoints, vector } = useStore();
  const surface = getSurface(surfaceId);
  const kind = availableKinds(surfaceId).includes(pathKind) ? pathKind : 'latitude';
  const curve = useMemo<ParamCurve | null>(() => {
    if (kind === 'free') return freePoints.length >= 3 ? catmullRomLoop(freePoints) : null;
    if (surfaceId === 'sphere') return kind === 'triangle' ? geodesicTriangleSphere() : latitudeLoop(latitude);
    if (surfaceId === 'torus') return torusLoop(latitude);
    if (surfaceId === 'custom') return customLoop(surface, Math.min(0.9, Math.max(0.1, latitude)));
    return circleLoop(Math.min(1.1, Math.max(0.1, latitude)));
  }, [surfaceId, surface, kind, latitude, freePoints]);
  const start = useMemo(() => (curve ? curve.point(0) : null), [curve]);
  const V0 = vector;
  const samples = useMemo(() => (curve ? transport(surface, curve, V0, STEPS) : null), [surface, curve, V0]);
  return { surface, kind, curve, start, V0, samples };
}

const lift = (s: Surface, uv: Vec2, h: number): Vec3 => {
  h *= markerScale(s);
  const p = s.position(uv[0], uv[1]), n = unitNormal(s, uv[0], uv[1]);
  return [p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h];
};

export default function TransportPath() {
  const { surface, curve, start, V0, samples } = useTransportData();
  const progress = useStore((st) => st.progress);
  const { freePoints, pathKind } = useStore();
  const line = useMemo(() => {
    if (!curve) return null;
    const pts: Vec3[] = [];
    for (let i = 0; i <= 400; i++) pts.push(lift(surface, curve.point(i / 400), 0.012));
    return pts;
  }, [surface, curve]);

  const idx = Math.round(progress * STEPS);
  const trail = useMemo(() => {
    if (!samples) return [];
    const stride = STEPS / TRAIL;
    return Array.from({ length: TRAIL }, (_, k) => Math.round(k * stride));
  }, [samples]);

  return (
    <group>
      {line && <Line points={line} color={PAL.path} lineWidth={2.5} />}
      {(pathKind === 'free' || !curve) &&
        freePoints.map((p, i) => (
          <mesh key={i} position={lift(surface, p, 0.02)}>
            <sphereGeometry args={[0.03 * markerScale(surface), 12, 8]} />
            <meshStandardMaterial color={PAL.p} emissive={PAL.p} emissiveIntensity={0.5} />
          </mesh>
        ))}
      {samples && start && (
        <>
          {trail.filter((i) => i < idx).map((i) => (
            <VectorArrow key={i} surface={surface} uv={samples[i].uv} V={samples[i].V} color={PAL.V} ghost />
          ))}
          <VectorArrow surface={surface} uv={start} V={V0} color={PAL.ghost} ghost />
          <VectorArrow surface={surface} uv={samples[idx].uv} V={samples[idx].V} color={PAL.V} />
        </>
      )}
    </group>
  );
}
