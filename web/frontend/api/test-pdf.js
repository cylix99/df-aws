import { createTestPdf } from "../orders/rmv2";

export default async function handler(req, res) {
  const pdfBytes = await createTestPdf();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=test.pdf");
  res.send(Buffer.from(pdfBytes));
}
