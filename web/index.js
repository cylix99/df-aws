// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import axios from "axios";
import { sendOrderEmails } from "./emailService.js"; // Adjust the import path as needed
import { calculateUSCustomsDuties, isUSAddress, createDutiesLineItem, getDutiesExplanation } from "./utils/usCustomsDuties.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Configure session cookies for embedded apps
app.set("trust proxy", 1);

// Configure express for JSON and URL encoded parsing BEFORE webhook handling
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

// Add webhook handling with better error handling
app.post(
  shopify.config.webhooks.path,
  (req, res, next) => {
    console.log("Webhook received:", {
      topic: req.headers["x-shopify-topic"],
      shop: req.headers["x-shopify-shop-domain"],
      hasBody: !!req.body,
      bodyLength: req.body ? req.body.length : 0,
    });
    next();
  },
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// Add some debugging middleware before session validation
app.use("/api/*", (req, res, next) => {
  // Skip webhook endpoints
  if (req.path.includes("/webhooks")) {
    return next();
  }

  console.log(`API request to ${req.path}, session info:`, {
    hasShopifyLocals: !!res.locals.shopify,
    sessionId: res.locals.shopify?.session?.id,
    shop: res.locals.shopify?.session?.shop,
    authorization: req.headers.authorization
      ? "Bearer token present"
      : "No authorization header",
  });
  next();
});

// All endpoints after this point will require an active session (except webhooks)
app.use("/api/*", async (req, res, next) => {
  // Skip webhook endpoints and auth endpoints
  if (req.path.includes("/webhooks") || req.path.includes("/auth")) {
    return next();
  }

  console.log("[SESSION] Processing API request to:", req.path);

  // For embedded apps, try to get the session from the session token first
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const sessionToken = authHeader.substring(7);
      console.log("[SESSION] Found session token in Authorization header");
      try {
        // Decode and validate the session token
        const payload = await shopify.api.session.decodeSessionToken(
          sessionToken
        );
        console.log("[SESSION] Decoded session token payload:", {
          iss: payload.iss,
          dest: payload.dest,
          aud: payload.aud,
          sub: payload.sub,
          exp: payload.exp,
          iat: payload.iat,
        });

        // Extract shop from the issuer
        const shop = payload.iss.replace("https://", "").replace("/admin", "");

        // Try to get the offline session for this shop
        const offlineSessionId = shopify.api.session.getOfflineId(shop);
        const offlineSession = await shopify.config.sessionStorage.loadSession(
          offlineSessionId
        );

        if (offlineSession) {
          console.log("[SESSION] Found offline session for shop:", shop);
          res.locals.shopify = { session: offlineSession };
          return next();
        } else {
          console.log("[SESSION] No offline session found for shop:", shop);
        }
      } catch (tokenError) {
        console.log(
          "[SESSION] Session token validation failed:",
          tokenError.message
        );
      }
    } else {
      console.log("[SESSION] No Bearer token found in Authorization header");
    }
  } catch (error) {
    console.log("[SESSION] Error processing session token:", error.message);
  }

  // Fall back to traditional session validation
  console.log("[SESSION] Falling back to traditional session validation");
  return shopify.validateAuthenticatedSession()(req, res, next);
});

function convertLineItemsEmail(items) {
  let groupedItems = {};

  items.forEach((item) => {
    const quantityPairs = item.quantities.split(", ");
    const quantitiesObject = {};

    quantityPairs.forEach((pair) => {
      const [title, value] = pair.split(" x ");
      quantitiesObject[title.trim()] = parseFloat(value);
    });

    let stock_message = "";
    if (item.unfulfilledQuantity > 0) {
      if (quantitiesObject.on_hand > 0) {
        if (quantitiesObject.available < 0) {
          stock_message = "Might be Available to ship";
        } else {
          stock_message = "Available to ship";
        }
      } else {
        stock_message = "Awaiting Stock";
      }

      // Group items by stock message
      if (!groupedItems[stock_message]) {
        groupedItems[stock_message] = [];
      }
      if (stock_message == "Awaiting Stock") {
        const expectedFromDate = new Date(item.expectedFrom);
        const expectedToDate = new Date(item.expectedTo);

        /** @type {Intl.DateTimeFormatOptions} */
        const options = { day: "numeric", month: "short", year: "2-digit" };

        const formattedFromDate = expectedFromDate
          .toLocaleDateString("en-US", options)
          .replace(/(\d+)(st|nd|rd|th)/, "$1$2");
        const formattedToDate = expectedToDate
          .toLocaleDateString("en-US", options)
          .replace(/(\d+)(st|nd|rd|th)/, "$1$2");

        groupedItems[stock_message].push(
          `${item.title}  (Expected release: ${formattedFromDate} - ${formattedToDate})`
        );
      } else {
        groupedItems[stock_message].push(item.title);
      }
    }
  });

  // Format the grouped items into the desired output
  let finalOutput = "";
  for (const stock_message in groupedItems) {
    finalOutput += `\n${stock_message}\n`;
    groupedItems[stock_message].forEach((title) => {
      finalOutput += `${title}\n`;
    });
  }

  return finalOutput;
}

