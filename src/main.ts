import { loadSourcePdf, splitPdf } from "./splitting";
import { describeRangeSet, parseRangeSet, type Range } from "./rangeParsing";
import { namePart } from "./naming";

const fileInput = document.getElementById(
  "source-pdf-input",
) as HTMLInputElement;
const sourcePdfSummary = document.getElementById(
  "source-pdf-summary",
) as HTMLElement;
const rangeSetInput = document.getElementById(
  "range-set-input",
) as HTMLInputElement;
const rangeSetInterpretation = document.getElementById(
  "range-set-interpretation",
) as HTMLElement;
const problemSummary = document.getElementById(
  "problem-summary",
) as HTMLElement;
const burstButton = document.getElementById(
  "burst-button",
) as HTMLButtonElement;
const splitButton = document.getElementById(
  "split-button",
) as HTMLButtonElement;
const resultList = document.getElementById("result-list") as HTMLElement;

// The Source PDF's Page count and bytes, known only once a Source PDF has loaded successfully.
let sourcePageCount: number | undefined;
let sourceBytes: Uint8Array | undefined;
let sourceFilename: string | undefined;

// Blob URLs held for the life of the page, one per Part currently on display.
let partUrls: string[] = [];

function showSourcePdfSummary(filename: string, pageCount: number): void {
  sourcePdfSummary.textContent = `${filename} — ${pageCount} Page${pageCount === 1 ? "" : "s"}`;
}

function showProblems(problems: string[]): void {
  problemSummary.replaceChildren();
  const list = document.createElement("ul");
  for (const problem of problems) {
    const item = document.createElement("li");
    item.textContent = problem;
    list.appendChild(item);
  }
  problemSummary.appendChild(list);
}

function showRangeSetInterpretation(descriptions: string[]): void {
  rangeSetInterpretation.replaceChildren();
  const list = document.createElement("ul");
  for (const description of descriptions) {
    const item = document.createElement("li");
    item.textContent = description;
    list.appendChild(item);
  }
  rangeSetInterpretation.appendChild(list);
}

function formatSize(byteLength: number): string {
  if (byteLength < 1024) {
    return `${byteLength} B`;
  }
  const kilobytes = byteLength / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }
  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function describeRangeSpan(range: Range): string {
  return range.start === range.end
    ? `page ${range.start}`
    : `pages ${range.start}–${range.end}`;
}

function clearResults(): void {
  for (const url of partUrls) {
    URL.revokeObjectURL(url);
  }
  partUrls = [];
  resultList.replaceChildren();
}

function showResults(
  ranges: Range[],
  parts: Uint8Array[],
  filename: string,
): void {
  clearResults();

  ranges.forEach((range, index) => {
    const partBytes = parts[index];
    const arrayBuffer = new ArrayBuffer(partBytes.byteLength);
    new Uint8Array(arrayBuffer).set(partBytes);
    const url = URL.createObjectURL(
      new Blob([arrayBuffer], { type: "application/pdf" }),
    );
    partUrls.push(url);

    const link = document.createElement("a");
    link.href = url;
    link.download = namePart(filename, range);
    link.textContent = `${link.download} — ${describeRangeSpan(range)}, ${formatSize(partBytes.byteLength)}`;

    const item = document.createElement("li");
    item.appendChild(link);
    resultList.appendChild(item);
  });
}

function resetRangeSet(): void {
  rangeSetInput.value = "";
  rangeSetInput.disabled = true;
  rangeSetInterpretation.replaceChildren();
  burstButton.disabled = true;
  splitButton.disabled = true;
}

function updateRangeSetInterpretation(): void {
  rangeSetInterpretation.replaceChildren();
  problemSummary.replaceChildren();

  if (sourcePageCount === undefined) {
    return;
  }

  const result = parseRangeSet(rangeSetInput.value, sourcePageCount);
  if (result.ok) {
    showRangeSetInterpretation(describeRangeSet(result.ranges));
  } else {
    showProblems(result.problems);
  }
}

fileInput.addEventListener("change", () => {
  sourcePdfSummary.textContent = "";
  problemSummary.replaceChildren();
  sourcePageCount = undefined;
  sourceBytes = undefined;
  sourceFilename = undefined;
  resetRangeSet();
  clearResults();

  const file = fileInput.files?.[0];
  if (!file) {
    return;
  }

  file
    .arrayBuffer()
    .then((buffer) => {
      const bytes = new Uint8Array(buffer);
      return loadSourcePdf(bytes).then((result) => ({ result, bytes }));
    })
    .then(({ result, bytes }) => {
      if (result.ok) {
        showSourcePdfSummary(file.name, result.pageCount);
        sourcePageCount = result.pageCount;
        sourceBytes = bytes;
        sourceFilename = file.name;
        rangeSetInput.disabled = false;
        burstButton.disabled = false;
        splitButton.disabled = false;
      } else {
        showProblems(result.problems);
      }
    });
});

rangeSetInput.addEventListener("input", updateRangeSetInterpretation);

burstButton.addEventListener("click", () => {
  if (sourcePageCount === undefined) {
    return;
  }

  const pages: string[] = [];
  for (let page = 1; page <= sourcePageCount; page++) {
    pages.push(String(page));
  }
  rangeSetInput.value = pages.join(",");
  updateRangeSetInterpretation();
});

splitButton.addEventListener("click", () => {
  if (
    sourcePageCount === undefined ||
    sourceBytes === undefined ||
    sourceFilename === undefined
  ) {
    return;
  }
  const filename = sourceFilename;
  const bytes = sourceBytes;

  const result = parseRangeSet(rangeSetInput.value, sourcePageCount);
  if (!result.ok) {
    showProblems(result.problems);
    clearResults();
    return;
  }
  problemSummary.replaceChildren();

  splitPdf(bytes, result.ranges).then((splitResult) => {
    if (splitResult.ok) {
      showResults(result.ranges, splitResult.parts, filename);
    } else {
      showProblems(splitResult.problems);
      clearResults();
    }
  });
});

