import type { Locator } from '@playwright/test'

type V3 = [number, number, number]

/** Screen position of a world point for the app's fixed camera: position (3,2.5,3), fov 45, looking at the origin, y up. */
export async function project(canvas: Locator, p: V3) {
  const box = (await canvas.boundingBox())!
  const cam: V3 = [3, 2.5, 3]
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const norm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l] }
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const f = norm(sub([0, 0, 0], cam))
  const r = norm(cross(f, [0, 1, 0]))
  const u = cross(r, f)
  const d = sub(p, cam)
  const z = dot(d, f)
  const t = Math.tan((45 * Math.PI) / 360)
  const aspect = box.width / box.height
  const ndcX = dot(d, r) / z / (t * aspect)
  const ndcY = dot(d, u) / z / t
  return { x: box.x + ((ndcX + 1) / 2) * box.width, y: box.y + ((1 - ndcY) / 2) * box.height }
}

/** Sphere (R = 1) position and tangent vector V^θ ∂θ + V^φ ∂φ in world space. */
export function sphereWorld(th: number, ph: number, V: [number, number]) {
  const pos: V3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]
  const dth: V3 = [Math.cos(th) * Math.cos(ph), -Math.sin(th), Math.cos(th) * Math.sin(ph)]
  const dph: V3 = [-Math.sin(th) * Math.sin(ph), 0, Math.sin(th) * Math.cos(ph)]
  const tip: V3 = [0, 1, 2].map((i) => pos[i] + V[0] * dth[i] + V[1] * dph[i]) as V3
  return { pos, tip }
}

export async function drag(page: import('@playwright/test').Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 6 })
  await page.mouse.move(to.x, to.y, { steps: 6 })
  await page.mouse.up()
}
