import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Configuration variables - Professional Thermal Label Design
const CONFIG = {
  // Text content
  thankYouMessage: "THANK YOU FOR YOUR ORDER!",
  discountPercent: "10%",
  discountWord: "OFF",
  nextOrderText: "ON YOUR NEXT ORDER",
  discountCode: "PZGL10",
  validityText: "VALID FOR 30 DAYS",
  footerText: "SAVE WITH CODE:",
  disclaimerText: "Enter discount code at checkout to save 10%",
  websiteText: "PUZZLESGALORE.CO.UK",

  // Enhanced Typography for Visual Appeal
  discountFontSize: 84,
  offFontSize: 36,
  thankYouFontSize: 14,
  codeBoxFontSize: 24,

  // Visual Elements
  decorativeBorderThickness: 6,
  innerBorderThickness: 2,
  ruleThickness: 3,

  // High Contrast B&W Colors
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
  darkGray: rgb(0.15, 0.15, 0.15),
  mediumGray: rgb(0.4, 0.4, 0.4),
  lightGray: rgb(0.85, 0.85, 0.85),

  // Layout
  logoWidth: 160,
  logoHeight: 65,
};

export async function createPuzzleGaloreLabel(props = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([288, 432]);

  // Define colors optimized for thermal B&W printing
  const black = CONFIG.black;
  const white = CONFIG.white;
  const darkGray = CONFIG.darkGray;
  const lightGray = CONFIG.lightGray;
  const mediumGray = CONFIG.mediumGray;

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const centerX = width / 2;

  // === PROFESSIONAL HEADER SECTION ===
  // Black header bar
  page.drawRectangle({
    x: 20,
    y: height - 50,
    width: width - 40,
    height: 25,
    color: black,
  });

  // Company name in white on black background
  const companyName = "PUZZLES GALORE";
  const companyNameWidth = helveticaBold.widthOfTextAtSize(companyName, 14);
  page.drawText(companyName, {
    x: centerX - companyNameWidth / 2,
    y: height - 42,
    size: 14,
    font: helveticaBold,
    color: white,
  });

  // === MAIN DISCOUNT SECTION ===
  // Outer decorative border with thick lines
  const mainBoxX = 30;
  const mainBoxY = height - 180;
  const mainBoxWidth = width - 60;
  const mainBoxHeight = 100;

  // Triple border effect for elegance
  page.drawRectangle({
    x: mainBoxX - 3,
    y: mainBoxY - 3,
    width: mainBoxWidth + 6,
    height: mainBoxHeight + 6,
    color: black,
  });

  page.drawRectangle({
    x: mainBoxX - 1,
    y: mainBoxY - 1,
    width: mainBoxWidth + 2,
    height: mainBoxHeight + 2,
    color: white,
  });

  page.drawRectangle({
    x: mainBoxX,
    y: mainBoxY,
    width: mainBoxWidth,
    height: mainBoxHeight,
    color: black,
  });

  page.drawRectangle({
    x: mainBoxX + 2,
    y: mainBoxY + 2,
    width: mainBoxWidth - 4,
    height: mainBoxHeight - 4,
    color: white,
  });

  // Massive "10%" text
  const percentText = "10%";
  const percentWidth = helveticaBold.widthOfTextAtSize(percentText, 72);
  page.drawText(percentText, {
    x: centerX - percentWidth / 2,
    y: mainBoxY + 45,
    size: 72,
    font: helveticaBold,
    color: black,
  });

  // "OFF" text with style
  const mainOffText = "OFF";
  const mainOffWidth = helveticaBold.widthOfTextAtSize(mainOffText, 28);
  page.drawText(mainOffText, {
    x: centerX - mainOffWidth / 2,
    y: mainBoxY + 15,
    size: 28,
    font: helveticaBold,
    color: black,
  });

  // === SUBTITLE SECTION ===
  const subtitleText = "YOUR NEXT ORDER";
  const subtitleWidth = helvetica.widthOfTextAtSize(subtitleText, 12);
  page.drawText(subtitleText, {
    x: centerX - subtitleWidth / 2,
    y: height - 200,
    size: 12,
    font: helvetica,
    color: black,
  });

  // === DISCOUNT CODE SECTION ===
  const codeBoxY = height - 240;
  const codeBoxWidth = 180;
  const codeBoxHeight = 30;

  // Professional code box with shadow effect
  page.drawRectangle({
    x: centerX - codeBoxWidth / 2 + 2,
    y: codeBoxY - 2,
    width: codeBoxWidth,
    height: codeBoxHeight,
    color: mediumGray,
  });

  page.drawRectangle({
    x: centerX - codeBoxWidth / 2,
    y: codeBoxY,
    width: codeBoxWidth,
    height: codeBoxHeight,
    color: lightGray,
  });

  page.drawRectangle({
    x: centerX - codeBoxWidth / 2 + 1,
    y: codeBoxY + 1,
    width: codeBoxWidth - 2,
    height: codeBoxHeight - 2,
    color: black,
  });

  // Discount code text
  const discountCode = props.discountCode || "PUZZLE10";
  const codeWidth = helveticaBold.widthOfTextAtSize(discountCode, 20);
  page.drawText(discountCode, {
    x: centerX - codeWidth / 2,
    y: codeBoxY + 8,
    size: 20,
    font: helveticaBold,
    color: white,
  });

  // === DECORATIVE ELEMENTS ===
  // Decorative corner elements
  const cornerSize = 15;
  const cornerThickness = 3;

  // Top corners
  page.drawLine({
    start: { x: 35, y: height - 25 },
    end: { x: 35 + cornerSize, y: height - 25 },
    thickness: cornerThickness,
    color: black,
  });
  page.drawLine({
    start: { x: 35, y: height - 25 },
    end: { x: 35, y: height - 25 - cornerSize },
    thickness: cornerThickness,
    color: black,
  });

  page.drawLine({
    start: { x: width - 35, y: height - 25 },
    end: { x: width - 35 - cornerSize, y: height - 25 },
    thickness: cornerThickness,
    color: black,
  });
  page.drawLine({
    start: { x: width - 35, y: height - 25 },
    end: { x: width - 35, y: height - 25 - cornerSize },
    thickness: cornerThickness,
    color: black,
  });

  // === VALIDITY INFORMATION ===
  const validityText = "Valid for 30 days from order date";
  const validityWidth = helvetica.widthOfTextAtSize(validityText, 10);
  page.drawText(validityText, {
    x: centerX - validityWidth / 2,
    y: height - 270,
    size: 10,
    font: helvetica,
    color: darkGray,
  });

  // === DECORATIVE SEPARATOR ===
  // Elegant separator line
  page.drawLine({
    start: { x: 50, y: height - 290 },
    end: { x: width - 50, y: height - 290 },
    thickness: 2,
    color: black,
  });

  // Decorative dots
  const dotSize = 4;
  page.drawCircle({
    x: centerX - 30,
    y: height - 290,
    size: dotSize,
    color: black,
  });
  page.drawCircle({
    x: centerX,
    y: height - 290,
    size: dotSize,
    color: black,
  });
  page.drawCircle({
    x: centerX + 30,
    y: height - 290,
    size: dotSize,
    color: black,
  });

  // === FOOTER SECTION ===
  const footerY = height - 330;

  // Feedback message
  const feedbackText = "We'd love your feedback!";
  const feedbackWidth = helveticaBold.widthOfTextAtSize(feedbackText, 12);
  page.drawText(feedbackText, {
    x: centerX - feedbackWidth / 2,
    y: footerY,
    size: 12,
    font: helveticaBold,
    color: black,
  });

  // Website URL with professional styling
  const websiteUrl = "trustpilot.com/review/puzzlesgalore.co.uk";
  const websiteWidth = helvetica.widthOfTextAtSize(websiteUrl, 9);

  // URL background box
  page.drawRectangle({
    x: centerX - websiteWidth / 2 - 5,
    y: footerY - 25,
    width: websiteWidth + 10,
    height: 14,
    color: lightGray,
  });

  page.drawText(websiteUrl, {
    x: centerX - websiteWidth / 2,
    y: footerY - 20,
    size: 9,
    font: helvetica,
    color: black,
  });

  // === BOTTOM BRANDING ===
  const brandingText = "PUZZLES GALORE";
  const brandingWidth = helveticaBold.widthOfTextAtSize(brandingText, 8);
  page.drawText(brandingText, {
    x: centerX - brandingWidth / 2,
    y: 20,
    size: 8,
    font: helveticaBold,
    color: mediumGray,
  });

  return await pdfDoc.save();
}
