import { test, expect, tab, readout, surface, num } from './fixtures'

for (const s of ['Sphere', 'Torus', 'Saddle']) {
  test(`Theorema Egregium on ${s}: intrinsic K = extrinsic K`, async ({ app }) => {
    await tab(app, 'Curvature')
    await surface(app, s)
    const a = await num(readout(app, 'K intrinsic (from g)'))
    const b = await num(readout(app, 'K extrinsic (κ₁κ₂)'))
    expect(Math.abs(a - b)).toBeLessThan(1e-4) // both printed to 5 d.p.
    expect(Math.abs(await num(readout(app, 'difference')))).toBeLessThan(1e-6)
  })
}
