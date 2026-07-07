---
sidebar_label: "Drift Trail"
---

# Drift Trail

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/drift-trail/index.html" height="640px" />

## What was built

A collapsible panel that sits below the chat input and turns the conversation into a **trajectory through feature space**. Each completed message (user or assistant) gets a 4-dimensional fingerprint computed entirely client-side from its text:

| Axis | What it measures | Range |
|------|------------------|-------|
| **Complexity** | mean word length × sentence count | 0..1 |
| **Richness** | type-token ratio (unique / total words, damped for length) | 0..1 |
| **Sentiment** | lexicon-based polarity with simple negation handling | -1..+1 |
| **Verbosity** | log-scaled character count | 0..1 |

The first two axes are mapped to a 2D scatter canvas: X = vocabulary richness, Y = sentiment (inverted so positive is up). Each message is a dot, color-coded by role (user = blue, assistant = green). A gray polyline connects the dots in order, showing how the conversation has wandered.

### Quadrants

The canvas is divided into four labeled quadrants plus the axis cross:

- **↗ expressive joy** (rich + positive)
- **↗ simple cheer** (repetitive + positive)
- **↙ dense lament** (rich + negative)
- **↙ stuck loop** (repetitive + negative)
- **neutral zone** (on the axes)

The latest message's quadrant is shown in the stats strip.

### Per-role averages

Two dashed circles mark the centroid of user dots (blue "u") and assistant dots (green "a"). Watching these drift apart or converge is itself a meaningful signal — when the user centroid pulls far from the assistant centroid, the two voices have wandered to different parts of feature space.

### Stats strip

Below the canvas, three badges show:

- **Quadrant** — human label of the latest message's quadrant
- **Drift** — total 4-D Euclidean distance traveled across all consecutive messages (cumulative)
- **Velocity** — mean distance over the last 3 transitions (recent rate of change)

A small text line below shows the last point's full fingerprint as `c=… r=… s=… v=…`.

### Streaming behavior

While the model is generating, a **pulsing ghost dot** appears at the in-flight message's projected position. Color matches the next expected role. Once the response commits, the ghost dot is replaced by a permanent solid dot and a "you are here" ring.

### Hover inspection

Hover any dot to see its index, role, and a short text preview in a dark tooltip.

## Why this feature

Every prior cycle changed what the user *types* (perspective deck, voice input, fork, RAG, tool admin) or what the user *reads* (council, constellation, reply-shape, prompt-xray, token-mosaic). **Drift Trail changes how the user sees the conversation evolve over time.** The same ten turns that play out as a flat list in every other chat UI become a winding path through a 2D feature space, with quadrants, centroids, and drift magnitudes that are visible at a glance.

This is genuinely orthogonal to Token Mosaic (7-06). Mosaic shows the *content* of one response as colored tiles + replay. Drift Trail shows the *shape* of the whole conversation across messages. Different module (`src/drift-trail/`), different visualization primitive (SVG scatter + path vs CSS tile grid), different data flow (committed messages vs `chunk` event timing), different concept (conversation-as-trajectory vs response-as-tiles).

It's also orthogonal to Prompt X-Ray (7-05, wire introspection), Token Budget (7-04, context meter), Inference Playground (7-03, sampling), Engine Telemetry (6-28, runtime state), and every persona/voice feature. None of them surface the conversation's *evolution* as a visible trajectory.

## Implementation notes

The implementation is small and deliberately additive. No engine changes, no new events, no new dependencies.

**Key files:**

- `src/drift-trail/types.ts` (new) — `Fingerprint`, `TrailPoint`, `DriftStats`, `Quadrant`
- `src/drift-trail/lexicon.ts` (new) — `POSITIVE_WORDS` (53 words), `NEGATIVE_WORDS` (61 words), `wordPolarity()` helper
- `src/drift-trail/fingerprint.ts` (new) — `computeFingerprint()`, `makeTrailPoint()`, `fingerprintToXY()`, `fingerprintDistance()`, `classifyQuadrant()`, `computeDriftStats()`, `QUADRANT_LABELS`, `formatFingerprint()`, `formatNumber()`
- `src/drift-trail/DriftTrail.tsx` (new) — the panel UI (canvas, trail, ghost dot, hover tooltip, stats strip)
- `src/drift-trail/index.ts` (new) — barrel
- `src/__tests__/drift-trail.test.ts` (new) — 38 tests covering fingerprint computation, sentiment polarity, negation handling, richness/complexity/verbosity, XY mapping, distance symmetry, quadrant classification, drift statistics, formatters, lexicon
- `src/WebLLMChat.tsx` — additive: `<DriftTrail />` rendered below `<InputArea />`
- `vite.config.embed.ts` (new) — relative-asset build config for the iframe embed (same pattern as 7-06)

**Performance:**

- Fingerprint computation is O(n) in the message's character count and runs only on message changes (not on every render). A 1000-character message fingerprints in under 1 ms.
- Trail polyline is recomputed only when `committedPoints` changes (memoized via `useMemo`).
- Ghost dot uses native SVG `<animate>` for the pulse — no JS animation library, no `requestAnimationFrame` polling.
- Quadrant labels and center axes are static; only the dynamic dots, line, and tooltip re-render.

**Edge cases handled:**

- Empty input / whitespace-only text → returns zero fingerprint (no NaN)
- Punctuation-only text → still produces well-defined fingerprint values (no NaN)
- Messages with both positive and negative words → sentiment is the *balance* (positive words pull one way, negative the other; negation inverts the sign of a nearby word)
- Single message → all drift/velocity stats are zero, but quadrant is still computed
- All-user or all-assistant conversations → the missing role's average is `null` (rendered as a dash)
- In-flight streaming → ghost dot uses the in-progress `streamText` and the next expected role

**Models this feature works with:**

The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` is plenty — the fingerprint is computed from whatever text comes back, regardless of size. Larger models just produce richer vocabulary and longer messages, which the trail visualizes naturally.

## Anti-chain compliance

- New module `src/drift-trail/` — no overlap with `src/token-mosaic/` (7-06 per-token tile grid), `src/prompt-xray/` (7-05 wire introspection), `src/token-budget/` (7-04 context meter), `src/inference-playground/` (7-03 sampling), `src/telemetry/` (6-28 engine state), `src/voice/` (6-29/6-30 STT/output), `src/conversation-tree/` (7-02 forks), `src/perspective-deck/` (6-22), `src/local-notes-rag/` (6-20), `src/export/` (6-21), `src/tools/` (7-05/7-06).
- Pure client-side computation: zero engine changes, zero new events.
- WebLLMChat edit is purely additive: one new component rendered below the input.
- Not another Mode toggle, not another persona, not another A/B runner, not another observability panel, not another wire-format view. Fresh axis: **conversation-as-trajectory through feature space**.

## Try it

Interact with the embedded demo above, or <a href="/ux/drift-trail/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Send a few messages back and forth (the default 1B model is fine). Watch the dots appear in the canvas and the trail grow. Hover any dot to see its index and preview. Once you have 5+ messages, watch the per-role averages (dashed circles) and the drift magnitude. Try sending messages with clearly different tones ("I love this amazing day" vs "everything is broken and terrible") to see the points jump to opposite quadrants.