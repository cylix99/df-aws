let fetch;

export function setAuthFetch(authFetch) {
  fetch = authFetch;
}

const DISCOUNT_CODE_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) {
              edges {
                node {
                  code
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function generateRandomCode() {
  console.log("Generating random discount code...");
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "PZ"; // Fixed prefix
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  console.log(`Generated code: ${code}`);
  return code;
}

async function findValidDiscountCode() {
  console.log("Searching for existing valid discount codes...");
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
    {
      discountNodes(
        first: 50
        ${cursor ? `after: "${cursor}"` : ""}
        query: "status:active type:percentage method:code"
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            discount {
              ... on DiscountCodeBasic {
                codes(first: 1) {
                  edges {
                    node {
                      code
                    }
                  }
                }
                startsAt
                endsAt
                status
                title
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
      console.log("Fetching discount codes from Shopify...");
      const response = await fetch("/api/call/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Add debug logging
      console.log("Raw API Response:", {
        status: response.status,
        statusText: response.statusText,
        result,
      });

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        return null;
      }

      // Check if data exists
      if (!result.data) {
        console.error("No data in response:", result);
        return null;
      }

      const { edges = [], pageInfo = {} } = result.data.discountNodes || {};

      // Update pagination info
      hasNextPage = pageInfo.hasNextPage || false;
      cursor = pageInfo.endCursor;

      console.log(`Processing ${edges.length} discount codes...`);

      // Filter codes that match our criteria
      const validCodes = edges
        .filter((edge) => {
          if (!edge?.node?.discount) {
            console.log("Skipping edge without discount data");
            return false;
          }

          const discount = edge.node.discount;
          if (!discount.codes?.edges?.[0]?.node?.code) {
            console.log("Skipping discount without code");
            return false;
          }

          const code = discount.codes.edges[0].node.code;
          const title = discount.title || "";
          const percentage = discount.customerGets?.value?.percentage;

          console.log(
            `Checking code: ${code}, title: ${title}, percentage: ${
              percentage * 100
            }%`
          );

          // Check for PZ prefix
          if (!code.startsWith("PZ")) {
            console.log(`Skipping code with wrong prefix: ${code}`);
            return false;
          }

          // Skip if not a 30-Day New Customer Discount
          if (!title.includes("30-Day New Customer Discount")) {
            console.log(`Skipping code with wrong title format: ${title}`);
            return false;
          }

          // Check expiry date if it exists
          if (discount.endsAt) {
            const endsAt = new Date(discount.endsAt);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            if (endsAt < thirtyDaysFromNow) {
              console.log(`Skipping code that expires too soon: ${code}`);
              return false;
            }
          }

          // Check for correct percentage (10%)
          if (percentage !== 0.1) {
            console.log(
              `Skipping code with wrong percentage: ${percentage * 100}%`
            );
            return false;
          }

          console.log(`Found valid code: ${code}`);
          return true;
        })
        .map((edge) => edge.node.discount.codes.edges[0].node.code);

      if (validCodes.length > 0) {
        console.log(
          `Found ${validCodes.length} valid codes, using: ${validCodes[0]}`
        );
        return validCodes[0];
      }

      if (!hasNextPage) {
        console.log("No more pages to check");
        break;
      }

      console.log("No valid codes found on this page, checking next page...");
    } catch (error) {
      console.error("Failed to fetch discount codes:", error);
      return null;
    }
  }

  console.log("No valid discount codes found after checking all pages");
  return null;
}

export function generatePeriodCode() {
  console.log("Generating period-based code...");
  const date = new Date();
  // Get the period number (0-35 for year, 0-2 for 10-day period)
  const year = date.getFullYear() - 2024; // Starting from 2024
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  const period = Math.floor(dayOfYear / 10);

  // Generate a deterministic but random-looking code for this period
  const seed = year * 100 + period; // Create a unique seed for this period
  Math.seed = seed; // Set the seed for "random" generation
  console.log(`Generated period code with seed ${seed}`);
  return generateRandomCode();
}

export async function hasReceivedOffer(customerId) {
  console.log(`Checking if customer ${customerId} has received an offer...`);
  try {
    const query = `
      query getCustomer($customerId: ID!) {
        customer(id: $customerId) {
          id
          email
          displayName
          tags
          metafields(first: 10) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
        }
      }
    `;

    // Ensure customerId has proper gid format
    const formattedCustomerId = customerId.includes("gid://")
      ? customerId
      : `gid://shopify/Customer/${customerId}`;

    console.log(`Querying for customer ID: ${formattedCustomerId}`);

    const response = await fetch("/api/call/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { customerId: formattedCustomerId },
      }),
    });

    if (!response.ok) {
      console.error("Network response was not ok:", {
        status: response.status,
        statusText: response.statusText,
      });
      return false;
    }

    const data = await response.json();
    console.log("Customer data response:", data);

    // Check for GraphQL errors first
    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return false;
    }

    // The customer data is directly in data.data.customer
    const customer = data.data?.customer;

    // Validate customer data
    if (!customer) {
      console.error("Customer not found");
      return false;
    }

    // Check metafields
    const offerMetafield = customer.metafields?.edges?.find(
      ({ node }) =>
        node.namespace === "offers" && node.key === "last_discount_date"
    )?.node;

    const lastDiscountDate = offerMetafield?.value;

    if (lastDiscountDate) {
      console.log(`Last discount date found: ${lastDiscountDate}`);
      const lastDate = new Date(lastDiscountDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`Days since last offer: ${diffDays}`);

      if (diffDays < 30) {
        console.log(`Customer received an offer ${diffDays} days ago`);
        return true;
      }
    } else {
      console.log("No previous discount date found for customer");
    }

    return false;
  } catch (error) {
    console.error("Error checking offer eligibility:", {
      error: error,
      message: error.message,
      stack: error.stack,
      customerId: customerId,
    });
    return false;
  }
}

export async function createDiscountCode(isAmazonOrder = false) {
  console.log(`Creating discount code (Amazon order: ${isAmazonOrder})`);
  if (isAmazonOrder) {
    console.log("Amazon order - using FIRSTORDER code");
    return "FIRSTORDER";
  }

  console.log("Checking for existing valid codes...");
  // First check for existing valid code
  const existingCode = await findValidDiscountCode();
  if (existingCode) {
    console.log(`Using existing discount code: ${existingCode}`);
    return existingCode;
  }

  // Generate new code if no valid existing code found
  const code = generateRandomCode();
  console.log(`Creating new discount code: ${code}`);

  const variables = {
    basicCodeDiscount: {
      title: `30-Day New Customer Discount ${code}`,
      code: code,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
      customerSelection: {
        all: true,
      },
      customerGets: {
        value: {
          percentage: 0.1, // Corrected to be between 0.0 and 1.0
        },
        items: {
          all: true,
        },
      },
      appliesOncePerCustomer: true,
      usageLimit: null,
      combinesWith: {
        orderDiscounts: false,
        productDiscounts: false,
        shippingDiscounts: false,
      },
    },
  };

  try {
    console.log("Sending discount code creation request...");
    const response = await fetch("/api/call/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: DISCOUNT_CODE_MUTATION,
        variables,
      }),
    });

    const data = await response.json();
    console.log("Discount code API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    if (data.error || data.errors) {
      console.error(
        "API returned error during discount creation:",
        data.error || data.errors
      );
      console.error("Full response:", JSON.stringify(data, null, 2));
      console.error("Response status code:", response.status);
      console.error("Response status text:", response.statusText);
      return null;
    }

    if (data?.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      const error = data.data.discountCodeBasicCreate.userErrors[0];
      console.error("Failed to create discount code:", error);
      throw new Error(error.message);
    }

    const createdCode =
      data?.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes
        ?.edges[0]?.node?.code;

    if (!createdCode) {
      throw new Error("Created discount code not found in response");
    }

    console.log(`Successfully created discount code: ${createdCode}`);
    return createdCode;
  } catch (error) {
    console.error("Failed to create discount code:", {
      error: error,
      message: error.message,
      stack: error.stack,
    });
    return null;
  }
}

