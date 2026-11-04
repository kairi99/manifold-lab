import { useMemo } from 'react';
import * as THREE from 'three';
import { Label } from './Label';
import { coordText } from '../panels/Tex';
import type { Surface, Vec2 } from '../math/types';
import Arrow from './Arrow';
import { PAL } from '../theme/palette';
import { useMarkerScale } from './markerScale';
import { add, cross, norm, normalize, scale } from './geom';

export interface TangentPlaneProps {
  surface: Surface;
  uv: Vec2;
  /** half-size of the patch */
  size?: number;
  opacity?: number;
  showLabels?: boolean;
}


export default function TangentPlane({ surface: s, uv, size = 0.4, opacity = 0.25, showLabels = true }: TangentPlaneProps) {
  const [u, v] = uv;
  const k = useMarkerScale(s);
  const p = s.position(u, v), a = s.du(u, v), b = s.dv(u, v);
  const key = [...p, ...a, ...b].join();
  const quat = useMemo(() => {
    const e1 = normalize(a);
    const n = normalize(cross(a, b));
    const e2 = cross(n, e1); // orthonormalized second axis
    return new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(new THREE.Vector3(...e1), new THREE.Vector3(...e2), new THREE.Vector3(...n)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (norm(cross(a, b)) < 1e-9) return null;
  return (
    <group>
      <group position={p} quaternion={quat}>
        <mesh>
          <planeGeometry args={[2 * size * k, 2 * size * k]} />
          <meshStandardMaterial color="#ffffff" side={2} transparent opacity={opacity} depthWrite={false} />
        </mesh>
      </group>
      <Arrow origin={p} dir={a} color={PAL.du} hlKey="du" radius={0.015 * k} />
      <Arrow origin={p} dir={b} color={PAL.dv} hlKey="dv" radius={0.015 * k} />
      {showLabels && (
        <>
          <Label position={add(p, scale(a, 1.15))} text={`∂${coordText(s.coords[0])}`} color={PAL.du} height={0.09 * k} />
          <Label position={add(p, scale(b, 1.15))} text={`∂${coordText(s.coords[1])}`} color={PAL.dv} height={0.09 * k} />
        </>
      )}
    </group>
  );
}
