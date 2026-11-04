import * as THREE from 'three';
import type { Surface, Vec2, Vec3 } from '../math/types';

export { add, sub, scale, dot, cross, norm, normalize } from '../math/vec';
export { toWorld, fromWorld } from '../math/metric';
import { cross, normalize } from '../math/vec';

export function clampWrap(s: Surface, u: number, v: number): Vec2 {
  const f = (x: number, [a, b]: [number, number], per: boolean) =>
    per ? a + ((((x - a) % (b - a)) + (b - a)) % (b - a)) : Math.min(b, Math.max(a, x));
  return [f(u, s.domain.u, s.domain.periodicU), f(v, s.domain.v, s.domain.periodicV)];
}

/** Normalized (0..1) uv -> domain coords. */
export function uvToDomain(s: Surface, t: THREE.Vector2): Vec2 {
  const { u, v } = s.domain;
  return clampWrap(s, u[0] + t.x * (u[1] - u[0]), v[0] + t.y * (v[1] - v[0]));
}

export function unitNormal(s: Surface, u: number, v: number): Vec3 {
  return normalize(cross(s.du(u, v), s.dv(u, v)));
}

/** Grid geometry over the domain with `uv` attribute in normalized param coords. */
export function buildSurfaceGeometry(s: Surface, nu: number, nv: number): THREE.BufferGeometry {
  const { u: du, v: dv } = s.domain;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
  const uvs = new Float32Array((nu + 1) * (nv + 1) * 2);
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const k = j * (nu + 1) + i;
      const a = i / nu, b = j / nv;
      const p = s.position(du[0] + a * (du[1] - du[0]), dv[0] + b * (dv[1] - dv[0]));
      pos.set(p, k * 3);
      uvs[k * 2] = a;
      uvs[k * 2 + 1] = b;
      if (i < nu && j < nv) {
        const k1 = k + 1, k2 = k + nu + 1, k3 = k2 + 1;
        idx.push(k, k1, k2, k1, k3, k2);
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
