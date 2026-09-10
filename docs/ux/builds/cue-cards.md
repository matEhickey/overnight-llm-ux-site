---
sidebar_label: "Cue Cards"
---

# Cue Cards

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/cue-cards/index.html" height="500px" />

## What was built

A horizontal strip of one-tap **intent modifier chips** pinned above the input
area. Each chip carries a small instructional prefix that gets folded into
your next message at submit time. Pick a chip, type your prompt, hit Send —
the model sees your text plus a short line of cues like `Be concise.` or
`Use bullet points.` Cues accumulate (toggle them off by clicking again), and
the strip auto-resets after each send so the next turn starts clean.

The shipped library includes 9 cues:

- **Be concise** — keep replies short
- **Use bullet points** — prefer lists
- **Cite tradeoffs** — surface pros and cons
- **ELI5** — explain like I'm five
- **Add a code example** — include a short snippet
- **Tone: friendly** — informal, warm voice
- **Strict markdown** — clean headings/lists/code blocks
- **Step-by-step** — walk through it sequentially
- **Show caveats** — list the caveats

## Why this feature

The overnight-llm-ux project has accumulated many *post-generation* surfaces
(receipts, snippets, citations, hover lenses, timelines). Almost nothing
touches the **input side** — the place where the model is actually steered.

Cue Cards fill that gap. They are *ephemeral* (per-turn), *prefix-only* (they
do not mutate the system prompt), and *zero-persistence* (no localStorage, no
saved libraries). That makes them the lightest possible intent-modifier
surface: pick-and-go, no setup, no commitment. If a cue turns out wrong for
the next turn, just don't pick it — there's nothing to undo.

The cue strip also creates a tight feedback loop with **Reply Receipt**, the
existing post-generation provenance surface. When you pick `Be concise` +
`Use bullet points` and send a question, the receipt's `responseShape`
classifier almost always returns `bulleted-list` or `single-paragraph` — the
cue visibly shaped the shape of the reply.

A subtle interaction worth highlighting: a single Send prefix may sound small,
but the small / cheap / reversible cue is exactly what makes a developer-grade
LLM UI feel responsive. The cues are not a saved preset library (that lives
on the unmerged `prompt-capsules` branch as a heavier persistent surface)
and they are not a system-prompt override (that lives on the unmerged
`persona-quick-switch` branch). Cue Cards is the *transient* counterpart.

## Implementation notes

- **New module:** `src/cue-cards/`
  - `cues.ts` — pure data + `buildAugmentedPrompt(text, ids)` + `toggleCue`
  - `CueCards.tsx` — controlled chip strip (parent owns the selection)
  - `styles.css` — hand-written scoped CSS with responsive breakpoint at 640 px
    (chip strip becomes horizontally scrollable on mobile, label hidden)
  - `index.ts` — barrel
- **Store changes:** `src/store.ts` — added three fields:
  - `activeCueIds: string[]`
  - `toggleActiveCue(id: string)`
  - `clearActiveCues()`
- **Wire-up:** `src/WebLLMChat.tsx` — new `CueCardsRow` component reads the
  store and renders `<CueCards />` between `<MessageList />` and
  `<InputArea />`. The submit handler reads `activeCueIds` live, calls
  `buildAugmentedPrompt(t, activeCueIds)`, sends the augmented text, and
  clears the selection.
- **Tests:**
  - `src/__tests__/cue-cards.test.ts` — 16 tests for `CUE_LIBRARY`,
    `findCue`, `buildAugmentedPrompt`, `toggleCue`
  - `src/__tests__/cue-cards.component.test.tsx` — 7 jsdom tests for
    rendering, aria-pressed state, toggle, clear, disabled behavior
- **Dependencies added:** none. Uses React, Zustand selectors, plain CSS.
- **Models this feature needs at runtime:** none. Cue Chips work without
  WebLLM ever loading — open the embed, click chips, type into the input,
  the local state updates instantly.

## Try it

Interact with the embedded demo above, or
<a href="/ux/cue-cards/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
