import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { loadSourcePdf } from "./splitting";

async function makeValidPdfBytes(pageCount: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  return pdfDoc.save();
}

async function makeEncryptedPdfBytes(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage();
  // Marks the trailer as encrypted, the same signal a real password-protected PDF carries.
  const encryptDict = pdfDoc.context.obj({ Filter: "Standard" });
  pdfDoc.context.trailerInfo.Encrypt = pdfDoc.context.register(encryptDict);
  return pdfDoc.save();
}

describe("loadSourcePdf", () => {
  it("reports the Page count of a valid Source PDF", async () => {
    const bytes = await makeValidPdfBytes(3);

    const result = await loadSourcePdf(bytes);

    expect(result).toEqual({ ok: true, pageCount: 3 });
  });

  it("rejects bytes that are not a PDF, regardless of extension or MIME type claims", async () => {
    const bytes = new TextEncoder().encode("just some plain text, not a PDF");

    const result = await loadSourcePdf(bytes);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual(["This file could not be read as a PDF."]);
    }
  });

  it("rejects a password-protected Source PDF, naming the password as the reason", async () => {
    const bytes = await makeEncryptedPdfBytes();

    const result = await loadSourcePdf(bytes);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual([
        "This Source PDF is password-protected. Remove the password and try again.",
      ]);
    }
  });
});
