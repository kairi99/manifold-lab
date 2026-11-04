import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import type { Surface, Vec2 } from '../math/types';
import { buildSurfaceGeometry, uvToDomain } from './geom';

export interface DraggablePointProps {
  surface: Surface;
  uv: Vec2;
  onChange: (uv: Vec2) => void;
  color?: string;
  radius?: number;
}

/** Marker dragged along the surface; picks against an internal low-res copy of the surface. */
export default function DraggablePoint({ surface: s, uv, onChange, color = '#ffd24a', radius = 0.05 }: DraggablePointProps) {
  const { gl, camera, controls } = useThree();
  const [drag, setDrag] = useState(false);
  const cb = useRef(onChange);
  cb.current = onChange;
  const pickMesh = useMemo(
    () => new THREE.Mesh(buildSurfaceGeometry(s, 96, 48), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })),
    [s],
  );
  useEffect(() => () => { pickMesh.geometry.dispose(); (pickMesh.material as THREE.Material).dispose(); }, [pickMesh]);
  const ctrl = controls as unknown as { enabled: boolean } | null;

  useEffect(() => {
    if (!drag) return;
    const el = gl.domElement;
    const rc = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ndc, camera);
      const hit = rc.intersectObject(pickMesh)[0];
      if (hit?.uv) cb.current(uvToDomain(s, hit.uv));
    };
    const up = () => setDrag(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    if (ctrl) ctrl.enabled = false;
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (ctrl) ctrl.enabled = true;
    };
  }, [drag, gl, camera, pickMesh, s, ctrl]);

  return (
    <mesh
      position={s.position(uv[0], uv[1])}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setDrag(true); }}
      onPointerOver={() => (gl.domElement.style.cursor = 'grab')}
      onPointerOut={() => (gl.domElement.style.cursor = '')}
    >
      <sphereGeometry args={[radius, 24, 16]} />
      <meshStandardMaterial color={drag ? '#fff2a8' : color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
}
