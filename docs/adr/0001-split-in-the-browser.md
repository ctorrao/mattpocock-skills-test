# Split PDFs in the browser, not on a server

Splitting runs entirely client-side with `pdf-lib`; the Source PDF is never uploaded. This keeps the app a static site with no hosting cost and no custody of users' documents, at the price of being bounded by browser memory and unable to offer shareable result links.

Adding a backend later means owning uploads, temp storage, retention and abuse handling — treat that as a new decision, not an extension of this one.
