import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { loadSourcePdf, splitPdf } from "./splitting";

async function makeValidPdfBytes(pageCount: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage();
  }
  return pdfDoc.save();
}

// Each Page gets a unique width so it can be told apart after copying, without needing text extraction.
async function makeMarkedPdfBytes(pageCount: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    pdfDoc.addPage([100 + i, 200]);
  }
  return pdfDoc.save();
}

async function pageWidths(bytes: Uint8Array): Promise<number[]> {
  const pdfDoc = await PDFDocument.load(bytes);
  return pdfDoc.getPages().map((page) => page.getWidth());
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

describe("splitPdf", () => {
  it("produces one Part per Range, each with the Range's Page count", async () => {
    const bytes = await makeMarkedPdfBytes(5);

    const result = await splitPdf(bytes, [
      { start: 1, end: 3 },
      { start: 4, end: 4 },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parts).toHaveLength(2);
      expect(await pageWidths(result.parts[0])).toHaveLength(3);
      expect(await pageWidths(result.parts[1])).toHaveLength(1);
    }
  });

  it("puts the correct Pages, in Range order, into each Part", async () => {
    const bytes = await makeMarkedPdfBytes(5);

    const result = await splitPdf(bytes, [{ start: 2, end: 4 }]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await pageWidths(result.parts[0])).toEqual([101, 102, 103]);
    }
  });

  it("produces Parts in the order the Ranges were given", async () => {
    const bytes = await makeMarkedPdfBytes(5);

    const result = await splitPdf(bytes, [
      { start: 5, end: 5 },
      { start: 1, end: 1 },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await pageWidths(result.parts[0])).toEqual([104]);
      expect(await pageWidths(result.parts[1])).toEqual([100]);
    }
  });

  it("duplicates Pages shared by overlapping Ranges across their Parts", async () => {
    const bytes = await makeMarkedPdfBytes(5);

    const result = await splitPdf(bytes, [
      { start: 1, end: 3 },
      { start: 2, end: 4 },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await pageWidths(result.parts[0])).toEqual([100, 101, 102]);
      expect(await pageWidths(result.parts[1])).toEqual([101, 102, 103]);
    }
  });

  it("leaves the Source PDF unmodified", async () => {
    const bytes = await makeMarkedPdfBytes(5);
    const widthsBefore = await pageWidths(bytes);

    await splitPdf(bytes, [{ start: 1, end: 3 }]);

    expect(await pageWidths(bytes)).toEqual(widthsBefore);
  });

  it("rejects bytes that are not a PDF", async () => {
    const bytes = new TextEncoder().encode("just some plain text, not a PDF");

    const result = await splitPdf(bytes, [{ start: 1, end: 1 }]);

    expect(result).toEqual({
      ok: false,
      problems: ["This file could not be read as a PDF."],
    });
  });

  it("rejects a password-protected Source PDF, naming the password as the reason", async () => {
    const bytes = await makeEncryptedPdfBytes();

    const result = await splitPdf(bytes, [{ start: 1, end: 1 }]);

    expect(result).toEqual({
      ok: false,
      problems: [
        "This Source PDF is password-protected. Remove the password and try again.",
      ],
    });
  });
});

