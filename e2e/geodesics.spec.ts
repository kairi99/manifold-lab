import { test, expect, tab, readout } from './fixtures'

test('central geodesic of the default fan ends at the antipode of p', async ({ app }) => {
  const t = (await app.locator('[data-tour="metric-readout"] p').first().textContent())!
  const m = /=\s*\(([-\d.]+),\s*([-\d.]+)\)/.exec(t)!
  const th = parseFloat(m[1]), ph = parseFloat(m[2])
  await tab(app, 'Geodesics')
  await expect(app.getByText('Progress 100%', { exact: true })).toBeVisible()
  const [a, b] = (await readout(app, '(θ, φ)').textContent())!.match(/-?\d+\.\d+/g)!.map(Number)
  const TAU = 2 * Math.PI
  expect(Math.abs(a - (Math.PI - th))).toBeLessThan(1e-2)
  const dphi = (((b - (ph + Math.PI)) % TAU) + 3 * Math.PI) % TAU - Math.PI
  expect(Math.abs(dphi)).toBeLessThan(1e-2)
})
