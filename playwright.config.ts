import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 6100);
const origin = `http://127.0.0.1:${port}`;
const isCI = Boolean(process.env.CI);

// Every spec runs once per builder against that builder's static Storybook.
// The path prefixes match scripts/serve-storybooks.mjs.
const builders = ['vite', 'webpack', 'rsbuild'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  projects: builders.map((name) => ({
    name,
    use: { baseURL: `${origin}/${name}/` },
  })),
  webServer: {
    command: 'node scripts/serve-storybooks.mjs',
    env: { PORT: String(port) },
    url: `${origin}/vite/index.json`,
    reuseExistingServer: !isCI,
  },
});
