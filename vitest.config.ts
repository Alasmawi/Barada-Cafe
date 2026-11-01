import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const migrations = await readD1Migrations('migrations');

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        // Tests never call the real model: ai-draft.test.ts passes in fixture clients.
        remoteBindings: false,
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      include: ['test/**/*.test.ts'],
      setupFiles: ['test/setup.ts'],
    },
  };
});
