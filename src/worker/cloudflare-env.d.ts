declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    AI: Ai;
    /** A secret. Without it, the demo can't be reset over HTTP. */
    DEMO_RESET_TOKEN?: string;
  }
}
