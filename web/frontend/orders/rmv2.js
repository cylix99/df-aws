import axios from "axios";
import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";
import queryString from "query-string";
import { createPuzzleGaloreLabel } from "./createThankYouPdf.js";
import {
  hasReceivedOffer,
  createDiscountCode,
  recordOfferSent,
} from "./discountCodeManager.js";

const clientId = "7179C24746DE67CE3498458CD6CE3B5E";
const clientSecret =
  "CF2A133BF48095B7780A40F30BBA119D81EFEB374A574BFE12D568BB3EBAD39C";
const tokenUrl = "https://authentication.proshipping.net/connect/token";
const grantType = "client_credentials";
let token = null;
let expiry = null;
const ShippingAccountId = "Duncans Retail Ltd";
const test = false;

const useDiscountCodeManager = true;

const hvkCountries = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "DK",
  "EE",
  "FR",
  "DE",
  "GR",
  "HU",
  "IT",
  "IE",
  "LV",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "CH",
  "CA",
];

function getApiServiceCode(oc) {
  return hvkCountries.includes(oc) ? "HVK" : "HVB";
}

async function getToken() {
  if (token && expiry && Date.now() < expiry) {
    return token;
  }

  const params = new URLSearchParams({
    grant_type: grantType,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  try {
    const response = await axios.post(tokenUrl, params.toString(), options);
    if (response.status === 200) {
      const data = response.data;
      token = data.access_token;
      expiry = Date.now() + data.expires_in * 1000;
      return token;
    } else {
      throw new Error(
        `Request failed. Status: ${response.status}\nResponse: ${JSON.stringify(
          response.data
        )}`
      );
    }
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
}

const createLabel = async (data) => {
  const proxyUrl = "/proxy/shipping";
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(proxyUrl, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data);
  }
};

export async function createManifests() {
  if (token === null) {
    token = await getToken();
  }
  const proxyUrl = "/proxy/manifests";
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(proxyUrl, {}, { headers });

    // Create the final manifest with title page and rotated pages
    const mergedPdf = await PDFDocument.create();
    const firstPageBytes = await createManifestTitle();
    const firstPagePdf = await PDFDocument.load(firstPageBytes);
    const [firstPage] = await mergedPdf.copyPages(firstPagePdf, [0]);
    mergedPdf.addPage(firstPage);

    for (const manifestL of response.data) {
      const pdf = await PDFDocument.load(manifestL.ManifestImage);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        page.setRotation(degrees(-90));
        mergedPdf.addPage(page);
      });
    }

    const buf = await mergedPdf.save();
    saveAs(
      new Blob([new Uint8Array(buf)], { type: "application/pdf" }),
      "manifest.pdf"
    );
  } catch (error) {
    console.error("Error:", error.response || error);
  }
}

const createManifestTitle = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([350, 240]);
  const { width, height } = page.getSize();

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBoldFont = await pdfDoc.embedFont(
    StandardFonts.TimesRomanBold
  );

  const fontSize = 20;
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long" };
  const formattedDate = today.toLocaleDateString("en-GB", options);

  const royalMailText = "Royal Mail";
  const collectionText = "Collection";
  const dateText = formattedDate;
  const barcodeLabelText = "Collection point barcode";

  const royalMailWidth = timesRomanFont.widthOfTextAtSize(
    royalMailText,
    fontSize
  );
  const collectionWidth = timesRomanBoldFont.widthOfTextAtSize(
    collectionText,
    fontSize
  );
  const dateWidth = timesRomanFont.widthOfTextAtSize(dateText, fontSize);
  const barcodeLabelWidth = timesRomanFont.widthOfTextAtSize(
    barcodeLabelText,
    fontSize
  );

  const royalMailX = (width - royalMailWidth) / 2;
  const collectionX = (width - collectionWidth) / 2;
  const dateX = (width - dateWidth) / 2;
  const barcodeLabelX = (width - barcodeLabelWidth) / 2;

  page.setFont(timesRomanFont);
  page.setFontSize(fontSize);
  page.drawText(royalMailText, { x: royalMailX, y: height - 60 });

  page.setFont(timesRomanBoldFont);
  page.drawText(collectionText, { x: collectionX, y: height - 90 });

  page.setFont(timesRomanFont);
  page.drawText(dateText, { x: dateX, y: height - 120 });

  const barcodeUrl =
    "https://cdn.shopify.com/s/files/1/0622/5756/1826/files/barcode.png?v=1734612498";
  const barcodeBytes = await fetch(barcodeUrl).then((res) => res.arrayBuffer());
  const barcodeImage = await pdfDoc.embedPng(barcodeBytes);
  const barcodeDims = barcodeImage.scale(1);

  page.drawImage(barcodeImage, {
    x: (width - barcodeDims.width) / 2,
    y: 40,
    width: barcodeDims.width,
    height: barcodeDims.height,
  });

  page.drawText(barcodeLabelText, { x: barcodeLabelX, y: 20 });

  return await pdfDoc.save();
};

