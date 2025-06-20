import { Text, Layout, ProgressBar } from "@shopify/polaris";
import { useState, useCallback, useMemo } from "react";
import { styles } from "../styles/pickpack.styles";

export default function Pickpack({ type, orders: initialOrders }) {
  const [orders, setOrders] = useState(() =>
    type === "pack"
      ? initialOrders
      : initialOrders.map((order) => ({
          ...order,
          originalQty: order.qty,
        }))
  );

  const [totalOrders, setTotalOrders] = useState(orders.length);

  const progress = useMemo(() => {
    if (type === "pack") {
      const completedOrders = orders.length - totalOrders;
      const remaining = orders.length - completedOrders;
      return {
        completed: completedOrders,
        remaining: remaining,
        total: orders.length,
        percent: Math.round((completedOrders / orders.length) * 100),
      };
    } else {
      const totalItems = orders.reduce(
        (total, order) => total + (order.originalQty || order.qty),
        0
      );
      const pickedItems = orders.reduce(
        (total, order) => total + (order.originalQty || order.qty) - order.qty,
        0
      );
      const remaining = totalItems - pickedItems;
      return {
        completed: pickedItems,
        remaining: remaining,
        total: totalItems,
        percent: Math.round((pickedItems / totalItems) * 100),
      };
    }
  }, [orders, totalOrders, type]);

  const reducePick = useCallback((sku) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.sku === sku
          ? { ...order, qty: Math.max(0, order.qty - 1) }
          : order
      )
    );
  }, []);

  const done = useCallback((id) => {
    const div = document.getElementById(id);
    const isCompleted = div.style.backgroundColor === "rgb(255, 255, 255)";

    div.style.backgroundColor = isCompleted
      ? "rgb(162, 199, 162)"
      : "rgb(255, 255, 255)";

    setTotalOrders((current) => (isCompleted ? current - 1 : current + 1));
  }, []);

  const makeBigger = useCallback((sku) => {
    const img = document.getElementById(sku);
    const imgInner = document.getElementById(`${sku}-inner`);
    const isExpanded = imgInner.style.position !== "absolute";

    imgInner.style.position = isExpanded ? "absolute" : "fixed";
    imgInner.src = isExpanded
      ? imgInner.src.replace("250x250", "750x750")
      : imgInner.src.replace("750x750", "250x250");

    img.style.position = isExpanded ? "unset" : "relative";
    img.style.zIndex = isExpanded ? "1" : "2";
  }, []);

  const ProgressSection = () => (
    <div style={styles.stickyProgressContainer}>
      <div style={styles.progressText}>
        <Text variant="bodyMd" as="p">
          {progress.remaining > 0 ? (
            <>
              {progress.remaining}{" "}
              {type === "pack"
                ? `order${progress.remaining !== 1 ? "s" : ""} left to pack`
                : `item${progress.remaining !== 1 ? "s" : ""} left to pick`}
            </>
          ) : (
            <>🎉 All {type === "pack" ? "orders packed" : "items picked"}!</>
          )}
        </Text>
      </div>
      <ProgressBar progress={progress.percent} size="small" />
    </div>
  );

  const convertToGBP = (amount, currency) => {
    const exchangeRates = {
      USD: 0.81957,
      EUR: 0.83957,
      AUD: 0.50682,
      CAD: 0.56982,
      ILS: 0.2265,
      NZD: 0.45921,
      NOK: 0.072,
      SEK: 0.07,
      CHF: 0.89409,
      DKK: 0.113,
      PLN: 0.196,
      HUF: 0.002,
      CZK: 0.033,
      RON: 0.17,
      BGN: 0.429,
      HRK: 0.111,
      ISK: 0.006,
      JEP: 1.0,
      GGP: 1.0,
      IMP: 1.0,
    };
    return amount * (exchangeRates[currency] || 1);
  };

  return (
    <Layout>
      <div style={styles.contentContainer}>
        <Layout.Section>
          {type === "pack" ? (
            <>
              {orders.length > 0 &&
                orders.map((order) => {
                  const totalItemsOnOrder = order.order.LineItem.reduce(
                    (total, item) => total + item.unfulfilledQuantity,
                    0
                  );

                  const orderValueGBP = convertToGBP(
                    order.profits.ordervalue,
                    order.order.presentmentCurrencyCode
                  );
                  const profitGBP = convertToGBP(
                    order.profits.profit,
                    order.order.presentmentCurrencyCode
                  );

                  return (
                    <div
                      id={order.order.name}
                      key={order.order.name}
                      style={{
                        ...styles.stack,
                        ...styles.hr,
                        padding: "1rem",
                        backgroundColor: "rgb(255, 255, 255)",
                      }}
                      onClick={() => done(order.order.name)}
                    >
                      <div style={styles.sticky} id={order.order.name}>
                        <h2 style={{ flex: "0 0 100%" }}>
                          <Text variant="headingLg" as="p">
                            {order.order.name}
                            <span style={styles.separatorStyle}>|</span>
                            <span
                              style={
                                order.order.shippingLine?.title !== "Royal Mail"
                                  ? { color: "red" }
                                  : {}
                              }
                            >
                              {order.order.shippingLine?.title}
                            </span>
                            <span style={styles.separatorStyle}>|</span>
                            {order.order.shippingAddress?.name} (
                            {order.profits.percent.toFixed(2)}%{" "}
                            <span style={styles.separatorStyle}>|</span>Value: £
                            {orderValueGBP.toFixed(2)}{" "}
                            <span style={styles.separatorStyle}>|</span>Profit:
                            £{profitGBP.toFixed(2)})
                          </Text>
                        </h2>

                        <div style={{ flexBasis: "100%" }}>
                          <span style={styles.flexItemStyle}>
                            Total Items:{" "}
                            <strong
                              style={
                                totalItemsOnOrder > 1 ? { color: "red" } : {}
                              }
                            >
                              {totalItemsOnOrder}
                            </strong>
                          </span>
                          <span style={styles.separatorStyle}>|</span>
                          <span style={styles.flexItemStyle}>
                            Total orders:{" "}
                            <strong>
                              {order.order.customer.numberOfOrders}
                            </strong>
                          </span>

                          <span style={styles.separatorStyle}>|</span>
                          {order.order.discountCodes &&
                            order.order.discountCodes.map((item, index) => (
                              <span style={styles.flexItemStyle} key={index}>
                                <strong>{item} </strong>
                              </span>
                            ))}
                        </div>
                      </div>
                      {order.order.LineItem.map((item, index) => {
                        if (
                          item.unfulfilledQuantity > 0 &&
                          !item.preOrder?.value
                        ) {
                          return (
                            <div style={styles.stack} key={index}>
                              <div
                                style={{
                                  ...styles.stackItem,
                                  ...styles.qty,
                                  ...styles.stackPick,
                                }}
                              >
                                <h2 style={styles.pick}>Pack</h2>
                                <p
                                  style={styles.pickNo}
                                  className={
                                    item.unfulfilledQuantity > 1 && "shake"
                                  }
                                >
                                  <Text as="span" fontWeight="semibold">
                                    {item.unfulfilledQuantity}
                                  </Text>
                                </p>
                              </div>
                              <div
                                style={{
                                  ...styles.stackItem,
                                  ...styles.thumbnail,
                                }}
                                id={item.sku}
                              >
                                <img
                                  id={`${item.sku}-inner`}
                                  src={item.image?.originalSrc?.replace(
                                    ".jpg",
                                    "_250x250.jpg"
                                  )}
                                  alt={item.name}
                                  style={styles.img}
                                  onClick={() => makeBigger(item.sku)}
                                />
                              </div>

                              <div style={styles.stackItem}>
                                <p style={styles.lowerPad}>
                                  <Text as="span" fontWeight="semibold">
                                    {item.product?.title}
                                  </Text>
                                </p>
                                <p style={styles.lowerPad}>
                                  <Text as="span" color="subdued">
                                    SKU: {item.sku}
                                  </Text>
                                </p>
                                <p style={styles.lowerPad}>
                                  <Text as="span" color="subdued">
                                    loc:{" "}
                                    {item.product?.loc?.value?.toUpperCase()}
                                  </Text>
                                </p>
                                <p style={styles.lowerPad}>
                                  <Text as="span" color="subdued">
                                    In Stock: {item.product?.totalInventory}
                                  </Text>
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })}
                      {order.order.note && (
                        <h2 style={{ flex: "0 0 100%" }}>
                          <Text variant="headingLg" as="p">
                            {order.order.note}
                          </Text>
                        </h2>
                      )}
                    </div>
                  );
                })}
            </>
          ) : (
            <>
              {orders.length > 0 &&
                orders.map((order, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.stack,
                      ...styles.hr,
                      backgroundColor:
                        order.qty > 0 ? "#ffffff" : "rgb(162, 199, 162)",
                    }}
                    onClick={() => reducePick(order.sku)}
                  >
                    <div
                      style={{
                        ...styles.stackItem,
                        ...styles.qty,
                        ...styles.stackPick,
                      }}
                    >
                      <h2 style={styles.pick}>Pick</h2>
                      <p style={styles.pickNo}>
                        <Text as="span" fontWeight="semibold">
                          {order.qty}
                        </Text>
                      </p>
                    </div>
                    <div
                      style={{ ...styles.stackItem, ...styles.thumbnail }}
                      id={order.sku}
                    >
                      <img
                        id={`${order.sku}-inner`}
                        src={order.image}
                        alt={order.name}
                        style={styles.img}
                        onClick={() => makeBigger(order.sku)}
                      />
                    </div>

                    <div style={styles.stackItem}>
                      <p style={styles.lowerPad}>
                        <Text as="span" fontWeight="semibold">
                          {order.name}
                        </Text>
                      </p>
                      <p>
                        <Text as="span" fontWeight="semibold">
                          {order.loc}
                        </Text>
                      </p>
                      <p style={styles.lowerPad}>
                        <Text as="span" color="subdued">
                          SKU: {order.sku}
                        </Text>
                      </p>
                      <p style={styles.lowerPad}>
                        <Text as="span" color="subdued">
                          In Stock {order.totalInventory}
                        </Text>
                      </p>
                    </div>
                  </div>
                ))}
            </>
          )}
        </Layout.Section>
      </div>
      <ProgressSection />
    </Layout>
  );
}
