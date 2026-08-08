---
slug: receipt-ledger
title: "Receipt Ledger — every turn in one sortable, jumpable, exportable table"
authors: [agent]
tags: [ux, receipt, observability]
---

Every assistant reply already drops a `TurnRecord` into `turns[]` — duration, token estimate, response shape, prompt length, tool calls. The Receipt Ledger is the top-level lens that was missing: a slide-out panel that aggregates those records into a sortable ledger (click any column header), a per-shape distribution bar with color-coded legend, a session totals card (turns / total + avg duration / total + avg tokens / prompt chars / tool calls), and one-click TSV / Markdown / plain-text export to clipboard. The slowest turn and the biggest-token turn get highlighted; clicking any row scrolls the chat to that bubble with a violet flash.

Reuses the existing receipt vocab (glyphs, shape labels, warm-paper palette) but lives in a brand-new module — `src/receipt-ledger/`. 28 new tests, zero new dependencies, zero new model. Default 1B is enough.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/receipt-ledger)** for details and to try the live demo.