import {
  Page,
  Button,
  Card,
  Layout,
  Link,
  Frame,
  useIndexResourceState,
  IndexTable,
  Modal,
  Toast,
  Box,
  InlineStack,
  Thumbnail,
  Text,
  BlockStack,
  Badge,
  Select,
  Banner,
  ButtonGroup,
  EmptyState,
  IndexFilters,
  useSetIndexFiltersMode,
  TextField,
  ProgressBar,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../hooks";
import Pickpack from "./pickpack";
import { useCallback, useState, useEffect, useMemo } from "react";
import { ToastManager, useToastManager } from "../components/ToastManager";

import { CHECK_BULK } from "../graphql/query/orders.query";
import { UPDATE_ORDER } from "../graphql/mutations/order";
import { CREATE_FULFILLMENT } from "../graphql/mutations/order";
import { DELETE_METAFIELD } from "../graphql/mutations/metafields";
import { UPDATE_CUSTOMER } from "../graphql/mutations/customer";
import { TAGS_ADD } from "../graphql/mutations/metafields";
import { TAGS_REMOVE } from "../graphql/mutations/metafields";
import { CANCEL } from "../graphql/mutations/metafields";

import axios from "axios";

//orders(first: 10, query: "name: 38000000001") {
export default function Order() {
  const fetch = useAuthenticatedFetch();
  const { toasts, addToast, addToasts, flushToasts, clearAllToasts } =
    useToastManager();
  const [orders, setOrders] = useState(null);
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("Initializing...");
  const [rerun, setRerun] = useState(0);
  const [active, setActive] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [totalValue, setTotalValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingTimeout, setPollingTimeout] = useState(null);

  const [pickActive, setPickActive] = useState(false);
  const [pickOrders, setPickOrders] = useState(null);
  const togglePickActive = useCallback(
    () => setPickActive((pickActive) => !pickActive),
    []
  );

  const [packActive, setPackActive] = useState(false);
  const [packOrders, setPackOrders] = useState(null);
  const togglePackActive = useCallback(
    () => setPackActive((packActive) => !packActive),
    []
  );
  const toggleActive = useCallback(() => {
    setActive((active) => !active);
    if (active) {
      clearAllToasts();
    }
  }, [clearAllToasts]);
  useEffect(() => {
    console.log("Preorder page: Starting fresh bulk operation");
    setIsLoading(true);
    setError(null);
    setStatus("Creating bulk operation...");
    createbulkrequest();

    // Cleanup polling on unmount
    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
    };
  }, []);

  const BULK_ORDERS = `
  mutation bulkOperationRunQuery($query: String!) {
    bulkOperationRunQuery(query: $query) {      
      bulkOperation {
        id
        status
        objectCount
        query
      }
      userErrors {
        field
        message
        
      }
    }
  }`;

  const tagsRemove = async (variables) => {
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: TAGS_REMOVE,
        variables: variables?.variables,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const cancelBulkRequest = async (variables) => {
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: CANCEL,
        variables: variables?.variables,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };
  const createbulkrequest = async () => {
    try {
      console.log("Preorder page: Creating new bulk operation");
      setStatus("Creating bulk operation...");
      setError(null);

      const response = await fetch("/api/call/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: BULK_ORDERS,
          variables: bulkOrdersText(),
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data_call = await response.json();
      console.log("Preorder page: Bulk operation response:", data_call);

      // Handle GraphQL errors
      if (data_call.errors) {
        console.error("Preorder page: GraphQL errors:", data_call.errors);
        setError(
          "Failed to create bulk operation: " + data_call.errors[0].message
        );
        setStatus("Error creating bulk operation");
        setIsLoading(false);
        return;
      }

      const bulkOp = data_call?.data?.bulkOperationRunQuery?.bulkOperation;
      const userErrors = data_call?.data?.bulkOperationRunQuery?.userErrors;

      if (userErrors && userErrors.length > 0) {
        console.error("Preorder page: User errors:", userErrors);
        setError("Failed to create bulk operation: " + userErrors[0].message);
        setStatus("Error: " + userErrors[0].message);
        setIsLoading(false);
        return;
      }

      if (bulkOp?.status === "CREATED") {
        console.log(
          "Preorder page: Bulk operation created successfully, starting polling"
        );
        setStatus("Bulk operation created, polling for completion...");
        setRerun(0); // Reset retry counter
        checkbulkrequest();
      } else {
        console.error(
          "Preorder page: Unexpected bulk operation status:",
          bulkOp?.status
        );
        setError("Failed to create bulk operation");
        setStatus("Failed to create bulk operation");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Preorder page: Error creating bulk operation:", error);
      setError("Network error: " + error.message);
      setStatus("Network error");
      setIsLoading(false);
    }
  };
  const checkbulkrequest = async () => {
    try {
      console.log(
        `Preorder page: Checking bulk operation status (attempt ${rerun + 1})`
      );

      const response = await fetch("/api/call/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: CHECK_BULK,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Preorder page: Bulk operation check response:", result);

      // Handle GraphQL errors
      if (result.errors) {
        console.error("Preorder page: GraphQL errors in check:", result.errors);
        setError("Error checking bulk operation: " + result.errors[0].message);
        setStatus("Error checking status");
        setIsLoading(false);
        return;
      }

      const data = result.data?.currentBulkOperation;

      if (!data) {
        console.error("Preorder page: No bulk operation data in response");
        setError("No bulk operation found");
        setStatus("No bulk operation found");
        setIsLoading(false);
        return;
      }

      console.log("Preorder page: Current bulk operation:", data);
      setStatus(`Status: ${data.status}`);
      setCurrentId(data.id);

      // Handle completed operation with no results (error case)
      if (data.objectCount === "0" && data.status === "COMPLETED") {
        console.error(
          "Preorder page: Bulk operation completed but returned 0 objects, retrying..."
        );
        setStatus("No results found, creating new bulk operation...");
        setRerun(0); // Reset counter
        createbulkrequest();
        return;
      }

      // Handle successful completion
      if (data.url !== null && data.status === "COMPLETED") {
        console.log(
          "Preorder page: Bulk operation completed successfully, fetching data from:",
          data.url
        );
        setStatus("Bulk operation completed, fetching data...");

        try {
          const axiosResponse = await axios.get(data.url);
          if (axiosResponse && axiosResponse.data) {
            console.log(
              "Preorder page: Successfully fetched bulk operation data"
            );
            setStatus("📋 Parsing preorder data...");
            let responseOrders = axiosResponse.data;
            let groupedOrders = readJsonl(responseOrders);
            console.log("Preorder page: Grouped orders:", groupedOrders);
            setOrders(groupedOrders);

            if (groupedOrders && groupedOrders.length > 0) {
              setStatus(`🔄 Processing ${groupedOrders.length} preorders...`);
              let totalValueRunning = 0;
              let arr = groupedOrders.map((order) => {
                let mainId = order.id.replace("gid://shopify/Order/", "");
                totalValueRunning += parseFloat(
                  order.totalPriceSet?.presentmentMoney?.amount || 0
                );
                return {
                  id: mainId,
                  orderNo: order.name,
                  name: order.customer?.displayName,
                  email: order.customer?.email,
                  cmc: order.shippingAddress?.country,
                  rmTracking: order.royalMailTrackingNumber?.value,
                  rmShipment: order.royalMailShipmentNumber?.value,
                  fulfilmentStatus:
                    order.FulfillmentOrder?.[0]?.status ||
                    order.fulfillment?.edges?.[0]?.node?.status,
                  items: convertLineItems(order),
                  message: null,
                  tags: order.tags,
                };
              });

              setTotalValue(totalValueRunning);
              setRows(arr);
              setStatus(
                `✅ Successfully loaded ${
                  groupedOrders.length
                } preorders (Total value: £${totalValueRunning.toFixed(2)})`
              );
              console.log(
                `Preorder page: Successfully processed ${groupedOrders.length} preorders`
              );
            } else {
              setStatus("No preorders found");
              setRows([]);
              console.log("Preorder page: No preorders found in results");
            }
            setIsLoading(false);
          } else {
            console.error(
              "Preorder page: No response data found from bulk operation URL"
            );
            setError("No data received from bulk operation");
            setStatus("No data received");
            setIsLoading(false);
          }
        } catch (error) {
          console.error(
            "Preorder page: Error fetching bulk operation data:",
            error
          );
          setError("Failed to fetch bulk operation data: " + error.message);
          setStatus("Error fetching data");
          setIsLoading(false);
        }
      } else if (data.status === "RUNNING" || data.status === "CREATED") {
        // Continue polling
        const pollingMessage =
          data.status === "CREATED"
            ? "📝 Bulk operation created, waiting for processing to start..."
            : `🔄 Processing preorders... (${
                data.objectCount || "checking"
              } found so far)`;
        console.log(
          `Preorder page: Bulk operation still ${data.status}, continuing to poll...`
        );
        setStatus(pollingMessage);
        setRerun(rerun + 1);

        const timeout = setTimeout(() => {
          checkbulkrequest();
        }, 1000); // Poll every second

        setPollingTimeout(timeout);
      } else if (data.status === "FAILED" || data.status === "CANCELED") {
        console.error(
          "Preorder page: Bulk operation failed or was canceled:",
          data.status
        );
        setError(`Bulk operation ${data.status.toLowerCase()}`);
        setStatus(`Bulk operation ${data.status.toLowerCase()}`);
        setIsLoading(false);
      } else {
        // Unknown status, continue polling for a while then give up
        if (rerun < 30) {
          // Increased retry limit
          console.log(
            `Preorder page: Unknown status ${data.status}, retrying...`
          );
          setStatus(
            `⏳ Waiting for bulk operation... (attempt ${
              rerun + 1
            }/30, status: ${data.status})`
          );
          setRerun(rerun + 1);

          const timeout = setTimeout(() => {
            checkbulkrequest();
          }, 1000);

          setPollingTimeout(timeout);
        } else {
          console.error("Preorder page: Too many retries, giving up");
          setError("Bulk operation timed out");
          setStatus("❌ Operation timed out after 30 attempts");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Preorder page: Error checking bulk operation:", error);
      // Retry on network errors, but not indefinitely
      if (rerun < 10) {
        console.log("Preorder page: Retrying after network error...");
        setStatus(`⚠️ Network error, retrying... (attempt ${rerun + 1}/10)`);
        setRerun(rerun + 1);

        const timeout = setTimeout(() => {
          checkbulkrequest();
        }, 2000); // Wait longer after errors

        setPollingTimeout(timeout);
      } else {
        setError("Network error: " + error.message);
        setStatus(`❌ Network error after 10 attempts: ${error.message}`);
        setIsLoading(false);
      }
    }
  };

  const refreshOrders = () => {
    console.log("Preorder page: Manual refresh triggered");

    // Clear any existing polling timeout
    if (pollingTimeout) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }

    // Reset state
    setIsLoading(true);
    setError(null);
    setRerun(0);
    setOrders(null);
    setRows(null);
    setTotalValue(0);
    setStatus("Creating fresh bulk operation...");

    // Start fresh bulk operation
    createbulkrequest();
  };

  console.log({ rows });

  function convertLineItems(orderData) {
    return orderData.LineItem.map((item) => {
      if (item.product == null) {
        return null;
      }

      const productIdMatch = item.product.id.match(/[^/]+$/);
      const productId = productIdMatch ? productIdMatch[0] : null;
      const productLink = `/store/puzzles-galore-shop/products/${productId}`;

      const quantities = item.additionalData
        .map((lineItem) =>
          lineItem.quantities.map((q) => `${q.name} x ${q.quantity}`).join(", ")
        )
        .join("; ");

      return {
        id: item.id,
        imageSrc: item.image?.originalSrc,
        title: item.product.title,
        sku: item.sku,
        productLink,
        quantities,
        expectedFrom: item.product.expectedFrom?.value,
        expectedTo: item.product.expectedTo?.value,
        unfulfilledQuantity: item.unfulfilledQuantity,
      };
    }).filter(Boolean); // filter out null values
  }

  function checkStockAvailability(items) {
    // Initialize a variable to keep track of whether all items are in stock
    let allInStock = true;

    // Loop through the items and check the available quantity for each
    for (const item of items) {
      if (item.unfulfilledQuantity > 0) {
        // Extract the available quantity from the quantities string
        const availableQuantity = parseInt(
          item.quantities.split("available x ")[1]
        );

        // Check if the available quantity is less than 0 (not in stock)
        if (availableQuantity < 0) {
          allInStock = false;
          break; // Exit the loop as soon as one item is not in stock
        }
      }
    }

    // Return 1 if all items are in stock, else return 0
    return allInStock ? 1 : 0;
  }

  function convertLineItemsJSX(productId, items) {
    return items.map((item) => {
      const quantityPairs = item.quantities.split(", ");
      const quantitiesObject = {};
      quantityPairs.forEach((pair) => {
        const [title, value] = pair.split(" x ");
        quantitiesObject[title.trim()] = parseFloat(value);
      });

      const stock_message = getStockMessage(quantitiesObject, item);

      return (
        <Box key={item.id} padding="3">
          <BlockStack gap="2">
            <Text variant="bodyMd" fontWeight="bold">
              {item.title}
            </Text>
            <InlineStack gap="3" wrap={false}>
              <Text variant="bodySm" color="subdued">
                SKU: {item.sku}
              </Text>
              <Badge tone={getStockBadgeTone(stock_message)}>
                {stock_message}
                {stock_message === "Awaiting Stock" && item.expectedFrom && (
                  <Text variant="bodySm">
                    {" "}
                    ({item.expectedFrom} - {item.expectedTo})
                  </Text>
                )}
              </Badge>
            </InlineStack>
          </BlockStack>
        </Box>
      );
    });
  }

  const getStockMessage = (quantities, item) => {
    if (item.unfulfilledQuantity === 0) return "Already Dispatched";
    if (quantities.on_hand > 0) {
      return quantities.available >= 0
        ? "Available to ship"
        : "Might be Available to ship";
    }
    return "Awaiting Stock";
  };

  const getStockBadgeTone = (status) => {
    switch (status) {
      case "Available to ship":
        return "success";
      case "Might be Available to ship":
        return "warning";
      case "Awaiting Stock":
        return "critical";
      default:
        return "default";
    }
  };

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

  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rows);

  const rowMarkup = rows?.map(
    (
      { id, orderNo, name, cmc, rmTracking, fulfilmentStatus, items, email },
      index
    ) => {
      const lineItemsJSX = convertLineItemsJSX(id, items);
      const stock = checkStockAvailability(items);
      const emailBody = convertLineItemsEmail(items);
      const subject = encodeURIComponent("Update on your Pre-Order"); // The subject of the email
      const body = encodeURIComponent(
        `Hello,

We're reaching out to update you on the current status of your order, which includes one or more pre-ordered jigsaw puzzles.

${emailBody}

To get your available puzzles sooner, we can arrange a partial shipment for an additional £3.97 shipping charge. If this option suits you, please reply to this email, and we'll send a payment request to facilitate this. Alternatively, if you prefer to wait until all puzzles are in stock, there's nothing more you need to do.

Ian McLaren
Head of Puzzle Obsession
Puzzle Galore
`
      );
      const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

      return (
        <IndexTable.Row
          id={id}
          key={id}
          position={index}
          selected={selectedResources.includes(id)}
        >
          <IndexTable.Cell>{orderNo}</IndexTable.Cell>
          <IndexTable.Cell>{name}</IndexTable.Cell>
          <IndexTable.Cell>{cmc}</IndexTable.Cell>
          <IndexTable.Cell>{rmTracking}</IndexTable.Cell>
          <IndexTable.Cell>{fulfilmentStatus}</IndexTable.Cell>
          <IndexTable.Cell>
            {stock && <Badge tone="success">Shippable</Badge>}
            {!stock && <Badge tone="critical">Not in Stock Yet</Badge>}
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Link dataPrimaryLink url={mailtoLink}>
              Send Pre-filled Email
            </Link>
          </IndexTable.Cell>
          <IndexTable.Cell>{lineItemsJSX}</IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  const onSubmitEmail = async (ids) => {
    // Filter orders to include only those specified by `ids`
    let filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );

    // Prepare the data to be sent to the backend
    const emailData = filteredOrders.map((order) => ({
      id: order.id,
      email: order.customer?.email, // Assuming `order.email` is where the email address is stored
      items: convertLineItems(order),
      number: order.name,
    }));

    // Make an API call to the backend endpoint
    try {
      const response = await fetch("/api/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orders: emailData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Emails sent successfully:", result);
      addToast(`📧 Emails sent successfully: ${result}`);
      setActive(true);
      flushToasts();
    } catch (error) {
      addToast(`❌ Error sending emails: ${error}`);
      setActive(true);
      flushToasts();
      console.error("Error sending emails:", error);
    }
  };

  const promotedBulkActions = [
    {
      content: "Send Emails",
      onAction: () => onSubmitEmail(selectedResources),
    },
    {
      content: "Remove tags",
      onAction: () => console.log("Todo: implement bulk remove tags"),
    },
    {
      content: "Delete orders",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];

  const [filterValue, setFilterValue] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessages, setToastMessages] = useState([]);
  const [selectedForBulk, setSelectedForBulk] = useState([]);

  // Add filter options
  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <Select
          label="Status"
          options={[
            { label: "All", value: "all" },
            { label: "Shippable", value: "shippable" },
            { label: "Awaiting Stock", value: "awaiting" },
          ]}
          onChange={setFilterValue}
          value={filterValue}
        />
      ),
    },
  ];

  // Filter orders based on selection
  const filteredOrders = useMemo(() => {
    if (!rows) return [];
    return rows.filter((order) => {
      const stock = checkStockAvailability(order.items);
      switch (filterValue) {
        case "shippable":
          return stock === 1;
        case "awaiting":
          return stock === 0;
        default:
          return true;
      }
    });
  }, [rows, filterValue]);

  // Bulk actions handlers
  const handleRemovePreOrderTag = async (selectedIds) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await tagsRemove({
            variables: {
              id: `gid://shopify/Order/${id}`,
              tags: ["pre-order"],
            },
          });
        })
      );
      addToast(
        `✅ Successfully removed pre-order tags from ${selectedResources.length} orders`
      );
      setActive(true);
      flushToasts();
      await checkbulkrequest(); // Refresh the data
    } catch (error) {
      addToast(`❌ Error removing tags: ${error.message}`);
      setActive(true);
      flushToasts();
    }
    setIsProcessing(false);
  };

  const handleUnarchiveOrders = async (selectedIds) => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedIds.map(async (id) => {
          await fetch("/api/call/graphql", {
            method: "POST",
            body: JSON.stringify({
              query: `mutation OrderOpen($input: OrderOpenInput!) {
              orderOpen(input: $input) {
                order {
                  id
                }
                userErrors {
                  field
                  message
                }
              }
            }`,
              variables: {
                input: {
                  id: `gid://shopify/Order/${id}`,
                },
              },
            }),
            headers: { "Content-Type": "application/json" },
          });
        })
      );
      addToast(`✅ Successfully unarchived ${selectedResources.length} orders`);
      setActive(true);
      flushToasts();
      await checkbulkrequest(); // Refresh the data
    } catch (error) {
      addToast(`❌ Error unarchiving orders: ${error.message}`);
      setActive(true);
      flushToasts();
    }
    setIsProcessing(false);
  };

  const bulkActions = [
    {
      content: "Remove Pre-order Tag",
      onAction: () => handleRemovePreOrderTag(selectedResources),
      disabled: isProcessing,
    },
    {
      content: "Unarchive Orders",
      onAction: () => handleUnarchiveOrders(selectedResources),
      disabled: isProcessing,
    },
    {
      content: "Send Emails",
      onAction: () => onSubmitEmail(selectedResources),
      disabled: isProcessing,
    },
  ];

  return (
    <Frame>
      <Page fullWidth>
        {active && (
          <ToastManager toasts={toasts} onDismiss={() => setActive(false)} />
        )}
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="4">
                <BlockStack gap="4">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingLg" as="h1">
                      Pre-Orders (Total Value: £{totalValue.toFixed(2)})
                    </Text>
                    <Box minWidth="200">
                      <Select
                        label="Filter orders"
                        labelInline
                        options={[
                          { label: "All Orders", value: "all" },
                          { label: "Shippable", value: "shippable" },
                          { label: "Awaiting Stock", value: "awaiting" },
                        ]}
                        onChange={setFilterValue}
                        value={filterValue}
                      />
                    </Box>
                  </InlineStack>{" "}
                  {status && (
                    <Box
                      padding="4"
                      background="bg-surface-secondary"
                      borderRadius="2"
                      marginBottom="4"
                    >
                      <BlockStack gap="3">
                        <Text variant="headingSm">Bulk Operation Status</Text>
                        <ProgressBar
                          progress={
                            status.includes("✅")
                              ? 100
                              : status.includes("📋") || status.includes("🔄")
                              ? 80
                              : status.includes("Processing") ||
                                status.includes("RUNNING")
                              ? 60
                              : status.includes("created") ||
                                status.includes("📝")
                              ? 40
                              : status.includes("Creating")
                              ? 20
                              : status.includes("❌") ||
                                status.includes("Error")
                              ? 0
                              : 30
                          }
                          size="small"
                          tone={
                            status.includes("✅")
                              ? "success"
                              : status.includes("❌") ||
                                status.includes("Error")
                              ? "critical"
                              : status.includes("⚠️")
                              ? "attention"
                              : "primary"
                          }
                        />
                        <Text>{status}</Text>
                      </BlockStack>
                    </Box>
                  )}
                  <ButtonGroup>
                    <Button onClick={refreshOrders} loading={isLoading} primary>
                      Refresh Orders
                    </Button>
                    <Button
                      onClick={() =>
                        cancelBulkRequest({ variables: { id: currentId } })
                      }
                      disabled={isLoading}
                    >
                      Cancel Request
                    </Button>
                  </ButtonGroup>
                </BlockStack>
              </Box>
            </Card>{" "}
            <Box paddingBlockStart="6">
              <Card>
                {error && (
                  <Box paddingBlockEnd="4">
                    <Banner status="critical" title="Error">
                      <p>{error}</p>
                      <Box paddingBlockStart="2">
                        <Button onClick={refreshOrders} size="slim">
                          Try Again
                        </Button>
                      </Box>
                    </Banner>
                  </Box>
                )}

                {isLoading && !error && (
                  <Box padding="4">
                    <BlockStack gap="4">
                      <ProgressBar progress={rerun * 5} size="small" />
                      <Text variant="bodyMd" alignment="center">
                        {status}
                      </Text>
                    </BlockStack>
                  </Box>
                )}

                {!isLoading &&
                !error &&
                filteredOrders &&
                filteredOrders.length > 0 ? (
                  <IndexTable
                    resourceName={resourceName}
                    itemCount={filteredOrders.length}
                    selectedItemsCount={
                      allResourcesSelected ? "All" : selectedResources.length
                    }
                    onSelectionChange={handleSelectionChange}
                    bulkActions={bulkActions}
                    headings={[
                      { title: "Order", width: "10%" },
                      { title: "Customer", width: "15%" },
                      { title: "Country", width: "10%" },
                      { title: "Status", width: "15%" },
                      { title: "Pre-Order Status", width: "15%" },
                      { title: "Actions", width: "15%" },
                      { title: "Items", width: "20%" },
                    ]}
                  >
                    {rowMarkup}{" "}
                  </IndexTable>
                ) : !isLoading && !error ? (
                  <EmptyState
                    heading="No preorders found"
                    action={{
                      content: "Refresh Orders",
                      onAction: refreshOrders,
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      No pre-orders match the current filter. Try refreshing or
                      check your filter settings.
                    </p>
                  </EmptyState>
                ) : null}
              </Card>
            </Box>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}

const bulkOrdersText = () => {
  let query;
  query = `first: 500, query:"status:closed, tag:pre-order"`;

  return {
    query: `{
        orders( ${query} ) {
              edges {
                node {
                  id
                  name
                  tags
                  note
                  discountCodes
                  customer {
                    displayName
                    email
                    id
                    tags
                    numberOfOrders
                  }
                  fulfillment: fulfillmentOrders(first:1) {
                    edges {
                      node {
                        id
                        status
                      }
                    }
                  }
                  shippingAddress {
                    country
                    company
                    name
                    address1
                    address2
                    city
                    province
                    provinceCode
                    zip
                    phone
                    countryCodeV2
                  }
                  royalMailTrackingNumber: metafield(
                    namespace: "my_fields"
                    key: "royal_mail_tracking_number"
                    
                  ) {
                    id
                    value
                  }
                  royalMailShipmentNumber: metafield(
                    namespace: "my_fields"
                    key: "royal_mail_shipment_number"
                    
                  ) {
                    id
                    value
                  }
                  shippingLine {
                    code
                    title
                  }
                  lineItems(first: 100) {
                    edges {
                      node {
                        image { 
                          originalSrc
                        }
                        
                        product {   
                            id                       
                          loc: metafield(
                            namespace: "my_fields"
                            key: "loc"
                          ) {
                            value
                          }
                          expectedFrom: metafield(
                            namespace: "product"
                            key: "expected"
                          ) {
                            value
                          }
                          expectedTo: metafield(
                            namespace: "product"
                            key: "expected_extended"
                          ) {
                            value
                          }
                          totalInventory
                         
                          title
                        }
                        
                        variant {
                          weight
                          
                          inventoryItem {
                            inventoryLevels(first: 10) {
                              edges {
                                node {
                                  quantities(names: ["on_hand"]) {
                                    name
                                    quantity
                                  }
                                }
                              }
                            }
                            unitCost {
                             amount
                            }
                            invQuantitys: inventoryLevels(first: 10) {
                                edges {
                                    node {
                                        quantities(names: ["on_hand","committed","available"]) {
                                        name
                                        quantity
                                        }                                    
                                    }
                                }
                            }
                            harmonizedSystemCode
                            countryCodeOfOrigin
                          }
                        }
                        quantity
                        unfulfilledQuantity
                        duties {
                          harmonizedSystemCode
                          countryCodeOfOrigin
                        }
                        sku
                        id
                        name
                        taxLines {
                          priceSet {
                            presentmentMoney {
                              amount
                            }
                          }
                        }
                        originalTotalSet {
                          presentmentMoney {
                            amount
                          }
                        }
                      }
                    }
                  }
                  totalPriceSet {
                    presentmentMoney {
                      amount
                    }
                  }
                  currentTaxLines {
                    rate
                  }
                  presentmentCurrencyCode
                  totalShippingPriceSet {
                    presentmentMoney {
                      amount
                    }
                  }
                  createdAt   
                  customAttributes   {
                    key
                    value
                  }            
                }
              }
            }
          }`,
  };
};
function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

function dynamicSortMultiple() {
  //People.sort(dynamicSortMultiple("Name", "-Surname"));
  /*
   * save the arguments object as it will be overwritten
   * note that arguments object is an array-like object
   * consisting of the names of the properties to sort by
   */
  var props = arguments;
  return function (obj1, obj2) {
    var i = 0,
      result = 0,
      numberOfProperties = props.length;
    /* try getting a different result from 0 (equal)
     * as long as we have extra properties to compare
     */
    while (result === 0 && i < numberOfProperties) {
      result = dynamicSort(props[i])(obj1, obj2);
      i++;
    }
    return result;
  };
}

function findProfit(order) {
  let oc = order.shippingAddress.countryCodeV2;
  if (oc == "JE" || oc == "GG" || oc == "IM") {
    oc = "GB";
  }
  let amazon =
    order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
    null;
  let ebay =
    order.customAttributes.find((x) => x.key === "eBay Order Id")?.value ||
    null;
  let vat = oc == "GB" ? 1.2 : 1;
  //console.log({ oc });
  //console.log({ vat });
  let commission = amazon ? 1.15 : ebay ? 1.15 : 1;
  //console.log({ commission });
  let totalcost = 0;
  //let shipping = oc == "GB" ? 2.71 : parseFloat(order.totalShippingPriceSet?.presentmentMoney?.amount);
  for (const item of order.LineItem) {
    totalcost += parseFloat(item.variant?.inventoryItem?.unitCost?.amount) || 0;
  }
  //console.log({ totalcost });
  //console.log({ shipping });
  //totalcost += shipping;
  //console.log({ totalcost });
  let ordervalue =
    parseFloat(order.totalPriceSet?.presentmentMoney?.amount) -
    parseFloat(order.totalShippingPriceSet?.presentmentMoney?.amount);
  //console.log({ ordervalue });
  //minuscurrency = ordervalue / $rates[$currency_setting];
  let minusvat = ordervalue / vat;
  //console.log({ minusvat });
  let commissTot = minusvat * commission - minusvat;
  //console.log({ commissTot });
  let minuscommission = minusvat - commissTot;
  //console.log({ minuscommission });
  let profit = minuscommission - totalcost;
  //console.log({ profit });
  let percent = (profit / ordervalue) * 100;
  //console.log({ percent });
  return { profit, totalcost, percent, ordervalue };
}

function sortPickOrder(orders) {
  if (!orders) return;
  let count = [];
  let w2 = [];
  for (const order of orders) {
    const items = order.LineItem;
    for (const item of items) {
      let sku = String(`a${item.sku}`);
      //if (item.product?.loc?.value?.toUpperCase()?.substring(0, 2) === "W2") {
      if (count[sku] !== undefined) {
        count[sku] = count[sku] + item.unfulfilledQuantity;
        let elementIndex = w2.findIndex((obj) => obj.sku == sku);
        w2[elementIndex].qty = count[sku];
      } else {
        count[sku] = item.unfulfilledQuantity;
        w2.push({
          name: item.name,
          loc: item.product?.loc?.value?.toUpperCase() || "x",
          qty: count[sku],
          orderid: order.name,
          sku,
          image: item.image?.originalSrc,
          totalInventory: item.product?.totalInventory,
          onHandInventory: item.variant?.inventoryItem?.inventoryLevels?.edges?.[0]?.node?.quantities?.find(q => q.name === "on_hand")?.quantity || 0,
        });
        //}
      }
    }
  }
  console.log({ w2 });
  return w2.sort(dynamicSortMultiple("loc"));
}

function sortPackOrder(orders) {
  if (!orders) return;
  let amazon;
  let w2 = [];
  let count = [];
  for (const order of orders) {
    amazon =
      order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
      null;
    const items = order.LineItem;
    for (const item of items) {
      let sku = String(`a${item.sku}`);
      if (count[sku] !== undefined) {
        count[sku] = count[sku] + item.unfulfilledQuantity;
      } else {
        count[sku] = item.unfulfilledQuantity;
      }
    }
  }
  for (const order of orders) {
    amazon =
      order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
      null;
    const items = order.LineItem;
    for (const item of items) {
      let sku = String(`a${item.sku}`);
      w2.push({
        id: order.name,
        name: item.name,
        sku,
        qty: count,
        weight: item.variant?.weight,
        order,
        profits: findProfit(order),
        amazon: amazon ? true : false,
      });
    }
  }
  w2 = w2.filter(
    (value, index, self) => index === self.findIndex((t) => t.id === value.id)
  );

  return w2.sort(dynamicSortMultiple("weight", "-sku", "id")).reverse();
}

function parseJSONLLine(line) {
  try {
    return JSON.parse(line);
  } catch (error) {
    console.error(`Error parsing line: ${line}`);
    return null;
  }
}

function readJsonl(jsonlString) {
  const lines = jsonlString.trim().split("\n");
  const orders = {};

  lines.forEach((line) => {
    if (!line) return; // Skip empty lines

    let obj;
    try {
      obj = JSON.parse(line);
    } catch (error) {
      console.error("Error parsing JSON line:", line, error);
      return; // Skip lines that are not valid JSON
    }

    const typeMatch = obj.id?.match(/gid:\/\/shopify\/(\w+)\//);
    const type = typeMatch ? typeMatch[1] : null;

    if (type === "Order") {
      orders[obj.id] = { ...obj, LineItem: [], FulfillmentOrder: [] };
    } else if (obj.__parentId) {
      const parentTypeMatch = obj.__parentId.match(/gid:\/\/shopify\/(\w+)\//);
      const parentType = parentTypeMatch ? parentTypeMatch[1] : null;

      if (parentType === "Order") {
        orders[obj.__parentId] = orders[obj.__parentId] || {
          LineItem: [],
          FulfillmentOrder: [],
        };
        orders[obj.__parentId][type].push(obj);
      } else if (parentType === "LineItem") {
        const parentOrder = Object.values(orders).find((order) =>
          order.LineItem.some((lineItem) => lineItem.id === obj.__parentId)
        );
        if (parentOrder) {
          const lineItem = parentOrder.LineItem.find(
            (lineItem) => lineItem.id === obj.__parentId
          );
          lineItem.additionalData = lineItem.additionalData || [];
          lineItem.additionalData.push(obj);
        }
      }
    }
  });

  return Object.values(orders);
}

const deleteMetafield = async (variables) => {
  fetch("/api/call/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: DELETE_METAFIELD,
      variables: {
        input: {
          ids: [variables?.variables?.input?.id],
        },
      },
    }),
    headers: { "Content-Type": "application/json" },
  });
};
