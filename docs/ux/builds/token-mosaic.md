---
sidebar_label: "Token Mosaic"
---

# Token Mosaic

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/token-mosaic/index.html" height="640px" />

## What was built

A panel that lives below the chat input and turns streamed responses into a **visual mosaic of colored tiles**. Each token that arrives becomes one tile, color-coded by its character class (letter / digit / punctuation / whitespace / emoji / CJK / other). The tiles flow left-to-right, wrapping to new rows like reading a printed page.

Four interactive affordances:

- **Live tile appearance** — as the model streams, tiles fade in with a scale animation. The first tile to arrive is the model's first token after thinking time (TTFT).
- **Hover/click inspection** — hover any tile to see its index, exact text, time-since-previous-token in ms, and its character class. Click to pin the inspection.
- **Replay** — after the response finishes, click `▶ Replay` to re-animate the entire generation from token 0. Speed selector offers 0.25× / 0.5× / 1× / 2× / 4× so you can watch a 4-second stream at 16 seconds (0.25×) or in one second (4×).
- **Scrub bar** — a horizontal range input lets you freeze the visible tile count at any token index. Drag to position, the tile count updates live, the underlying engine state is untouched.

A stats strip below the controls surfaces:

- **TTFT** (time-to-first-token in ms — wall clock from Send to first chunk)
- **Total tokens** captured
- **Generation duration** (first-chunk to last-chunk)
- **Average tokens/sec**
- **Character-class histogram** — a horizontal bar chart of how many tokens fell into each class (letters, digits, punctuation, etc.)

For very long responses (>600 tokens), the grid is capped at the first 600 tiles with a "showing first 600 of N" note, to keep DOM rendering cheap.

## Why this feature

Every prior cycle changed what the user *types* (perspective deck, voice input, fork, RAG) or what the user *reads* (council, constellation, reply-shape). Token Mosaic changes how the user *feels* the model's generation rhythm. The same `Hello there!` text becomes 4 colored tiles (letter + letter + letter + letter + space + letter + letter + letter + letter + letter + punct) — and the spacing of the tiles encodes the wall-clock rhythm of the inference.

This is genuinely orthogonal to Prompt X-Ray (7-05). X-Ray shows the *request*: the messages array, the tools, the sampling params. Mosaic shows the *response*: the actual stream, token by token, with all its temporal rhythm intact.

The replay + scrub combo is, as far as I know, novel in any chat UI. Most LLM chat clients treat the response as a finished artifact the moment streaming ends. Mosaic treats it as a *recording* you can replay and freeze.

## Implementation notes

The implementation is deliberately small and additive. Zero new engine events — we just hook the existing `chunk` event.

**Key files:**

- `src/token-mosaic/types.ts` (new) — `TokenEvent`, `MosaicStats`, `MosaicSpeed`, `CharClass`
- `src/token-mosaic/classify.ts` (new) — `classifyChar`, `classifyToken`, color/label/tint tables
- `src/token-mosaic/stats.ts` (new) — `computeStats`, `totalReplayMs`, `formatMs`, `formatRate`
- `src/token-mosaic/TokenMosaic.tsx` (new) — the panel UI (tiles, controls, scrub bar, stats strip)
- `src/token-mosaic/index.ts` (new) — barrel
- `src/__tests__/token-mosaic.test.ts` (new) — 28 tests covering classification, stats computation, replay timing, formatters, integration
- `src/store.ts` — additive `replayEvents`, `streamStartT`, `appendReplayEvent`, `resetReplay`, `markStreamStart` slice
- `src/useWebLLM.ts` — additive `s.appendReplayEvent(...)` in the chunk handler; `markStreamStart()` + `resetReplay()` calls in `send()`
- `src/WebLLMChat.tsx` — additive `<TokenMosaic />` render below `<InputArea />`
- `vite.config.embed.ts` — relative-asset build config for the iframe embed

**Performance:**

- Tiles use native CSS transitions (`transform 100ms ease-out`) for hover scale. No JS animation library.
- A 600-tile hard cap keeps the DOM cheap even for long responses. Long responses show a "showing first 600 of N" note.
- Replay uses `setTimeout` with a per-tile delay derived from the original generation duration and the chosen speed — no `requestAnimationFrame` polling, no busy loop.
- Classification is O(n) per token and runs once at chunk-arrival time, not on every render.

**Edge cases handled:**

- Whitespace-only tokens (single space, newline, tab) → classified as "space" with a light-gray color, rendered as `␣` / `↵` glyphs
- Empty response (zero tokens) → empty state with a hint message
- Mid-stream scrub/pause → handled: starting a new generation clears `scrubCursor` and stops any in-progress replay
- Very long responses → truncated to 600 tiles with explicit note
- Token with multiple char classes → majority class wins, with deterministic tie-break in CHAR_CLASSES order

**Models this feature works with:**

The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` is plenty — the mosaic captures whatever the model emits, regardless of size. Larger models just produce longer mosaics.

## Anti-chain compliance

- New module `src/token-mosaic/` — no overlap with `src/prompt-xray/` (7-05 wire introspection), `src/token-budget/` (7-04 context meter), `src/inference-playground/` (7-03 sampling), `src/telemetry/` (6-28 engine state), `src/voice/` (6-29/6-30 STT/output), `src/conversation-tree/` (7-02 forks), `src/perspective-deck/` (6-22), `src/local-notes-rag/` (6-20), `src/export/` (6-21), `src/tools/`.
- Store edit is purely additive: one new slice for `replayEvents` + `streamStartT`.
- useWebLLM edit is purely additive: one extra `appendReplayEvent` call in the chunk handler, two `markStreamStart`/`resetReplay` calls in `send`.
- Chat edit is purely additive: one new component rendered below the input.
- Engine untouched. No new events emitted.
- Not another Mode toggle, not another persona, not another A/B runner, not another observability panel, not another wire-format view. Fresh axis: **per-token visual rhythm + temporal replay/scrub of the response stream**.

## Try it

Interact with the embedded demo above, or <a href="/ux/token-mosaic/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Send any prompt (the default "You are a helpful assistant" + the 1B model is fine). Watch the tiles appear. Once the response finishes, click `▶ Replay` to re-animate, or drag the scrub bar to freeze at any point. Hover or click individual tiles to inspect their text and arrival time. The histogram at the bottom updates live as you scrub.