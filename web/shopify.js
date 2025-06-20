import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { SQLiteSessionStorage } from "@shopify/shopify-app-session-storage-sqlite";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// Use Memory storage for production on Heroku to avoid SQLite file issues
const sessionStorage =
  process.env.NODE_ENV === "production"
    ? new MemorySessionStorage()
    : new SQLiteSessionStorage(DB_PATH);

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: process.env.SCOPES?.split(",") || ["read_products"],
    hostName: process.env.HOST?.replace(/https?:\/\//, "") || "localhost",
    hostScheme: "https",
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
  // Use appropriate session storage based on environment
  sessionStorage: sessionStorage,
});

export default shopify;
