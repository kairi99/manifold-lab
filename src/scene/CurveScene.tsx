import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCurves } from '../modules/curvesState';
import { CURVES, frenet } from '../math/frenet';
import type { Vec3 } from '../math/types';
import { PAL } from '../theme/palette';
import { Label } from './Label';

const SECONDS = 14, N = 400;
const toThree = ([x, y, z]: Vec3): Vec3 => [x, z, -y]; // math z-up -> three y-up, orientation preserved

function Arrow({ from, dir, len, color, label }: { from: Vec3; dir: Vec3; len: number; color: string; label: string }) {
  const tip: Vec3 = [from[0] + dir[0] * len, from[1] + dir[1] * len, from[2] + dir[2] * len];
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize()), [dir]);
  const head = len * 0.18;
  return (
    <group>
      <Line points={[from, tip]} color={color} lineWidth={3} />
      <mesh position={tip} quaternion={q}><coneGeometry args={[head * 0.4, head, 12]} /><meshBasicMaterial color={color} /></mesh>
      <Label text={label} position={[tip[0] + dir[0] * head, tip[1] + dir[1] * head + 0.05, tip[2] + dir[2] * head]} color={color} height={0.16} />
    </group>
  );
}

/** Space curve with its moving Frenet frame and osculating circle. All math is in curve units; the group is recentred and scaled to fit. */
export function CurveScene() {
  const { preset, a, b, u, set } = useCurves();
  const def = CURVES[preset];
  useFrame((_, dt) => {
    const s = useCurves.getState();
    if (s.playing) s.set({ u: def.closed ? (s.u + Math.min(dt, 0.1) / SECONDS) % 1 : Math.min(1, s.u + Math.min(dt, 0.1) / SECONDS), ...(!def.closed && s.u >= 1 ? { playing: false } : {}) });
  });
  const { pts, centre, k, ext } = useMemo(() => {
    const [t0, t1] = def.range;
    const pts = Array.from({ length: N + 1 }, (_, i) => def.jet(t0 + ((t1 - t0) * i) / N, a, b).r);
    const lo = [0, 1, 2].map((c) => Math.min(...pts.map((p) => p[c]))), hi = [0, 1, 2].map((c) => Math.max(...pts.map((p) => p[c])));
    const centre = lo.map((l, c) => (l + hi[c]) / 2) as Vec3;
    const ext = Math.max(...lo.map((l, c) => hi[c] - l)) / 2;
    return { pts, centre, k: 1.8 / ext, ext };
  }, [def, a, b]);
  const t = def.range[0] + u * (def.range[1] - def.range[0]);
  const j = def.jet(t, a, b), f = frenet(j);
  const m = (p: Vec3): Vec3 => toThree([p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]]);
  const P = m(j.r);
  const rho = 1 / f.kappa;
  const osc = useMemo(() => {
    if (!f.defined || rho > 6 * ext) return null;
    const c: Vec3 = [j.r[0] + f.N[0] * rho, j.r[1] + f.N[1] * rho, j.r[2] + f.N[2] * rho];
    return Array.from({ length: 65 }, (_, i) => {
      const w = (2 * Math.PI * i) / 64;
      return m([c[0] - f.N[0] * rho * Math.cos(w) + f.T[0] * rho * Math.sin(w), c[1] - f.N[1] * rho * Math.cos(w) + f.T[1] * rho * Math.sin(w), c[2] - f.N[2] * rho * Math.cos(w) + f.T[2] * rho * Math.sin(w)]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, a, b, preset]);
  const L = ext * 0.5;
  return (
    <group scale={k}>
      <Line points={pts.map(m)} color={PAL.path} lineWidth={2.5} />
      {osc && <Line points={osc} color={PAL.metric} lineWidth={1.5} dashed dashSize={0.1 * ext} gapSize={0.06 * ext} />}
      <mesh position={P} onClick={() => set({ playing: false })}><sphereGeometry args={[0.06 * ext, 16, 12]} /><meshBasicMaterial color={PAL.p} /></mesh>
      <Arrow from={P} dir={toThree(f.T)} len={L} color={PAL.du} label="T" />
      {f.defined && <Arrow from={P} dir={toThree(f.N)} len={L} color={PAL.dv} label="N" />}
      {f.defined && <Arrow from={P} dir={toThree(f.B)} len={L} color={PAL.V} label="B" />}
    </group>
  );
}
