import fs from "fs/promises";
import path from "path";
import { createPuzzleGaloreLabel } from "./createThankYouPdf.js";

/**
 * Function to test PDF generation and save to a file
 * @param {string} outputPath - Path where the PDF should be saved
 * @param {object} customProps - Optional properties to customize the PDF
 */
async function testPdfGeneration(
  outputPath = "./thank-you.pdf",
  customProps = {}
) {
  try {
    console.log("Generating PDF...");
    const pdfBytes = await createPuzzleGaloreLabel(customProps);

    // Ensure the directory exists
    const directory = path.dirname(outputPath);
    await fs.mkdir(directory, { recursive: true });

    // Write the PDF file
    await fs.writeFile(outputPath, pdfBytes);

    console.log(`✅ PDF successfully created at: ${path.resolve(outputPath)}`);
  } catch (error) {
    console.error("❌ Error generating PDF:");
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const outputPath = args[0] || "./thank-you.pdf";

// Optional custom properties
const customProps = {};
if (args[1]) {
  try {
    Object.assign(customProps, JSON.parse(args[1]));
  } catch (e) {
    console.warn("Warning: Could not parse custom properties. Using defaults.");
  }
}

// Run the test
testPdfGeneration(outputPath, customProps);
