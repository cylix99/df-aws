import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";

// Simple persistent session storage using memory (will reset on restart but that's ok for OAuth)
const sessionStorage = new MemorySessionStorage();

// Ensure SCOPES are handled correctly
const scopes = process.env.SCOPES
  ? process.env.SCOPES.split(",")
  : [
      "read_customers",
      "write_customers",
      "read_inventory",
      "read_orders",
      "read_all_orders",
      "write_orders",
      "read_products",
      "write_products",
      "read_product_listings",
      "read_reports",
      "read_shipping",
      "write_assigned_fulfillment_orders",
      "read_assigned_fulfillment_orders",
      "write_fulfillments",
      "read_fulfillments",
      "read_merchant_managed_fulfillment_orders",
      "write_merchant_managed_fulfillment_orders",
      "read_third_party_fulfillment_orders",
      "write_third_party_fulfillment_orders",
      "read_discounts",
      "write_discounts",
      "write_store_credit_account_transactions",
    ];

console.log("Using scopes:", scopes);

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes,
    hostName: process.env.HOST
      ? process.env.HOST.replace(/https?:\/\//, "")
      : "heroku.puzzlesgalore.co.uk",
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
  useOnlineTokens: false, // Use offline tokens for simpler session management
});

export default shopify;
