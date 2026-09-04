---
sidebar_label: "Hover Lens"
---

# Hover Lens

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/hover-lens/index.html" height="500px" />

## What was built

Hover Lens is a per-block action overlay for assistant messages. Where reply-receipt (the previous cycle's feature) gave you per-MESSAGE provenance — a small POS-style stamp — Hover Lens gives you per-BLOCK interaction: hover any paragraph, heading, or code fence in a reply and a small floating toolbar offers three actions.

- 📋 **Copy** — copies just that block (paragraph, code, list, heading) to the clipboard. The action is scoped to the block you hovered; the rest of the bubble is left alone.
- › **Quote** — inserts the block as a `&gt; ...` blockquote line directly into the chat input. Useful for follow-up questions that reference a specific paragraph of the previous reply.
- 🔁 **Rephrase** — pre-fills the input box with a rephrase-style ask: *"Rephrase this in your own words: &lt;block&gt;"*. One keystroke away from a fresh take on just that section.

The toolbar appears with a small slide-down animation when you hover, and slides away when you leave. A toast confirms the action ("✓ Copied" / "✓ Quoted" / "✓ Rephrase") so you can tell at a glance which verb fired.

Responsive-first: on screens ≤ 600 px wide the floating toolbar collapses into a single `••• actions` pill that opens a bottom-sheet with the same three actions. The collapse is automatic via `window.innerWidth` and re-renders the lens without remounting the chat thread.

## Why this feature

We had two interaction patterns for assistant content in the app up to now — read it, or click the receipt stamp. The middle verbs (copy, quote, rephrase) all required selecting text with the cursor and either `Cmd-C` or manual blockquote formatting. None of that is fun on mobile.

Hover Lens collapses the three common post-read verbs into one discoverable motion. It is intentionally orthogonal to reply-receipt:

| | Reply Receipt (cycle before) | Hover Lens (this cycle) |
|---|---|---|
| Granularity | per-message (bubble corner) | per-block (inline element) |
| Verbs | show stamp, expand card | copy, quote, rephrase |
| Folder on main | `src/reply-receipt/` | `src/hover-lens/` |
| Trigger | always on render | hover or focus |
| Visibility model | passive (always shows a stamp) | active (slides in on hover) |

The split felt natural because provenance (where reply-receipt lives) and quick verbs (where Hover Lens lives) are different concerns at different surfaces.

## Implementation notes

**Architecture.** A new `src/hover-lens/` folder contains five small files:

- `HoverLens.tsx` — the React component (uses `useState` for hover and open state, with a debounced close timeout so the toolbar survives brief mouse excursions between adjacent blocks).
- `MarkdownWithLens.tsx` — wraps the host's chat bubble body. Splits the markdown text into top-level blocks (paragraph / heading / code / list / blockquote / other) and emits one `&lt;HoverLens&gt;` per block.
- `useBlockActions.ts` — the three action callbacks. `copy` uses the modern `navigator.clipboard.writeText` with a `&lt;textarea&gt;` + `execCommand` fallback. `quote` and `rephrase` both call the host's `setDraft` prop, which is wired to the chat input box state (lifted to `WebLLMChat`).
- `segmentBlocks.ts` + `useBlockActions.ts` (text helpers). Lightweight regex-based segmentation (~50 LOC) rather than a full Markdown AST — keeps the bundle small.
- `types.ts` — the shared `BlockDescriptor` / `HoverLensActions` types.

**Wiring.** `src/WebLLMChat.tsx` was modified to:
1. Lift the input state up to `WebLLMChat` (was previously local to `InputArea`). This is needed because `Quote` and `Rephrase` mutate the input from inside the bubble body.
2. Pass `setDraft` down to both `MessageList` and `Bubble`, which forwards it to `&lt;MarkdownWithLens setDraft={...}&gt;`.

Zero changes to `engine.ts`, `useWebLLM.ts`, `store.ts`, `models.ts`, `tools.ts`, `types.ts`, `App.tsx`, or the `reply-receipt/` folder.

**Tests.** 20 new vitest tests in `src/__tests__/hover-lens.test.tsx`. Coverage:

- 9 segmenter tests (paragraph splitting, fence handling, heading/list/blockquote detection, stable id generation).
- 3 action-helper tests (quote prefixing, rephrase prompt shape, long-text truncation).
- 1 unclosed-fence stress test.
- 5 component tests (rendering counts, override actions, hover-to-show toolbar, compact-mode pill, button wiring).
- Pre-existing suite: 4 test files / 66 tests still pass; new file lifts the total to 86/86.

The test environment was changed to `jsdom` for the new file (the existing tests run in `node` because they don't need DOM). One line in `vitest.config.ts` enables both: `include: ["src/__tests__/**/*.test.{ts,tsx}"]`.

**Demoability.** The default model is `Llama-3.2-1B-Instruct-q4f32_1-MLC` — small enough to load in ~30 s in the iframe. The lens is interactive without a model loaded, so the iframe works the moment the page renders.

**Anti-chain.** The previous cycle's feature was reply-receipt. Touch-points with reply-receipt are limited to the `Bubble` component (where both live), and the lens mount code is a self-contained `<MarkdownWithLens>` element that wraps only the bubble body. The receipt code is unchanged.

## Try it

Interact with the embedded demo above, or <a href="/ux/hover-lens/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
