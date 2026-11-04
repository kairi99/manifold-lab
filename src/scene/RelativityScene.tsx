import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { Vec3 } from '../math/types';
import { makeFlamm, zOfR } from '../math/flamm';
import { useTr } from '../i18n';
import {
  B_CRIT, ISCO, PHOTON_SPHERE, R_S, deflection, integrateOrbit, orbitFromApsides,
} from '../math/schwarzschild';
import { ORBITS, LIGHT, bodyById, massInGeometricUnits } from '../data/celestial';
import type { CelestialBody, LightPreset, OrbitPreset } from '../data/celestial';
import { useStore } from '../state/store';
import { Label } from './Label';
import SurfaceMesh from './SurfaceMesh';
import { KerrView, ImageView, ClocksView } from './KerrScene';

/**
 * Display scale: the whole scene lives in a group scaled by DISPLAY = 1/14, so 1 world unit = 14 M
 * (r_s = 2M ≈ 0.14 units, r = 40M ≈ 2.9 units). All coordinates below are in units of M.
 * Equatorial plane: (r, φ) -> [r cosφ, 0, r sinφ]. With the Flamm view on, the same (r, φ) is lifted
 * to height z(r) on the paraboloid r = 2 + z²/8 (upper sheet).
 */
export const DISPLAY = 1 / 14;
const FLAMM_ZMAX = 18; // r up to 42.5 M
const SECONDS = 10; // playback time for progress 0 -> 1
const TOY_RP = 8;
const TOY_RA_MAX = 60;
const N_RAYS = 15;
const R_START = 45;

type Traj = ReturnType<typeof integrateOrbit>;
export interface OrbitModel {
  body: CelestialBody | null;
  preset: OrbitPreset | null;
  /** apsides actually drawn (M); differs from the real ones when `toy` */
  rp: number; ra: number; toy: boolean;
  orb: { E: number; L: number } | null;
  traj: Traj | null;
}
export interface LightModel {
  body: CelestialBody | null;
  preset: LightPreset | null;
  rays: { b: number; traj: Traj; central: boolean }[];
  alpha: number | null; // numeric deflection of the central ray (rad), null if captured
}

// beyond the drawn Flamm rim, curves stay at rim height: z(r) is unbounded and would send far-away rays skyward
const R_RIM = 2 + (FLAMM_ZMAX * FLAMM_ZMAX) / 8;
export const lift = (r: number, phi: number, flamm: boolean): Vec3 =>
  [r * Math.cos(phi), flamm ? zOfR(Math.min(Math.max(r, R_S), R_RIM)) : 0, r * Math.sin(phi)];
const planar = (x: number, y: number, flamm: boolean) => lift(Math.hypot(x, y), Math.atan2(y, x), flamm);

const one = <T,>() => {
  let key = '', val: T;
  return (k: string, f: () => T): T => (k === key ? val : ((key = k), (val = f())));
};
const orbitCache = one<OrbitModel>();
const lightCache = one<LightModel>();

export const bodyMass = (b: CelestialBody | null) => (b ? massInGeometricUnits(b.gm) : null);

export function orbitModel(grBody: string, grOrbit: string, grRp: number, grRa: number): OrbitModel {
  return orbitCache(`${grBody}|${grOrbit}|${grRp}|${grRa}`, () => {
    const body = grBody ? bodyById(grBody) ?? null : null;
    const preset = body ? ORBITS.find((o) => o.id === grOrbit && o.centralId === body.id) ?? null : null;
    let rp = Math.min(grRp, grRa), ra = Math.max(grRp, grRa), toy = false;
    if (preset && body) {
      // real a/M is ~1e7: precession invisible, so draw a strong-field toy with the same eccentricity
      toy = true;
      rp = TOY_RP;
      ra = Math.min(TOY_RA_MAX, (rp * (1 + preset.e)) / (1 - preset.e));
    }
    const orb = orbitFromApsides(rp, ra);
    let traj: Traj | null = null;
    if (orb) {
      const a = (rp + ra) / 2;
      traj = integrateOrbit({
        kind: 'timelike', E: orb.E, L: orb.L, r0: ra, phi0: 0, inward: true,
        lambdaMax: 3.2 * 2 * Math.PI * a ** 1.5, rMax: ra * 3,
      });
    }
    return { body, preset, rp, ra, toy, orb, traj };
  });
}

