import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";

// Use Postgres if DATABASE_URL is provided, else fall back to SQLite
const sessionStorage = process.env.DATABASE_URL
  ? new PostgreSQLSessionStorage(process.env.DATABASE_URL)
  : new SQLiteSessionStorage("./sessions.db");

// Ensure SCOPES are handled correctly
const scopes = process.env.SCOPES ? process.env.SCOPES.split(",") : [];

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes,
    hostName: process.env.HOST.replace(/https?_\/\//, ""),
    apiVersion: LATEST_API_VERSION,
    restResources,
    isEmbeddedApp: true,
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage,
});

export default shopify;
