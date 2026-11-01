declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: import('@cloudflare/vitest-plugin').D1Migration[];
  }

  interface GlobalProps {
    mainModule: typeof import('../src/worker/index');
  }
}
