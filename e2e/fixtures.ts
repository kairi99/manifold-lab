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
      for (const m of ['metric', 'transport', 'geodesics', 'curvature', 'fields', 'relativity', 'spacetime', 'cosmos'])
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

export const num = async (l: Locator) => parseFloat((await l.textContent())!.replace('−', '-'))

export const surface = (p: Page, label: string) => p.locator('[data-tour="surface-picker"] select').selectOption({ label })
