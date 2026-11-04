import { test, expect, tab, readout, num } from './fixtures'

const open = async (app: import('@playwright/test').Page, view?: string) => {
  await tab(app, 'Curvature in 4D')
  if (view) await app.getByRole('group', { name: 'View' }).getByRole('button', { name: view }).click()
}
const setRange = (app: import('@playwright/test').Page, label: string, v: number) =>
  app.getByLabel(label, { exact: true }).evaluate((el, x) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(x))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, v)

test('Schwarzschild r=6: Kretschmann 48/6^6 and vacuum Einstein equation', async ({ app }) => {
  await open(app)
  expect(await num(readout(app, 'Kretschmann K'))).toBeCloseTo(48 / 6 ** 6, 6)
  await expect(readout(app, 'Kretschmann K')).toHaveText('1.029×10⁻³')
  await expect(readout(app, 'Einstein equation')).toHaveText('Gμν = 0 ✓')
  await expect(readout(app, 'Ricci scalar R')).toHaveText('0')
})

test('closed forms agree with the computed invariants for every spacetime', async ({ app }) => {
  await open(app)
  for (const name of ['Kerr (Boyer–Lindquist)', 'Reissner–Nordström', 'de Sitter (flat slicing)', 'Flat ΛCDM FLRW', 'Schwarzschild']) {
    await app.getByLabel('Spacetime', { exact: true }).selectOption({ label: name })
    const cell = app.locator('.readout > span').filter({ hasText: /^closed form / }).first().locator('xpath=following-sibling::span[1]')
    const sup: Record<string, string> = { '⁻': '-', '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }
    // numbers print as 1.029×10⁻³ (or plain decimals, true minus)
    const [a, b] = ((await cell.textContent())!.match(/[-−]?[\d.]+(?:×10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)?/g) ?? []).map((s) => {
      const [m, e] = s.replace('−', '-').split('×10')
      return parseFloat(m) * (e ? 10 ** Number([...e].map((c) => sup[c]).join('')) : 1)
    })
    expect(a, name).toBeCloseTo(b, 8)
    if (name !== 'Schwarzschild' && name !== 'Kerr (Boyer–Lindquist)') await expect(readout(app, 'Einstein equation')).toContainText('✓')
  }
})

test('Minkowski in spherical coordinates: Γ ≠ 0, Riemann = 0', async ({ app }) => {
  await open(app)
  await app.getByLabel('Spacetime', { exact: true }).selectOption({ label: 'Minkowski (spherical coordinates)' })
  expect(await num(readout(app, 'nonzero Γ components'))).toBeGreaterThan(0)
  await expect(readout(app, 'nonzero Riemann components')).toHaveText('0')
  await expect(readout(app, 'Kretschmann K')).toHaveText('0')
})

test('Schwarzschild event r slider updates K', async ({ app }) => {
  await open(app)
  await setRange(app, 'Event r', 3.02)
  expect(await num(readout(app, 'Kretschmann K'))).toBeCloseTo(48 / 3.02 ** 6, 3)
})

test('tidal: horizon of a 10 solar-mass hole gives 2.06e8 m/s^2 across 2 m', async ({ app }) => {
  await open(app, 'Tidal')
  await expect(readout(app, 'tidal accel. across L at horizon, radial')).toContainText('2.061×10⁸ m/s²')
  await expect(readout(app, 'τ / M')).toContainText('of 97.97')
  await app.getByLabel('Black hole', { exact: true }).selectOption({ label: 'Sagittarius A*' })
  await expect(app.getByText(/Nothing dramatic at the horizon/)).toBeVisible()
  await app.getByLabel('Scrub fall').evaluate((el) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, '0.5'); el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(await num(readout(app, 'trace E'))).toBeCloseTo(0, 8)
})

test('waves: ring, GW150914 plot and parameters render', async ({ app }) => {
  await open(app, 'Waves')
  await expect(app.getByRole('img', { name: /GW150914 strain/ })).toBeVisible()
  await expect(app.getByRole('table', { name: 'GW150914 parameters' })).toContainText('35.6')
  await app.getByRole('group', { name: 'Wave source' }).getByRole('button', { name: 'GW150914 template' }).click()
  await app.getByRole('group', { name: 'Parameter set' }).getByRole('button', { name: 'PRL 2016' }).click()
  expect(await num(readout(app, 'ringdown f220'))).toBeGreaterThan(200)
  await expect(app.locator('.canvas canvas')).toBeVisible()
})
