---
sidebar_label: "Source Anchors"
---

# Source Anchors

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/source-anchors/index.html" height="500px" />

## What was built

Source Anchors is a per-bubble inline-citation strip that runs a five-pass
heuristic detector over every committed assistant message. The detector finds:

- **Bare URLs** (`https://...`) — host extracted as the chip label
- **Markdown links** (`[text](url)`) — link text becomes the chip label
- **Footnote markers** (`[1]` .. `[99]`) — small numeric chips
- **Attribution patterns** ("according to X", "per X", "cited by X", "from the X")
- **Year-context anchors** ("in 2024", "since 2019", "by 2020", "from 2021")

When any anchor is found, a small horizontal chip strip renders just below
the bubble header — above the markdown body. Each chip shows a glyph (🔗 / ¹ /
❝ / 📅) and the detected label.

**Click a chip** → the bubble body scrolls into view (if needed) and flashes
an amber outline + light amber background tint for 1.4 s. The flash is
implemented by adding a `source-anchor-flashing` class to the bubble's
content region; the class auto-removes after 1.4 s. The chip's label tells
the user WHICH source they clicked (e.g. `github.com`, `[3]`, `according to
the Annual Report`, `in 2024`); the bubble-flash tells them WHICH bubble
the source lives in.

**Responsive-first.** On viewports ≤ 600 px the chip row collapses to a
single `📌 N sources` pill. Clicking the pill opens a bottom sheet
listing every detected anchor with its glyph, kind tag, and full label.
Clicking a row in the sheet triggers the same bubble-flash + auto-closes
the sheet.

**No-noise rule.** Bubbles without any detected anchors render `null` —
Source Anchors never adds visual weight to a bubble that doesn't mention
sources.

## Why this feature

Until now, every assistant reply was a wall of text. URLs and footnote
markers disappeared inline. If the model said *"According to recent
research, latency dropped 30% [1]"*, the user had to spot the citation
themselves, no UI affordance.

Source Anchors lifts those references out of the prose as discrete
chips. It is **content-aware** (not position-aware) — it works on any
reply, on any topic, on any model, regardless of where in the conversation
the bubble lives.

The split from the previous cycle's feature is deliberate:

| | Reply Receipt (cycle before) | Source Anchors (this cycle) |
|---|---|---|
| Granularity | per-message (corner stamp) | per-bubble-top (chip strip) |
| What it surfaces | generation metadata (duration, shape, tokens) | inline content citations (URLs, footnotes, attributions, years) |
| Verbs | show stamp, expand card | scan, jump, flash |
| Folder on main | `src/reply-receipt/` | `src/source-anchors/` |
| Heuristic scope | shape classification | content extraction |

Provenance and citation are different concerns at different surfaces. The
two features are orthogonal — both can render in the same bubble without
conflict.

## Implementation notes

**Architecture.** A new `src/source-anchors/` folder contains four small files:

- `detect.ts` — pure heuristic detector (200 LOC). Five regex passes in
  priority order, then deduped by overlap. The longest-match-wins dedup
  ensures a markdown link is captured as a single `markdown-link` anchor
  rather than two overlapping `markdown-link` + `url` anchors.
- `SourceAnchors.tsx` — the React component. Uses `useMemo` to recompute
  anchors when `text` changes; `useState` for the bottom-sheet visibility.
  Renders the `<style>` block once (defines the chip / sheet / flash
  classes) plus the chip strip JSX. Click handler delegates to
  `jumpToAnchor(messageId, anchor)` which finds the bubble body via
  `[data-source-anchor-flash="1"][data-message-id="…"]` and toggles the
  `source-anchor-flashing` class.
- `types.ts` — the `Anchor` and `AnchorKind` types.
- `index.ts` — barrel export.

**Wiring.** `src/WebLLMChat.tsx` was modified to mount `<SourceAnchors>`
above the bubble body, wrap the existing `<ReactMarkdown>` body in a
`<div data-source-anchor-flash="1" data-message-id={messageId}>` so the
flash target is well-defined, and import the new module. **Zero changes
to `engine.ts`, `useWebLLM.ts`, `store.ts`, `models.ts`, `tools.ts`,
`types.ts`, `App.tsx`, or the `reply-receipt/` folder.** The receipt
mount is unchanged.

**Tests.** 18 new vitest tests in `src/__tests__/source-anchors.test.ts`:

- 4 URL detection tests (bare URL, multiple URLs, www-strip, markdown link)
- 2 footnote tests (`[1]` `[2]`, no false-positive on `[text](url)`)
- 2 attribution tests (`according to`, `per`)
- 3 year-context tests (`in 2024`, `since 2019`, ignore `2048 RAM`)
- 2 dedup + ordering tests (markdown-link wins over bare URL, sorted by start)
- 3 edge-case tests (empty, plain prose, mixed kinds)
- 1 component smoke test (SourceAnchors importable)
- 1 DOM-safety test (jumpToAnchor returns false outside browser)

Total: 5 test files, 84 tests pass (66 pre-existing + 18 new).

**Demoability.** The iframe loads in ~1 s because the Source Anchors
detector is pure and runs synchronously on already-committed bubble text.
The chips appear immediately on every bubble that mentions a URL,
footnote, attribution, or year. No model download is required for the
chips themselves to work — the heuristic operates on whatever text is
already in the `messages[]` array.

**Anti-chain.** The previous cycle's feature was reply-receipt. The two
features share the bubble mount in `WebLLMChat.tsx`, but the mount is
additive (a `<SourceAnchors>` line above the existing
`<ReactMarkdown>` body) and the substantive code lives in a separate
folder (`src/source-anchors/` vs `src/reply-receipt/`). Receipt code path
is unchanged.

## Try it

Interact with the embedded demo above, or <a href="/ux/source-anchors/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
