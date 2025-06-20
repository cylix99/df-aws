// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import shopify from "./shopify.js";
import GDPRWebhookHandlers from "./gdpr.js";
import axios from "axios";
import { sendOrderEmails } from "./emailService.js"; // Adjust the import path as needed

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
app.set('trust proxy', 1);

// Configure express for cookie handling
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js
// All endpoints after this point will require an active session.
app.use("/api/*", shopify.validateAuthenticatedSession());

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
  const shopData = await shopify.api.rest.Shop.all({
    session: res.locals.shopify.session,
  });
  res.status(200).send(shopData);
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

    console.log("api response", response?.body);

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

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
