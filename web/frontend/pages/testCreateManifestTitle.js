import fs from "fs";
import { grayscale, PDFDocument, degrees, StandardFonts } from "pdf-lib";
import bwipjs from "bwip-js";

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

  // Calculate text widths
  const royalMailText = "Royal Mail";
  const collectionText = "Collection";
  const dateText = formattedDate;
  const barcodeText = "FIR801143";
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

  // Set font and draw text
  page.setFont(timesRomanFont);
  page.setFontSize(fontSize);
  page.drawText(royalMailText, { x: royalMailX, y: height - 60 });

  page.setFont(timesRomanBoldFont);
  page.drawText(collectionText, { x: collectionX, y: height - 90 });

  page.setFont(timesRomanFont);
  page.drawText(dateText, { x: dateX, y: height - 120 });

  // Generate barcode image
  const barcodePng = await bwipjs.toBuffer({
    bcid: "code128", // Barcode type
    text: barcodeText, // Text to encode
    scale: 2.25, // 1.5 times bigger than the previous 1.5 scale
    height: 10, // 3 times the previous height of 10
    includetext: false, // Show human-readable text
  });

  // Embed barcode image into PDF
  const barcodeImage = await pdfDoc.embedPng(barcodePng);
  const barcodeDims = barcodeImage.scale(1);

  page.drawImage(barcodeImage, {
    x: (width - barcodeDims.width) / 2,
    y: 40,
    width: barcodeDims.width,
    height: barcodeDims.height,
  });

  // Draw barcode label
  page.drawText(barcodeLabelText, { x: barcodeLabelX, y: 20 });

  return await pdfDoc.save();
};

(async () => {
  const pdfBytes = await createManifestTitle();
  fs.writeFileSync("manifestTitle.pdf", pdfBytes);
  console.log("PDF created and saved as manifestTitle.pdf");
})();
