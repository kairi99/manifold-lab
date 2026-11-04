import { test, expect } from './fixtures'
import { drag, project, sphereWorld } from './project'
import type { Page } from '@playwright/test'

const coords = async (p: Page) => {
  const t = (await p.locator('[data-tour="metric-readout"] p').first().textContent())!
  const m = /=\s*\(([-\d.]+),\s*([-\d.]+)\)/.exec(t)!
  return [parseFloat(m[1]), parseFloat(m[2])] as [number, number]
}
const vec = async (p: Page) => [parseFloat(await p.locator('input[type=number]').nth(0).inputValue()), parseFloat(await p.locator('input[type=number]').nth(1).inputValue())]
const gpp = async (p: Page) => {
  const tex = await p.locator('[data-tour="metric-readout"] annotation').filter({ hasText: 'g_{ij}' }).first().textContent()
  return parseFloat(/&\s*([-\d.]+)\s*\\end\{pmatrix\}/.exec(tex!)![1])
}

test('dragging the yellow point moves p and keeps g_φφ = sin²θ', async ({ app }) => {
  const canvas = app.locator('.canvas canvas')
  const [th0, ph0] = await coords(app)
  expect(th0).toBeCloseTo(Math.PI / 3, 2)
  const { pos } = sphereWorld(th0, ph0, [0.5, 0.5])
  const from = await project(canvas, pos)
  const c = await project(canvas, [0, 0, 0])
  const k = 60 / Math.hypot(c.x - from.x, c.y - from.y)
  await drag(app, from, { x: from.x + (c.x - from.x) * k, y: from.y + (c.y - from.y) * k })
  await expect.poll(async () => (await coords(app)).join()).not.toBe(`${th0.toFixed(3)},${ph0.toFixed(3)}`)
  const [th, ph] = await coords(app)
  expect(Math.hypot(th - th0, ph - ph0)).toBeGreaterThan(0.05)
  expect(Math.abs((await gpp(app)) - Math.sin(th) ** 2)).toBeLessThanOrEqual(1.001e-3)
})

test('dragging the vector tip changes V^i', async ({ app }) => {
  const canvas = app.locator('.canvas canvas')
  const [th, ph] = await coords(app)
  const v0 = await vec(app)
  const { tip } = sphereWorld(th, ph, v0 as [number, number])
  const from = await project(canvas, tip)
  await drag(app, from, { x: from.x + 30, y: from.y - 30 })
  await expect.poll(async () => (await vec(app)).join()).not.toBe(v0.join())
  const v1 = await vec(app)
  expect(Math.hypot(v1[0] - v0[0], v1[1] - v0[1])).toBeGreaterThan(0.05)
  expect((await coords(app)).join()).toBe([th, ph].join()) // p unchanged
})
