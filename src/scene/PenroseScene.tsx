import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useStore } from '../state/store';
import {
  constR, constT, horizons, infallGeodesic, minkowskiConstR, minkowskiConstT, nullInfinities, type Pt,
} from '../math/penrose';
import { Label as Lbl } from './Label';
const Label = (p: React.ComponentProps<typeof Lbl>) => <Lbl height={0.12} {...p} />;
import { CosmoLine, apply, type Xf } from './CosmoLine';
import { infallState, probeAt } from '../panels/PenroseModel';
import { useTr } from '../i18n';

const PI = Math.PI, HP = PI / 2, S = 3 / (2 * PI);
const GRID_R = '#3f6fa3', GRID_T = '#7a5fb0', HOR = '#e8e8e8', SING = '#ff5a5a', SCRI = '#6cb6ff', CONE = '#ffd24a', OBS = '#5fe08a';
const DUR = 10; // seconds for one infall animation

const zigzag = (y: number, sign: 1 | -1): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= 60; i++) pts.push([-HP + (PI * i) / 60, y + sign * (i % 2 ? 0.07 : 0)]);
  return pts;
};
const Dot = ({ p, xf, color = '#fff' }: { p: Pt; xf: Xf; color?: string }) => (
  <mesh position={apply(xf, p)}><sphereGeometry args={[0.03, 12, 8]} /><meshBasicMaterial color={color} /></mesh>
);
const at = (xf: Xf, x: number, y: number, dz = 0): [number, number, number] => { const q = apply(xf, [x, y]); return [q[0], q[1], dz]; };

function Static({ space, xf }: { space: 'minkowski' | 'schwarzschild'; xf: Xf }) {
  const t = useTr();
  const g = useMemo(() => {
    if (space === 'minkowski') {
      return { r: [0.5, 1, 2, 4, 10].map((r) => minkowskiConstR(r)), t: [-8, -4, -2, -1, 0, 1, 2, 4, 8].map((t) => minkowskiConstT(t)), r2: [] as Pt[][], t2: [] as Pt[][] };
    }
    return {
      r: [2.5, 3, 4, 6, 10, 20].flatMap((r) => [constR(r, 'I'), constR(r, 'III')]),
      t: [-20, -6, -2, 0, 2, 6, 20].flatMap((t) => [constT(t, 'I'), constT(t, 'III')]),
      r2: [0.4, 1, 1.6].flatMap((r) => [constR(r, 'II'), constR(r, 'IV')]),
      t2: [-1.5, 0, 1.5].flatMap((t) => [constT(t, 'II'), constT(t, 'IV')]),
    };
  }, [space]);
  const ni = nullInfinities(), h = horizons();
  if (space === 'minkowski') {
    return (
      <>
        {g.r.map((l, i) => <CosmoLine key={`r${i}`} pts={l} xf={xf} color={GRID_R} width={1} opacity={0.8} />)}
        {g.t.map((l, i) => <CosmoLine key={`t${i}`} pts={l} xf={xf} color={GRID_T} width={1} opacity={0.8} />)}
        <CosmoLine pts={[[0, -PI], [0, PI]]} xf={xf} color={HOR} width={1.5} />
        <CosmoLine pts={[[PI, 0], [0, PI]]} xf={xf} color={SCRI} width={2.5} />
        <CosmoLine pts={[[PI, 0], [0, -PI]]} xf={xf} color={SCRI} width={2.5} />
        <Label text="i⁺" position={at(xf, 0, PI + 0.17)} /><Label text="i⁻" position={at(xf, 0, -PI - 0.17)} />
        <Label text="i⁰" position={at(xf, PI + 0.22, 0)} />
        <Label text="ℐ⁺" position={at(xf, PI / 2 + 0.25, PI / 2 + 0.25)} color={SCRI} /><Label text="ℐ⁻" position={at(xf, PI / 2 + 0.25, -PI / 2 - 0.25)} color={SCRI} />
        <Label text="r = 0" position={at(xf, -0.3, 0)} color={HOR} />
        {[[PI, 0], [0, PI], [0, -PI]].map((p, i) => <Dot key={i} p={p as Pt} xf={xf} />)}
      </>
    );
  }
  return (
    <>
      {[...g.r, ...g.r2].map((l, i) => <CosmoLine key={`r${i}`} pts={l} xf={xf} color={GRID_R} width={1} opacity={0.8} />)}
      {[...g.t, ...g.t2].map((l, i) => <CosmoLine key={`t${i}`} pts={l} xf={xf} color={GRID_T} width={1} opacity={0.8} />)}
      <CosmoLine pts={h.U0} xf={xf} color={HOR} width={2.2} />
      <CosmoLine pts={h.V0} xf={xf} color={HOR} width={2.2} />
      <CosmoLine pts={zigzag(HP, 1)} xf={xf} color={SING} width={2.5} />
      <CosmoLine pts={zigzag(-HP, -1)} xf={xf} color={SING} width={2.5} />
      {[ni.scriPlusRight, ni.scriMinusRight, ni.scriPlusLeft, ni.scriMinusLeft].map((l, i) => <CosmoLine key={i} pts={l} xf={xf} color={SCRI} width={2.5} />)}
      {[ni.i0Right, ni.i0Left, ni.iPlusRight, ni.iMinusRight, ni.iPlusLeft, ni.iMinusLeft].map((p, i) => <Dot key={i} p={p} xf={xf} />)}
      <Label text="I" position={at(xf, HP, 0)} height={0.16} color="#fff" /><Label text="III" position={at(xf, -HP, 0)} height={0.16} />
      <Label text={t('II (black hole)', 'II (agujero negro)')} position={at(xf, 0, 0.62)} height={0.1} color="#ffb4b4" /><Label text={t('IV (white hole)', 'IV (agujero blanco)')} position={at(xf, 0, -0.62)} height={0.1} color="#ffb4b4" />
      <Label text="r = 0" position={at(xf, 0, HP + 0.2)} color={SING} /><Label text="r = 0" position={at(xf, 0, -HP - 0.2)} color={SING} />
      <Label text="i⁰" position={at(xf, PI + 0.22, 0)} /><Label text="i⁰" position={at(xf, -PI - 0.22, 0)} />
      <Label text="i⁺" position={at(xf, HP + 0.25, HP + 0.15)} /><Label text="i⁻" position={at(xf, HP + 0.25, -HP - 0.15)} />
      <Label text="i⁺" position={at(xf, -HP - 0.25, HP + 0.15)} /><Label text="i⁻" position={at(xf, -HP - 0.25, -HP - 0.15)} />
      <Label text="ℐ⁺" position={at(xf, 2.5, 1.0)} color={SCRI} /><Label text="ℐ⁻" position={at(xf, 2.5, -1.0)} color={SCRI} />
      <Label text="U=0" position={at(xf, 1.25, 1.47)} color={HOR} /><Label text="V=0" position={at(xf, -1.25, 1.47)} color={HOR} />
    </>
  );
}

