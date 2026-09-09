---
sidebar_label: "Scrub Replay"
---

# Scrub Replay

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/scrub-replay/index.html" height="620px" />

## What was built

A horizontal timeline strip pinned to the bottom of the chat, just above the
input. The strip turns the conversation into something you can *replay* rather
than just *read* — every committed turn becomes a tick on a track, color-coded
by speaker (blue for user, amber for assistant, purple for tool). A draggable
playhead marks the current position; a Play/Pause button animates the
conversation chronologically at 0.5×/1×/2×/4× speed.

Clicking a tick jumps the playhead to that turn; clicking the track jumps to
the nearest tick; dragging the scrubber previews turns continuously and resumes
playback on pointer-up. The active bubble gets a brief amber halo via a CSS
animation when the playhead crosses its window.

Because the surface is useful even with zero real conversation, the empty state
offers a single-click "↺ Load demo conversation" button that injects 8
deterministic turns (a short Q&A about JavaScript's `let`/`var`/`const`,
closures, and async/await). The demo is built into the bundle — no model
download required, no network call, instant.

## Why this feature

The overnight-llm-ux project has shipped many text-oriented affordances — receipts,
counters, snippet vaults, citation strips, hover lenses. None of them touches
*time*. Conversations are inherently temporal: each turn has a beginning and a
duration, and reading a long transcript in a chat bubble is a slog. Scrub Replay
turns the transcript into something more like a video timeline, letting you
*scrub* the conversation instead of scrolling it.

It's also a much better *demo* surface for the blog iframe: visitors see the
8-turn seed conversation animate in ~18 seconds at 1×, with no model download.

## Implementation notes

- **Pure-additive module.** All code lives in `src/scrub-replay/` (5 files,
  ~580 LOC). Zero overlap with `src/reply-receipt/`, `src/code-playground/`,
  `src/composer-stage/`, or any other prior module.
- **One mainline seam.** `src/WebLLMChat.tsx` gets `<ScrubReplay />` mounted
  between `<MessageList />` and `<InputArea />`, plus a `data-message-id`
  attribute on each bubble so the scrubber can find + highlight them via
  `document.querySelector('[data-message-id="…"]')`.
- **Pure clock logic.** `src/scrub-replay/scrubClock.ts` exports
  `advancePosition`, `activeMessageAt`, `bubbleAtPosition`, `nearestTick`,
  `formatScrubTime`, and `buildSummary` — all side-effect-free, fully tested
  in `node` (no DOM).
- **RAF loop.** The component uses `requestAnimationFrame` with a virtual
  clock that multiplies real `delta` by the selected speed. Each frame calls
  `advancePosition()` and updates `setClock()`; the active-message side effect
  is a CSS attribute toggle that triggers the highlight animation.
- **No new dependencies.** Uses React, Zustand, and the browser's built-in
  pointer events. CSS is hand-written (no Tailwind).
- **Responsive.** On viewports ≤ 640 px, the speed selector and time readout
  collapse; the strip shrinks from 56 px to 40 px tall; ticks remain tappable.
- **Determinism.** `seedDemoConversation()` resets its internal counter on
  every call, so two consecutive calls return deep-equal objects. The seed
  is also covered by a "every message is reachable" test that asserts each
  message appears as the active message at some position inside its window.

## How to test locally

1. `cd ~/.openclaw/overnight/overnight-llm-ux/`
2. `npm install && npm run dev`
3. Open the dev URL → click "↺ Load demo conversation" in the strip at the
   bottom → click Play.
4. Try clicking individual ticks; try dragging the playhead; try the
   0.5×/1×/2×/4× speed buttons.
5. Send a real message and the strip updates with a new tick at the end.
6. On a viewport < 640 px, the speed selector hides and the strip collapses.

## Try it

Interact with the embedded demo above, or
<a href="/ux/scrub-replay/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
