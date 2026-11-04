import { useMemo, useRef } from 'react';
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../state/store';
import { ringPositionExact } from '../math/gw';
import { gwDisplay } from '../panels/GWModel';
import { Label } from './Label';

const N = 64, R = 2, SECONDS = 10;

/** Ring of free particles in the x–y plane (TT gauge, wave along z): coordinates fixed, proper separations oscillate. */
export function GWScene() {
  const drive = useStore((s) => s.gwDrive);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ghostPts = useMemo(() => Array.from({ length: N + 1 }, (_, k) => [R * Math.cos((2 * Math.PI * k) / N), R * Math.sin((2 * Math.PI * k) / N), 0] as [number, number, number]), []);
  useFrame((_, dt) => {
    const st = useStore.getState();
    if (st.stPlaying) st.set({ stProgress: (st.stProgress + Math.min(dt, 0.1) / SECONDS) % 1 });
    if (!mesh.current) return;
    const { hPlus, hCross } = gwDisplay(st.stProgress, st.gwDrive, st.stPol, st.stAmp);
    for (let k = 0; k < N; k++) {
      const [x, y] = ringPositionExact(R * Math.cos((2 * Math.PI * k) / N), R * Math.sin((2 * Math.PI * k) / N), hPlus, hCross);
      dummy.position.set(x, y, 0); dummy.updateMatrix(); mesh.current.setMatrixAt(k, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group scale={0.5}>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color="#ffd166" />
      </instancedMesh>
      <Line points={ghostPts} color="#8a8f98" lineWidth={1} dashed dashSize={0.1} gapSize={0.1} transparent opacity={0.6} />
      <Line points={[[0, 0, -1], [0, 0, 3]]} color="#6cb6ff" lineWidth={2} />
      <Label text="z (wave)" position={[0, 0.3, 3.2]} color="#6cb6ff" height={0.26} />
      <Label text="x" position={[R + 0.6, 0, 0]} height={0.3} />
      <Label text="y" position={[0, R + 0.6, 0]} height={0.3} />
      <Label text={drive === 'mono' ? `TT ring, amplitude exaggerated (real h ~ 1e-21)` : 'GW150914 NR template (H1), scaled up, slowed ~50x'} position={[0, -3.1, 0]} color="#ffb347" height={0.3} />
    </group>
  );
}
