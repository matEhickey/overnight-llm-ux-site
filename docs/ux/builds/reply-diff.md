---
sidebar_label: "Reply Diff"
---

# Reply Diff

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-diff/index.html" height="640px" />

## What was built

A **per-bubble word-level diff view** that regenerates a committed assistant reply and shows it side-by-side with the original. Below every committed assistant bubble, a small `📊 DIFF` chip appears next to the existing Reply Receipt stamp. Click it and the diff panel opens inline:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 REPLY DIFF                              ✓ done       │
│ +3 words   −5 words   =2 unchanged   Δ=−40%   ~13→8 tok │
├──────────────────────────┬──────────────────────────────┤
│ ORIGINAL                 │ REGENERATED                  │
│                          │                              │
│ The ~~cat~~ sat on the   │ The cat sat on the mat.      │
│ ~~mat,~~ lazy ~~dog,~~   │                              │
│ sleeping.                │                              │
└──────────────────────────┴──────────────────────────────┘
  7 → 5 words              [ close diff ]
```

- **Original column** — committed reply with deletions shown in red strike-through.
- **Regenerated column** — variant text with insertions shown in green.
- **Equal text** — grey, appears in both columns at the same offset.

The algorithm is a classic LCS over tokenised words. Equal tokens are stitched back together so the visual diff stays readable on long replies.

### Engine: `generateRaw()`

The variant is produced via a **new method** on the chat engine, `engine.generateRaw({systemPrompt, userPrompt, onChunk, onDone, onError})`. It runs the model in a 2-message context — `{system, user}` — without touching the main chat history or KV cache:

- No tool definitions passed → no function-calling loop possible.
- `stream_options` stripped → no usage chunks, no extra metadata.
- `engine.getMessage()` is called at the end to retrieve the final variant text.
- The original conversation is not appended to. Re-running the model 5 times in a row never grows the context.

This is the smallest possible surface area for a "what would the model have said differently?" question. The same capability could in future cycles power style reformatting, prompt-variant comparison, or a "show me the conservative vs creative path" explorer.

### Default meta-prompt

The first-cycle variant asks for a **more concise** rewrite:

```
You are an editor. Rewrite the following assistant reply to be more concise —
preserve every factual claim and intent, but tighten the wording. Output only
the rewritten reply, no preamble, no commentary.
```

A future cycle can extend the `📊 DIFF` button into a small popover with multiple meta-prompts (concise, technical, casual, formal, expanded, bullets). For this cycle the surface is intentionally a single button.

### Stats strip

Above the two columns, the panel reports:

- `+X words` — words only in the variant (green).
- `−Y words` — words only in the original (red).
- `=Z unchanged` — equal words appearing in both.
- `Δ=N%` — percent change in total word count, signed.
- `~A→B tok` — token estimate before and after, using the same `1.33×` rule as Reply Receipt.
- Generation duration in ms or s.

These stats are computed once on the `onDone` callback, then cached in the store so reopening the panel never re-runs the model. Click `📊 DIFF ↺` (the icon flips to a refresh glyph once a result is cached) to regenerate with a fresh run.

## Why this feature

The Reply Receipt panel answers *how* a reply was produced (duration, tokens, shape, tool calls). Reply Diff answers the orthogonal question: *what if the model had said it differently?* Both questions come up in real sessions — Receipt for "why was this slow?", Diff for "could it have been shorter / less formal / restructured?".

The diff is also the **first** place in the project where a second model run produces a *visible, comparable* artifact. Until now every LLM call landed in the main conversation and was either kept or discarded. Reply Diff introduces the concept of "parallel model output" without polluting the conversation history — a primitive future cycles (style transformer, persona pivots, multi-perspective answers) can build on.

## Implementation notes

### New module: `src/reply-diff/`

| File | Lines | Purpose |
|---|---|---|
| `wordDiff.ts` | ~150 | LCS-based `diffWords()`, `diffStats()`, `tokenize()`, `recompose()` — pure functions, zero dependencies. |
| `DiffButton.tsx` | ~60 | Per-bubble `📊 DIFF` trigger chip. Disabled while generating or while a diff is in flight. |
| `DiffPanel.tsx` | ~200 | Side-by-side diff view with stats strip, two-column layout, and footer close button. |
| `types.ts` | ~25 | Public type surface: `DiffOp`, `DiffSegment`, `DiffStats`, `DiffVariant`. |
| `index.ts` | ~20 | Barrel re-exports. |

### Engine extension: `engine.generateRaw()`

Added ~50 lines to `src/engine.ts`. New interface entry in `ChatEngine`:

```ts
generateRaw(opts: GenerateRawOptions): Promise<string>;
```

The implementation is a slim wrapper around `engine.chat.completions.create({messages, stream: true})` — no tool loop, no history mutation, no event emissions (callers wire up their own `onChunk` / `onDone` / `onError`). The existing `generate()` flow is untouched.

### Store extension

Added a transient slice to `src/store.ts` for per-bubble diff state:

```ts
diffInFlight: string[];                  // messageIds currently streaming
diffResults: Record<string, DiffVariant>; // cached variant + stats
diffStarted(messageId), diffFinished(messageId), setDiffResult(v), clearDiffResults()
```

`reset()` and `unload()` now call `clearDiffResults()` to keep the conversation reset clean.

### Hook extension

`useWebLLM` now exposes `diffVariant({messageId, original, prompt, onDelta, onDone, onError})`. It calls `eng.current.generateRaw(...)`, computes the word-level diff + stats once the variant lands, and caches the result in the store. The hook does not throw — errors are surfaced via `onError` and stored on the cached variant.

### WebLLMChat integration

Two small additions to `WebLLMChat.tsx`:

1. `<Bubble>` accepts a `diffVariant` prop (passed down from `MessageList`).
2. Below `<ReplyReceiptPanel>`, the assistant bubble renders `<DiffButton>` + (when open) `<DiffPanel>`.

The streaming variant text lives in local component state so the panel updates in real time without re-rendering the entire message list.

## Try it

Interact with the embedded demo above, or <a href="/ux/reply-diff/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Wait for the 1B model to download.
2. Send a normal chat message; wait for the assistant reply to commit.
3. Click the `📊 DIFF` chip below the bubble.
4. Watch the variant stream into the right column. Stats fill in once it finishes.
5. Click `close diff` to dismiss, or `📊 DIFF ↺` to regenerate.