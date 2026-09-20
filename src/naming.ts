import type { Range } from "./rangeParsing";

// Path separators and C0 control characters, which user-supplied filenames may carry.
const UNSAFE_STEM_CHARACTERS = /[/\\\x00-\x1f]/g;

function sourceStem(sourceFilename: string): string {
  const lastDot = sourceFilename.lastIndexOf(".");
  const withoutExtension =
    lastDot > 0 ? sourceFilename.slice(0, lastDot) : sourceFilename;
  return withoutExtension.replace(UNSAFE_STEM_CHARACTERS, "_");
}

/** Names a Part from the Source PDF's filename and the Range it covers. */
export function namePart(sourceFilename: string, range: Range): string {
  const stem = sourceStem(sourceFilename);
  const pageSuffix =
    range.start === range.end
      ? `p${range.start}`
      : `p${range.start}-${range.end}`;
  return `${stem}-${pageSuffix}.pdf`;
}
