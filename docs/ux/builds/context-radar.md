---
sidebar_label: "Context Radar"
---

# Context Radar

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/context-radar/index.html" height="580px" />

## What was built

Context Radar is a responsive-first context-control surface for the WebLLM chat. It makes the content accumulated for the next inference visible as a compact coloured composition bar and a short, inspectable ledger. The view separates system intent, user prompts, assistant replies, and tool results.

The panel is useful before a model has loaded too: the system instruction is included immediately, then the map updates as the conversation grows. On narrow screens the three key metrics remain a compact grid and the role legend wraps rather than disappearing behind a settings menu.

## Why this feature

Browser inference makes every carried-forward character meaningful, but the default chat interface gives no intuition for what is travelling into the next request. Context Radar makes that trade-off tangible without pretending to know an individual model's exact tokenizer or context window.

It is a new observability concept on the main branch, not a continuation of Model Compass: Model Compass helps choose a model before download; Context Radar explains the active prompt composition after that choice.

## Implementation notes

The new `src/context-radar` module has a pure estimator and React drawer. Its estimate is intentionally transparent — roughly four trimmed characters per token — and the UI labels it as a composition estimate rather than a hard model limit. It reads only the in-memory Zustand chat store and the active system prompt, so it makes no network call, adds no dependency, stores nothing, and never triggers a WebLLM download.

The branch adds three focused tests around the estimator, system-intent inclusion, role composition, and the dense-context threshold.

## Try it

Interact with the embedded demo above, or <a href="/ux/context-radar/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
