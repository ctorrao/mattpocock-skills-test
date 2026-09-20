import { loadSourcePdf } from "./splitting";
import { describeRangeSet, parseRangeSet } from "./rangeParsing";

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

// The Source PDF's Page count, known only once a Source PDF has loaded successfully.
let sourcePageCount: number | undefined;

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

function resetRangeSet(): void {
  rangeSetInput.value = "";
  rangeSetInput.disabled = true;
  rangeSetInterpretation.replaceChildren();
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
  resetRangeSet();

  const file = fileInput.files?.[0];
  if (!file) {
    return;
  }

  file
    .arrayBuffer()
    .then((buffer) => loadSourcePdf(new Uint8Array(buffer)))
    .then((result) => {
      if (result.ok) {
        showSourcePdfSummary(file.name, result.pageCount);
        sourcePageCount = result.pageCount;
        rangeSetInput.disabled = false;
      } else {
        showProblems(result.problems);
      }
    });
});

rangeSetInput.addEventListener("input", updateRangeSetInterpretation);
