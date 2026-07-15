---
sidebar_label: "Style Transformer"
---

# Style Transformer

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/style-transformer/index.html" height="640px" />

## What was built

A **per-message style-shifting control** that turns any committed assistant reply into 6 different formats on demand. Below every committed assistant bubble, a row of 6 small buttons appears:

| Button | What it does |
|---|---|
| **▸ Concise** | One paragraph, 30-50 words, no fluff |
| **❐ Expanded** | Add context, examples, and reasoning, 2-3x longer |
| **• Bullets** | Bullet-point list of the key takeaways, no prose |
| **λ Technical** | Precise terminology, formal logic, no colloquialisms |
| **✦ Casual** | Friendly, conversational, contractions, first-person |
| **§ Formal** | Academic / professional tone, no contractions |

Click any button and a **side card** slides out from the right of the bubble. The model re-runs in an isolated sub-context with a style-shift meta-prompt that preserves the original content. The transformed reply streams in real time into the side card. When the stream finishes, two action buttons appear:

- **↺ swap** — replace the original bubble content with the transformed version
- **✕ close** — dismiss the side card, leave the bubble unchanged

### Six style presets, six meta-prompts

Each preset is a self-contained system+user prompt pair. The user template has one placeholder, `{originalText}`, which is replaced with the actual committed reply. The 6 system prompts are deliberately distinct — they ask the model to behave like a different persona (expert editor, technical writer, summarizer, senior engineer, friendly peer, academic editor) for each style.

The meta-prompt is short (~50 tokens). The default 1B model handles the re-format task reliably and streams the result in a few seconds. No new dependencies, no new model, no new context — just a focused single-shot generation.

### Sub-context generation: the main conversation is untouched

The Style Transformer does **not** append to the main conversation. It calls a new engine method, `generateRaw({systemPrompt, userPrompt})`, which builds a 2-message context — `{system, user}` — and runs the model without touching the engine's main chat history or KV cache. The original bubble and the transformed variant are completely independent. You can run 6 different style transforms in a row, swap one in, and the main conversation history still shows only the original turn (now updated with the chosen style).

This isolation is critical: it means the transformer can re-run the model as many times as the user wants, with each run costing only the meta-prompt tokens — not the full conversation history.

### Per-message UI: side card with slide-in animation

The side card uses a CSS keyframe animation (`@keyframes stx-slide-in`) to slide in from `translateX(20px)` to `translateX(0)` over 220ms. The card has three states:

1. **idle** — no card, only the button row
2. **streaming** — card visible, "streaming…" status, text grows as chunks arrive
3. **done** — card visible, "done" status, ↺ swap + ✕ close buttons enabled

Errors (e.g. engine failed mid-transform) show a red ✕ in the card and the buttons are disabled. The card auto-closes if the user starts a new transform on a different bubble — the engine singleton can only run one generation at a time, and we surface that to the user via the side card.

## Why this feature

A chat reply is usually written in one voice. But the *same content* often needs to be reshaped for a different audience: a tweet, a slide, a doc, a memo, a chat. Today, the user copies the reply, opens a new chat, and types "rewrite this in X style" — losing the context, the conversation, and the model's knowledge of what just happened.

The Style Transformer brings that capability back into the chat itself. One click re-shapes the reply; the result streams live; the user can swap or discard. It's a small UI surface, but it changes the chat from a "one-shot reply" tool into a "shaped content" tool.

## Implementation notes

### New module: `src/style-transformer/`

```
src/style-transformer/
├── types.ts                       — StyleId, StylePreset, TransformTarget
├── presets.ts                     — STYLE_PRESETS (6 entries), STYLE_PRESETS_BY_ID
├── transformer.ts                 — buildMetaPrompt(originalText, preset) — pure
├── StyleTransformerPanel.tsx      — per-bubble UI (button row + side card)
└── index.ts                       — barrel
```

### Total cost: minimal engine / store / types changes

