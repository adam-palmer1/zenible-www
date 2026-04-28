import { defineConfig, devices } from '@playwright/test';

const ENABLE_WEBKIT = process.env.AUDIT_WEBKIT !== '0';

const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 568 },
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-414', width: 414, height: 896 },
  { name: 'tablet-768', width: 768, height: 1024 },
] as const;

const STORAGE_STATE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests/mobile-audit',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.AUDIT_BASE_URL ?? 'https://app.zenible.com',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    ...VIEWPORTS.map((vp) => ({
      name: `chromium-${vp.name}`,
      dependencies: ['setup'] as string[],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: vp.width < 768,
        storageState: STORAGE_STATE,
      },
      metadata: { viewportName: vp.name, viewportWidth: vp.width, viewportHeight: vp.height, engine: 'chromium' },
    })),
    ...(ENABLE_WEBKIT
      ? [
          {
            name: 'webkit-iphone-12',
            dependencies: ['setup'] as string[],
            use: {
              ...devices['iPhone 12'],
              storageState: STORAGE_STATE,
            },
            metadata: { viewportName: 'webkit-iphone-12', viewportWidth: 390, viewportHeight: 844, engine: 'webkit' },
          },
        ]
      : []),
  ],
});
