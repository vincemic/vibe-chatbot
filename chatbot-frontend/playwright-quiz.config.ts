import { defineConfig, devices } from '@playwright/test';

/**
 * Quiz-specific Playwright configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Only run quiz-related tests */
  testMatch: ['**/quiz*.spec.ts'],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report-quiz' }],
    ['json', { outputFile: 'test-results-quiz.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Extend timeout for quiz tests since they involve API calls */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-quiz',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox-quiz',
      use: { ...devices['Desktop Firefox'] },
    },

    /* Test quiz functionality on mobile */
    {
      name: 'mobile-chrome-quiz',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Global timeout for each test */
  timeout: 60000,

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'dotnet run',
      cwd: '../ChatbotApi',
      port: 7271,
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // Extended timeout for quiz API initialization
      env: {
        'ASPNETCORE_ENVIRONMENT': 'Development',
        'DOTNET_ENVIRONMENT': 'Development'
      }
    },
    {
      command: 'npm run start -- --port 4200',
      port: 4200,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
