---
sidebar_label: "Confidence Pulse"
---

# Confidence Pulse — the chat blooms where you're reading

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/confidence-pulse/index.html" height="600px" />

## What was built

**Confidence Pulse** is a scroll-and-attention-aware chat layout. The message currently in the center of your viewport *blooms* — a subtle scale-up, a soft blue drop-shadow, and full opacity. Every other message dims to 78% opacity and pulls in slightly. As you scroll, the bloom follows your reading center, and a thin **Tide Meter** in the header tracks where you are in the conversation.

When you stop scrolling for more than 1.2 seconds, the Tide Meter's position dot starts a slow 1.8s breath animation — the chat is *waiting* for you. Resume scrolling and the dot snaps sharp again. On viewports wider than 1600px, a right-side **Confidence Panel** appears with one dot per message, each glowing in proportion to the cumulative time you've spent reading it. Click a dot to jump back to that message.

The bloom treatment is responsive-first. On phones (≤639px) there's no scale at all — just an opacity shift — because a 1.02× scaled bubble on a 390px-wide screen is unreadable. Tablets (640–1023px) get a 1.01× scale. Desktops (1024–1599px) get the full 1.02× scale + drop-shadow. Wide screens (≥1600px) add the Confidence Panel.

## Why this feature

Every shipped chat variant to date treats all messages equally. Latency Lens measures *generation* rhythm (token deltas). Adaptive Canvas measures *viewport* width. Shape Memory classifies *content shape*. None of them measure *where the reader is looking* — and the reading center is the most important signal in a chat UI.

Confidence Pulse introduces a new axis: **scroll position + idle time → visual density**. It's progressive enhancement: if `IntersectionObserver` is unavailable (very old browsers), nothing breaks — the chat just renders without bloom. The Tide Meter works the moment the chat loads, before the model has even downloaded.

It's also opt-in. The canonical chat variant is untouched. There's a new checkbox in the Configuration panel: **Confidence Pulse (scroll-aware focus bloom + tide meter)**. Default off.

## Implementation notes

The feature lives entirely in a new module on `main`: `src/confidence-pulse/`. No files in `src/reply-receipt/`, `src/store.ts`, `src/engine.ts`, `src/useWebLLM.ts`, or `src/WebLLMChat.tsx` were modified — only `App.tsx` (a 1-line opt-in toggle), `main.tsx` (one CSS import), and `vitest.config.ts` (switched to `jsdom` so `IntersectionObserver` is available in tests).

Key files:
- `src/confidence-pulse/usePulseStore.ts` — Zustand slice holding `focusedId`, `dwellMs`, `idle`, `tideProgress`. Kept separate from the main `useChatStore` so the canonical store contract is unchanged.
- `src/confidence-pulse/useReadingPulse.ts` — Attaches `IntersectionObserver` to a `data-pulse-id` selector, plus a scroll listener for `tideProgress`, plus a 250ms cadence dwell accumulator, plus a 250ms idle-watcher. The observer uses `rootMargin: "-20% 0px -20% 0px"` so only the middle 60% of the viewport is the "reading center".
- `src/confidence-pulse/BubbleBloom.tsx` — Wraps each bubble and applies one of three CSS classes: `pulse-bubble--focused`, `pulse-bubble--neighbor`, or `pulse-bubble--idle`. Pure CSS — no inline-style recomputation.
- `src/confidence-pulse/BloomProvider.tsx` — Applies `PulseConfig` as CSS custom properties (`--pulse-bloom-scale`, `--pulse-neighbor-opacity`, `--pulse-focus-shadow-blur`) so the responsive matrix can override per-breakpoint without re-rendering.
- `src/confidence-pulse/TideMeter.tsx` — The header widget. 6px-tall bar with a 12px circular dot. Idle state triggers `pulse-breathe` keyframes.
- `src/confidence-pulse/ConfidencePanel.tsx` — Right-side rail with one dot per message, brightness-mapped to cumulative dwell. Click to scrollIntoView.
- `src/confidence-pulse/styles.css` — All visual styles, including the 4-breakpoint responsive matrix and `prefers-reduced-motion` overrides.
- `src/confidence-pulse/PulseChat.tsx` — The chat variant entry component (mirrors `WebLLMChat` structure but with `useReadingPulse` wired in).

Dependencies added: **none**. The feature uses native `IntersectionObserver` + `performance.now()` + plain CSS. The `zustand` and `@mlc-ai/web-llm` deps already on `main` are sufficient.

Models this feature needs at runtime: **none in particular**. The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` works perfectly. The bloom + Tide Meter are UI-only — they animate correctly even before the model finishes downloading.

## Try it

Interact with the embedded demo above, or <a href="/ux/confidence-pulse/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Once the chat has some messages, scroll up and down — you'll see the bloom follow the message in your viewport. Pause for ~1.5 seconds and watch the Tide Meter's dot start to breathe. Resize your browser across the 4 breakpoints (640 / 1024 / 1600) and watch the layout shift from phone to tablet to desktop to wide.