export async function getLabelsv2(orders, authFetch) {
  let returnDataArray = { toast: [], data: [], originalData: null };
  let pdfsToMerge = [];

  // Pre-generate discount code once for this batch
  let batchDiscountCode = null;
  if (useDiscountCodeManager) {
    returnDataArray.toast.push(
      "🎟️ Preparing discount codes for eligible customers..."
    );
    batchDiscountCode = await createDiscountCode(false);
    if (batchDiscountCode) {
      returnDataArray.toast.push(
        `✅ Created batch discount code: ${batchDiscountCode}`
      );
    } else {
      returnDataArray.toast.push(
        "⚠️ Could not create discount code - proceeding without offers"
      );
    }
  }

  if (token === null) {
    returnDataArray.toast.push("🔐 Getting Royal Mail authentication token...");
    token = await getToken();
    returnDataArray.toast.push("✅ Successfully authenticated with Royal Mail");
  }

  for (let order of orders) {
    order = order.order;
    let returnData = {
      id: order.id.replace("gid://shopify/Order/", ""),
      message: null,
      mutations: {},
      shipmentNumber: null,
    };

    try {
      let response = {};
      // Check if this is an Amazon order
      if (
        order.shippingLine?.code?.includes("AMZSTD") ||
        (order.shippingLine?.code?.includes("Amazon") &&
          order.shippingAddress?.countryCodeV2 == "GB")
      ) {
        // For Amazon orders, skip Royal Mail and use temporary PDF
        returnDataArray.toast.push(
          `📦 Creating temporary label for Amazon order ${order.name}...`
        );
        pdfsToMerge.push(await createTmpPdf(order));
      } else if (
        !test &&
        order.royalMailShipmentNumber?.value &&
        order.royalMailShipmentNumber?.value !== "0"
      ) {
        returnDataArray.toast.push(
          `🔍 Retrieving existing label for order ${order.name}...`
        );
        response = await getLabel(order.royalMailShipmentNumber?.value);
        returnDataArray.toast.push(
          `✅ Found existing label for order ${order.name}`
        );
      } else {
        returnDataArray.toast.push(
          `🚚 Requesting new label from Royal Mail for order ${order.name}...`
        );
        const data = buildCreateshipment(order);

        returnDataArray.originalData = data;
        if (!data) {
          returnData.message = "No Data Submitted";
          returnDataArray.toast.push(
            `⚠️ Skipping order ${order.name} - No data to submit`
          );
        } else {
          response = await createLabel(data);
          if (response?.Packages) {
            returnDataArray.toast.push(
              `🎉 Successfully created label for order ${order.name}`
            );
          }
        }
      }

      if (response?.Errors) {
        returnData.message = `${response.Errors} - Order ${order.name}`;
        returnDataArray.toast.push(
          `Error processing order ${order.name}: ${response.Errors}`
        );
      }

      if (response === undefined) {
        returnDataArray.toast.push(
          `Creating temporary label for order ${order.name}`
        );
        if (
          !order.shippingLine?.code?.includes("AMZSTD") &&
          !order.shippingLine?.code?.includes("Amazon")
        ) {
          pdfsToMerge.push(await createTmpPdf(order));
        }
      }

      if (response !== undefined) {
        let shipmentNumber;
        if (response.Packages) {
          let tracking = response.Packages[0];
          shipmentNumber =
            tracking.TrackingNumber || tracking.CarrierDetails.UniqueId;
          returnDataArray.toast.push(
            `Got tracking number ${shipmentNumber} for order ${order.name}`
          );

          let metafields = [
            {
              namespace: "my_fields",
              key: "royal_mail_tracking_number",
              value: shipmentNumber,
            },
            {
              namespace: "my_fields",
              key: "royal_mail_shipment_number",
              value: shipmentNumber,
            },
          ];

          returnData.mutations = {
            variables: {
              input: {
                id: order.id,
                metafields,
              },
            },
          };
          returnDataArray.toast.push(
            `Updating Shopify with tracking info for order ${order.name}`
          );
        }

        if (!("Labels" in response)) {
          returnDataArray.toast.push(
            `Creating temporary label for order ${order.name}`
          );
          pdfsToMerge.push(await createTmpPdf(order));
        }

        if ("Documents" in response) {
          returnDataArray.toast.push(
            `Processing shipping documents for order ${order.name}`
          );
          pdfsToMerge.push(response.Documents);
        }

        if ("Labels" in response) {
          returnDataArray.toast.push(
            `Processing shipping label for order ${order.name}`
          );
          if (order.shippingAddress.countryCodeV2 == "FR") {
            if (test) {
              pdfsToMerge.push(response.Labels);
            } else {
              returnDataArray.toast.push(
                `Adding recycling info to French label for order ${order.name}`
              );
              pdfsToMerge.push(await addRecylcing(response.Labels));
            }
          } else {
            if (test) {
              pdfsToMerge.push(response.Labels);
            } else {
              returnDataArray.toast.push(
                `Adding logo to label for order ${order.name}`
              );
              pdfsToMerge.push(await addLogo(response.Labels));
            }
          }
        }

        returnData.message = `Success - Shipment# ${
          shipmentNumber || response?.UniqueId
        }`;
        returnData.shipmentNumber = shipmentNumber || response?.UniqueId;
      }
    } catch (error) {
      console.error(error);
      if (error?.response && "Errors" in error?.response?.data) {
        returnDataArray.toast.push(
          `Error: ${error?.response?.data?.Errors[0]?.Message} for order ${order.name}`
        );
      }
      returnDataArray.toast.push(
        `Creating temporary label for failed order ${order.name}`
      );
      pdfsToMerge.push(await createTmpPdf(order));
    } finally {
      returnDataArray.data.push(returnData);
    }

    if (useDiscountCodeManager && batchDiscountCode) {
      if (
        order.shippingLine?.code?.includes("AMZSTD") ||
        order.shippingLine?.code?.includes("Amazon")
      ) {
        returnDataArray.toast.push(
          `📦 Adding Amazon thank you PDF for order ${order.name}`
        );
        const thankYouPdfBytes = await createPuzzleGaloreLabel({
          nextOrderText: "ON YOUR FIRST ORDER",
          discountCode: "FIRSTORDER",
        });
        pdfsToMerge.push(thankYouPdfBytes);
      } else {
        const customerId = order.customer?.id;
        if (customerId && !(await hasReceivedOffer(customerId))) {
          returnDataArray.toast.push(
            `🎁 Adding discount offer for new customer (Order ${order.name})`
          );
          const thankYouPdfBytes = await createPuzzleGaloreLabel({
            nextOrderText: "ON YOUR NEXT ORDER",
            discountCode: batchDiscountCode,
          });
          pdfsToMerge.push(thankYouPdfBytes);
          await recordOfferSent(customerId, false);
          returnDataArray.toast.push(
            `✅ Recorded offer for customer ${customerId} (Order ${order.name})`
          );
        } else if (customerId) {
          returnDataArray.toast.push(
            `ℹ️ Customer already received offer, skipping (Order ${order.name})`
          );
        }
      }
    }

    // Check for USA orders with Ravensburger products
    if (
      order.shippingAddress?.countryCodeV2 === "US" &&
      hasRavensburgerProduct(order)
    ) {
      returnDataArray.toast.push(
        `Adding Ravensburger USA notice for order ${order.name}`
      );
      const ravensburgerNoticeBytes = await createRavensburgerUSANotice();
      pdfsToMerge.push(ravensburgerNoticeBytes);
    }
  }

  returnDataArray.toast.push("Merging all labels into final PDF...");
  const mergedPdf = await PDFDocument.create();
  for (const pdfBytes of pdfsToMerge) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const buf = await mergedPdf.save();
  saveAs(
    new Blob([new Uint8Array(buf)], { type: "application/pdf" }),
    "labels.pdf"
  );
  returnDataArray.toast.push("📄 Successfully generated and saved labels PDF!");

  // Add discount code summary
  if (useDiscountCodeManager && batchDiscountCode) {
    const offersCount = returnDataArray.toast.filter((msg) =>
      msg.includes("Adding discount offer for new customer")
    ).length;
    if (offersCount > 0) {
      returnDataArray.toast.push(
        `🎉 Batch processing complete! ${offersCount} customers received discount code: ${batchDiscountCode}`
      );
    }
  }

  return returnDataArray;
}

