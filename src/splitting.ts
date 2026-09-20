import { PDFDocument } from "pdf-lib";
import type { Range } from "./rangeParsing";

export type LoadSourcePdfResult =
  | { ok: true; pageCount: number }
  | { ok: false; problems: string[] };

export type SplitPdfResult =
  | { ok: true; parts: Uint8Array[] }
  | { ok: false; problems: string[] };

type OpenSourcePdfResult =
  | { ok: true; doc: PDFDocument }
  | { ok: false; problems: string[] };

/** Opens a Source PDF by attempting to parse it; never trusts file extension or MIME type. */
async function openSourcePdf(bytes: Uint8Array): Promise<OpenSourcePdfResult> {
  try {
    const doc = await PDFDocument.load(bytes);
    return { ok: true, doc };
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

/** Loads and validates a Source PDF, reporting only its Page count. */
export async function loadSourcePdf(
  bytes: Uint8Array,
): Promise<LoadSourcePdfResult> {
  const result = await openSourcePdf(bytes);
  if (!result.ok) {
    return result;
  }
  return { ok: true, pageCount: result.doc.getPageCount() };
}

/** Splits a Source PDF into Parts, one per Range, each a faithful copy of its Pages in Range order. */
export async function splitPdf(
  bytes: Uint8Array,
  ranges: Range[],
): Promise<SplitPdfResult> {
  const opened = await openSourcePdf(bytes);
  if (!opened.ok) {
    return opened;
  }

  const parts: Uint8Array[] = [];
  for (const range of ranges) {
    const partDoc = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let page = range.start; page <= range.end; page++) {
      pageIndices.push(page - 1);
    }
    const copiedPages = await partDoc.copyPages(opened.doc, pageIndices);
    for (const page of copiedPages) {
      partDoc.addPage(page);
    }
    parts.push(await partDoc.save());
  }

  return { ok: true, parts };
}