- **Engine:** one new method `generateRaw({systemPrompt, userPrompt})` in `src/engine.ts`. Two new event types (`transform_chunk`, `transform_done`) in `src/types.ts`. The existing `generate(opts)` path is untouched.
- **Store:** one new field `transform: TransformTarget | null` + five new methods (`startTransform`, `appendTransformChunk`, `commitTransform`, `setTransformError`, `clearTransform`) + one utility (`replaceMessageContent`) in `src/store.ts`. All existing fields and methods are untouched.
- **Hook:** one new method `transform(messageId, styleId)` on `useWebLLM`. Plus two new event-router cases for `transform_chunk` and `transform_done`, and a tweak to the `error` case so transform errors route to the transform slice instead of the main error banner.
- **UI:** one new import in `src/WebLLMChat.tsx` and one new component (`<StyleTransformerPanel>`) attached to the assistant `Bubble`. One-line prop change to pass `messageId` + `api` into `Bubble`.
- **Tests:** one new test file `src/__tests__/style-transformer.test.ts` with **27 test cases** covering all 6 presets, `buildMetaPrompt` substitution (5 cases including empty, long, and special chars), and the transform-slice + `replaceMessageContent` lifecycle.
- **Build:** one new config `vite.config.embed.ts` (with `base: "./"`) for the embed build.

### Why the panel only runs on committed messages

Just like the reply-audit panel (shipped 2026-07-14), the Style Transformer panel is rendered inside the `Bubble` component, which is only rendered for messages already in `messages[]`. The in-flight streaming bubble uses a different path and never gets a panel. That means:

- The transformer can never be triggered on partial tokens (no flicker, no churn).
- The user always knows they're re-styling a *committed* reply, not a half-written one.
- The `messageId` prop is stable for the entire lifetime of the bubble.

### Sub-context isolation: why we built a separate engine method

The existing `engine.generate(opts: GenerateOptions)` always takes a full `messages[]` array and runs the model with a tool-execution loop. It mutates the engine's internal KV cache. We needed a stripped-down method that:

- Builds a 2-message context (`{system, user}`) — no history, no tools, no loop
- Streams via `transform_chunk` events (not the main `chunk` event, so the main chat doesn't get polluted)
- Emits `transform_done` (not `done`) so the hook can route the result to the transform slice
- Does **not** call `engine.resetChat()` — the user's main conversation is preserved
- Reuses the same engine singleton, so the model stays loaded

The implementation is ~30 lines and lives in `engine.ts` as an additive method.

### Performance

The meta-prompt is short (~50 tokens). The 1B model returns a typical 100-200 word rewrite in 5-15 seconds on a modern laptop. The side card uses `useChatStore` subscription for the streaming text, so React re-renders are batched and cheap.

## Anti-chain compliance

- **New module `src/style-transformer/`** — does not exist on main prior to this cycle. Reply Audit (last cycle) lives in `src/reply-audit/`, a different folder.
- **Not a prompt inspector** (unlike `prompt-xray` / `prompt-capsules` / `token-budget`) — the transformer runs the model with a meta-prompt, not inspects the user's input.
- **Not a streaming visualization** (unlike `token-mosaic` / `drift-trail`) — the side card renders the *committed* result, not the streaming tokens (though the streaming is visible inside the card while the transform is in flight).
- **Not a comparison / multi-pane surface** (unlike `council` / `constellation` / `perspective-deck` / `lens-ab-runner` / `reply-shape-ab`) — it's a single-pane side card per bubble.
- **Not memory / RAG / fork** (unlike `memory-vault` / `local-notes-rag` / `conversation-forking`).
- **Not voice / TTS** (unlike `voice-forge` / `voice-input` / `message-tts`).
- **Not code execution** (unlike `code-studio`).
- **Not annotation / notes** (unlike `sticky-board`).
- **Not telemetry / observability** (unlike `engine-telemetry`).
- **Not post-reply classification** (unlike `reply-audit`) — the transformer *produces new content*, not classifies existing content.

The transformer is the first **interactive per-message re-generation** surface in the project. It's an orthogonal axis: it writes to the model, not reads from it; it triggers a new generation, not just inspects one.

## Try it

Interact with the embedded demo above, or <a href="/ux/style-transformer/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Load the 1B model.
2. Send any prompt and wait for a reply.
3. Notice the 6-button strip below the assistant bubble.
4. Click **▸ Concise** — watch the side card slide in and stream the rewrite.
5. Click **↺ swap** to replace the original with the concise version.
6. Try **• Bullets** on a different reply — the same content becomes a markdown bullet list.
7. Try **§ Formal** on a casual reply — watch the model shift register.
