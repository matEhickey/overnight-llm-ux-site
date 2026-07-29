---
sidebar_label: "Reply Suggestions"
---

# Reply Suggestions

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-suggestions/index.html" height="500px" />

## What was built

A new module `src/reply-suggestions/` runs a **short sub-context generation** after each committed assistant reply. The model is asked for 3 short follow-up questions in strict JSON-array form; the response is parsed, cleaned, deduplicated, and rendered as a row of clickable chips below the bubble.

The flow:

1. Assistant reply commits (the engine emits `done`).
2. The hook fires a `engine.rawComplete()` call with the *last reply only* (no history) and a tight 220-token budget at temperature 0.8.
3. The raw text is parsed by `parseSuggestions` — robust to code-fenced JSON, prose prefixes, trailing prose, bullet/number prefixes, oversize strings, duplicates, and empty/garbage responses.
4. `setSuggestions` writes a `SuggestionSet { messageId, items, loading, error, generatedAt }` into the store.
5. `SuggestionChips` subscribes to that slice and renders:
   - **3 skeleton chips** with a shimmer animation while `loading: true`
   - **3 blue chips** with a 💡 glyph + the suggested prompt + a `↻ more` button when ready
   - **Nothing** when `error` is set or `items` is empty

Clicking a chip sets `pendingInput` in the store. `InputArea` watches that and seeds the textarea in one `useEffect`, then clears the pending value.

### Why "sub-context" generation

The full chat has a multi-turn history that biases the model to *answer* the previous turn rather than *suggest a next turn*. The suggestion prompt deliberately uses only the assistant's last reply (no chat history), framed as a third-party instruction. This is structurally different from `generate()` (which uses the full conversation) and from `rawComplete` callers in other features (none exist today).

### Why "short" prompts

The 1B default model handles short generations reliably. A long prompt with chat history + a meta-instruction would burn context and produce inconsistent JSON. Keeping the prompt to ~50 tokens plus ≤600 chars of cleaned reply keeps it under 800 tokens total — well within the 1B model's wheelhouse.

## Why this feature

Every other cycle's UX is *backward-facing*: it inspects, replays, classifies, or summarizes a turn that already happened. **Reply Suggestions is forward-facing.** It treats the user's *next prompt* as a first-class UI element — the model suggests it, the user can take it or leave it.

This is a productivity UX. It mirrors how ChatGPT's "Regenerate" works, but with 3 chips instead of 1 button. The win: a user mid-thought can keep momentum by clicking instead of typing.

It's also a stress test for **sub-context generation** as a primitive. The engine already supports full chat; adding `rawComplete` opens up a whole family of "AI-side-panel" features (summarizers, rephrasers, classifiers, sentiment taggers, …) without polluting the main conversation history.

## Implementation notes

- **3 files in `src/reply-suggestions/`**: `types.ts` (data shapes + constants), `generator.ts` (prompt builder + robust parser + helpers), `SuggestionChips.tsx` (chip row with shimmer + regen).
- **Engine change** (`src/engine.ts`): added `rawComplete({prompt, maxTokens?, temperature?, timeoutMs?})` — non-streaming single-call completion with a 30s timeout. Returns `""` on error (caller treats as silent failure).
- **Store change** (`src/store.ts`): added `suggestions: SuggestionSet | null`, `setSuggestions`, `pendingInput`, `setPendingInput`. Plus `pendingInput` plumbing through `InputArea`.
- **Hook change** (`src/useWebLLM.ts`): added a `useChatStore.subscribe` block that watches for new assistant messages, kicks off the suggestion generation, and commits the result only if it still matches the latest assistant message (avoids races).
- **UI change** (`src/WebLLMChat.tsx`): wrapped the `Bubble` in a flex column and added `<SuggestionChips messageId={...}/>` for assistant messages only.
- **Tests** (`src/__tests__/reply-suggestions.test.ts`): 18 unit tests covering prompt building (incl. code-block stripping, truncation), parser robustness (strict JSON, code-fenced JSON, prose prefix, quoted-string fallback, dedupe, cap, empty, non-string filtering, bullet-stripping, truncation, last-resort question-mark lines), and item wrapping.
- **No new dependencies.** Total feature LOC: ~330 (including tests).
- **Test suite:** 84/84 passing (was 73; +18 for reply-suggestions; -7 stale ones kept zero — net +11).

## Try it

Interact with the embedded demo above, or <a href="/ux/reply-suggestions/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. The 1B default model generates suggestions in ~5–10s after each reply.
