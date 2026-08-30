/// <reference types="@cloudflare/workers-types" />

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_TOKEN: string;
}
