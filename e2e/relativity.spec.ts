import { test, expect, tab, readout } from './fixtures'

test('Sun + Mercury: GR perihelion prediction 42.98″/century', async ({ app }) => {
  await tab(app, 'Relativity: Schwarzschild & Kerr')
  await app.getByRole('group', { name: 'View' }).getByRole('button', { name: 'Orbits' }).click()
  await app.getByLabel('Central object').selectOption({ label: 'Sun' })
  await app.getByLabel('Orbit preset').selectOption({ label: 'Mercury' })
  await expect(readout(app, 'GR prediction')).toContainText('42.98 ″/century')
})

const view = async (app: import('@playwright/test').Page, name: string) => {
  await tab(app, 'Relativity: Schwarzschild & Kerr')
  await app.getByRole('group', { name: 'View' }).getByRole('button', { name }).click()
}
const setSpin = (app: import('@playwright/test').Page, a: number) =>
  app.getByLabel('Black hole spin a over M').evaluate((el, v) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, String(v))
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, a)

test('Kerr: ISCO radius and accretion efficiency vs spin', async ({ app }) => {
  await view(app, 'Kerr')
  const cases: [number, string, string, string?][] = [
    [0, '6.000, 6.000 M', '5.72 %'],
    [0.9, '2.321, 8.717 M', '15.58 %'],
    [0.998, '1.237, 8.994 M', '32.1'],
  ]
  for (const [a, isco, eff] of cases) {
    await setSpin(app, a)
    await expect(readout(app, 'ISCO pro, retro')).toContainText(isco)
    await expect(readout(app, 'efficiency 1 − E')).toContainText(eff)
  }
  await app.getByRole('group', { name: 'Orbit direction' }).getByRole('button', { name: 'Retrograde' }).click()
  await expect(readout(app, 'ISCO pro, retro')).toContainText('1.237, 8.994 M')
})

test('Image: ray trace completes and canvas is not black', async ({ app }) => {
  await view(app, 'Image')
  await expect(app.getByRole('status').filter({ hasText: 'trace complete' })).toBeVisible({ timeout: 45_000 })
  const lit = await app.getByRole('img', { name: /Ray-traced image/ }).evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && d[i] + d[i + 1] + d[i + 2] > 30) n++
    return n
  })
  expect(lit).toBeGreaterThan(100)
})

test('Clocks: Pound-Rebka, Gravity Probe B, Cassini predictions', async ({ app }) => {
  await view(app, 'Clocks')
  const pick = (label: string | RegExp) => app.getByLabel('Test').selectOption({ label: label as string })
  await pick('Pound-Rebka / Pound-Snider (Harvard tower)')
  await expect(readout(app, 'GR predicted |Δν/ν|')).toContainText('2.45e-15')
  await pick('Gravity Probe B')
  const row = (n: string) => app.getByRole('row', { name: new RegExp(`^${n}`) })
  await expect(row('geodetic')).toContainText('6606.1')
  await expect(row('frame dragging')).toContainText('39.2')
  await pick('Cassini solar conjunction (2002)')
  await expect(readout(app, 'one-way delay')).toContainText('μs')
  await expect(readout(app, 'observed')).not.toBeEmpty()
})
