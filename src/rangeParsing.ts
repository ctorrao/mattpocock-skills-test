export type Range = { start: number; end: number };

export type ParseRangeSetResult =
  | { ok: true; ranges: Range[] }
  | { ok: false; problems: string[] };

// Matches N, A-B, or A- once whitespace has been stripped from the whole input.
const RANGE_ITEM_PATTERN = /^(\d+)(?:-(\d+)?)?$/;

/** Parses a raw Range Set against a Page count. All-or-nothing: any problem means no Ranges are returned. */
export function parseRangeSet(
  input: string,
  pageCount: number,
): ParseRangeSetResult {
  const stripped = input.replace(/\s+/g, "");

  if (stripped === "") {
    return { ok: false, problems: ["Enter at least one Range."] };
  }

  const problems: string[] = [];
  const ranges: Range[] = [];

  for (const item of stripped.split(",")) {
    const match = RANGE_ITEM_PATTERN.exec(item);
    if (!match) {
      problems.push(
        `"${item}" is not a valid Range. Use a Page (4), a Range (1-3), or an open Range (5-).`,
      );
      continue;
    }

    const isOpenOrBounded = item.includes("-");
    const start = Number(match[1]);
    const end = isOpenOrBounded
      ? match[2] !== undefined
        ? Number(match[2])
        : pageCount
      : start;

    if (isOpenOrBounded && match[2] !== undefined && start > end) {
      problems.push(
        `"${item}" is a reversed Range: page ${start} comes after page ${end}.`,
      );
      continue;
    }

    if (start < 1 || start > pageCount) {
      problems.push(
        `"${item}" starts at page ${start}, which is outside 1-${pageCount}.`,
      );
      continue;
    }

    if (end < 1 || end > pageCount) {
      problems.push(
        `"${item}" ends at page ${end}, which is outside 1-${pageCount}.`,
      );
      continue;
    }

    ranges.push({ start, end });
  }

  if (problems.length > 0) {
    return { ok: false, problems };
  }

  return { ok: true, ranges };
}

/** Echoes a resolved Range Set as one description per Part, in Range order. */
export function describeRangeSet(ranges: Range[]): string[] {
  return ranges.map((range, index) => {
    const partNumber = index + 1;
    if (range.start === range.end) {
      return `Part ${partNumber}: page ${range.start} (1 page)`;
    }
    const pageCount = range.end - range.start + 1;
    return `Part ${partNumber}: pages ${range.start}–${range.end} (${pageCount} pages)`;
  });
}
