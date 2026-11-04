import { test, expect, tab, readout } from './fixtures'

test('Sun + Mercury: GR perihelion prediction 42.98″/century', async ({ app }) => {
  await tab(app, 'Relativity: Schwarzschild & Kerr')
  await app.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Orbits' }).click()
  await app.getByLabel('Central object').selectOption({ label: 'Sun' })
  await app.getByLabel('Orbit preset').selectOption({ label: 'Mercury' })
  await expect(readout(app, 'GR prediction')).toContainText('42.98 ″/century')
})