const addRecylcing = async (pdf) => {
  const pdfDoc = await PDFDocument.load(pdf);
  const firstPage = pdfDoc.getPages()[0];
  const triUrl =
    "https://cdn.shopify.com/s/files/1/0622/5756/1826/files/tri.png?v=1665567544";
  const triBytes = await fetch(triUrl).then((res) => res.arrayBuffer());
  const triImage = await pdfDoc.embedPng(triBytes);
  const triDims = triImage.scale(0.3);
  const { width } = firstPage.getSize();
  firstPage.drawImage(triImage, {
    x: width - triDims.width - 1,
    y: 1,
    width: triDims.width,
    height: triDims.height,
  });

  return await pdfDoc.save();
};

const addLogo = async (pdf) => {
  const pdfDoc = await PDFDocument.load(pdf);
  const firstPage = pdfDoc.getPages()[0];
  const logoUrl =
    "https://cdn.shopify.com/s/files/1/0622/5756/1826/files/logo_grey.jpg?v=1689252458";
  const logoBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
  const logoImage = await pdfDoc.embedJpg(logoBytes);
  const logoDims = logoImage.scale(0.09);
  const { width } = firstPage.getSize();
  firstPage.drawImage(logoImage, {
    x: width - logoDims.width - 7,
    y: 7,
    width: logoDims.width,
    height: logoDims.height,
  });

  return await pdfDoc.save();
};

