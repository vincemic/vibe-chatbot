import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for manual testing (servers started manually)
 * Use this when you want to start servers yourself and just run tests
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for easier debugging
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for debugging
  workers: 1, // Single worker for easier debugging
  reporter: [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Increase timeouts for slower systems
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test only in Chrome for faster feedback during debugging
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Slow down interactions for better debugging
        launchOptions: {
          slowMo: 100
        }
      },
    },
  ],

  // No webServer - start servers manually
  timeout: 60000, // 60 second test timeout
});
