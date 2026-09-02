---
sidebar_label: "Message Trail Map"
---

# Message Trail Map

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/trail-map/index.html" height="500px" />

## What was built

A thin horizontal **navigation strip** that lives just above the chat input. Each committed message becomes a glyph on the strip — a small dot for user turns, a wider bar (proportional to character count) for assistant turns, and a small square for tool turns. The strip does three jobs:

1. **Wayfinding** — click any glyph to smooth-scroll the chat to that message and flash an amber outline on the bubble for 1.2 seconds.
2. **Rhythm at a glance** — wider bars mean longer replies; the strip's silhouette literally shows the conversation's pacing.
3. **Live cursor** — an amber outline tracks whichever bubble is most-visible in the chat, updated by a per-bubble `IntersectionObserver` (threshold 0.5).

Hovering a glyph opens a tooltip with role + character count + the message's first 60 characters; the tooltip is hidden in compact-mobile mode (≤ 600 px) so the strip stays glanceable. On wider viewports the strip gains a right-aligned `N msgs · M chars` summary.

## Why this feature

The previous chain of features in `overnight-llm-ux` is overwhelmingly **per-message provenance** — the Reply Receipt corner stamp on each bubble, the per-turn turn records in the store. There was no equivalent **per-conversation** navigation. Once a conversation has 10+ turns, scrolling back to "the message where the model said the thing about X" is a real friction point. Trail Map is the first feature that treats the **conversation as a navigable object** rather than just a list of bubbles.

## Implementation notes

- **New module:** `src/trail-map/` (4 files, ~230 LOC: `TrailMap.tsx`, `useMessageInView.ts`, `types.ts`, `index.ts`).
- **Touched:** `src/WebLLMChat.tsx` (added one import + one `<TrailMap />` line above `<InputArea />` + `data-message-id` / `data-message-role` attributes on the bubble div so the IntersectionObserver can find them).
- **No store changes** — TrailMap subscribes directly to the existing `useChatStore.messages` selector. Zero state additions.
- **Zero new dependencies.** Uses only `IntersectionObserver` (browser API) + `Element.animate()` (WAAPI) + `matchMedia` (responsive listener).
- **Responsive-first:**
  - ≤ 600 px viewport → compact mode (36 px row, dots only, no tooltips, no summary)
  - 601–1024 px → standard mode (tooltips visible)
  - > 1024 px → standard mode + summary text on the right
  - A `useEffect`-bound `matchMedia('(max-width: 600px)')` listener flips between modes at runtime; no media query CSS, so the JS bundle is the single source of truth for compact vs. full.
- **Click-to-jump** uses `scrollIntoView({ behavior: 'smooth', block: 'center' })` and a WAAPI `Element.animate()` outline flash. The animation is guarded behind `typeof el.animate === 'function'` so JSDOM-based tests don't blow up.
- **13 new tests** in `src/__tests__/trail-map.test.tsx`, including a `MockIntersectionObserver` that records every `observe()` call and lets the test fire `isIntersecting: true` from inside `act()` to drive the cursor.
- **Total bundle delta:** under 4 KB (gzipped). Trail Map ships entirely in the existing `index-*.js` chunk.

## Try it

Interact with the embedded demo above, or <a href="/ux/trail-map/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.