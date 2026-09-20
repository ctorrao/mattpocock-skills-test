# A dark-only interface

The page ships a single dark palette and deliberately does not respond to `prefers-color-scheme`. Committing to one scheme lets contrast and card elevation be tuned against known surface colours — on dark, depth comes from lighter fills and hairline borders rather than shadows, and that treatment cannot be shared with a light palette.

The cost is real: users who need a light UI get none, and adding one later is not a stylesheet tweak but a re-tokenising of every colour in `src/style.css` against two schemes. Treat light mode as a new decision, not a follow-up.
