import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { ringDeformation, ringInitial } from '../math/tidal';
import { Label } from './Label';

const N = 48, STEPS = 240;
const COL = ['#ffb347', '#6cb6ff', '#35e0c2']; // rings in planes (radial,θ̂), (radial,φ̂), (θ̂,φ̂)

let cache: { r0: number; res: ReturnType<typeof ringDeformation> } | null = null;
/** Three great circles of test particles (radius 1 initially) falling from rest at r0; cached per r0. */
export function tidalRing(r0: number) {
  if (cache?.r0 !== r0) {
    const xi0 = [ringInitial(N, 1, 0, 1), ringInitial(N, 1, 0, 2), ringInitial(N, 1, 1, 2)].flat();
    cache = { r0, res: ringDeformation({ r0, xi0, tauEnd: Infinity, steps: STEPS }) };
  }
  return cache.res;
}
export const tidalFrame = (r0: number, progress: number) => {
  const res = tidalRing(r0), f = progress * STEPS, i = Math.min(Math.floor(f), STEPS - 1), w = f - i;
  return { i, w, tau: res.tau[i] * (1 - w) + res.tau[i + 1] * w, r: res.r[i] * (1 - w) + res.r[i + 1] * w, res };
};
/** Linear up to 3, logarithmic beyond so a runaway stretch stays on screen (the panel reports the true value). */
const squash = (v: number) => (Math.abs(v) <= 3 ? v : Math.sign(v) * (3 + Math.log(Math.abs(v) / 3)));
const SECONDS = 12;

export function TidalScene() {
  const r0 = useStore((s) => s.stR0);
  const mesh = useRef<THREE.InstancedMesh>(null), marker = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => Array.from({ length: 3 * N }, (_, k) => new THREE.Color(COL[Math.floor(k / N)])), []);
  const strip = (r: number) => -3 + (3 * (r - 2)) / (r0 - 2); // r0 at x=0, horizon at x=-3
  useFrame((_, dt) => {
    const st = useStore.getState();
    if (st.stPlaying) st.set({ stProgress: Math.min(1, st.stProgress + Math.min(dt, 0.1) / SECONDS) });
    if (st.stPlaying && st.stProgress >= 1) st.set({ stPlaying: false });
    if (!mesh.current) return;
    const { i, w, res, r } = tidalFrame(st.stR0, st.stProgress);
    for (let k = 0; k < 3 * N; k++) {
      const a = res.offsets[i][k], b = res.offsets[i + 1][k];
      // triad (radial, θ̂, φ̂) -> scene (x, y, z)
      dummy.position.set(squash(a[0] + w * (b[0] - a[0])), squash(a[1] + w * (b[1] - a[1])), squash(a[2] + w * (b[2] - a[2])));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(k, dummy.matrix);
      mesh.current.setColorAt(k, colors[k]);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    marker.current?.position.set(strip(r), -3.4, 0);
  });
  return (
    <group scale={0.4}>
      <instancedMesh ref={mesh} args={[undefined, undefined, 3 * N]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial />
      </instancedMesh>
      <mesh><sphereGeometry args={[0.1, 12, 8]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <Line points={[[0, 0, 0], [3, 0, 0]]} color="#ff6b6b" lineWidth={2} />
      <Line points={[[0, 0, 0], [0, 3, 0]]} color="#8a8f98" lineWidth={1} />
      <Line points={[[0, 0, 0], [0, 0, 3]]} color="#8a8f98" lineWidth={1} />
      <Label text="radial: stretches" position={[3.4, 0.5, 0]} color="#ff6b6b" height={0.32} />
      <Label text="θ̂ (squeezes)" position={[0, 3.6, 0]} color="#c8ccd4" height={0.28} />
      <Label text="φ̂ (squeezes)" position={[0, 0, 3.8]} color="#c8ccd4" height={0.28} />
      <Label text="3 rings of test particles (radius 1 at release)" position={[0, 4.3, 0]} color="#8a8f98" height={0.28} />
      <Line points={[[-3, -3.4, 0], [0, -3.4, 0]]} color="#8a8f98" lineWidth={1} />
      <mesh position={[-3, -3.4, 0]}><sphereGeometry args={[0.18, 12, 8]} /><meshBasicMaterial color="#000000" /></mesh>
      <Label text="horizon 2M" position={[-3, -3.95, 0]} height={0.3} />
      <Label text={`r0 = ${r0}M`} position={[0, -3.95, 0]} height={0.3} />
      <mesh ref={marker}><sphereGeometry args={[0.14, 12, 8]} /><meshBasicMaterial color="#ffffff" /></mesh>
    </group>
  );
}
