import { PDFDocument } from "pdf-lib";

export type LoadSourcePdfResult =
  | { ok: true; pageCount: number }
  | { ok: false; problems: string[] };

/** Loads and validates a Source PDF by attempting to parse it; never trusts file extension or MIME type. */
export async function loadSourcePdf(
  bytes: Uint8Array,
): Promise<LoadSourcePdfResult> {
  try {
    const pdfDoc = await PDFDocument.load(bytes);
    return { ok: true, pageCount: pdfDoc.getPageCount() };
  } catch (error) {
    // pdf-lib ships separate bundles for its `EncryptedPDFError` class depending on
    // resolution path, so `instanceof` can't reliably tell it apart; its message is stable.
    if (error instanceof Error && /is encrypted/i.test(error.message)) {
      return {
        ok: false,
        problems: [
          "This Source PDF is password-protected. Remove the password and try again.",
        ],
      };
    }
    return {
      ok: false,
      problems: ["This file could not be read as a PDF."],
    };
  }
}
