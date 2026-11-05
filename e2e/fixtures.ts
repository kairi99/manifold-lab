import { test as base, expect, type Locator, type Page } from '@playwright/test'

export { expect }

type Opts = { tourSeen: boolean; start: string }

/** Every test fails on console errors or uncaught page errors. Opens `start` (default: the metric module, skipping
 *  the start page); every module's guide is pre-dismissed unless `tourSeen` is false. */
export const test = base.extend<Opts & { app: Page }>({
  tourSeen: [true, { option: true }],
  start: ['/#metric', { option: true }],
  app: async ({ page, tourSeen, start }, use) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    if (tourSeen) await page.addInitScript(() => {
      for (const m of ['curves', 'metric', 'transport', 'geodesics', 'curvature', 'fields', 'relativity', 'spacetime', 'cosmos', 'limits', 'frontiers'])
        localStorage.setItem(`manifoldlab.tourSeen.${m}`, '1')
    })
    await page.goto(start)
    if (start.includes('#')) await expect(page.locator('.canvas canvas')).toBeVisible()
    await use(page)
    expect(errors).toEqual([])
  },
})

export const tab = (p: Page, name: string) => p.locator('.nav').getByRole('button', { name, exact: true }).click()

/** Value cell next to a `.readout` label cell (label matched as a whole, KaTeX-safe via regex on textContent). */
export const readout = (p: Page, label: string | RegExp): Locator =>
  p.locator('.readout > span').filter({ hasText: typeof label === 'string' ? new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) : label })
    .first().locator('xpath=following-sibling::span[1]')

const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' }
/** Parses plain decimals and the app's scientific format (2.1×10⁷, −4.5×10⁻³). */
export const num = async (l: Locator) => {
  const s = (await l.textContent())!.replace('−', '-')
  const m = s.match(/^\s*(-?[\d.]+)×10([⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)/)
  return m ? parseFloat(m[1]) * 10 ** parseInt([...m[2]].map((c) => SUP[c]).join('')) : parseFloat(s)
}

export const surface = (p: Page, label: string) => p.locator('[data-tour="surface-picker"] select').selectOption({ label })
