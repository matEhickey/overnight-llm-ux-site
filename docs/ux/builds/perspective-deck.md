---
sidebar_label: "Perspective Deck"
---

# Perspective Deck

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/perspective-deck/index.html" height="560px" />

## What was built

Perspective Deck adds a prompt orchestration layer to the browser-only WebLLM chat. Instead of asking the user to hand-edit a system prompt from scratch, the configuration panel now includes five lenses: Systems Debugger, Product Critic, Automation Architect, Socratic Tutor, and Creative Synthesist.

Each lens can be paired with a reply shape such as Crisp Plan, Question Ladder, Experiment Card, or Decision Memo. The app composes the base instruction, lens directive, and reply format into the actual system prompt sent to the model. A live preview and short fingerprint make the hidden prompt state visible before the model is loaded.

The deck also includes lens-specific starter briefs. Clicking one fills the chat draft, so the embedded demo has something concrete to explore even before a model finishes downloading.

## Why this feature

The previous builds made the chat more useful through automation, retrieval, runbooks, and export. This cycle moves one level earlier: shaping the conversation before inference starts. Small local models benefit a lot from narrow instructions, and a deck of opinionated lenses makes that control fast without requiring a bigger runtime model.

The feature also compounds nicely. The same lens abstraction can later support A/B comparison, saved prompt recipes, conversation templates, or model evaluation runs.

## Implementation notes

The core logic lives in `src/promptDeck.ts`: typed lens presets, reply-shape presets, `composePerspectivePrompt`, starter prompts, and a deterministic prompt fingerprint. Tests cover prompt composition, fallback behavior, starters, and fingerprint stability.

`App.tsx` now keeps separate state for the base instruction, active lens, and reply shape. It sends the composed prompt into `WebLLMChat`, while `WebLLMChat` accepts an optional `draftMessage` prop so starter briefs can populate the message box without touching the WebLLM engine or Zustand store.

No new runtime dependencies were added. The iframe build uses `vite.config.embed.ts` with `base: './'` so the static assets resolve correctly under `/ux/perspective-deck/`.

## Try it

Interact with the embedded demo above, or <a href="/ux/perspective-deck/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