export async function recordOfferSent(customerId, isAmazonOrder = false) {
  console.log(
    `Recording offer sent for customer ${customerId} (Amazon: ${isAmazonOrder})`
  );
  try {
    const mutation = `
      mutation CreateMetafield($metafield: MetafieldsSetInput!) {
        metafieldsSet(metafields: [$metafield]) {
          metafields {
            id
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      metafield: {
        namespace: "offers",
        key: "last_discount_date",
        ownerId: customerId,
        type: "single_line_text_field",
        value: new Date().toISOString().split("T")[0],
      },
    };

    console.log("Sending metafield update request...");
    const response = await fetch("/api/call/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = await response.json();
    console.log("Metafield update API Response:", {
      status: response.status,
      statusText: response.statusText,
      data: data,
    });

    // Check for GraphQL errors
    if (data.error || data.errors) {
      console.error(
        "API returned error during metafield update:",
        data.error || data.errors
      );
      return false;
    }

    // Check for user errors
    if (data?.data?.metafieldsSet?.userErrors?.length > 0) {
      const errors = data.data.metafieldsSet.userErrors;
      console.error("Metafield update validation errors:", {
        errors,
        customerId,
      });
      return false;
    }

    // Validate successful update
    const createdMetafield = data?.data?.metafieldsSet?.metafields?.[0];
    if (
      !createdMetafield?.id ||
      createdMetafield.value !== variables.metafield.value
    ) {
      console.error("Metafield not created correctly:", {
        received: createdMetafield,
        expected: variables.metafield,
      });
      return false;
    }

    console.log(`Successfully recorded offer date for customer ${customerId}`);
    return true;
  } catch (error) {
    console.error("Failed to record offer:", {
      error: error,
      message: error.message,
      stack: error.stack,
      customerId,
      isAmazonOrder,
    });
    return false;
  }
}
