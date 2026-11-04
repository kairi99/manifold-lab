import { test, expect, tab, readout, surface, num } from './fixtures'

for (const s of ['Sphere', 'Torus']) {
  test(`Poincaré–Hopf on ${s}: Σ ind = χ for every preset`, async ({ app }) => {
    await tab(app, 'Vector Fields & TM')
    await surface(app, s)
    const X = app.locator('label.field', { hasText: 'Field X' }).locator('select')
    const values = await X.locator('option').evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value))
    expect(values.length).toBeGreaterThan(1)
    for (const v of values) {
      await X.selectOption(v)
      const chi = await num(readout(app, 'χ(M)'))
      expect(chi).toBe(s === 'Sphere' ? 2 : 0)
      expect(await num(readout(app, 'Σ ind')), `field ${v}`).toBe(chi)
    }
  })
}
