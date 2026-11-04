import { useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../math/types';
import { useStore } from '../state/store';

export interface ArrowProps {
  origin: Vec3;
  dir: Vec3;
  color?: string;
  opacity?: number;
  radius?: number;
  /** draw on top of everything (no depth test), for markers that would sink into a curved surface */
  overlay?: boolean;
  /** linked-highlight key ('du' | 'dv' | 'V'): hovering sets store.hl, a matching hl thickens and brightens the arrow */
  hlKey?: string;
}

const Y = new THREE.Vector3(0, 1, 0);

export default function Arrow({ origin, dir, color = '#ffffff', opacity = 1, radius = 0.015, overlay = false, hlKey }: ArrowProps) {
  const lit = useStore((s) => hlKey !== undefined && s.hl === hlKey);
  if (lit) radius *= 1.8;
  const emissive = lit ? color : '#000000';
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(...dir).normalize()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dir[0], dir[1], dir[2]],
  );
  if (len < 1e-6) return null;
  const head = Math.min(0.35 * len, radius * 6);
  const shaft = len - head;
  const transparent = opacity < 1;
  return (
    <group position={origin} quaternion={quat}
      onPointerOver={hlKey ? () => useStore.getState().set({ hl: hlKey }) : undefined}
      onPointerOut={hlKey ? () => useStore.getState().set({ hl: null }) : undefined}>
      <mesh position={[0, shaft / 2, 0]} renderOrder={overlay ? 10 : 0}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <meshStandardMaterial color={color} transparent={transparent || overlay} opacity={opacity} depthTest={!overlay} emissive={emissive} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]} renderOrder={overlay ? 10 : 0}>
        <coneGeometry args={[radius * 2.5, head, 16]} />
        <meshStandardMaterial color={color} transparent={transparent || overlay} opacity={opacity} depthTest={!overlay} emissive={emissive} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}
