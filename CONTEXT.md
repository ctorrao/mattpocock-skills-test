# PDF Splitter

A browser-only webpage that takes one PDF and produces several smaller PDFs, each covering a range of pages the user chooses. Nothing is uploaded: the file is read and split entirely in the user's browser.

## Language

**Source PDF**:
The single PDF the user supplies. It is read but never modified.
_Avoid_: Input file, document, upload

**Page**:
A single page of the Source PDF, identified by its 1-based position.
_Avoid_: Sheet, leaf

**Range**:
A contiguous span of Pages, written as a single page (`4`), two bounds (`1-3`), or an open end meaning "to the last page" (`5-`). Both bounds are inclusive.
_Avoid_: Interval, span, selection

**Range Set**:
The ordered list of Ranges the user asks for. Order is significant, and Ranges may overlap or repeat.
_Avoid_: Selection, page list, split points

**Interpretation**:
The plain-English readback of a Range Set, naming the Part each Range will produce. It is shown before a Split, so the user can check their intent against ours.
_Avoid_: Preview, echo, summary

**Part**:
One output PDF, produced from exactly one Range. A Range Set of _n_ Ranges always yields _n_ Parts.
_Avoid_: Chunk, section, split, output document

**Burst**:
The Range Set in which every Page is its own Range, so each Part holds one Page. Reachable in one click.
_Avoid_: Explode, split all, page mode

**Split**:
The operation that turns a Source PDF and a Range Set into an ordered list of Parts.
_Avoid_: Extract, divide, chop

**Problem**:
A reason a Source PDF or Range Set cannot be Split, stated in the user's terms rather than the machine's. Problems are all-or-nothing: while one stands, no Parts are produced.
_Avoid_: Error, warning, validation message
