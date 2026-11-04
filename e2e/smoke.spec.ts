import { test, expect, tab } from './fixtures'

const MODULES: [string, string][] = [
  ['Metric & Tangent Spaces', 'Parametrization'],
  ['Parallel Transport', 'Holonomy'],
  ['Geodesics', 'Geodesic equation'],
  ['Curvature', 'Intrinsic vs extrinsic'],
  ['Vector Fields & TM', 'Poincaré–Hopf'],
  ['Relativity: Schwarzschild & Kerr', 'Schwarzschild geometry'],
]

test('every module tab loads its panel', async ({ app }) => {
  for (const [name, heading] of MODULES) {
    await tab(app, name)
    await expect(app.locator('.nav button.active')).toHaveText(name)
    await expect(app.locator('.panel').getByRole('heading', { name: heading })).toBeVisible()
    await expect(app.locator('.canvas canvas')).toBeVisible()
  }
})