export function PenroseScene() {
  const space = useStore((s) => s.csSpace), pt = useStore((s) => s.csPt), r0 = useStore((s) => s.csR0);
  const progress = useStore((s) => s.csProgress), set = useStore((s) => s.set);
  const { camera, gl, controls } = useThree();
  const [drag, setDrag] = useState(false);
  const xf: Xf = useMemo(() => ({ sx: S, sy: S, ox: space === 'minkowski' ? -(PI / 2) * S : 0, oy: 0 }), [space]);
  const probe = useMemo(() => probeAt(space, pt[0], pt[1]), [space, pt]);
  const geo = useMemo(() => infallGeodesic(r0), [r0]);
  const inf = infallState(r0, progress);
  const ctrl = controls as unknown as { enabled: boolean } | null;
  const xfRef = useRef(xf), spaceRef = useRef(space);
  xfRef.current = xf; spaceRef.current = space;

  useEffect(() => {
    if (!drag) return;
    const el = gl.domElement, rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ndc, camera);
      if (!rc.ray.intersectPlane(plane, hit)) return;
      const f = xfRef.current, X = (hit.x - f.ox) / f.sx, T = (hit.y - f.oy) / f.sy;
      if (probeAt(spaceRef.current, X, T)) set({ csPt: [X, T] });
    };
    const up = () => setDrag(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    if (ctrl) ctrl.enabled = false;
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); if (ctrl) ctrl.enabled = true; };
  }, [drag, gl, camera, ctrl, set]);

  useFrame((_, dt) => {
    const st = useStore.getState();
    if (!st.csPlaying || st.csSpace !== 'schwarzschild') return;
    const p = st.csProgress + Math.min(dt, 0.1) / DUR;
    set({ csProgress: p >= 1 ? 0 : p });
  });

  const cone = probe?.cone;
  const col = probe?.region === 'II' ? '#ff9a9a' : CONE;
  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const X = (e.point.x - xf.ox) / xf.sx, T = (e.point.y - xf.oy) / xf.sy;
    if (probeAt(space, X, T)) set({ csPt: [X, T] });
    setDrag(true);
  };
  return (
    <group>
      <Static space={space} xf={xf} />
      {cone && (['futureRight', 'futureLeft', 'pastRight', 'pastLeft'] as const).map((k) => <CosmoLine key={k} pts={cone[k]} xf={xf} color={col} width={2} dashed={k.startsWith('past')} />)}
      {probe && <mesh position={apply(xf, pt)}><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color={col} /></mesh>}
      {space === 'schwarzschild' && (
        <>
          <CosmoLine pts={geo.pts} xf={xf} color={OBS} width={1.5} dashed opacity={0.8} />
          <mesh position={apply(xf, inf.pt)}><sphereGeometry args={[0.04, 16, 12]} /><meshBasicMaterial color={OBS} /></mesh>
        </>
      )}
      <mesh position={[0, 0, -0.01]} onPointerDown={down}
        onPointerOver={() => (gl.domElement.style.cursor = 'crosshair')} onPointerOut={() => (gl.domElement.style.cursor = '')}>
        <planeGeometry args={[8, 5]} /><meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}
