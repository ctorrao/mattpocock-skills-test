import { loadSourcePdf } from "./splitting";

const fileInput = document.getElementById(
  "source-pdf-input",
) as HTMLInputElement;
const sourcePdfSummary = document.getElementById(
  "source-pdf-summary",
) as HTMLElement;
const problemSummary = document.getElementById(
  "problem-summary",
) as HTMLElement;

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

fileInput.addEventListener("change", () => {
  sourcePdfSummary.textContent = "";
  problemSummary.replaceChildren();

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
      } else {
        showProblems(result.problems);
      }
    });
});
