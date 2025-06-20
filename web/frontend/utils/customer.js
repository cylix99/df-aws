import { fetchApi } from "./api";

export async function checkCustomerOfferEligibility(customerId) {
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

    const formattedId = customerId.includes("gid://")
      ? customerId
      : `gid://shopify/Customer/${customerId}`;

    console.log(`Querying for customer ID: ${formattedId}`);

    const response = await fetchApi("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query,
        variables: {
          customerId: formattedId,
        },
      }),
    });

    const data = await response.json();
    console.log("Customer data response:", data);

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return false;
    }

    const customer = data.customer;
    if (!customer) {
      console.error("Customer not found");
      return false;
    }

    const lastDiscountMetafield = customer.metafields?.edges?.find(
      ({ node }) =>
        node.namespace === "offers" && node.key === "last_discount_date"
    )?.node;

    const lastDiscountDate = lastDiscountMetafield?.value;

    if (lastDiscountDate) {
      console.log(`Last discount date found: ${lastDiscountDate}`);
      const lastDate = new Date(lastDiscountDate);
      const daysSince = Math.ceil(
        Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24)
      );

      console.log(`Days since last offer: ${daysSince}`);
      if (daysSince < 30) {
        console.log(`Customer received an offer ${daysSince} days ago`);
        return true;
      }
    } else {
      console.log("No previous discount date found for customer");
    }

    return false;
  } catch (error) {
    console.error("Error checking offer eligibility:", {
      error,
      message: error.message,
      stack: error.stack,
      customerId,
    });
    return false;
  }
}
