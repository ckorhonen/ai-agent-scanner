/// <reference types="@remix-run/cloudflare" />
/// <reference types="vite/client" />

// Cloudflare Workers bindings
interface CloudflareEnv {
  /** KV namespace for persisting scan results (7-day TTL) */
  SCAN_KV: KVNamespace
  /** D1 database for structured scan history + leaderboard */
  DB: D1Database
}

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv
    }
  }
}

// Vite ?url suffix imports
declare module "*.css?url" {
  const url: string;
  export default url;
}
