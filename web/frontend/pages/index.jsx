import {
  Card,
  Page,
  Layout,
  Link,
  Banner,
  TextField,
  DataTable,
  Button,
  Loading,
  SkeletonBodyText,
  Frame,
  BlockStack,
  Box,
  Text,
  ProgressBar,
  EmptyState,
  InlineStack,
  ButtonGroup,
  Tooltip,
  ActionList,
  Popover,
  Icon,
  Navigation,
  FooterHelp,
  Divider,
} from "@shopify/polaris";
import {
  PackageIcon,
  CalendarIcon,
  ImportIcon,
  QuestionCircleIcon,
  InfoIcon,
  FilterIcon,
  SortIcon,
  PrintIcon,
} from "@shopify/polaris-icons";

import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { setAuthFetch } from "../orders/discountCodeManager";
import { createManifests } from "../orders/rmv2";

export default function HomePage() {
  const authFetch = useAuthenticatedFetch();

  useEffect(() => {
    setAuthFetch(authFetch);
  }, [authFetch]);

  const { data: shop, isLoading } = useAppQuery({
    url: "/api/shop",
  });

  const fetch = useAuthenticatedFetch();
  const [value, setValue] = useState("");
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [eansValue, setEansValue] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [failedBarcodes, setFailedBarcodes] = useState([]);
  const [mainMessage, setMainMessage] = useState("Updating products...");
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState("");
  const [isCheckingProducts, setIsCheckingProducts] = useState(false);

  function getProductsQuery(barcodesGql) {
    let productsQuery = [`first: 250`, `query: "${barcodesGql}"`];
    if (cursor != null) {
      productsQuery.push(`after:"${cursor}"`);
    }
    productsQuery = productsQuery.join(",");
    return `
    query {
      productVariants(${productsQuery}) {
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
        edges {
          cursor
          node {
            id
            product {
              id
            }  
            displayName 
            barcode
            sku
            inventoryQuantity           
          }
        }
      }
    }
  `;
  }

  const UPDATE_PRODUCT_METAFIELDS = `
    mutation updateProductMetafields($productId: ID!) {
      productUpdate(
        input: {
          id: $productId
          metafields: [
            {
              namespace: "product"
              key: "backorder"
              value: "true"
              type: "boolean"
            }
            {
              namespace: "product"
              key: "backorder_time"
              value: "unknown"
              type: "single_line_text_field"
            }
          ]
        }
      ) {
        product {
          id
        }
      }
    }
  `;

  const ADD_TAGS_TO_PRODUCT = `
    mutation addTagsToProduct($productId: ID!, $tags: [String!]!) {
      tagsAdd(id: $productId, tags: $tags) {
        node {
          id
        }
      }
    }
  `;

  const UPDATE_PRODUCT_VARIANT = `
    mutation updateProductVariant($id: ID!) {
      productVariantUpdate(input: { id: $id, inventoryPolicy: CONTINUE }) {
        productVariant {
          id
          inventoryPolicy
        }
      }
    }
  `;

  const getProductIds = async (barcodesGql, rd) => {
    const response = await fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: getProductsQuery(barcodesGql),
        variables: null,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log({ data });
    if (data != null) {
      const failedBarcodes = [];

      if (data != null) {
        const updatedRows = [...rd];
        for (
          let index = 0;
          index < data.productVariants.edges.length;
          index++
        ) {
          const product = data.productVariants.edges[index];
          const { id, displayName, barcode, sku } = product.node;
          const productId = product.node.product.id;

          try {
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                fetch("/api/call/graphql", {
                  method: "POST",
                  body: JSON.stringify({
                    query: UPDATE_PRODUCT_VARIANT,
                    variables: { id: id },
                  }),
                  headers: { "Content-Type": "application/json" },
                })
                  .then(() => {
                    setSuccessCount((prevCount) => prevCount + 1);
                    const rowIndex = updatedRows.findIndex(
                      (row) => row[1] === barcode
                    );
                    if (rowIndex !== -1) {
                      updatedRows[rowIndex][4] = displayName;
                      updatedRows[rowIndex][2] = sku;
                      updatedRows[rowIndex][5] = "Updated";
                    }
                    resolve();
                  })
                  .catch(() => {
                    setFailureCount((prevCount) => prevCount + 1);
                    const rowIndex = updatedRows.findIndex(
                      (row) => row[1] === barcode
                    );
                    if (rowIndex !== -1) {
                      failedBarcodes.push(barcode);
                      updatedRows[rowIndex][4] = displayName;
                      updatedRows[rowIndex][2] = sku;
                      updatedRows[rowIndex][5] = "Failed";
                    }
                    resolve();
                  });
              }, 200); // Delay before each update
            });

            await new Promise((resolve, reject) => {
              setTimeout(() => {
                fetch("/api/call/graphql", {
                  method: "POST",
                  body: JSON.stringify({
                    query: UPDATE_PRODUCT_METAFIELDS,
                    variables: { productId: productId },
                  }),
                  headers: { "Content-Type": "application/json" },
                })
                  .then(() => {
                    // Success logic for updateProductMeta
                    resolve();
                  })
                  .catch(() => {
                    // Failure logic for updateProductMeta
                    resolve();
                  });
              }, 200); // Delay before each updateProductMeta
            });

            await new Promise((resolve, reject) => {
              setTimeout(() => {
                fetch("/api/call/graphql", {
                  method: "POST",
                  body: JSON.stringify({
                    query: ADD_TAGS_TO_PRODUCT,
                    variables: { productId: productId, tags: ["backorder"] },
                  }),
                  headers: { "Content-Type": "application/json" },
                })
                  .then(() => {
                    // Success logic for addTag
                    resolve();
                  })
                  .catch(() => {
                    // Failure logic for addTag
                    resolve();
                  });
              }, 200); // Delay before each addTag
            });
          } catch (error) {
            console.error(error);
          }
        }

        console.log({ updatedRows });
        setRows(updatedRows);

        const failedRows = updatedRows.filter((row) => row[5] === "Failed");

        // Handle retries for failed rows sequentially
        for (let index = 0; index < failedRows.length; index++) {
          const row = failedRows[index];
          const barcode = row[1];

          setProgressMessage((prev) => `${prev}\nRetrying ${barcode}`);

          try {
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                const product = data.productVariants.edges.find(
                  (p) => p.node.barcode === barcode
                );
                if (product) {
                  const { id } = product.node;
                  fetch("/api/call/graphql", {
                    method: "POST",
                    body: JSON.stringify({
                      query: UPDATE_PRODUCT_VARIANT,
                      variables: { id: id },
                    }),
                    headers: { "Content-Type": "application/json" },
                  })
                    .then(() => {
                      const rowIndex = updatedRows.findIndex(
                        (r) => r[1] === barcode
                      );
                      if (rowIndex !== -1) {
                        setProgressMessage(
                          (prev) => `${prev}\n${barcode} Success`
                        );
                        updatedRows[rowIndex][5] = "Success";
                      }
                      resolve();
                    })
                    .catch(() => {
                      const rowIndex = updatedRows.findIndex(
                        (r) => r[1] === barcode
                      );
                      if (rowIndex !== -1) {
                        setProgressMessage(
                          (prev) => `${prev}\n${barcode} Failed`
                        );
                        updatedRows[rowIndex][5] = "Failed";
                      }
                      resolve();
                    });
                } else {
                  setProgressMessage(
                    (prev) => `${prev}\n${barcode} Product not found`
                  );
                  resolve();
                }
              }, 200); // Delay increases with each retry by 1 second
            });
          } catch (error) {
            console.error(error);
          }
        }

        // Handle second page of data
        if (data.productVariants.pageInfo.hasNextPage) {
          const updatedCursor =
            data.productVariants.edges[data.productVariants.edges.length - 1]
              .cursor;
          setCursor(updatedCursor);
          getProductIds(barcodesGql, updatedRows);
        } else {
          setCursor(null);
        }
      }
      setFailedBarcodes(failedBarcodes);
      setMainMessage("Finished");
    }
  };

  console.log({ rows });

  const getproducts = async (barcodesGql, rd, allFoundBarcodes = new Set(), isFirstCall = true) => {
    if (isFirstCall) {
      setIsCheckingProducts(true);
    }
    
    const response = await fetch("/api/call/graphql", {
      method: "POST",
      body: JSON.stringify({
        query: getProductsQuery(barcodesGql),
        variables: null,
      }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data != null) {
      console.log(data);
      const updatedRows = [...rd];
      
      data.productVariants?.edges?.forEach((product) => {
        if (!product.node.displayName.toLowerCase().includes("damaged")) {
          setCursor(product.cursor);
          const rowIndex = updatedRows.findIndex(
            (row) => row[1] === product.node.barcode
          );
          console.log({ rowIndex });
          if (rowIndex !== -1) {
            updatedRows[rowIndex][4] = product.node.displayName;
            updatedRows[rowIndex][2] = product.node.sku;
            updatedRows[rowIndex][3] = product.node.inventoryQuantity;
            updatedRows[rowIndex][5] = "Found";
            allFoundBarcodes.add(product.node.barcode);
          }
        }
      });

      console.log({ updatedRows });
      
      if (data.productVariants?.pageInfo?.hasNextPage) {
        // Continue to next page without updating rows yet
        await getproducts(barcodesGql, updatedRows, allFoundBarcodes, false);
      } else {
        setCursor(null);
        // After all pages are processed, ensure unfound items are marked as "Not On System"
        const finalRows = updatedRows.map(row => {
          if (!allFoundBarcodes.has(row[1]) && row[5] !== "Found") {
            row[5] = "Not On System";
          }
          return row;
        });
        console.log('Final rows:', finalRows);
        setRows(finalRows);
        setIsCheckingProducts(false);
      }
    }
  };

  const handleBackorderChange = async () => {
    if (eansValue != null) {
      let rd = [];
      for (const bc of eansValue.split(/\r?\n/)) {
        if (bc) rd.push(["", bc, "", "", "", "Not On System"]);
      }
      setRows(rd);
      setValue(eansValue);
      let tmpbarcodes = eansValue.split(/\r?\n/).map((i) => "barcode:" + i);
      tmpbarcodes = tmpbarcodes.join(" OR "); // wait for setState
      getProductIds(tmpbarcodes, rd);
    }
  };

  const handleChange = useCallback(async (barcode) => {
    if (barcode != null && barcode.trim() !== "") {
      setCursor(null); // Reset cursor for new search
      let rd = [];
      for (const bc of barcode.split(/\r?\n/)) {
        if (bc.trim()) rd.push(["", bc.trim(), "", "", "", "Checking..."]);
      }
      setRows(rd);
      setValue(barcode);
      let tmpbarcodes = barcode.split(/\r?\n/)
        .filter(bc => bc.trim())
        .map((i) => "barcode:" + i.trim());
      tmpbarcodes = tmpbarcodes.join(" OR ");
      await getproducts(tmpbarcodes, rd);
    }
  }, []);

  const renderProgressSection = () => (
    <Card>
      <Box padding="4">
        <BlockStack gap="4">
          <Text variant="headingMd" as="h2">
            Progress
          </Text>
          <ProgressBar
            progress={Math.round(
              (successCount / (successCount + failureCount || 1)) * 100
            )}
            size="small"
          />
          <BlockStack gap="2">
            <Text color="success">✓ {successCount} products updated</Text>
            {failureCount > 0 && (
              <Text color="critical">✕ {failureCount} failed</Text>
            )}
          </BlockStack>
          {progressMessage && (
            <Box paddingBlock="3">
              <Text>{progressMessage}</Text>
            </Box>
          )}
          {failedBarcodes.length > 0 && (
            <Banner status="critical" title="Failed Updates">
              <Text>{failedBarcodes.join(", ")}</Text>
            </Banner>
          )}
        </BlockStack>
      </Box>
    </Card>
  );

  const renderDashboardActions = () => (
    <Box padding="4">
      <InlineStack wrap={false} align="space-between">
        <BlockStack gap="4">
          <Text variant="headingLg" as="h1">
            {shop.data[0].name} Dashboard
            <Tooltip content="Manage orders, inventory and more">
              <Icon source={InfoIcon} color="subdued" />
            </Tooltip>
          </Text>
          <ButtonGroup>
            <Button url="/order?filter=pending" icon={PackageIcon} primary>
              Pick/Pack Orders
            </Button>
            <Button url="/preorder" icon={CalendarIcon}>
              Pre-Orders
            </Button>
            <Button icon={PrintIcon} onClick={createManifests}>
              Create Manifest
            </Button>
          </ButtonGroup>
        </BlockStack>
        <Popover
          active={isFilterActive}
          activator={
            <Button
              icon={FilterIcon}
              onClick={() => setIsFilterActive(!isFilterActive)}
            >
              Filter
            </Button>
          }
          onClose={() => setIsFilterActive(false)}
        >
          <ActionList
            items={[
              { title: "All Orders", onAction: () => {} },
              { title: "Pending Orders", onAction: () => {} },
              { title: "Completed Orders", onAction: () => {} },
            ]}
          />
        </Popover>
      </InlineStack>
    </Box>
  );

  const pageContent = shop?.data ? (
    <Layout>
      <Layout.Section>
        <BlockStack gap="4">
          <Card>{renderDashboardActions()}</Card>

          <Card>
            <Box padding="4">
              <BlockStack gap="4">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    Stock Checker
                  </Text>
                  <Tooltip content="Check stock levels and update inventory">
                    <Icon source={QuestionCircleIcon} color="subdued" />
                  </Tooltip>
                </InlineStack>

                <TextField
                  label="Enter Barcodes"
                  value={value}
                  onChange={handleChange}
                  multiline={4}
                  placeholder="Enter one barcode per line"
                  autoComplete="off"
                />
                {isCheckingProducts && (
                  <Banner status="info">
                    <Text>🔄 Checking products in Shopify...</Text>
                  </Banner>
                )}
                {rows.length > 0 && (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "text",
                      "numeric",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "ID",
                      "EAN",
                      "MPN",
                      "Stock",
                      "Product",
                      "Status",
                    ]}
                    rows={rows.map(row => {
                      const status = row[5];
                      let statusDisplay = status;
                      
                      if (status === "Found") {
                        statusDisplay = "✅ Found";
                      } else if (status === "Not On System") {
                        statusDisplay = "❌ Not On System";
                      } else if (status === "Updated") {
                        statusDisplay = "✅ Updated";
                      } else if (status === "Failed") {
                        statusDisplay = "❌ Failed";
                      } else if (status === "Checking...") {
                        statusDisplay = "🔄 Checking...";
                      }
                      
                      return [row[0], row[1], row[2], row[3], row[4], statusDisplay];
                    })}
                    truncate
                  />
                )}
              </BlockStack>
            </Box>
          </Card>

          {renderProgressSection()}

          <Card>
            <Box padding="4">
              <BlockStack gap="4">
                <Text variant="headingMd" as="h2">
                  Backorder Management
                </Text>
                <TextField
                  label="EANs for Backorder"
                  value={eansValue}
                  onChange={setEansValue}
                  multiline={4}
                  placeholder="Enter one EAN per line"
                  autoComplete="off"
                />
                <Button primary onClick={handleBackorderChange}>
                  Add to Backorder
                </Button>
              </BlockStack>
            </Box>
          </Card>
        </BlockStack>
      </Layout.Section>
    </Layout>
  ) : (
    <Layout.Section>
      <EmptyState
        heading="Welcome to Duncan's Functions"
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>Loading shop data...</p>
      </EmptyState>
    </Layout.Section>
  );

  return (
    <Frame>
      <Page fullWidth>
        <TitleBar
          title={`Duncan's Functions${shop ? ` - ${shop.data[0].name}` : ""}`}
        />
        {pageContent}
      </Page>
    </Frame>
  );
}
