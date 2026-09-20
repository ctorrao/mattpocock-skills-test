import { describe, expect, it } from "vitest";
import { namePart } from "./naming";

describe("namePart", () => {
  it("names a single-Page Range with the collapsed p<n> form", () => {
    const name = namePart("contract.pdf", { start: 4, end: 4 });

    expect(name).toBe("contract-p4.pdf");
  });

  it("names a multi-Page Range with its start and end", () => {
    const name = namePart("contract.pdf", { start: 1, end: 3 });

    expect(name).toBe("contract-p1-3.pdf");
  });

  it("uses the whole filename as the stem when there is no extension", () => {
    const name = namePart("contract", { start: 4, end: 4 });

    expect(name).toBe("contract-p4.pdf");
  });

  it("strips only the last extension from a filename containing dots", () => {
    const name = namePart("contract.v2.pdf", { start: 1, end: 3 });

    expect(name).toBe("contract.v2-p1-3.pdf");
  });

  it("replaces path separators and control characters in the stem", () => {
    const name = namePart("../weird\\name\x01.pdf", { start: 1, end: 1 });

    expect(name).toBe(".._weird_name_-p1.pdf");
  });
});
