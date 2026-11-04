import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '../math/types';
import {
  horizons, ergosphere, iscoKerr, photonOrbitKerr, frameDragging, kerrOrbitFromApsides, integrateKerr,
} from '../math/kerr';
import { SHAPIRO_TESTS, FRAME_DRAG_TESTS } from '../data/grTests';
import { useStore } from '../state/store';
import { Label } from './Label';
import Arrow from './Arrow';

/** Scene units are M (the parent group is scaled by 1/14). Boyer–Lindquist (r, θ, φ) are drawn as if spherical: [r sinθ cosφ, r cosθ, −r sinθ sinφ] (right-handed, spin along +y, φ increases counter-clockwise seen from +y). */
export const bl = (r: number, th: number, ph: number): Vec3 => [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), -r * Math.sin(th) * Math.sin(ph)];
const ringPts = (r: number, y = 0): Vec3[] => Array.from({ length: 97 }, (_, i) => { const f = (i / 96) * 2 * Math.PI; return [r * Math.cos(f), y, r * Math.sin(f)]; });

/** Disk outer radius and observer distance shared by the traced image and its 3D schematic. */
export const DISK_OUTER = 20;
export const OBS_SCENE = 38;

type KTraj = ReturnType<typeof integrateKerr>;
export interface KerrOrbit { orb: { E: number; L: number } | null; traj: KTraj | null }
let key = '', cached: { pro: KerrOrbit; retro: KerrOrbit } | null = null;
export function kerrOrbits(a: number, rp: number, ra: number) {
  const lo = Math.min(rp, ra), hi = Math.max(rp, ra), k = `${a}|${lo}|${hi}`;
  if (k === key && cached) return cached;
  const one = (prograde: boolean): KerrOrbit => {
    const orb = kerrOrbitFromApsides(a, lo, hi, prograde);
    if (!orb) return { orb: null, traj: null };
    const sm = (lo + hi) / 2;
    const traj = integrateKerr({ a, kind: 'timelike', E: orb.E, L: orb.L, r0: hi, theta0: Math.PI / 2, phi0: 0,
      lambdaMax: 3.2 * 2 * Math.PI * sm ** 1.5, rMax: hi * 3, nSamples: 3000 });
    return { orb, traj };
  };
  key = k; cached = { pro: one(true), retro: one(false) };
  return cached;
}

/** Mean periapsis advance per orbit (rad, beyond the 2π sweep) in the direction of motion; null with < 2 periapsides. */
export function kerrPrecession(traj: KTraj | null): number | null {
  if (!traj) return null;
  const s = traj.samples, idx: number[] = [];
  for (let i = 1; i < s.length - 1; i++) if (s[i].r < s[i - 1].r && s[i].r <= s[i + 1].r) idx.push(i);
  if (idx.length < 2) return null;
  return Math.abs(s[idx[idx.length - 1]].phi - s[idx[0]].phi) / (idx.length - 1) - 2 * Math.PI;
}

function at(traj: KTraj, p: number) {
  const s = traj.samples, t = s[0].lambda + p * (s[s.length - 1].lambda - s[0].lambda);
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m].lambda <= t) lo = m; else hi = m; }
  const A = s[lo], B = s[hi], f = B.lambda > A.lambda ? Math.min(1, Math.max(0, (t - A.lambda) / (B.lambda - A.lambda))) : 0;
  return bl(A.r + f * (B.r - A.r), A.theta + f * (B.theta - A.theta), A.phi + f * (B.phi - A.phi));
}

function Horizon({ a, label = true }: { a: number; label?: boolean }) {
  const { rPlus } = horizons(a);
  return (
    <group>
      <mesh><sphereGeometry args={[rPlus, 48, 32]} /><meshBasicMaterial color="#000000" /></mesh>
      <mesh><sphereGeometry args={[rPlus * 1.02, 48, 32]} /><meshBasicMaterial color="#ff9f43" transparent opacity={0.3} side={THREE.BackSide} depthWrite={false} /></mesh>
      {label && <Label text="horizon r+ (a sphere in BL coordinates)" position={[0, -rPlus - 3.5, 0]} color="#ff9f43" height={1.6} />}
    </group>
  );
}

function Ergo({ a }: { a: number }) {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 65 }, (_, i) => { const th = (i / 64) * Math.PI, r = ergosphere(a, th) * 1.003; return new THREE.Vector2(r * Math.sin(th), r * Math.cos(th)); });
    return new THREE.LatheGeometry(pts, 64);
  }, [a]);
  return <mesh geometry={geo}><meshBasicMaterial color="#c792ff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} /></mesh>;
}