export function lightModel(grBody: string, grOrbit: string, grB: number): LightModel {
  return lightCache(`${grBody}|${grOrbit}|${grB}`, () => {
    const body = grBody ? bodyById(grBody) ?? null : null;
    const preset = body ? LIGHT.find((o) => o.id === grOrbit && o.centralId === body.id) ?? null : null;
    const mid = (N_RAYS - 1) / 2;
    const rays = Array.from({ length: N_RAYS }, (_, i) => {
      const b = Math.max(0.3, grB + (i - mid) * 0.5);
      // start on the incoming asymptote y = -b so the ray comes in horizontally from the left
      const phi0 = Math.PI + Math.asin(Math.min(1, b / R_START));
      const traj = integrateOrbit({ kind: 'null', E: 1, L: b, r0: R_START, phi0, inward: true, lambdaMax: 600, rMax: 60 });
      return { b, traj, central: i === mid };
    });
    return { body, preset, rays, alpha: deflection(grB).numeric };
  });
}

/** Sample at fraction `p` of the proper-time span (binary search on tau). */
export function sampleAt(traj: Traj, p: number) {
  const s = traj.samples;
  const target = s[0].tau + p * (s[s.length - 1].tau - s[0].tau);
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m].tau <= target) lo = m; else hi = m; }
  const a = s[lo], b = s[hi], f = b.tau > a.tau ? Math.min(1, Math.max(0, (target - a.tau) / (b.tau - a.tau))) : 0;
  return { r: a.r + f * (b.r - a.r), phi: a.phi + f * (b.phi - a.phi), tau: target };
}

/** Indices of local minima of r (periapsis passages). */
export function periapsides(traj: Traj): number[] {
  const s = traj.samples, out: number[] = [];
  for (let i = 1; i < s.length - 1; i++) if (s[i].r < s[i - 1].r && s[i].r <= s[i + 1].r) out.push(i);
  return out;
}

const ring = (r: number, flamm: boolean): Vec3[] =>
  Array.from({ length: 97 }, (_, i) => lift(r, (i / 96) * 2 * Math.PI, flamm));

function Rings({ flamm }: { flamm: boolean }) {
  // default camera looks from φ = π/4; labels at φ = π/4 ± π/2 sit left/right of the centre instead of stacking on it
  const tt = useTr();
  const lbl = (r: number, phi: number): Vec3 => { const p = lift(r, phi, flamm); return [p[0], p[1] + 1.2, p[2]]; };
  return (
    <>
      <Line points={ring(PHOTON_SPHERE, flamm)} color="#ffd166" lineWidth={1.5} dashed dashSize={0.4} gapSize={0.3} />
      <Line points={ring(ISCO, flamm)} color="#35e0c2" lineWidth={1.5} />
      <Label text={tt('photon sphere 3M', 'esfera de fotones 3M')} position={lbl(PHOTON_SPHERE, Math.PI * 0.75)} color="#ffd166" height={1.6} />
      <Label text={tt('ISCO 6M', 'ISCO 6M')} position={lbl(ISCO, -Math.PI * 0.25)} color="#35e0c2" height={1.6} />
    </>
  );
}

function Horizon() {
  const tt = useTr();
  return (
    <group>
      <mesh><sphereGeometry args={[R_S, 48, 32]} /><meshBasicMaterial color="#000000" /></mesh>
      <mesh><sphereGeometry args={[R_S * 1.04, 48, 32]} /><meshBasicMaterial color="#ff9f43" transparent opacity={0.35} side={1} depthWrite={false} /></mesh>
      <Label text={tt('horizon r = 2M', 'horizonte r = 2M')} position={[0, -R_S - 2.5, 0]} color="#ff9f43" height={1.6} />
    </group>
  );
}

