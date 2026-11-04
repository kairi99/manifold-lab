import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { getSurface } from '../math';
import type { Vec3 } from '../math/types';
import { SURFACE_MODULES } from '../state/modules';
import { useStore } from '../state/store';

const HOME = [3, 2.5, 3] as const;
const DIR = [3, 2.5, 3].map((x) => x / Math.hypot(3, 2.5, 3));
const DIST = Math.hypot(...HOME) * 0.95; // distance at which the unit sphere fits comfortably

/** Frames the custom surface (any size or position) when it changes; restores the home view for built-in surfaces. */
export function FitCamera() {
  const { camera, controls } = useThree();
  const module = useStore((s) => s.module);
  const surfaceId = useStore((s) => s.surfaceId);
  const spec = useStore((s) => s.customSpec);
  const fitted = useRef(false);
  useEffect(() => {
    const ctrl = controls as unknown as { target: { set(x: number, y: number, z: number): void }; update(): void } | null;
    if (!ctrl || !SURFACE_MODULES.has(module)) return;
    let c = [0, 0, 0], R = 1;
    if (surfaceId === 'custom') {
      const s = getSurface('custom'), { u, v } = s.domain, N = 24;
      const pts: Vec3[] = [];
      for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
        const p = s.position(u[0] + ((u[1] - u[0]) * i) / N, v[0] + ((v[1] - v[0]) * j) / N);
        if (p.every(Number.isFinite)) pts.push(p);
      }
      if (!pts.length) return;
      const lo = [0, 1, 2].map((k) => Math.min(...pts.map((p) => p[k]))), hi = [0, 1, 2].map((k) => Math.max(...pts.map((p) => p[k])));
      c = lo.map((x, k) => (x + hi[k]) / 2);
      R = Math.max(0.3, Math.max(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]))));
      fitted.current = true;
    } else if (fitted.current) fitted.current = false;
    else return;
    const d = DIST * R;
    camera.position.set(c[0] + DIR[0] * d, c[1] + DIR[1] * d, c[2] + DIR[2] * d);
    ctrl.target.set(c[0], c[1], c[2]);
    ctrl.update();
    // spec identity: re-fit when a new surface is applied, but not on every slider tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, surfaceId, spec.x, spec.y, spec.z, spec.f, spec.mode, spec.uRange, spec.vRange, controls, camera]);
  return null;
}
