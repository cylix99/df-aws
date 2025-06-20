// Test script to generate an attractive 10% off label locally
// Run this with: node testLabel.js

import { createPuzzleGaloreLabel } from "./createThankYouPdf.js";
import fs from "fs";

async function generateTestLabel() {
  try {
    console.log("🎨 Generating enhanced 10% off label...");

    const pdfBytes = await createPuzzleGaloreLabel({
      nextOrderText: "ON YOUR NEXT ORDER",
      discountCode: "TESTCODE10",
    });

    // Save the PDF
    fs.writeFileSync("test-discount-label.pdf", pdfBytes);

    console.log("✅ Test label generated successfully!");
    console.log("📄 Saved as: test-discount-label.pdf");
    console.log("🎉 Open the file to see the enhanced design!");
  } catch (error) {
    console.error("❌ Error generating label:", error);
  }
}

generateTestLabel();
