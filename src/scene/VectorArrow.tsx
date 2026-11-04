import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import type { Surface, Vec2 } from '../math/types';
import Arrow from './Arrow';
import { PAL } from '../theme/palette';
import { useStore } from '../state/store';
import { useMarkerScale } from './markerScale';
import { add, cross, fromWorld, sub, toWorld } from './geom';

export interface VectorArrowProps {
  surface: Surface;
  uv: Vec2;
  V: Vec2;
  color?: string;
  editable?: boolean;
  ghost?: boolean;
  onChange?: (V: Vec2) => void;
}

export default function VectorArrow({ surface: s, uv, V, color = PAL.V, editable = false, ghost = false, onChange }: VectorArrowProps) {
  const { gl, camera, controls } = useThree();
  const [drag, setDrag] = useState(false);
  const lit = useStore((st) => !ghost && st.hl === 'V');
  const live = useRef({ s, uv, onChange });
  live.current = { s, uv, onChange };
  const ctrl = controls as unknown as { enabled: boolean } | null;
  const k = useMarkerScale(s);
  const p = s.position(uv[0], uv[1]);
  const W = toWorld(s, uv[0], uv[1], V);
  const tip = add(p, W);

  useEffect(() => {
    if (!drag) return;
    const el = gl.domElement;
    const rc = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
    const move = (ev: PointerEvent) => {
      const { s: ls, uv: luv, onChange: lchange } = live.current;
      const r = el.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ndc, camera);
      const base = ls.position(luv[0], luv[1]);
      const n = cross(ls.du(luv[0], luv[1]), ls.dv(luv[0], luv[1]));
      plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(...n).normalize(), new THREE.Vector3(...base));
      if (rc.ray.intersectPlane(plane, hit)) lchange?.(fromWorld(ls, luv[0], luv[1], sub([hit.x, hit.y, hit.z], base)));
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
  }, [drag, gl, camera, ctrl]);

  return (
    <group>
      <Arrow origin={p} dir={W} color={color} opacity={ghost ? 0.35 : 1} radius={(ghost ? 0.01 : 0.018) * k} hlKey={ghost ? undefined : 'V'} />
      {editable && (
        <mesh
          position={tip}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setDrag(true); }}
          onPointerOver={() => { gl.domElement.style.cursor = 'grab'; useStore.getState().set({ hl: 'V' }); }}
          onPointerOut={() => { gl.domElement.style.cursor = ''; useStore.getState().set({ hl: null }); }}
        >
          <sphereGeometry args={[(lit ? 0.06 : 0.045) * k, 16, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
