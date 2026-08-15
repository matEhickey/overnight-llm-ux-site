---
sidebar_label: "Shape Memory"
---

# Shape Memory

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/shape-memory/index.html" height="600px" />

## What was built

A **shape-aware chat variant** where each assistant bubble takes a layout tuned to its classified response shape. Six layouts, each responsive-first:

- **`SingleParagraphLayout`** — narrow centered prose (max-width 560px on desktop, full-width on mobile), generous line-height, `text-wrap: pretty`.
- **`ListLayout`** (covers both bulleted and numbered) — vertical step-cards with a hanging indent and a small circle on the left rail (• for bullets, 1/2/3 for numbered). On mobile the rail moves above each item.
- **`CodeWithProseLayout`** — the **responsive centerpiece**. Two-column CSS Grid on desktop (code left, prose right, both at 50%). On tablet: code on top (max-height 380px), prose below. On mobile: full stacked with a `↕ split` divider.
- **`MultiSectionLayout`** — sectioned blocks with anchored headings and a top-border treatment that gives each `## Heading` its own visual weight.
- **`EmptyLayout`** — pulsing dot, used while streaming has produced no classifiable text yet.
- **`SingleParagraphLayout`** is also used for user messages (they always look like paragraphs).

A small **shape badge** above each bubble shows the glyph (`¶`, `•`, `#`, `</>`, `§`, `·`) and label so you always know which layout is active.

**Mid-stream reflow**: every 200ms during streaming, `useResponsiveShape` re-classifies the streamed text. When the shape changes (e.g. the model starts with a paragraph and then emits a bullet list), the bubble fades into the new layout.

**Chat Variant toggle**: in the Configuration panel there's a new `Default | Shape Memory` toggle that switches the whole chat to the shape-aware renderer. The choice persists in `localStorage`. The default variant (`Default`) is unchanged — every existing user sees the same UI they had yesterday.

**Header badge**: when the Shape Memory variant is active, a `shape-memory` chip appears in the header bar next to the model name and the `tools` chip.

## Why this feature

The classifier already exists on `main` (`src/reply-receipt/classifier.ts`) — it powers the Reply Receipt's corner stamp. That output is currently *displayed* but never *acted on*. Every assistant reply is computed into one of six shapes, and then rendered as a single rectangular bubble with `ReactMarkdown`. The shape information is decorative.

Meanwhile, the chat UX has been single-column forever. Long responses get a `maxWidth: 80%` on the bubble, but there's no real responsive behavior. A 1000-word prose reply looks the same on a 360px phone and a 1440px desktop.

Shape Memory is the obvious next move:
- **Reuses** the classifier that already exists on main.
- **Reads** the response shape and *chooses a layout* — not just a glyph.
- **Responds** to viewport size — every layout has mobile/tablet/desktop breakpoints.
- **Lives in its own module** (`src/shape-memory/`), separate from any existing chain (Reply Receipt, Latency Lens, the default chat).

The two axes are:
1. **Shape ↔ Layout** — what kind of response is this? Render it appropriately.
2. **Viewport ↔ Layout** — how much room do we have? Reflow.

Existing chat UXes (Claude, ChatGPT, Gemini, Perplexity) collapse to one bubble shape regardless of content or viewport. Shape Memory is a different choice.

## Implementation notes

- **New** `src/shape-memory/`:
  - `types.ts` — re-exports `ResponseShape` from the existing classifier; defines `ShapeLayoutProps`, `ShapeLayoutKind`, `LAYOUT_FOR_SHAPE`.
  - `ShapeBubble.tsx` — the router. Calls `useResponsiveShape`, picks a layout, plays a fade-in animation on shape change.
  - `ShapeMemoryChat.tsx` — mirrors `WebLLMChat`'s structure (header, progress, tool cards, error banner, message list, input area) but routes assistant bubbles through `ShapeBubble`.
  - `hooks/useResponsiveShape.ts` — re-classifies on a 200ms cadence while streaming, once on commit; tracks `isReflowing` for the fade.
  - `layouts/SingleParagraphLayout.tsx` — narrow centered prose with media queries.
  - `layouts/ListLayout.tsx` — `parseList` parses bullet/numbered lines into items; each item is a card with a rail circle and a hanging indent.
  - `layouts/CodeWithProseLayout.tsx` — splits text into prose/code segments and pairs adjacent (code, prose) pairs into two-column rows on desktop via CSS Grid.
  - `layouts/MultiSectionLayout.tsx` — `ReactMarkdown` with anchored-heading styles.
  - `layouts/EmptyLayout.tsx` — pulsing dot placeholder.
  - `index.ts` — barrel.
- **New** `src/__tests__/shape-memory.test.ts` — 22 tests covering the layout map, classifier integration, router logic, list parser, and code/prose splitter (verified via the classifier).
- **Modified** `src/App.tsx` — additive only: one new `ChatVariant` type, one new `chatVariant` state, a `Default | Shape Memory` toggle in the Configuration panel, conditional rendering of `WebLLMChat` vs `ShapeMemoryChat`, and a `shape-memory` chip in the header when the variant is active.
- **Not modified**: `src/store.ts`, `src/useWebLLM.ts`, `src/engine.ts`, `src/reply-receipt/*`. Shape Memory reuses the classifier from reply-receipt without touching the receipt itself.

## Responsive behavior

| Breakpoint | Paragraph | List | Code+Prose | Sections |
|------------|-----------|------|------------|----------|
| Mobile (`<640px`) | full-width, 14.5px | rail above each item, 14px body | full-width stacked with `↕ split` divider | stacked, 14px, headings 17px+ |
| Tablet (`640-1023px`) | max-width 560, 15.5px | hanging-indent with rail on left | code on top (max-height 380), prose below | max-width 680 with anchored borders |
| Desktop (`≥1024px`) | max-width 640, 15.5px, centered | hanging-indent with rail on left | **two-column Grid 1fr 1fr**, code sticky | max-width 680 with anchored borders |

All breakpoints are implemented via `@media` queries inside each layout's `<style>` tag, so the layouts are self-contained.

## Try it

Interact with the embedded demo above, or <a href="/ux/shape-memory/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

**To see the responsive split in action:**
1. Open the demo (default 1B model loads in ~30s).
2. Send a prompt that produces code with prose around it: *"Write a Python function that flattens a nested list. Explain how it works."*
3. The `CodeWithProseLayout` activates. On desktop you see a true side-by-side; resize the window narrow and watch it collapse to stacked.

**To see shape reflow mid-stream:**
1. Send: *"Give me three short tips for better sleep. First, keep a regular schedule. Second, avoid screens before bed. Third, keep your bedroom cool."*
2. While the model streams, watch the bubble transition from `paragraph` to `bulleted-list` as the bullets accumulate.

**To switch variants:** open the Configuration panel and click `Shape Memory` (or `Default` to go back).