app.post("/proxy/manifests", async (req, res) => {
  try {
    const headers = {
      accept: req.headers["accept"],
      Authorization: req.headers["authorization"],
      "Content-Type": req.headers["content-type"],
    };

    const response = await axios.post(
      "https://api.proshipping.net/v4/manifests/rm",
      {},
      { headers }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error on proxy:", error);

    // Check if the error response is in the expected format
    if (error.response && error.response.data && error.response.data.Message) {
      const errorMessage = error.response.data.Message;
      const errorDetails = error.response.data.Errors || [];

      res.status(400).json({
        error: errorMessage,
        details: errorDetails,
      });
    } else {
      res.status(500).json({ error: "Failed to fetch from the API" });
    }
  }
});

app.post("/proxy/shipping", async (req, res) => {
  try {
    const headers = {
      accept: req.headers["accept"],
      Authorization: req.headers["authorization"],
      "Content-Type": req.headers["content-type"],
    };

    const response = await axios.post(
      "https://api.proshipping.net/v4/shipments/rm",
      req.body,
      { headers }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error on proxy:", error);

    // Check if the error response is in the expected format
    if (error.response && error.response.data && error.response.data.Message) {
      const errorMessage = error.response.data.Message;
      const errorDetails = error.response.data.Errors || [];

      res.status(400).json({
        error: errorMessage,
        details: errorDetails,
      });
    } else {
      res.status(500).json({ error: "Failed to fetch from the API" });
    }
  }
});

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/shop", async (_req, res) => {
  try {
    console.log("Shop endpoint called, session details:", {
      hasShopifyLocals: !!res.locals.shopify,
      sessionId: res.locals.shopify?.session?.id,
      shop: res.locals.shopify?.session?.shop,
      isOnline: res.locals.shopify?.session?.isOnline,
      accessToken: res.locals.shopify?.session?.accessToken
        ? "present"
        : "missing",
    });

    if (!res.locals.shopify?.session) {
      console.log("No session found in res.locals.shopify");
      return res.status(401).json({ error: "No session found" });
    }

    const shopData = await shopify.api.rest.Shop.all({
      session: res.locals.shopify.session,
    });

    console.log("Shop data retrieved successfully");
    res.status(200).send(shopData);
  } catch (error) {
    console.error("Shop endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to trigger email sending
app.post("/api/send-emails", async (req, res) => {
  const { orders } = req.body; // Extract orders from request body
  console.log({ orders });
  try {
    for (const order of orders) {
      // Here, you would reconstruct the email body using `order.items` and other details
      const emailBody = convertLineItemsEmail(order.items);
      const subject = "Update on your Pre-Order";
      const body = `Order# ${order.number}
      
      Hello,

We're reaching out to update you on the current status of your order, which includes one or more pre-ordered jigsaw puzzles.

${emailBody}

To get your available puzzles sooner, we can arrange a partial shipment for an additional £3.97 shipping charge. If this option suits you, please reply to this email, and we'll send a payment request to facilitate this. Alternatively, if you prefer to wait until all puzzles are in stock, there's nothing more you need to do.

Ian McLaren
Head of Puzzle Obsession
Puzzle Galore`;

      // Use your email sending logic here, as previously described
      await sendOrderEmails({
        to: order.email,
        subject: subject,
        body: body,
      });
    }

    res.json({ message: "Emails sent successfully." });
  } catch (error) {
    console.error("Failed to send emails:", error);
    res.status(500).json({ message: "Failed to send emails." });
  }
});

app.post("/api/call/graphql", async (req, res) => {
  try {
    console.log("api, post", JSON.stringify(req.body, null, 2));
    const { query, variables } = req.body;
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });
    const response = await client.query({
      data: {
        query,
        variables,
      },
    });

    console.log("api response", JSON.stringify(response?.body, null, 2));

    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send(JSON.stringify(response?.body || {}));
  } catch (error) {
    console.error("Error occurred:", error);

    // Send a default response or error message with a 200 status
    res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send(
        JSON.stringify({
          error: "An error occurred, but still returning 200 status.",
        })
      );
  }
});

// API endpoint to calculate US customs duties
app.post("/api/calculate-duties", async (req, res) => {
  try {
    const { items, totalValue, currency, shippingAddress, shipDate } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    if (!totalValue || totalValue <= 0) {
      return res.status(400).json({ error: "Total value is required and must be greater than 0" });
    }

    // Check if shipping to US
    if (!isUSAddress(shippingAddress)) {
      return res.json({
        dutyRequired: false,
        totalDuties: 0,
        adminFee: 0,
        totalCharges: 0,
        reason: "Duties only apply to US shipments"
      });
    }

    // Calculate duties
    const dutiesCalculation = calculateUSCustomsDuties(items, totalValue, currency || 'GBP');
    
    // Add explanation for customer
    dutiesCalculation.customerExplanation = getDutiesExplanation(dutiesCalculation);
    
    // Create line item if duties are required
    if (dutiesCalculation.dutyRequired) {
      dutiesCalculation.lineItem = createDutiesLineItem(dutiesCalculation);
    }

    res.json(dutiesCalculation);
  } catch (error) {
    console.error("Error calculating duties:", error);
    res.status(500).json({ 
      error: "Unable to calculate duties at this time",
      message: error.message 
    });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
