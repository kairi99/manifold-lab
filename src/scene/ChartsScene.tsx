import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { useCurves } from '../modules/curvesState';
import { sphPoint, stereoPoint } from '../math/charts';
import type { Vec3 } from '../math/types';
import { PAL } from '../theme/palette';
import { Label } from './Label';

const toThree = ([x, y, z]: Vec3): Vec3 => [x, z, -y];
const R = 1.1; // draw the unit sphere at this size; labels sit just outside it so the whole scene fits the default camera at wide viewports
const up = (p: Vec3, s = R): Vec3 => toThree([p[0] * s, p[1] * s, p[2] * s]);
export const GRID_SPH = PAL.du, GRID_ST = PAL.dv;

/** The sphere with two coordinate grids: spherical (orange) and stereographic from the north pole (blue). */
export function ChartsScene() {
  const { th, ph, set } = useCurves();
  const grids = useMemo(() => {
    const sph: Vec3[][] = [], st: Vec3[][] = [];
    for (let i = 1; i < 12; i++) sph.push(Array.from({ length: 97 }, (_, k) => up(sphPoint((Math.PI * i) / 12, (2 * Math.PI * k) / 96)))); // parallels
    for (let i = 0; i < 24; i++) sph.push(Array.from({ length: 49 }, (_, k) => up(sphPoint((Math.PI * k) / 48, (2 * Math.PI * i) / 24)))); // meridians
    for (const c of [-3, -2, -1.25, -0.6, 0, 0.6, 1.25, 2, 3]) {
      st.push(Array.from({ length: 121 }, (_, k) => up(stereoPoint(c, -12 + (24 * k) / 120)))); // x = const
      st.push(Array.from({ length: 121 }, (_, k) => up(stereoPoint(-12 + (24 * k) / 120, c)))); // y = const
    }
    return { sph, st };
  }, []);
  const p = sphPoint(th, ph);
  const P = up(p, R * 1.01);
  // projection ray from the north pole N through p to the plane z = 0 (x,y = stereographic coords)
  const hit: Vec3 = p[2] < 0.999 ? [p[0] / (1 - p[2]), p[1] / (1 - p[2]), 0] : [p[0] * 1e3, p[1] * 1e3, 0];
  const far = Math.hypot(hit[0], hit[1]) > 2.5;
  const ray = [up([0, 0, 1]), far ? up([hit[0] / Math.hypot(hit[0], hit[1]) * 2.5, hit[1] / Math.hypot(hit[0], hit[1]) * 2.5, 0]) : up(hit)];
  return (
    <group>
      <mesh onClick={(e) => { e.stopPropagation(); const q = e.point; const x = q.x / R, y = -q.z / R, z = q.y / R; set({ th: Math.acos(Math.max(-1, Math.min(1, z))), ph: (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI) }); }}>
        <sphereGeometry args={[R * 0.995, 48, 32]} /><meshBasicMaterial color="#1b2238" transparent opacity={0.9} />
      </mesh>
      {grids.sph.map((l, i) => <Line key={`s${i}`} points={l} color={GRID_SPH} lineWidth={1} transparent opacity={0.75} />)}
      {grids.st.map((l, i) => <Line key={`t${i}`} points={l} color={GRID_ST} lineWidth={1} transparent opacity={0.75} />)}
      <Line points={ray} color={PAL.ghost} lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
      <mesh position={P}><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color={PAL.p} /></mesh>
      <mesh position={up([0, 0, 1], R * 1.02)}><sphereGeometry args={[0.035, 12, 8]} /><meshBasicMaterial color={PAL.warn} /></mesh>
      <mesh position={up([0, 0, -1], R * 1.02)}><sphereGeometry args={[0.035, 12, 8]} /><meshBasicMaterial color={PAL.warn} /></mesh>
      <Label text="N (θ = 0)" position={up([0, 0, 1], R * 1.15)} color={PAL.warn} height={0.11} />
      <Label text="S (θ = π)" position={up([0, 0, -1], R * 1.15)} color={PAL.warn} height={0.11} />
      <Label text="(θ, φ)" position={up([1, 0, 0.1], R * 1.1)} color={GRID_SPH} height={0.1} />
      <Label text="(x, y)" position={up([-1, 0, 0.1], R * 1.1)} color={GRID_ST} height={0.1} />
    </group>
  );
}
