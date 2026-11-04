import { test, expect } from './fixtures'

test.use({ start: '/' })

test('start page lists every simulation, opens one, and is reachable again', async ({ app }) => {
  await expect(app.getByRole('heading', { name: 'Manifold Lab', level: 1 })).toBeVisible()
  await expect(app.locator('.home-card')).toHaveCount(8)
  await expect(app.locator('.canvas')).toHaveCount(0)

  await app.locator('.home-card', { hasText: 'Curvature in 4D' }).click()
  await expect(app).toHaveURL(/#spacetime$/)
  await expect(app.locator('.canvas canvas')).toBeVisible()
  await expect(app.locator('.nav button.active')).toHaveText('Curvature in 4D')

  await app.goBack() // browser back returns to the start page
  await expect(app.locator('.home-card')).toHaveCount(8)

  await app.locator('.home-card', { hasText: 'Geodesics' }).click()
  await expect(app.locator('.nav button.active')).toHaveText('Geodesics')
  await app.locator('.topbar .home-link').click()
  await expect(app.locator('.home-card')).toHaveCount(8)
})
