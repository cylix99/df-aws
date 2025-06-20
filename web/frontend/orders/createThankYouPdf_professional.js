import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

async function getImageBytes(url) {
  const response = await fetch(url);
  return new Uint8Array(await response.arrayBuffer());
}

export async function createPuzzleGaloreLabel(props = {}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([288, 432]);

  // Define sophisticated color palette
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const mediumGray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const accentGray = rgb(0.15, 0.15, 0.15);

  // Load and embed logo
  const logoBytes = await getImageBytes(
    "https://cdn.shopify.com/s/files/1/0622/5756/1826/files/logo_grey.jpg?v=1689252458&width=200"
  );
  const logoImage = await pdfDoc.embedJpg(logoBytes);

  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const centerX = width / 2;

  // === SOPHISTICATED HEADER WITH LOGO ===
  // Clean, minimal header background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: white,
  });

  // Subtle top accent line
  page.drawLine({
    start: { x: 0, y: height - 1 },
    end: { x: width, y: height - 1 },
    thickness: 3,
    color: accentGray,
  });

  // Logo with optimal sizing
  const logoWidth = 140;
  const logoHeight = 45;

  page.drawImage(logoImage, {
    x: centerX - logoWidth / 2,
    y: height - 70,
    width: logoWidth,
    height: logoHeight,
  });

  // Elegant underline beneath logo
  page.drawLine({
    start: { x: centerX - 50, y: height - 85 },
    end: { x: centerX + 50, y: height - 85 },
    thickness: 1,
    color: mediumGray,
  });

  // === PREMIUM DISCOUNT SECTION ===
  const discountBoxY = height - 220;
  const discountBoxWidth = 220;
  const discountBoxHeight = 110;

  // Outer shadow effect (multiple rectangles for depth)
  page.drawRectangle({
    x: centerX - discountBoxWidth / 2 + 3,
    y: discountBoxY - 3,
    width: discountBoxWidth,
    height: discountBoxHeight,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Main discount box with clean lines
  page.drawRectangle({
    x: centerX - discountBoxWidth / 2,
    y: discountBoxY,
    width: discountBoxWidth,
    height: discountBoxHeight,
    color: white,
  });

  // Premium border with rounded corner effect (simulated)
  page.drawRectangle({
    x: centerX - discountBoxWidth / 2 + 1,
    y: discountBoxY + 1,
    width: discountBoxWidth - 2,
    height: discountBoxHeight - 2,
    color: black,
  });

  page.drawRectangle({
    x: centerX - discountBoxWidth / 2 + 3,
    y: discountBoxY + 3,
    width: discountBoxWidth - 6,
    height: discountBoxHeight - 6,
    color: white,
  });

  // Massive, perfectly positioned "10%"
  const percentText = "10%";
  const percentSize = 68;
  const percentWidth = helveticaBold.widthOfTextAtSize(
    percentText,
    percentSize
  );
  page.drawText(percentText, {
    x: centerX - percentWidth / 2,
    y: discountBoxY + 50,
    size: percentSize,
    font: helveticaBold,
    color: black,
  });

  // Refined "OFF" text
  const offText = "OFF";
  const offSize = 24;
  const offWidth = helveticaBold.widthOfTextAtSize(offText, offSize);
  page.drawText(offText, {
    x: centerX - offWidth / 2,
    y: discountBoxY + 20,
    size: offSize,
    font: helveticaBold,
    color: black,
  });

  // === ELEGANT SUBTITLE ===
  const subtitleText = "YOUR NEXT ORDER";
  const subtitleSize = 11;
  const subtitleWidth = helvetica.widthOfTextAtSize(subtitleText, subtitleSize);
  page.drawText(subtitleText, {
    x: centerX - subtitleWidth / 2,
    y: height - 240,
    size: subtitleSize,
    font: helvetica,
    color: darkGray,
  });

  // === PREMIUM CODE SECTION ===
  const codeBoxY = height - 280;
  const codeBoxWidth = 160;
  const codeBoxHeight = 32;

  // Code box with professional styling
  page.drawRectangle({
    x: centerX - codeBoxWidth / 2,
    y: codeBoxY,
    width: codeBoxWidth,
    height: codeBoxHeight,
    color: accentGray,
  });

  // Inner code area
  page.drawRectangle({
    x: centerX - codeBoxWidth / 2 + 2,
    y: codeBoxY + 2,
    width: codeBoxWidth - 4,
    height: codeBoxHeight - 4,
    color: white,
  });

  // Discount code with perfect typography
  const discountCode = props.discountCode || "PUZZLE10";
  const codeSize = 16;
  const codeWidth = helveticaBold.widthOfTextAtSize(discountCode, codeSize);
  page.drawText(discountCode, {
    x: centerX - codeWidth / 2,
    y: codeBoxY + 10,
    size: codeSize,
    font: helveticaBold,
    color: black,
  });

  // === REFINED VALIDITY INFO ===
  const validityText = "Valid for 30 days from order date";
  const validitySize = 9;
  const validityWidth = helvetica.widthOfTextAtSize(validityText, validitySize);
  page.drawText(validityText, {
    x: centerX - validityWidth / 2,
    y: height - 300,
    size: validitySize,
    font: helvetica,
    color: mediumGray,
  });

  // === SOPHISTICATED SEPARATOR ===
  // Clean horizontal line
  page.drawLine({
    start: { x: 40, y: height - 320 },
    end: { x: width - 40, y: height - 320 },
    thickness: 1,
    color: lightGray,
  });

  // === COMPELLING FEEDBACK SECTION ===
  const feedbackY = height - 350;

  // Attention-grabbing headline
  const headlineText = "Quick favor? 30 seconds = Huge help!";
  const headlineSize = 12;
  const headlineWidth = helveticaBold.widthOfTextAtSize(
    headlineText,
    headlineSize
  );
  page.drawText(headlineText, {
    x: centerX - headlineWidth / 2,
    y: feedbackY,
    size: headlineSize,
    font: helveticaBold,
    color: black,
  });

  // Compelling call-to-action
  const ctaText = ">>> Leave a 5-star review <<<";
  const ctaSize = 11;
  const ctaWidth = helveticaBold.widthOfTextAtSize(ctaText, ctaSize);
  page.drawText(ctaText, {
    x: centerX - ctaWidth / 2,
    y: feedbackY - 18,
    size: ctaSize,
    font: helveticaBold,
    color: accentGray,
  });

  // Professional URL presentation
  const websiteUrl = "trustpilot.com/review/puzzlesgalore.co.uk";
  const urlSize = 9;
  const urlWidth = helvetica.widthOfTextAtSize(websiteUrl, urlSize);

  // Clean URL box
  page.drawRectangle({
    x: centerX - urlWidth / 2 - 8,
    y: feedbackY - 45,
    width: urlWidth + 16,
    height: 16,
    color: lightGray,
  });

  page.drawText(websiteUrl, {
    x: centerX - urlWidth / 2,
    y: feedbackY - 38,
    size: urlSize,
    font: helvetica,
    color: black,
  });

  // Motivational benefit text
  const benefitText = "Your review helps fellow puzzlers choose wisely!";
  const benefitSize = 8;
  const benefitWidth = helvetica.widthOfTextAtSize(benefitText, benefitSize);
  page.drawText(benefitText, {
    x: centerX - benefitWidth / 2,
    y: feedbackY - 60,
    size: benefitSize,
    font: helvetica,
    color: mediumGray,
  });

  // === SUBTLE FOOTER BRANDING ===
  const footerBrandText = "PUZZLES GALORE";
  const footerBrandSize = 7;
  const footerBrandWidth = helvetica.widthOfTextAtSize(
    footerBrandText,
    footerBrandSize
  );
  page.drawText(footerBrandText, {
    x: centerX - footerBrandWidth / 2,
    y: 15,
    size: footerBrandSize,
    font: helvetica,
    color: lightGray,
  });

  return await pdfDoc.save();
}
