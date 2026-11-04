import { useMemo } from 'react';
import * as THREE from 'three';
import type { Vec3 } from '../math/types';

export interface ArrowProps {
  origin: Vec3;
  dir: Vec3;
  color?: string;
  opacity?: number;
  radius?: number;
  /** draw on top of everything (no depth test), for markers that would sink into a curved surface */
  overlay?: boolean;
}

const Y = new THREE.Vector3(0, 1, 0);

export default function Arrow({ origin, dir, color = '#ffffff', opacity = 1, radius = 0.015, overlay = false }: ArrowProps) {
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
    <group position={origin} quaternion={quat}>
      <mesh position={[0, shaft / 2, 0]} renderOrder={overlay ? 10 : 0}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <meshStandardMaterial color={color} transparent={transparent || overlay} opacity={opacity} depthTest={!overlay} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]} renderOrder={overlay ? 10 : 0}>
        <coneGeometry args={[radius * 2.5, head, 16]} />
        <meshStandardMaterial color={color} transparent={transparent || overlay} opacity={opacity} depthTest={!overlay} />
      </mesh>
    </group>
  );
}
