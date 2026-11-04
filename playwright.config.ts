import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    // CI runners have no GPU and headless Firefox gets no WebGL there; Chromium's bundled SwiftShader
    // renders WebGL in software on any machine, so the 3D canvas exists everywhere
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: {
    // test the production bundle: the dev server re-optimizes deps on a cold start and reloads mid-test
    command: 'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /layout\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 1400, height: 850 } },
    },
    {
      name: 'phone',
      testMatch: /(layout|tour)\.spec\.ts/,
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
})
