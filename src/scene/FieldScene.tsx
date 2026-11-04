import { useLayoutEffect, useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSurface } from '../math';
import { EULER_CHARACTERISTIC, customFields, fieldIndex, fieldsFor, flow, flowCommutator } from '../math/fields';
import { toWorld } from '../math/metric';
import { norm } from '../math/vec';
import type { Surface, Vec2, Vec3, VectorField } from '../math/types';
import { useStore } from '../state/store';
import { useTr } from '../i18n';
import Arrow from './Arrow';
import DraggablePoint from './DraggablePoint';
import { Label } from './Label';
import { useMarkerScale } from './markerScale';
import SurfaceMesh from './SurfaceMesh';
import { unitNormal } from './geom';

const NU = 16, NV = 12, LIFT = 0.012, FLOW_T = 3, MAXLEN = 0.18;

const fieldCache = new WeakMap<Surface, VectorField[]>();
const presets = (s: Surface) => {
  let f = fieldCache.get(s);
  if (!f) fieldCache.set(s, (f = s.id === 'custom' ? customFields(s) : fieldsFor(s.id)));
  return f;
};
const indexCache = new WeakMap<VectorField, number[]>();
/** Numeric winding number at each zero of X (cached per field object). */
export function zeroIndices(s: Surface, X: VectorField): number[] {
  let r = indexCache.get(X);
  if (!r) indexCache.set(X, (r = X.zeros.map((z) => fieldIndex(s, X, z))));
  return r;
}
export const indexLabel = (n: number, es = false) => `${es ? 'índice' : 'ind'} = ${n > 0 ? '+' : ''}${n}`;

/** Current surface, X and optional Y (null when none or equal to X). */
export function useFieldSel() {
  const { surfaceId, customSpec, fieldId, fieldId2 } = useStore();
  return useMemo(() => {
    const surface = getSurface(surfaceId);
    const all = presets(surface);
    const X = all.find((f) => f.id === fieldId) ?? all[0]!;
    const Y = all.find((f) => f.id === fieldId2) ?? null;
    return { surface, all, X, Y: Y && Y !== X ? Y : null };
  }, [surfaceId, customSpec, fieldId, fieldId2]);
}

const lift = (s: Surface, [u, v]: Vec2, h = LIFT): Vec3 => {
  const p = s.position(u, v), n = unitNormal(s, u, v);
  return [p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h];
};
const polyline = (s: Surface, X: VectorField, uv: Vec2): Vec3[] => {
  const back = flow(s, X, uv, -FLOW_T).samples.map((q) => lift(s, q.uv)).reverse();
  return back.concat(flow(s, X, uv, FLOW_T).samples.slice(1).map((q) => lift(s, q.uv)));
};

