import { defineConfig } from '@playwright/test';

const database = process.env.TEST_MONGODB_URI;
if (!database || !/\/issue_tracker_frontend_test(?:\?|$)/.test(database)) {
  throw new Error(
    'Set TEST_MONGODB_URI to an isolated database named issue_tracker_frontend_test',
  );
}
const secret = 'frontend-e2e-only-secret-at-least-32-characters';
export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3011',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node ../server/src/server.js',
      url: 'http://localhost:5011/api/health',
      env: {
        MONGODB_URI: database,
        JWT_SECRET: secret,
        CLIENT_URL: 'http://localhost:3011',
        PORT: '5011',
        NODE_ENV: 'test',
      },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 3011',
      url: 'http://localhost:3011/login',
      env: {
        NEXT_PUBLIC_API_URL: 'http://localhost:5011/api',
        NEXT_TELEMETRY_DISABLED: '1',
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
