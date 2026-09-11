---
sidebar_label: "Inference Pulse"
---

# Inference Pulse

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/inference-pulse/index.html" height="500px" />

## What was built

A live **stream telemetry strip** pinned just above the input area. The moment the model starts generating, the strip fades in and starts reporting real numbers — not vibes.

What you see, left to right:

- **Status dot** — gray when idle, **green** while the model is actively streaming chunks, **amber** when the model has gone quiet for >800 ms (the "thinking pause" between bursts), and **blue** when the turn is complete.
- **Tier label** — `streaming` / `stalled` / `completed` — so the dot's color always has a word attached.
- **Tokens/sec** — a rolling approximation computed from `streamText.length ÷ 4 ÷ (lastChunk − firstChunk)`. Floors at 1.5 tok/s when only one chunk has arrived.
- **TTFT** — time-to-first-token, measured from `startStream()` to the first chunk. A single number that tells you whether the model is "snappy" or "slow to wake".
- **Elapsed** — total wall-clock since the request was sent. Format is `0.42s` for sub-second, `2.13s` for multi-second, `1m 5s` for multi-minute.
- **Pulse bar** — a horizontal bar whose width decays between chunks and refills on each new chunk. Its color mirrors the dot. When the model pauses to think, you can *see* the bar empty — and you can *see* it refill when streaming resumes.

The strip collapses to dot + tok/s + bar on viewports below 640 px (mobile-first per `style_hints`).

## Why this feature

When you use a 1B model on WebLLM, the experience is mostly "wait, then text appears". When you use a 13B model on a slower machine, the same experience becomes "wait a long time, then text appears". The user has no way to distinguish between **the model is computing** and **the model has stalled**. Inference Pulse makes the distinction visible:

- A green dot that beats at the chunk rate means **"live, just slow"**.
- An amber dot that pulses slowly means **"model paused between bursts"** (this is normal for non-cherry-picked decoding).
- A red dot would mean the model is wedged (rare; covered by the ErrorBanner).

Combined with the existing **Reply Receipt** provenance card (which fires once at commit and reports the total duration / shape / tool count), Inference Pulse completes the observability story: you see what's happening *during* the run, then get the receipt *after*.

## Implementation notes

### What changed

- `src/store.ts` — added three fields and three setters + one clear helper, in a new "Inference Pulse" slice **separate from the Cue Cards slice and the Reply Receipt slice**:
  - `streamStartedAt` (wall-clock at `startStream`)
  - `streamFirstChunkAt` (set once, on the very first `appendStream`)
  - `streamLastChunkAt` (refreshed on every `appendStream`)
  - The existing `startStream` / `appendStream` / `commitStream` / `resetStream` hooks are minimally extended to maintain these fields. No new state shape; no breaking changes to other slices.

- `src/inference-pulse/` — **brand-new directory**, 4 files:
  - `metrics.ts` — pure, deterministic stats layer (no React, no DOM, no I/O). Time is injected so unit tests don't depend on `performance.now()`. Exports `computePulseState` + `formatDuration`.
  - `InferencePulse.tsx` — controlled component, drives its own `now` via a 250 ms `setInterval` (only active while `startedAt !== null`, so zero idle cost).
  - `styles.css` — hand-written scoped CSS with a `@media (max-width: 640px)` responsive breakpoint.
  - `index.ts` — barrel.

- `src/WebLLMChat.tsx` — added `<InferencePulseRow />` between `<MessageList />` and `<CueCardsRow />`. The row is a 5-line wrapper that subscribes to the four store fields. **No other changes to WebLLMChat.tsx.**

### Architecture choice: separate module, separate store slice

Both Cue Cards and Reply Receipt have been retrofitted into the same store. Inference Pulse deliberately gets its own slice (`streamStartedAt` / `streamFirstChunkAt` / `streamLastChunkAt`) and its own module (`src/inference-pulse/`). This keeps each feature independently testable and avoids touching either of the existing feature modules.

### How the rolling rate is computed

WebLLM streams chunks of decoded text. Each chunk contains a variable number of characters (often a partial token). To approximate tokens/sec without a real tokenizer:

```ts
const tokenEstimate = Math.ceil(streamText.length / CHARS_PER_TOKEN);  // 4 chars/token
const chunkSpanMs = Math.max(1, lastChunkAt - firstChunkAt);
const rate = (tokenEstimate / chunkSpanMs) * 1000;
```

The 4-chars-per-token ratio is conservative (WebLLM models are typically 3.5-4 chars/token for English). Floor at 1.5 tok/s when only one chunk has arrived, so the strip never reads `0 tok/s` once it's actually live.

### Tier rules

| Tier | When | Dot color | Pulse bar |
| --- | --- | --- | --- |
| `idle` | `startedAt === null` (never sent a message) | — (component returns null) | — |
| `live` | `isGenerating` AND last chunk < 800 ms ago | green | decays 1.0 → 0.6 over 800 ms |
| `stalled` | `isGenerating` AND last chunk ≥ 800 ms ago | amber | decays 0.6 → 0.15 over next 800 ms |
| `done` | `isGenerating === false` AND `firstChunkAt !== null` | blue | holds full for 800 ms then settles to 0.4 |

### Tests

- `src/__tests__/inference-pulse.test.ts` — 16 unit tests for the pure metrics (idle, pre-first-chunk, solo-chunk floor, multi-chunk rolling rate, stalled detection, done, defensive guards, `formatDuration`).
- `src/__tests__/inference-pulse.component.test.tsx` — 7 jsdom tests for the component (idle returns null, rate label renders, TTFT placeholder, tier attribute, bar width, dot color, label smoke check).

Total cycle test count: 112 / 112 vitest pass (89 pre-existing + 23 new).

### Dependencies added

None. Plain CSS + React + Zustand selectors.

## Try it

Interact with the embedded demo above, or <a href="/ux/inference-pulse/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

For the most dramatic effect, ask the 1B model a question that produces a long response ("explain quantum entanglement in detail") and watch the pulse bar pulse green→amber→green as the model streams / pauses / resumes.
