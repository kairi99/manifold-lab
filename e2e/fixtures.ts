import { test as base, expect, type Locator, type Page } from '@playwright/test'

export { expect }

type Opts = { tourSeen: boolean }

/** Every test fails on console errors or uncaught page errors; the tour is pre-dismissed unless `tourSeen` is false. */
export const test = base.extend<Opts & { app: Page }>({
  tourSeen: [true, { option: true }],
  app: async ({ page, tourSeen }, use) => {
    const errors: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    if (tourSeen) await page.addInitScript(() => localStorage.setItem('manifoldlab.tourSeen', '1'))
    await page.goto('/')
    await expect(page.locator('.canvas canvas')).toBeVisible()
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
