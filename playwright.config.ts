import { defineConfig, devices } from '@playwright/test';

// Set BASE_URL to test an already running server (for example `wrangler dev` on :8787).
const external = process.env.BASE_URL;

export default defineConfig({
  testDir: './e2e',
  // Slower laptops (for example Windows on ARM, where Chromium runs emulated) time out when
  // many browsers cold-start at once. Two workers and longer limits keep the gate stable.
  workers: 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: { baseURL: external ?? 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: external
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        url: 'http://localhost:4173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