function OrbitView({ flamm }: { flamm: boolean }) {
  const tt = useTr();
  const grBody = useStore((s) => s.grBody), grOrbit = useStore((s) => s.grOrbit);
  const grRp = useStore((s) => s.grRp), grRa = useStore((s) => s.grRa);
  const m = orbitModel(grBody, grOrbit, grRp, grRa);
  const ref = useRef<THREE.Mesh>(null);
  const { traj } = m;
  const pts = useMemo(() => traj?.samples.map((q) => lift(q.r, q.phi, flamm)) ?? [], [traj, flamm]);
  const peri = useMemo(() => (traj ? periapsides(traj).map((i) => traj.samples[i]) : []), [traj]);
  const ghost = useMemo(() => {
    const e = (m.ra - m.rp) / (m.ra + m.rp), p = ((m.ra + m.rp) / 2) * (1 - e * e);
    return Array.from({ length: 181 }, (_, i) => { const f = (i / 180) * 2 * Math.PI; return lift(p / (1 - e * Math.cos(f)), f, flamm); });
  }, [m.rp, m.ra, flamm]);

  useFrame((_, dt) => {
    const st = useStore.getState();
    if (st.grPlaying) st.set({ grProgress: (st.grProgress + Math.min(dt, 0.1) / SECONDS) % 1 });
    if (!ref.current || !traj) return;
    const q = sampleAt(traj, useStore.getState().grProgress);
    ref.current.position.set(...lift(q.r, q.phi, flamm));
  });

  const top = flamm ? zOfR(42) + 4 : 8;
  return (
    <group>
      {pts.length > 1 && <Line points={pts} color="#6cb6ff" lineWidth={2} />}
      <Line points={ghost} color="#8a8f98" lineWidth={1} dashed dashSize={0.5} gapSize={0.4} transparent opacity={0.7} />
      {peri.map((q, i) => {
        const p = lift(q.r, q.phi, flamm), o = lift(0, 0, flamm);
        return (
          <group key={i}>
            <Line points={[o, p]} color="#ff6bd6" lineWidth={1} transparent opacity={0.5} />
            <mesh position={p}><sphereGeometry args={[0.3, 12, 8]} /><meshBasicMaterial color="#ff6bd6" /></mesh>
          </group>
        );
      })}
      <mesh ref={ref}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.7} />
      </mesh>
      <Label text={m.toy ? tt('strong-field illustration — real numbers in panel', 'ilustración de campo fuerte — cifras reales en el panel') : tt('custom orbit (geometric units, M = 1)', 'órbita personalizada (unidades geométricas, M = 1)')} position={[0, top + 1, 0]} color={m.toy ? '#ffb347' : '#e6e6e6'} height={2} />
      <Label text={tt('grey dashed: Newtonian ellipse; pink: periapsides', 'gris discontinuo: elipse newtoniana; rosa: periapsis')} position={[0, top - 2.5, 0]} color="#8a8f98" height={1.5} />
    </group>
  );
}

function LightView({ flamm }: { flamm: boolean }) {
  const tt = useTr();
  const grBody = useStore((s) => s.grBody), grOrbit = useStore((s) => s.grOrbit), grB = useStore((s) => s.grB);
  const m = lightModel(grBody, grOrbit, grB);
  const lines = useMemo(() => m.rays.map((r) => r.traj.samples.map((q) => lift(q.r, q.phi, flamm))), [m, flamm]);
  const asym = useMemo(() => {
    const c = m.rays.find((r) => r.central)!;
    const s = c.traj.samples, P = s[s.length - 1];
    if (m.alpha === null || c.traj.fate !== 'escape') return null;
    const px = P.r * Math.cos(P.phi), py = P.r * Math.sin(P.phi);
    const d = [Math.cos(m.alpha), Math.sin(m.alpha)];
    const t = (py + c.b) / Math.sin(m.alpha); // intersection with the incoming asymptote y = -b
    const X = px - t * d[0];
    const seg = (a: [number, number], b: [number, number]) =>
      Array.from({ length: 41 }, (_, i) => planar(a[0] + (b[0] - a[0]) * (i / 40), a[1] + (b[1] - a[1]) * (i / 40), flamm));
    return { inc: seg([-R_START, -c.b], [X, -c.b]), out: seg([X, -c.b], [X + 50 * d[0], -c.b + 50 * d[1]]) };
  }, [m, flamm]);
  const top = flamm ? zOfR(42) + 4 : 8;
  return (
    <group>
      {m.rays.map((r, i) => (
        <Line key={i} points={lines[i]}
          color={r.central ? '#ffd166' : r.traj.fate === 'capture' ? '#ff6b6b' : '#7fd6ff'}
          lineWidth={r.central ? 3 : 1.2} transparent opacity={r.central ? 1 : 0.75} />
      ))}
      {asym && (
        <>
          <Line points={asym.inc} color="#ffd166" lineWidth={1} dashed dashSize={0.6} gapSize={0.4} />
          <Line points={asym.out} color="#ffd166" lineWidth={1} dashed dashSize={0.6} gapSize={0.4} />
        </>
      )}
      <Label text={tt(`light rays; red: b < b_c = 3√3 M ≈ ${B_CRIT.toFixed(2)} M (captured)`, `rayos de luz; rojo: b < b_c = 3√3 M ≈ ${B_CRIT.toFixed(2)} M (capturados)`)} position={[0, top + 1, 0]} color="#e6e6e6" height={2} />
    </group>
  );
}