const createTmpPdf = async (order) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([240, 350]);
  page.moveTo(10, 200);
  page.drawText(order.name);
  page.moveTo(10, 170);
  page.drawText(order.shippingAddress.name?.substring(0, 39));

  let yPosition = 140;
  for (const item of order.LineItem) {
    if (item.unfulfilledQuantity > 0) {
      page.moveTo(10, yPosition);
      page.drawText(`Title: ${item.product?.title?.substring(0, 39)}`);
      yPosition -= 20;
      page.moveTo(10, yPosition);
      page.drawText(`Location: ${item.product?.loc?.value?.toUpperCase()}`);
      yPosition -= 30;
    }
  }

  return await pdfDoc.save();
};

const createRavensburgerUSANotice = async () => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([288, 432]); // Same size as thank you PDF
  const { width, height } = page.getSize();

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const centerX = width / 2;
  let yPosition = height - 60;

  // Title
  const title = "Important Notice for US Customers";
  const titleWidth = helveticaBold.widthOfTextAtSize(title, 16);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: yPosition,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 40;

  // Main notice text
  const noticeLines = [
    "This Ravensburger product has been imported from",
    "outside the United States. As such, Ravensburger USA",
    "will not be able to assist with any product issues or",
    "replacements.",
    "",
    "If you experience any problems with your puzzle,",
    "please contact us directly and we'll be happy to help.",
    "",
    "Thank you for your understanding.",
  ];

  for (const line of noticeLines) {
    if (line === "") {
      yPosition -= 20;
      continue;
    }

    const lineWidth = helvetica.widthOfTextAtSize(line, 12);
    page.drawText(line, {
      x: centerX - lineWidth / 2,
      y: yPosition,
      size: 11,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  return await pdfDoc.save();
};

// Check if order contains Ravensburger products
const hasRavensburgerProduct = (order) => {
  return order.LineItem.some(
    (item) =>
      item.product?.vendor?.toLowerCase().includes("ravensburger") ||
      item.product?.title?.toLowerCase().includes("ravensburger") ||
      item.sku?.toLowerCase().includes("rav")
  );
};

// Check if the customer has opted for split shipping on pre-order items
export function checkSplitShippingPreference(order) {
  // Check order attributes for the split shipping preference
  const splitShippingAttribute = order.customAttributes.find(
    (attr) => attr.key === "split_preorder_shipping"
  );

  // Return boolean indicating if split shipping is requested
  return splitShippingAttribute?.value === "true";
}

function buildCreateshipment(order) {
  let tax = order.currentTaxLines[0]?.rate
    ? 1 - order.currentTaxLines[0]?.rate
    : 1;
  const shippingMethod = order.shippingLine?.code;
  const shipping = order.shippingAddress;
  const items = order.LineItem;
  let oc = shipping.countryCodeV2;
  if (["JE", "GG", "IM"].includes(oc)) oc = "GB";
  if (shippingMethod?.includes("Std UK") && oc == "GB") return;

  let int = oc !== "GB";
  if (["PR", "GU"].includes(oc)) oc = "US";
  if (oc == "MC") oc = "FR";

  let ll = true;
  let weight = [];
  let skus = [];
  let total = [];
  let puzzle = false;
  let service_type;
  for (const item of items) {
    if (item.product?.preOrder?.value == 1 || item.product?.totalInventory < 0)
      continue;
    //if (!item?.variant?.weight) continue;
    if (item.product?.largeLetter?.value !== "true") ll = false;
    let w = item?.variant?.weight || 2;
    if (w > 2 && w <= 2.2) w = 1.999;
    weight.push(w * (test ? item.quantity : item.unfulfilledQuantity));
    if (
      ["9503006900", "9503009590"].includes(
        item?.variant?.inventoryItem?.harmonizedSystemCode
      )
    )
      puzzle = true;
    skus.push(item.sku);
    total.push(
      parseFloat(item.originalTotalSet?.presentmentMoney?.amount * tax)
    );
  }

  weight = sumOfArray(weight);
  let adjWeight = false;
  let weightDiff = null;
  if (weight > 2 && weight < 2.3 && puzzle) {
    weightDiff = weight - 1.999;
    weight = 1.999;
    adjWeight = true;
  }

  let api_service_code = "CRL2";
  if (weight > 1 && weight <= 2 && oc == "GB") api_service_code = "CRL2";
  if (
    shippingMethod?.includes("Express") ||
    shippingMethod?.includes("Standard Delivery (1 - 3 days approx)") ||
    order.shippingLine.title.includes("24")
  ) {
    api_service_code = "TPN";
  } else if (oc == "GB" && weight > 2) {
    api_service_code = "TPS";
  }
  if (shippingMethod?.includes("Tracked 24")) api_service_code = "TPN";

  let serviceOccurrence = 2;
  let api_service_format = "Parcel";
  if (ll && weight < 0.751) {
    api_service_code = "CRL2";
    api_service_format = "LargeLetter";
  }

  if (int) {
    api_service_format = "Parcel";
    api_service_code = "MP7";
    if (shippingMethod?.includes("Tracked")) {
      api_service_code = "MP7";
    }

    service_type = "I";
    serviceOccurrence = 1;

    if (weight > 2 && weight <= 30) {
      api_service_code = getApiServiceCode(oc);
    }
  }

  const customerRef = order.name?.substring(0, 11);
  let PreRegistrationNumber = "GB879355368000";
  let PreRegistrationType = "EORI";
  const intercoms = "DDU";

  if (oc == "FR") {
    PreRegistrationNumber = "FR44837874015";
    PreRegistrationType = "TVA";
  }
  if (oc == "GB") {
    PreRegistrationNumber = "GB879355368";
    PreRegistrationType = "VAT";
  }
  total = sumOfArray(total);

  if (
    (shippingMethod?.includes("AMZSTD") ||
      order.shippingLine?.code?.includes("Amazon")) &&
    oc != "GB"
  ) {
    PreRegistrationNumber = "IM4420001201";
    PreRegistrationType = "PRS";
    api_service_code = "MP7";
  }

  let yourDate = new Date();
  let TrackingNotifications;
  let PhoneNumber;
  let EmailAddress;
  if (shipping.phone) {
    PhoneNumber = shipping.phone?.substring(0, 34);
  }
  if (order.customer?.email) {
    EmailAddress =
      order.customer?.email?.length < 34 ? order.customer?.email : null;
  }

  if (
    EmailAddress &&
    oc == "GB" &&
    api_service_code != "CRL2" &&
    api_service_code != "PPF2" &&
    api_service_code != "PPF1"
  ) {
    TrackingNotifications = "Email";
  }

  let request = {
    Shipper: {
      Reference2: skus.join(",")?.substring(0, 30),
      Reference1: customerRef,
      ShippingAccountId,
      VatNumber: PreRegistrationNumber,
    },
    Destination: {
      Address: {
        CompanyName: shipping.company?.substring(0, 40),
        ContactName: shipping.name?.substring(0, 40),
        Line1: shipping.address1?.substring(0, 40),
        Line2: shipping.address2?.substring(0, 40) || null,
        Line3: null,
        Town: shipping.city?.substring(0, 40),
        County: shipping.provinceCode === "VI" ? "" : shipping.provinceCode,
        CountryCode: oc === "VI" ? "VI" : oc,
        Postcode: shipping.zip?.substring(0, 20),
      },
    },
    ShipmentInformation: {
      ShipmentDate: yourDate.toISOString().split("T")[0],
      ServiceCode: api_service_code,
      DeclaredWeight: weight.toFixed(2),
      WeightUnitOfMeasure: "KG",
      ContentType: "NDX",
      DescriptionOfGoods: "Jigsaw Puzzle",
      CurrencyCode: order.presentmentCurrencyCode,
      LabelFormat: "PDF",
    },

    Packages: [
      {
        PackageOccurrence: 1,
        DeclaredWeight: weight.toFixed(2),
        PackageType: api_service_format,
      },
    ],
    Items: [],

    Customs: {
      PreRegistrationNumber,
      PreRegistrationType,
      ShippingCharges:
        Math.round(
          (order.totalShippingPriceSet?.presentmentMoney?.amount || 0) *
            tax *
            100
        ) / 100,
      OtherCharges: 0,
      QuotedLandedCost: 0,
      InvoiceNumber: order.name,
      InvoiceDate: order.createdAt,
      ReasonForExport: "Sale of Goods",
      Incoterms: intercoms,
    },
  };

  if (TrackingNotifications) {
    request.Destination.Address.ContactEmail = EmailAddress;
    request.CarrierSpecifics = {
      ServiceEnhancements: [{ Code: TrackingNotifications }],
    };
  }

  // Check if this is a split shipment for pre-orders
  const isSplitShipment = checkSplitShippingPreference(order);

  // If this is a split shipment, only include available items
  let itemsToShip = items;
  if (isSplitShipment) {
    itemsToShip = items.filter((item) => {
      // Only include items that are in stock and not pre-order
      return (
        !(
          item.product?.preOrder?.value == 1 || item.product?.totalInventory < 0
        ) && item.unfulfilledQuantity > 0
      );
    });
  }

  let i = 0;
  let c;
  let group = false;
  let totalValue = 0;
  for (const item of itemsToShip) {
    if (item.unfulfilledQuantity < 1 && !test) {
      continue;
    }
    if (
      item.product?.preOrder?.value == 1 ||
      item.product?.totalInventory < 0
    ) {
      continue;
    }
    if (!item?.variant?.weight) {
    }
    group = false;
    if (item.unfulfilledQuantity > 1 || adjWeight) {
      group = true;
    }
    if (weightDiff && weightDiff < item.variant?.weight) {
      c = getContentDetails(item, order, weightDiff, tax);
      weightDiff = null;
    } else {
      c = getContentDetails(item, order, null, tax);
    }
    request.Items.push(c.details);
    totalValue = totalValue + parseFloat(c.value);
  }

  request.Packages.DeclaredValue = totalValue.toFixed(2);
  return request;
}

function getContentDetails(item, order, weightDiff = null, tax) {
  const qty = test ? item.quantity : item.unfulfilledQuantity;
  const cd = "Jigsaw Puzzle";
  let w = item.variant?.weight || 2;

  if (weightDiff) {
    w = w - weightDiff;
  }

  let value = parseFloat(item.originalTotalSet?.presentmentMoney?.amount * tax);
  value = (Math.floor(value * 100) / 100 / qty).toFixed(2);
  const details = {
    Quantity: qty,
    Description: `[${cd}] ${item.name?.substring(0, 255)}`,
    Value: value,
    Weight: w.toFixed(3),
    PackageOccurrence: 1,
    HsCode: "9503006900",
    SkuCode: item.sku,
    CountryOfOrigin: item.variant?.inventoryItem?.countryCode || "DE",
  };
  let weight = w * qty;
  return {
    details: details,
    weight: weight,
    value: (value * qty).toFixed(2),
  };
}

function sumOfArray(ar) {
  var sum = 0;
  for (var i = 0; i < ar.length; i++) {
    sum += ar[i];
  }
  return sum;
}
