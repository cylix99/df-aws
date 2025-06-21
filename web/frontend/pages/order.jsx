import {
  Page,
  Button,
  Card,
  Layout,
  Frame,
  useIndexResourceState,
  IndexTable,
  Modal,
  Toast,
  Icon,
  Banner,
  ButtonGroup,
  SkeletonPage,
  Loading,
  EmptyState,
  Text,
  Badge,
} from "@shopify/polaris";
import {
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "../hooks";
import Pickpack from "./pickpack";
import { useCallback, useState, useEffect } from "react";
import { ToastManager, useToastManager } from "../components/ToastManager";

import { getLabelsv2, createManifests } from "../orders/rmv2";

import { CHECK_BULK } from "../graphql/query/orders.query";
import { UPDATE_ORDER } from "../graphql/mutations/order";
import { CREATE_FULFILLMENT } from "../graphql/mutations/order";
import { DELETE_METAFIELD } from "../graphql/mutations/metafields";
import { UPDATE_CUSTOMER } from "../graphql/mutations/customer";
import { TAGS_ADD } from "../graphql/mutations/metafields";
import { TAGS_REMOVE } from "../graphql/mutations/metafields";
import { CANCEL } from "../graphql/mutations/metafields";

import axios from "axios";

import queryString from "query-string";

//orders(first: 10, query: "name: 38000000001") {
export default function Order() {
  const fetch = useAuthenticatedFetch();
  const authFetch = useAuthenticatedFetch();
  const { toasts, addToast, addToasts, flushToasts, clearAllToasts } =
    useToastManager();

  const [orders, setOrders] = useState(null);
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("Not Submitted");
  const [rerun, setRerun] = useState(0);  const [active, setActive] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [processingBulk, setProcessingBulk] = useState(false);

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
  }, [clearAllToasts]);  useEffect(() => {
    // Always create a fresh bulk operation on page load
    createbulkrequest();
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

  const updateOrder = async (variables) => {
    if (variables?.variables) {
      fetch("/api/call/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: UPDATE_ORDER,
          variables: variables?.variables,
        }),
        headers: { "Content-Type": "application/json" },
      });
    }
  };

  const deleteMetafield = async (variables) => {
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: DELETE_METAFIELD,
        variables: variables?.variables,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const updateCustomer = async (variables) => {
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: UPDATE_CUSTOMER,
        variables: variables?.variables,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const tagsAdd = async (variables) => {
    console.log(
      JSON.stringify({
        query: TAGS_ADD,
        variables: variables?.variables,
      })
    );
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: TAGS_ADD,
        variables: variables?.variables,
      }),
      headers: { "Content-Type": "application/json" },
    });
  };

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

  const handleError = (error) => {
    console.error("Operation failed:", error);
    addToast(`❌ Operation failed: ${error.message}`);
    flushToasts();
    setActive(true);
  };

  const [isLoading, setIsLoading] = useState(false);  const createbulkrequest = async () => {
    console.log("🚀 createbulkrequest called");
    setIsLoading(true);
    setProcessingBulk(false); // Reset processing state when creating new request
    setStatus("Creating bulk operation...");
    try {
      fetch("/api/call/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: BULK_ORDERS,
          variables: bulkOrdersText(),
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())        .then((data_call) => {
          console.log("Bulk operation creation response:", data_call);
          setStatus(
            data_call?.bulkOperationRunQuery?.bulkOperation?.status
              ? data_call?.bulkOperationRunQuery?.bulkOperation?.status
              : data_call?.bulkOperationRunQuery?.userErrors[0]?.message
          );
          
          if (
            data_call?.bulkOperationRunQuery?.bulkOperation?.status ===
            "CREATED"
          ) {
            console.log("✅ Bulk operation created successfully, starting polling");
            // Start polling immediately after creation
            setTimeout(checkbulkrequest, 1000);
          } else {
            console.error("Failed to create bulk operation:", data_call?.bulkOperationRunQuery?.userErrors);
          }
        })
        .catch((error) => {
          console.error("❌ Error creating bulk request:", error);
          setStatus("Error creating bulk operation");
        });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };  const checkbulkrequest = async () => {
    console.log("🔍 checkbulkrequest called for polling. processingBulk:", processingBulk);
    
    if (processingBulk) {
      console.log("⏸️ Already processing bulk operation, skipping...");
      return;
    }
    
    fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: CHECK_BULK,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => {        console.log("checkbulkrequest polling result:", data);

        // If there's no current bulk operation, something went wrong
        if (
          !data?.currentBulkOperation ||
          data?.currentBulkOperation === null
        ) {
          console.log("No current bulk operation found during polling - this shouldn't happen");
          setStatus("No bulk operation found");
          return;
        }

        setStatus(`Status: ${data?.currentBulkOperation?.status}`);
        setCurrentId(data.currentBulkOperation.id);

        // If bulk operation is still running (CREATED or RUNNING), keep polling
        if (
          data?.currentBulkOperation?.status === "CREATED" ||
          data?.currentBulkOperation?.status === "RUNNING"
        ) {
          console.log(
            "Bulk operation still running, will check again in 1 second"
          );
          setTimeout(checkbulkrequest, 1000);
          return;        }

        if (
          data?.currentBulkOperation?.objectCount === "0" &&
          data?.currentBulkOperation?.status === "COMPLETED"
        ) {
          // No orders found - show empty state
          console.log("Bulk operation completed but found 0 orders");
          setStatus("No orders found");
          setRows([]);
          return;
        } else if (
          data?.currentBulkOperation?.url !== null &&
          data?.currentBulkOperation?.status === "COMPLETED"
        ) {
          console.log(
            "✅ Bulk operation completed! Downloading results from:",
            data?.currentBulkOperation?.url
          );          console.log(
            "📊 Object count:",
            data?.currentBulkOperation?.objectCount
          );
          
          // Set processing state to prevent concurrent operations
          console.log("🔒 Setting processingBulk to true");
          setProcessingBulk(true);
          
          axios({
            method: "GET",
            url: data?.currentBulkOperation?.url,
            //`https://guq6e1oc76.execute-api.eu-west-2.amazonaws.com/?url=${encodeURIComponent(data?.currentBulkOperation?.url)}`,
          })
            .then(async (response) => {
              console.log("📦 Raw bulk operation response:", response);
              if (response) {
                let responseOrders = response.data.split("\n").reverse();
                console.log(
                  "📋 Split orders data:",
                  responseOrders.length,
                  "lines"
                );
                let groupedOrders = readJsonl(responseOrders);
                console.log("🔄 Processed orders:", { groupedOrders });
                setOrders(groupedOrders);
                let arr = groupedOrders.map((order) => {
                  let mainId = order.id.replace("gid://shopify/Order/", "");
                  const splitShippingAttr = order.customAttributes.find(
                    (attr) => attr.key === "split_preorder_shipping"
                  );
                  return {
                    id: mainId,
                    orderNo: order.name,
                    name: order.customer?.displayName,
                    cmc: order.shippingAddress?.country,
                    rmTracking: order.royalMailTrackingNumber?.value,
                    rmShipment: order.royalMailShipmentNumber?.value,
                    splitShipping: splitShippingAttr?.value === "true",
                    message: null,
                    tags: order.tags,
                  };
                });                console.log("📊 Setting rows with data:", arr);
                setRows(arr);
                console.log("🔓 Setting processingBulk to false - success");
                setProcessingBulk(false); // Reset processing state after successful completion
              } else {
                console.error("❌ No response data:", response);
                console.log("🔓 Setting processingBulk to false - no data");
                setProcessingBulk(false); // Reset processing state on error
              }
            })
            .catch((error) => {
              console.error(
                "❌ Error downloading bulk operation results:",
                error.message
              );
              console.log("🔓 Setting processingBulk to false - error");
              setProcessingBulk(false); // Reset processing state on error
            });
        } else {
          console.log(
            "⏳ Bulk operation not ready yet. Status:",
            data?.currentBulkOperation?.status,
            "URL:",
            data?.currentBulkOperation?.url,
            "Rerun count:",
            rerun
          );
          if (rerun < 5) {
            setRerun(rerun + 1);
            setTimeout(checkbulkrequest, 500);          } else {
            console.log("❌ Max retries reached. Setting empty rows.");
            setStatus("No orders found");
            setRows([]);
            console.log("🔓 Setting processingBulk to false - max retries");
            setProcessingBulk(false); // Reset processing state on max retries
          }
        }
      })      .catch((error) => {
        console.error("❌ Error checking bulk request:", error);
        console.log("🔓 Setting processingBulk to false - fetch error");
        setProcessingBulk(false); // Reset processing state on fetch error
        setStatus("Error checking bulk operation");
      });
  };

  const onSubmitRoyalMailv2 = (ids) => {
    let filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );
    filteredOrders = sortPackOrder(filteredOrders).reverse();

    addToast(
      `🚚 Starting Royal Mail label generation for ${filteredOrders.length} orders`
    );
    setActive(true);
    flushToasts();

    getLabelsv2(filteredOrders, authFetch)
      .then(async (response) => {
        console.log("originalData", response);

        // Add all toast messages from the Royal Mail API
        if (response.toast && response.toast.length > 0) {
          addToasts(response.toast);
        }

        addToast(
          `📦 Updating ${response.data.length} of ${filteredOrders.length} orders`
        );
        flushToasts();

        let items = [];
        let tmpOrders = [];
        let message = [];
        let rmTracking = [];
        let rmShipment = [];

        for (const res of response.data) {
          console.log({ res });

          if (res.mutations && "variables" in res.mutations) {
            await updateOrder(res.mutations);
            addToast(`✅ Updated order ${res.orderName || res.id}`);
          }

          let currentRow = rows.findIndex((x) => x.id == res.id);
          let newRow = rows[currentRow];
          newRow.message = res.message;
          newRow.rmTracking = res.shipmentNumber;
          newRow.rmShipment = res.shipmentNumber;
          rows[currentRow] = newRow;
          setRows(rows);

          //message[res.id] = res.message;
          rmTracking[res.id] = res.shipmentNumber;
          rmShipment[res.id] = res.shipmentNumber;
        }

        // Flush all accumulated toasts
        flushToasts();

        for (const row of rows) {
          row.message = message[row.id];
          row.rmTracking = rmTracking[row.id];
          row.rmShipment = rmShipment[row.id];
          items.push(row);
        }
        setRows(items);

        for (const o of orders) {
          o.royalMailTrackingNumber = {
            value: rmTracking[o.id.replace("gid://shopify/Order/", "")],
          };
          o.royalMailShipmentNumber = {
            value: rmShipment[o.id.replace("gid://shopify/Order/", "")],
          };
          tmpOrders.push(o);
        }

        addToast(
          `🎉 Royal Mail label generation completed for ${response.data.length} orders`
        );
        flushToasts();
      })
      .catch((error) => {
        addToast(`❌ Error generating Royal Mail labels: ${error.message}`);
        flushToasts();
      });
  };

  const onSubmitPickList = (ids) => {
    let filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );
    setPickOrders(filteredOrders);
    setPickActive((pickActive) => !pickActive);
    addToast(`📋 Generating pick list for ${filteredOrders.length} orders`);
    setActive(true);
    flushToasts();
  };

  const onSubmitPackList = (ids) => {
    let filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );
    setPackOrders(filteredOrders);
    setPackActive((packActive) => !packActive);
    addToast(`📦 Generating pack list for ${filteredOrders.length} orders`);
    setActive(true);
    flushToasts();
  };

  const onSubmitCompleteOrders = async (ids) => {
    const filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );

    // Set initial toast message
    addToast(
      `🚀 Starting completion process for ${filteredOrders.length} orders`
    );
    setActive(true);
    flushToasts();

    let completedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process orders sequentially to avoid overwhelming the API
    for (const order of filteredOrders) {
      try {
        addToast(`⏳ Processing order ${order.name}...`);
        flushToasts();

        // Only proceed if we have tracking information
        const trackingNumber = order.royalMailTrackingNumber?.value;

        // Set tracking information based on country
        let trackingInfo = null;

        if (trackingNumber) {
          const countryCode =
            order.shippingAddress?.countryCodeV2?.toUpperCase();

          switch (countryCode) {
            case "FR":
              trackingInfo = {
                number: trackingNumber,
                company: "La Poste",
                url: `https://www.laposte.fr/outils/track-a-parcel`,
              };
              addToast(
                `🇫🇷 Setting up La Poste tracking for order ${order.name}`
              );
              break;
            case "US":
              trackingInfo = {
                number: trackingNumber,
                company: "USPS",
                url: `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
              };
              addToast(`🇺🇸 Setting up USPS tracking for order ${order.name}`);
              break;
            case "AU":
              trackingInfo = {
                number: trackingNumber,
                company: "Australia Post",
                url: `https://auspost.com.au/mypost/track/#/details/${trackingNumber}`,
              };
              addToast(
                `🇦🇺 Setting up Australia Post tracking for order ${order.name}`
              );
              break;
            default:
              trackingInfo = {
                number: trackingNumber,
                company: "Royal Mail",
                url: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
              };
              addToast(
                `🇬🇧 Setting up Royal Mail tracking for order ${order.name}`
              );
          }
        } else {
          addToast(`⚠️ No tracking number found for order ${order.name}`);
        }

        // Create the fulfillment with tracking info if available
        const fulfillment = {
          variables: {
            fulfillment: {
              lineItemsByFulfillmentOrder: {
                fulfillmentOrderId: order.FulfillmentOrder[0].id,
              },
              notifyCustomer: true,
              ...(trackingInfo && { trackingInfo }),
            },
          },
        };

        const response_init = await fetch("/api/call/graphql", {
          method: "POST",
          body: JSON.stringify({
            query: CREATE_FULFILLMENT,
            variables: fulfillment.variables,
          }),
          headers: { "Content-Type": "application/json" },
        });

        if (!response_init.ok) {
          throw new Error(`HTTP error! status: ${response_init.status}`);
        }

        const response = await response_init.json();
        console.log(response);

        // Update the row state
        setRows((prevRows) => {
          const newRows = [...prevRows];
          const currentRowIndex = newRows.findIndex(
            (x) => x.id == order.id.replace("gid://shopify/Order/", "")
          );

          if (currentRowIndex !== -1) {
            const newRow = { ...newRows[currentRowIndex] };

            if (response.data?.fulfillmentCreateV2?.userErrors?.length > 0) {
              const errorMessage =
                response.data.fulfillmentCreateV2.userErrors[0].message;
              errors.push(`Order ${order.name}: ${errorMessage}`);
              errorCount++;

              addToast(
                `❌ Failed to complete order ${order.name}: ${errorMessage}`
              );

              newRow.fail = true;
              newRow.message = errorMessage;

              // Move failed row to top
              newRows.splice(currentRowIndex, 1);
              newRows.unshift(newRow);

              // Add error tag
              tagsAdd({
                variables: {
                  id: order.id,
                  tags: "dispatchError",
                },
              });
            } else {
              const message =
                response.data?.fulfillmentCreateV2?.fulfillment?.status ||
                "FULFILLED";
              completedCount++;

              addToast(
                `✅ Successfully completed order ${order.name} (${message})`
              );

              newRow.success = true;
              newRow.message = message;
              newRows[currentRowIndex] = newRow;

              // Add dispatched tag
              tagsAdd({
                variables: {
                  id: order.id,
                  tags: "dispatched",
                },
              });
            }

            // Remove packing tag for all processed orders
            tagsRemove({
              variables: {
                id: order.id,
                tags: "packing",
              },
            });
          }

          return newRows;
        });
      } catch (error) {
        console.error(`Error processing order ${order.name}:`, error);
        errorCount++;
        errors.push(`Order ${order.name}: ${error.message}`);

        addToast(`💥 Error processing order ${order.name}: ${error.message}`);

        // Update row to show error
        setRows((prevRows) => {
          const newRows = [...prevRows];
          const currentRowIndex = newRows.findIndex(
            (x) => x.id == order.id.replace("gid://shopify/Order/", "")
          );

          if (currentRowIndex !== -1) {
            const newRow = { ...newRows[currentRowIndex] };
            newRow.fail = true;
            newRow.message = error.message;

            // Move failed row to top
            newRows.splice(currentRowIndex, 1);
            newRows.unshift(newRow);
          }

          return newRows;
        });

        // Add error tag
        tagsAdd({
          variables: {
            id: order.id,
            tags: "dispatchError",
          },
        });
      }

      // Flush toasts after each order
      flushToasts();
    }

    // Show completion summary
    if (completedCount > 0) {
      addToast(`🎉 Successfully completed ${completedCount} orders`);
    }

    if (errorCount > 0) {
      addToast(`⚠️ Failed to complete ${errorCount} orders`);
    }

    addToast(
      `📊 Order completion finished: ${completedCount} successful, ${errorCount} failed`
    );
    flushToasts();

    setActive(false);
  };

  const onSubmitRemoveTracking = async (ids) => {
    let filteredOrders = orders.filter((order) =>
      ids.includes(order.id.replace("gid://shopify/Order/", ""))
    );

    addToast(`🗑️ Removing tracking info from ${filteredOrders.length} orders`);
    setActive(true);
    flushToasts();

    try {
      for (const order of filteredOrders) {
        const orderId = order.id.replace("gid://shopify/Order/", "");

        // Get the metafield IDs if they exist
        const trackingMetafieldId = order.royalMailTrackingNumber?.id;
        const shipmentMetafieldId = order.royalMailShipmentNumber?.id;

        // Only attempt to delete metafields that exist
        if (trackingMetafieldId) {
          await fetch("/api/call/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: DELETE_METAFIELD,
              variables: {
                input: {
                  ids: [trackingMetafieldId],
                },
              },
            }),
          });
        }

        if (shipmentMetafieldId) {
          await fetch("/api/call/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: DELETE_METAFIELD,
              variables: {
                input: {
                  ids: [shipmentMetafieldId],
                },
              },
            }),
          });
        }

        // Update the UI
        let currentRow = rows.findIndex((x) => x.id === orderId);
        if (currentRow !== -1) {
          let newRow = { ...rows[currentRow] };
          newRow.rmTracking = null;
          newRow.rmShipment = null;
          rows[currentRow] = newRow;
          addToast(`✅ Removed tracking info for order ${orderId}`);
        }
      }

      // Update the state with all changes at once
      setRows([...rows]);
      addToast(
        `🎉 Successfully removed tracking information from ${filteredOrders.length} orders`
      );
      flushToasts();
    } catch (error) {
      console.error("Error removing tracking info:", error);
      addToast(`❌ Error removing tracking info: ${error.message}`);
      flushToasts();
    }
  };

  const resourceName = {
    singular: "order",
    plural: "orders",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(rows);

  const rowMarkup = rows?.map(
    (
      {
        id,
        orderNo,
        name,
        cmc,
        rmTracking,
        rmShipment,
        message,
        tags,
        splitShipping,
      },
      index
    ) => {
      const success = rmTracking != undefined && rmTracking != null;
      const fail = message && message.includes("error");

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
          <IndexTable.Cell>{rmShipment}</IndexTable.Cell>
          <IndexTable.Cell>
            {success && <Icon source={CheckIcon} color="success" />}
            {fail && <Icon source={AlertTriangleIcon} color="critical" />}
            {splitShipping && <Badge tone="attention">Split Shipping</Badge>}
            {message}
          </IndexTable.Cell>
          <IndexTable.Cell>{tags}</IndexTable.Cell>
        </IndexTable.Row>
      );
    }
  );

  const promotedBulkActions = [
    {
      content: "Get RM Labels",
      onAction: () => onSubmitRoyalMailv2(selectedResources),
    },
    {
      content: "Pick List",
      onAction: () => onSubmitPickList(selectedResources),
    },
    {
      content: "Pack List",
      onAction: () => onSubmitPackList(selectedResources),
    },
    {
      content: "Complete Orders",
      onAction: () => onSubmitCompleteOrders(selectedResources),
    },
    {
      content: "Remove Tracking Info",
      onAction: () => onSubmitRemoveTracking(selectedResources),
    },
  ];

  const pageMarkup = rows ? (
    <Page
      fullWidth
      title="Orders Management"      primaryAction={
        <Button icon={RefreshIcon} onClick={() => createbulkrequest()}>
          Refresh Orders
        </Button>
      }
    >
      {status && status !== "COMPLETED" && (
        <Layout.Section>
          <Banner
            title="Order Status"
            status={status === "CREATED" ? "info" : "warning"}
          >
            <p>{status}</p>
          </Banner>
        </Layout.Section>
      )}

      {active && (
        <ToastManager toasts={toasts} onDismiss={() => setActive(false)} />
      )}

      <Modal
        large
        open={pickActive}
        onClose={togglePickActive}
        title="Pick List"
      >
        <Pickpack orders={sortPickOrder(pickOrders)} type="pick" />
      </Modal>

      <Modal
        large
        open={packActive}
        onClose={togglePackActive}
        title="Pack List"
      >
        <Pickpack orders={sortPackOrder(packOrders)} type="pack" />
      </Modal>

      <Layout>
        <Layout.Section>
          <Card>
            {rows.length > 0 ? (
              <IndexTable
                resourceName={resourceName}
                itemCount={rows.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                promotedBulkActions={[
                  {
                    content: "Get RM Labels",
                    onAction: () => onSubmitRoyalMailv2(selectedResources),
                  },
                  {
                    content: "Pick List",
                    onAction: () => onSubmitPickList(selectedResources),
                  },
                  {
                    content: "Pack List",
                    onAction: () => onSubmitPackList(selectedResources),
                  },
                  {
                    content: "Complete Orders",
                    onAction: () => onSubmitCompleteOrders(selectedResources),
                  },
                  {
                    content: "Remove Tracking",
                    onAction: () => onSubmitRemoveTracking(selectedResources),
                    destructive: true,
                  },
                ]}
                headings={[
                  { title: "Order#" },
                  { title: "Customer" },
                  { title: "Country" },
                  { title: "Tracking" },
                  { title: "Shipment" },
                  { title: "Status" },
                  { title: "Tags" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            ) : (
              <EmptyState
                heading="No orders found"                action={{
                  content: "Refresh Orders",
                  onAction: () => createbulkrequest(),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  No orders match your current selection. Try changing your
                  search parameters or refreshing the orders list.
                </p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  ) : (
    <SkeletonPage primaryAction>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Loading />
            <Text>Loading orders...</Text>
          </Card>
        </Layout.Section>
      </Layout>
    </SkeletonPage>
  );

  return (
    <Frame>
      {isLoading && <Loading />}
      {pageMarkup}
    </Frame>
  );
}

const bulkOrdersText = () => {
  let query;
  const parsedQs = queryString.parse(location.search);
  //let ids = "5317247402210,5316244537570,5312873857250";
  let { "ids[]": ids } = parsedQs;
  if (ids != null) {
    if (!Array.isArray(ids)) {
      if (ids === undefined) {
        ids = [];
      } else {
        ids = [ids];
      }
    }
    ids = ids.map((id) => "id:" + id);
    ids = ids.join(" OR ");
    query = `query:"${ids}"`;
  } else {
    query = `first: 50, query:"status:open"`;
  }
  console.log({ query });
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
                          loc: metafield(
                            namespace: "my_fields"
                            key: "loc"
                          ) {
                            value
                          }
                          preOrder: metafield(namespace: "product", key: "pre_order") {
                            value
                            id
                          } 
                          totalInventory
                          title
                        }
                        
                        variant {
                          weight
                          inventoryItem {
                            unitCost {
                             amount
                            }
                          }
                          inventoryItem {
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
  let shipping = oc === "GB" && amazon ? 4.21 : 0;
  for (const item of order.LineItem) {
    totalcost += parseFloat(item.variant?.inventoryItem?.unitCost?.amount) || 0;
  }
  //console.log({ totalcost });
  //console.log({ shipping });
  totalcost += shipping;
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
      let sku = item.sku ? String(`a${item.sku}`) : item.name;
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
          preOrder: item.product?.preOrder,
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
      let sku = item.sku ? String(`a${item.sku}`) : item.name;
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
      let sku = item.sku ? String(`a${item.sku}`) : item.name;
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

function readJsonl(data) {
  const childObjects = {};
  let returndata = [];
  let objectType = "LineItem";
  for (const line of data) {
    // eslint-disable-next-line no-continue
    if (!line) continue;
    const object = JSON.parse(line);

    if (object.id) {
      [, objectType] = /gid:\/\/shopify\/(.*)\/\d/.exec(object.id);
    }

    if (childObjects[object.id]) {
      Object.assign(object, {
        ...childObjects[object.id],
      });

      delete childObjects[object.id];
    }

    if (object.__parentId) {
      if (!childObjects[object.__parentId]) {
        childObjects[object.__parentId] = {};
      }

      if (!childObjects[object.__parentId][objectType]) {
        childObjects[object.__parentId][objectType] = [];
      }

      childObjects[object.__parentId][objectType].push(object);
    }
    if (!object.__parentId) {
      returndata.push(object);
    } else {
      delete object.__parentId;
    }
  }
  return returndata;
}