export function FieldsScene() {
  const { surface: s, X, Y } = useFieldSel();
  const { uv, showFibers, flowPlaying, commT, set } = useStore();
  const t = useTr();
  const k = useMarkerScale(s);
  const particles = useRef<THREE.InstancedMesh>(null);
  const discs = useRef<THREE.InstancedMesh>(null);

  const grid = useMemo(() => {
    const { u, v } = s.domain;
    const pts: { uv: Vec2; W: Vec3; m: number; pos: Vec3; n: Vec3 }[] = [];
    for (let j = 0; j < NV; j++)
      for (let i = 0; i < NU; i++) {
        const q: Vec2 = [u[0] + ((i + 0.5) / NU) * (u[1] - u[0]), v[0] + ((j + 0.5) / NV) * (v[1] - v[0])];
        if (s.id === 'sphere' && (q[0] < 0.12 || q[0] > Math.PI - 0.12)) continue;
        if (s.singularAt?.(q[0], q[1])) continue;
        const W = toWorld(s, q[0], q[1], X.X(q[0], q[1]));
        const n = unitNormal(s, q[0], q[1]);
        pts.push({ uv: q, W, m: norm(W), n, pos: lift(s, q) });
      }
    return { pts, max: Math.max(1e-9, ...pts.map((g) => g.m)) };
  }, [s, X]);

  const arrows = useMemo(() => {
    const sc = (MAXLEN * k) / grid.max;
    return grid.pts.map((g, k) => {
      if (g.m < 1e-4 * grid.max) return null;
      const color = new THREE.Color().setHSL(0.65 - 0.65 * (g.m / grid.max), 0.9, 0.58).getStyle();
      const up = 0.004 * k;
      return <Arrow key={k} origin={[g.pos[0] + g.n[0] * up, g.pos[1] + g.n[1] * up, g.pos[2] + g.n[2] * up]} dir={[g.W[0] * sc, g.W[1] * sc, g.W[2] * sc]} color={color} radius={0.006 * k} />;
    });
  }, [grid, k]);

  const seedLines = useMemo(() => {
    const sel = grid.pts.filter((_, k) => k % 17 === 5).slice(0, 11);
    return sel.map((g) => polyline(s, X, g.uv));
  }, [grid, s, X]);
  const pLine = useMemo(() => polyline(s, X, uv), [s, X, uv]);
  const lines = useMemo(() => [...seedLines, pLine], [seedLines, pLine]);

  const zeros = useMemo(() => { const ind = zeroIndices(s, X); return X.zeros.map((z, k) => ({ z, ind: ind[k] })); }, [s, X]);

  const comm = useMemo(() => {
    if (!Y) return null;
    const c = flowCommutator(s, X, Y, uv, commT);
    return { pts: c.path.map((q) => lift(s, q, 0.02 * k)), gap: c.gap };
  }, [s, X, Y, uv, commT, k]);

  useLayoutEffect(() => {
    const m = discs.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const z = new THREE.Vector3(0, 0, 1);
    grid.pts.forEach((g, k) => {
      o.position.set(...g.pos);
      o.quaternion.setFromUnitVectors(z, new THREE.Vector3(...g.n));
      o.scale.setScalar(1);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    });
    m.count = grid.pts.length;
    m.instanceMatrix.needsUpdate = true;
  }, [grid, showFibers]);

  const phase = useRef(useStore.getState().flowPhase);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const m = particles.current;
    if (!m) return;
    if (flowPlaying) {
      phase.current = (phase.current + dt / 6) % 1;
      if (Math.floor(phase.current * 50) !== Math.floor(((phase.current - dt / 6 + 1) % 1) * 50)) useStore.getState().set({ flowPhase: phase.current });
    }
    lines.forEach((pl, k) => {
      const f = (phase.current + k / lines.length) % 1;
      const a = pl[Math.min(pl.length - 1, Math.floor(f * (pl.length - 1)))];
      tmp.position.set(...a);
      tmp.updateMatrix();
      m.setMatrixAt(k, tmp.matrix);
    });
    m.count = lines.length;
    m.instanceMatrix.needsUpdate = true;
  });

  const pn = unitNormal(s, uv[0], uv[1]);
  const pPos = lift(s, uv, 0.006 * k);
  const legCol = ['#ff7a59', '#59d0ff', '#ff7a59', '#59d0ff'];
  return (
    <group>
      <SurfaceMesh surface={s} opacity={0.35} onPointerDown={(q) => set({ uv: q })} />
      <DraggablePoint surface={s} uv={uv} onChange={(q) => set({ uv: q })} />
      {arrows}
      {showFibers && (
        <>
          <instancedMesh ref={discs} args={[undefined, undefined, NU * NV]} frustumCulled={false}>
            <circleGeometry args={[0.07 * k, 20]} />
            <meshBasicMaterial color="#9ad0ff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
          </instancedMesh>
          <mesh position={pPos} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...pn))}>
            <circleGeometry args={[0.28 * k, 40]} />
            <meshBasicMaterial color="#ffd24a" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Label text="T_{p}M" position={[pPos[0] + pn[0] * 0.2 * k, pPos[1] + pn[1] * 0.2 * k, pPos[2] + pn[2] * 0.2 * k]} color="#ffd24a" height={0.09 * k} />
        </>
      )}
      {lines.map((pl, i) => pl.length > 1 && <Line key={i} points={pl} color={i === lines.length - 1 ? '#ffd24a' : '#ffffff'} lineWidth={1} transparent opacity={0.3} />)}
      <instancedMesh ref={particles} args={[undefined, undefined, 16]} frustumCulled={false}>
        <sphereGeometry args={[0.02 * k, 10, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
      {zeros.map(({ z, ind }, k) => (
        <group key={k}>
          <mesh position={z.point}><sphereGeometry args={[0.035 * k, 12, 8]} /><meshBasicMaterial color="#ff4d6d" depthTest={false} transparent /></mesh>
          <Label text={t(indexLabel(ind), indexLabel(ind, true))} position={[z.point[0] * 1.0, z.point[1] * 1.0 + 0.0, z.point[2] + 0.12 * k]} color="#ff9db0" height={0.09 * k} />
        </group>
      ))}
      {comm && (
        <>
          {/* path = 4 legs of LEG samples each (corners at 0, LEG, 2·LEG, 3·LEG, 4·LEG) */}
          {[0, 1, 2, 3].map((i) => {
            const leg = (comm.pts.length - 1) / 4;
            const pts = comm.pts.slice(i * leg, (i + 1) * leg + 1);
            return pts.length > 1 && <Line key={i} points={pts} color={legCol[i]} lineWidth={3} depthTest={false} />;
          })}
          {comm.pts.length > 1 && (() => {
            const a = comm.pts[comm.pts.length - 1], b = comm.pts[0];
            return <Arrow origin={a} dir={[b[0] - a[0], b[1] - a[1], b[2] - a[2]]} color="#ff4dff" radius={0.012 * k} overlay />;
          })()}
        </>
      )}
    </group>
  );
}

export { EULER_CHARACTERISTIC };
