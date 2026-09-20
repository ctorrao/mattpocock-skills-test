import { describe, expect, it } from "vitest";
import { describeRangeSet, parseRangeSet } from "./rangeParsing";

describe("parseRangeSet", () => {
  it("parses a single Page as a one-Page Range", () => {
    const result = parseRangeSet("4", 10);

    expect(result).toEqual({ ok: true, ranges: [{ start: 4, end: 4 }] });
  });

  it("parses a two-bound Range as inclusive at both ends", () => {
    const result = parseRangeSet("1-3", 10);

    expect(result).toEqual({ ok: true, ranges: [{ start: 1, end: 3 }] });
  });

  it("resolves an open-ended Range against the Source PDF's Page count", () => {
    const result = parseRangeSet("7-", 10);

    expect(result).toEqual({ ok: true, ranges: [{ start: 7, end: 10 }] });
  });

  it("keeps Ranges in the order typed, never sorted", () => {
    const result = parseRangeSet("5,1", 10);

    expect(result).toEqual({
      ok: true,
      ranges: [
        { start: 5, end: 5 },
        { start: 1, end: 1 },
      ],
    });
  });

  it("ignores whitespace anywhere in the input", () => {
    const result = parseRangeSet(" 1 - 3 ,  4 ", 10);

    expect(result).toEqual({
      ok: true,
      ranges: [
        { start: 1, end: 3 },
        { start: 4, end: 4 },
      ],
    });
  });

  it("accepts overlapping Ranges", () => {
    const result = parseRangeSet("1-3,2-5", 10);

    expect(result).toEqual({
      ok: true,
      ranges: [
        { start: 1, end: 3 },
        { start: 2, end: 5 },
      ],
    });
  });

  it("accepts duplicate Ranges", () => {
    const result = parseRangeSet("1-3,1-3", 10);

    expect(result).toEqual({
      ok: true,
      ranges: [
        { start: 1, end: 3 },
        { start: 1, end: 3 },
      ],
    });
  });

  it("rejects a reversed Range, quoting the offending text", () => {
    const result = parseRangeSet("5-1", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual([
        expect.stringContaining("5-1"),
      ]);
    }
  });

  it("rejects a Page below 1, never clamping it", () => {
    const result = parseRangeSet("0", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual([expect.stringContaining("0")]);
    }
  });

  it("rejects a Page above the Source PDF's Page count, never clamping it", () => {
    const result = parseRangeSet("11", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual([expect.stringContaining("11")]);
    }
  });

  it("rejects an open-ended Range whose start is above the Page count", () => {
    const result = parseRangeSet("11-", 10);

    expect(result.ok).toBe(false);
  });

  it("rejects an empty Range Set", () => {
    const result = parseRangeSet("", 10);

    expect(result).toEqual({
      ok: false,
      problems: [expect.stringContaining("at least one Range")],
    });
  });

  it("rejects an empty Range Set made only of whitespace", () => {
    const result = parseRangeSet("   ", 10);

    expect(result.ok).toBe(false);
  });

  it("rejects input that doesn't match the grammar, quoting the offending text", () => {
    const result = parseRangeSet("abc", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toEqual([expect.stringContaining('"abc"')]);
    }
  });

  it("reports every distinct problem in a Range Set together, not just the first", () => {
    const result = parseRangeSet("0,abc,5-1", 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toHaveLength(3);
      expect(result.problems[0]).toContain("0");
      expect(result.problems[1]).toContain("abc");
      expect(result.problems[2]).toContain("5-1");
    }
  });

  it("shows no interpretation at all when any problem exists (all-or-nothing)", () => {
    const result = parseRangeSet("1-3,abc", 10);

    expect(result).toEqual({
      ok: false,
      problems: [expect.stringContaining('"abc"')],
    });
  });
});

describe("describeRangeSet", () => {
  it("describes a multi-Page Range with its Page span and count", () => {
    const descriptions = describeRangeSet([{ start: 1, end: 3 }]);

    expect(descriptions).toEqual(["Part 1: pages 1–3 (3 pages)"]);
  });

  it("describes a single-Page Range as one page, not a span", () => {
    const descriptions = describeRangeSet([{ start: 4, end: 4 }]);

    expect(descriptions).toEqual(["Part 1: page 4 (1 page)"]);
  });

  it("numbers Parts in Range order", () => {
    const descriptions = describeRangeSet([
      { start: 5, end: 5 },
      { start: 1, end: 3 },
    ]);

    expect(descriptions).toEqual([
      "Part 1: page 5 (1 page)",
      "Part 2: pages 1–3 (3 pages)",
    ]);
  });
});