/** Proper radial distance from the throat, s(r) = sqrt(r(r-2)) + 2 ln((sqrt r + sqrt(r-2))/sqrt 2). */
const properS = (r: number) => Math.sqrt(r * (r - 2)) + 2 * Math.log((Math.sqrt(r) + Math.sqrt(r - 2)) / Math.SQRT2);
const rOfS = (s: number) => { let lo = 2, hi = 60; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (properS(m) < s) lo = m; else hi = m; } return lo; };

function FlammView() {
  const tt = useTr();
  const ruler = useMemo(() => {
    const rm = rOfS(25);
    const line: Vec3[] = Array.from({ length: 81 }, (_, i) => { const r = rOfS((i / 80) * 25); return [r, zOfR(r) + 0.15, 0] as Vec3; });
    return { rm, line, ticks: [0, 5, 10, 15, 20, 25].map((s) => { const r = rOfS(s); return { s, r, z: zOfR(r) + 0.15 }; }) };
  }, []);
  return (
    <group>
      <Line points={ring(R_S, true)} color="#ff9f43" lineWidth={2.5} />
      <Label text={tt('throat (Einstein–Rosen bridge)', 'garganta (puente de Einstein–Rosen)')} position={[-R_S - 5, 1.5, 0]} color="#ff9f43" height={1.8} />
      <Label text={tt('not traversable: the full spacetime is dynamical', 'no atravesable: el espaciotiempo completo es dinámico')} position={[-R_S - 5, -0.3, 0]} color="#8a8f98" height={1.3} />
      <Line points={ruler.line} color="#35e0c2" lineWidth={2} />
      {ruler.ticks.map((t, i) => (
        <group key={t.s}>
          <mesh position={[t.r, t.z, 0]}><sphereGeometry args={[0.25, 10, 8]} /><meshBasicMaterial color="#35e0c2" /></mesh>
          {i % 2 === 0 && <Label text={`s = ${t.s}M (r = ${t.r.toFixed(1)}M)`} position={[t.r + 1.5, t.z + 1.2, 0]} color="#35e0c2" height={1.3} />}
        </group>
      ))}
      <Label text={tt('spatial slice t = const, both sheets (two exteriors)', 'sección espacial t = const, ambas hojas (dos exteriores)')} position={[0, zOfR(42) + 6, 0]} color="#e6e6e6" height={2} />
    </group>
  );
}

export function RelativityScene() {
  const view = useStore((s) => s.grView), showFlamm = useStore((s) => s.grShowFlamm);
  const tt = useTr();
  const surface = useMemo(() => makeFlamm(FLAMM_ZMAX), []);
  if (view === 'kerr' || view === 'image' || view === 'clocks') {
    return (
      <group scale={DISPLAY}>
        {view === 'kerr' && <KerrView />}
        {view === 'image' && <ImageView />}
        {view === 'clocks' && <ClocksView />}
      </group>
    );
  }
  const flamm = view === 'flamm' || showFlamm;
  return (
    <group scale={DISPLAY}>
      {flamm && <SurfaceMesh surface={surface} opacity={view === 'flamm' ? 0.5 : 0.22} />}
      {view !== 'flamm' && <Horizon />}
      {view !== 'flamm' && <Rings flamm={showFlamm} />}
      {view !== 'flamm' && showFlamm && (
        <Label text={tt('spatial slice t = const (Flamm); curves drawn at their (r, φ)', 'sección espacial t = const (Flamm); curvas dibujadas en su (r, φ)')} position={[0, -2, 0]} color="#6cb6ff" height={1.6} />
      )}
      {view === 'orbits' && <OrbitView flamm={showFlamm} />}
      {view === 'light' && <LightView flamm={showFlamm} />}
      {view === 'flamm' && <FlammView />}
    </group>
  );
}