/** Counter-rotating rings of ZAMO markers at several radii, each ring turning at ω(r): frame dragging, faster near the hole. */
function Zamos({ a }: { a: number }) {
  const radii = useMemo(() => { const rp = horizons(a).rPlus; return [rp + 0.5, 3, 4.5, 7, 11].filter((r) => r > rp + 0.2); }, [a]);
  const refs = useRef<(THREE.Group | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (useStore.getState().grPlaying) t.current += Math.min(dt, 0.1) * 15; // 1 s = 15 M
    radii.forEach((r, i) => { const g = refs.current[i]; if (g) g.rotation.y = frameDragging(a, r, Math.PI / 2) * t.current; });
  });
  return (
    <group>
      {radii.map((r, i) => (
        <group key={r} ref={(g) => { refs.current[i] = g; }}>
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} position={[r * Math.cos((k / 6) * 2 * Math.PI), 0, r * Math.sin((k / 6) * 2 * Math.PI)]}>
              <sphereGeometry args={[0.22, 10, 8]} /><meshBasicMaterial color={k === 0 ? '#ffffff' : '#35e0c2'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function KerrView() {
  const a = useStore((s) => s.grSpin), rp = useStore((s) => s.grRp), ra = useStore((s) => s.grRa), retro = useStore((s) => s.grRetro);
  const orbits = kerrOrbits(a, rp, ra);
  const ref = useRef<THREE.Mesh>(null), ref2 = useRef<THREE.Mesh>(null);
  const rings = useMemo(() => ({
    iP: iscoKerr(a, true), iR: iscoKerr(a, false), pP: photonOrbitKerr(a, true), pR: photonOrbitKerr(a, false),
  }), [a]);
  const lines = useMemo(() => ({
    pro: orbits.pro.traj?.samples.map((q) => bl(q.r, q.theta, q.phi)) ?? [],
    retro: orbits.retro.traj?.samples.map((q) => bl(q.r, q.theta, q.phi)) ?? [],
  }), [orbits]);
  useFrame((_, dt) => {
    const st = useStore.getState();
    if (st.grPlaying) st.set({ grProgress: (st.grProgress + Math.min(dt, 0.1) / 10) % 1 });
    const p = useStore.getState().grProgress;
    if (ref.current && orbits.pro.traj) ref.current.position.set(...at(orbits.pro.traj, p));
    if (ref2.current && orbits.retro.traj) ref2.current.position.set(...at(orbits.retro.traj, p));
  });
  // camera looks from φ = π/4: labels sit left (3π/4) or right (−π/4) of the centre, stacked by k, so they don't overlap
  const lab = (r: number, f: number, k: number): Vec3 => [r * Math.cos(f), 1 + 1.4 * k, r * Math.sin(f)];
  return (
    <group>
      <Horizon a={a} />
      <Ergo a={a} />
      <Arrow origin={[0, 0, 0]} dir={[0, 14, 0]} color="#ffffff" radius={0.25} opacity={0.8} />
      <Label text="spin axis" position={[0, 16, 0]} color="#ffffff" height={1.5} />
      <Line points={ringPts(rings.iP)} color="#35e0c2" lineWidth={1.5} />
      <Line points={ringPts(rings.iR)} color="#ff6bd6" lineWidth={1.5} />
      <Line points={ringPts(rings.pP)} color="#ffd166" lineWidth={1.5} dashed dashSize={0.4} gapSize={0.3} />
      <Line points={ringPts(rings.pR)} color="#ffa94d" lineWidth={1.5} dashed dashSize={0.4} gapSize={0.3} />
      <Label text="ISCO pro" position={lab(rings.iP, Math.PI * 0.75, 0)} color="#35e0c2" height={1.5} />
      <Label text="ISCO retro" position={lab(rings.iR, -Math.PI * 0.25, 0)} color="#ff6bd6" height={1.5} />
      <Label text="photon pro" position={lab(rings.pP + 5, Math.PI * 0.75, 2.2)} color="#ffd166" height={1.5} />
      <Label text="photon retro" position={lab(rings.pR + 5, -Math.PI * 0.25, 2.2)} color="#ffa94d" height={1.5} />
      <Label text="ergosphere (purple)" position={[0, -horizons(a).rPlus - 6.5, 0]} color="#c792ff" height={1.5} />
      {lines.pro.length > 1 && <Line points={lines.pro} color="#6cb6ff" lineWidth={retro ? 1 : 2.5} transparent opacity={retro ? 0.5 : 1} />}
      {lines.retro.length > 1 && <Line points={lines.retro} color="#ff8fa3" lineWidth={retro ? 2.5 : 1} transparent opacity={retro ? 1 : 0.5} />}
      <mesh ref={ref}><sphereGeometry args={[0.4, 14, 10]} /><meshBasicMaterial color="#6cb6ff" /></mesh>
      <mesh ref={ref2}><sphereGeometry args={[0.4, 14, 10]} /><meshBasicMaterial color="#ff8fa3" /></mesh>
      <Zamos a={a} />
      <Label text="blue: prograde orbit, pink: retrograde; white/teal dots: ZAMOs (L = 0)" position={[0, 21, 0]} color="#e6e6e6" height={1.7} />
    </group>
  );
}

export function ImageView() {
  const a = useStore((s) => s.grSpin), incl = useStore((s) => s.grIncl);
  const { rPlus } = horizons(a);
  const rIn = iscoKerr(a, true);
  const i = (incl * Math.PI) / 180;
  const obs: Vec3 = [OBS_SCENE * Math.sin(i), OBS_SCENE * Math.cos(i), 0];
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-obs[0], -obs[1], -obs[2]).normalize()), [obs[0], obs[1], obs[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <Horizon a={a} label={false} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rIn, DISK_OUTER, 96, 1]} />
        <meshBasicMaterial color="#ff9f43" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Arrow origin={[0, 0, 0]} dir={[0, 14, 0]} color="#ffffff" radius={0.25} opacity={0.8} />
      <Label text="spin axis" position={[0, 16, 0]} color="#ffffff" height={1.5} />
      <Line points={[obs, [0, 0, 0]]} color="#7fd6ff" lineWidth={1.2} dashed dashSize={0.8} gapSize={0.6} />
      <group position={obs} quaternion={quat}>
        <mesh><boxGeometry args={[3, 2, 2.5]} /><meshBasicMaterial color="#7fd6ff" /></mesh>
        <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[1.6, 2.2, 16]} /><meshBasicMaterial color="#7fd6ff" /></mesh>
      </group>
      <Label text={`observer, inclination ${incl.toFixed(0)}°`} position={[obs[0], obs[1] + 4, obs[2]]} color="#7fd6ff" height={1.7} />
      <Label text={`disk: ISCO ${rIn.toFixed(2)} M to ${DISK_OUTER} M (observer drawn nearer than the real distance)`} position={[0, -rPlus - 4, 0]} color="#ff9f43" height={1.5} />
    </group>
  );
}

