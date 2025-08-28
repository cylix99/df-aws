export function dynamicSort(property) {
  let sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substring(1);
  }
  return function (a, b) {
    const result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

export function dynamicSortMultiple(...props) {
  return function (obj1, obj2) {
    let result = 0;
    for (let i = 0; i < props.length && result === 0; i++) {
      result = dynamicSort(props[i])(obj1, obj2);
    }
    return result;
  };
}

export function findProfit(order) {
  let oc = order.shippingAddress.countryCodeV2;
  if (["JE", "GG", "IM"].includes(oc)) {
    oc = "GB";
  }
  const amazon =
    order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
    null;
  const ebay =
    order.customAttributes.find((x) => x.key === "eBay Order Id")?.value ||
    null;
  const vat = oc === "GB" ? 1.2 : 1;
  const commission = amazon || ebay ? 1.15 : 1;
  let totalcost = 0;
  const shipping = oc === "GB" && amazon ? 4.21 : 0;
  for (const item of order.LineItem) {
    totalcost += parseFloat(item.variant?.inventoryItem?.unitCost?.amount) || 0;
  }
  totalcost += shipping;
  const ordervalue =
    parseFloat(order.totalPriceSet?.presentmentMoney?.amount) -
    parseFloat(order.totalShippingPriceSet?.presentmentMoney?.amount);
  const minusvat = ordervalue / vat;
  const commissTot = minusvat * commission - minusvat;
  const minuscommission = minusvat - commissTot;
  const profit = minuscommission - totalcost;
  const percent = (profit / ordervalue) * 100;
  return { profit, totalcost, percent, ordervalue };
}

export function sortPickOrder(orders) {
  if (!orders) return;
  const count = {};
  const w2 = [];
  for (const order of orders) {
    const items = order.LineItem;
    for (const item of items) {
      const sku = item.sku ? `a${item.sku}` : item.name;
      count[sku] = (count[sku] || 0) + item.unfulfilledQuantity;
      const index = w2.findIndex((obj) => obj.sku === sku);
      if (index > -1) {
        w2[index].qty = count[sku];
      } else {
        w2.push({
          name: item.name,
          loc: item.product?.loc?.value?.toUpperCase() || "x",
          qty: count[sku],
          orderid: order.name,
          sku,
          image: item.image?.originalSrc,
          totalInventory: item.product?.totalInventory,
          onHandInventory: item.variant?.inventoryItem?.inventoryLevels?.edges?.[0]?.node?.quantities?.find(q => q.name === "on_hand")?.quantity || 0,
          preOrder: item.product?.preOrder,
        });
      }
    }
  }
  return w2.sort(dynamicSortMultiple("loc"));
}

export function sortPackOrder(orders) {
  if (!orders) return;
  let amazon;
  const w2 = [];
  const count = {};
  for (const order of orders) {
    amazon =
      order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
      null;
    const items = order.LineItem;
    for (const item of items) {
      const sku = item.sku ? `a${item.sku}` : item.name;
      count[sku] = (count[sku] || 0) + item.unfulfilledQuantity;
    }
  }
  for (const order of orders) {
    amazon =
      order.customAttributes.find((x) => x.key === "Amazon Order Id")?.value ||
      null;
    const items = order.LineItem;
    for (const item of items) {
      const sku = item.sku ? `a${item.sku}` : item.name;
      w2.push({
        id: order.name,
        name: item.name,
        sku,
        qty: count,
        weight: item.variant?.weight,
        order,
        profits: findProfit(order),
        amazon: !!amazon,
      });
    }
  }
  const uniqueW2 = w2.filter(
    (value, index, self) => index === self.findIndex((t) => t.id === value.id)
  );
  return uniqueW2.sort(dynamicSortMultiple("weight", "-sku", "id")).reverse();
}

export function readJsonl(data) {
  const childObjects = {};
  const returndata = [];
  let objectType = "LineItem";
  for (const line of data) {
    if (!line) continue;
    const object = JSON.parse(line);
    if (object.id) {
      [, objectType] = /gid:\/\/shopify\/(.*)\/\d/.exec(object.id);
    }
    if (childObjects[object.id]) {
      Object.assign(object, childObjects[object.id]);
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
