---
sidebar_label: "Receipt Ledger"
---

# Receipt Ledger

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/receipt-ledger/index.html" height="560px" />

## What was built

A **top-level analytics surface** for the existing `turns[]` telemetry. Until now the per-turn data captured by Reply Receipt lived in the Zustand store, was rendered only as a per-bubble corner stamp + expandable card, and had no aggregated view. The Ledger exposes it as a slide-out panel:

- **Totals card** — turns, total duration, avg duration, total tokens, avg tokens, prompt chars, tool calls
- **Shape distribution** — horizontal stacked bar with color-coded segments + legend (`¶ paragraph · • bullets · # numbered · </> code+prose · § sections · · empty`)
- **Sortable ledger** — click any column header (`#` / `time` / `dur` / `tokens` / `prompt` / `shape` / `tools`) to toggle asc/desc; highlighted rows mark the slowest turn and the biggest-token turn
- **Click-to-jump** — clicking any row scrolls the chat to that bubble and flashes a violet ring for ~1.4s
- **One-click exports** — TSV (paste into Sheets/Excel), Markdown table, plain text. Clipboard write with `navigator.clipboard.writeText` and a graceful `<textarea>.execCommand("copy")` fallback. The button briefly shows a `✓ copied` confirmation.

## Why this feature

The project collects rich per-turn telemetry but exposes it only locally on each bubble. A session-wide lens was the natural next step in the **observability axis** — and it's also genuinely useful: the totals card answers "how long did this session cost me in real time?" at a glance; the shape distribution surfaces "is this conversation mostly code or mostly prose?"; the highlight flags the turn that slowed everything down.

It also **reuses the design language** of Reply Receipt — same warm-paper palette, same shape glyphs, same monospace stack — so the two surfaces feel like siblings without sharing a file.

## Implementation notes

- **New files** in `src/receipt-ledger/`:
  - `index.ts` — barrel
  - `types.ts` — `SortKey`, `SortDir`, `ShapeCounts`
  - `styles.ts` — palette + `ledgerStyles` + keyframe injector
  - `sort.ts` — pure `sortTurns`, `computeShapeCounts`, `computeTotals`, `highlightIndices`
  - `exporters.ts` — `toTsv`, `toMarkdown`, `toPlain`, `toRows`
  - `ShapeBar.tsx` — inline distribution bar
  - `TotalsCard.tsx` — session aggregates grid
  - `LedgerRow.tsx` — sortable row + on-mount pulse animation when highlighted
  - `ReceiptLedger.tsx` — slide-out panel, empty state, toolbar, table
- **Touched files**:
  - `src/App.tsx` — adds `📊 Ledger` button (purple outline, header right side) + `<ReceiptLedger open={…} onClose={…} />` overlay
  - `src/WebLLMChat.tsx` — adds `data-message-id={messageId}` to assistant bubble root so click-to-jump can find the target
  - `src/index.ts` — re-exports `ReceiptLedger`, `toTsv`, `toMarkdown`, `toPlain`
- **No new dependencies.**
- **Sort is stable** — the implementation tracks the original index and uses it as a tiebreaker, so equal-key rows preserve source order.
- **Sort by `shape`** uses the canonical shape order (paragraph → bullets → numbered → code+prose → sections → empty), not alphabetical.

## Tests

28 unit tests in `src/__tests__/receipt-ledger.test.ts` covering:

- `sortTurns` — every key asc + desc, stability on ties, empty array, immutability
- `computeShapeCounts` — zero counts on empty, correct counts on a sample, share sums to 1
- `computeTotals` — sums, slowest detection, biggest detection, averages, highlight merging
- `highlightIndices` — single entry when slowest === biggest
- `toTsv` / `toMarkdown` / `toPlain` / `toRows` — header shape, column count, 1-indexed rows, friendly shape labels, tool-call annotation

## Try it

Interact with the embedded demo above, or <a href="/ux/receipt-ledger/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. The panel opens with an empty state; send a message and watch a row appear. Open the panel again to see sortable columns, totals update live, and the slowest turn highlight (warm yellow) flash for ~1.2s. Click any row to jump to that turn in the chat.