const flat = (xs: [number, number][]): Vec3[] => xs.map(([x, y]) => [x, y, 0]);

export function ClocksView() {
  const id = useStore((s) => s.grClockPreset);
  const kind = SHAPIRO_TESTS.some((t) => t.id === id) ? 'shapiro' : FRAME_DRAG_TESTS.some((t) => t.id === id) ? 'drag' : 'redshift';
  // bend exaggerated for visibility
  const path = useMemo(() => flat([[-40, 9], [0, 9], [40, 4]]), []);
  return (
    <group>
      <mesh><sphereGeometry args={[6, 40, 28]} /><meshStandardMaterial color="#3a6ea5" emissive="#1c3350" /></mesh>
      <Label text="central body (schematic, not to scale)" position={[0, -9, 0]} color="#6cb6ff" height={1.6} />
      {kind === 'shapiro' && (
        <>
          <Line points={flat([[-40, 9], [40, 9]])} color="#8a8f98" lineWidth={1} dashed dashSize={0.8} gapSize={0.6} />
          <Line points={path} color="#ffd166" lineWidth={2.5} />
          <mesh position={[-40, 9, 0]}><sphereGeometry args={[0.9, 12, 8]} /><meshBasicMaterial color="#35e0c2" /></mesh>
          <mesh position={[40, path[2][1], 0]}><sphereGeometry args={[0.9, 12, 8]} /><meshBasicMaterial color="#ff6bd6" /></mesh>
          <Label text="signal source" position={[-36, 12, 0]} color="#35e0c2" height={1.5} />
          <Label text="receiver" position={[36, 3, 0]} color="#ff6bd6" height={1.5} />
          <Label text="path at impact parameter b, slight bend (schematic): extra delay" position={[0, 16, 0]} color="#ffd166" height={1.5} />
        </>
      )}
      {kind === 'redshift' && (
        <>
          <mesh position={[14, 4, 0]}><boxGeometry args={[2.2, 12, 2.2]} /><meshBasicMaterial color="#8a8f98" /></mesh>
          <mesh position={[14, -2.5, 0]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#35e0c2" /></mesh>
          <mesh position={[14, 10.5, 0]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#ff6bd6" /></mesh>
          <Arrow origin={[11, -2, 0]} dir={[0, 12, 0]} color="#ffd166" radius={0.25} />
          <Label text="tower (schematic)" position={[22, 4, 0]} color="#8a8f98" height={1.5} />
          <Label text="photon climbs: redshifted" position={[26, 12, 0]} color="#ffd166" height={1.4} />
        </>
      )}
      {kind === 'drag' && (
        <>
          <Line points={Array.from({ length: 97 }, (_, k) => { const f = (k / 96) * 2 * Math.PI; return [0, 12 * Math.cos(f), 12 * Math.sin(f)] as Vec3; })} color="#ffd166" lineWidth={1.5} />
          <Arrow origin={[0, 0, 0]} dir={[0, 9, 0]} color="#ffffff" radius={0.3} />
          <Label text="spin J" position={[0, 11, 0]} color="#ffffff" height={1.5} />
          <Label text="polar orbit of the gyroscope (schematic)" position={[0, -16, 0]} color="#ffd166" height={1.5} />
        </>
      )}
    </group>
  );
}
