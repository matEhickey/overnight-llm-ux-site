---
sidebar_label: "Reply Receipt"
---

# Reply Receipt

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-receipt/index.html" height="640px" />

## What was built

A **POS-receipt-styled provenance card** attached to every committed assistant message in the chat. Two pieces:

### 1. Corner stamp (always visible)

A small monospace badge in the bottom-right of every assistant bubble, e.g.:

```
¶  1.23s  #0003
```

Reading left to right:

| Glyph / field | Meaning |
|---|---|
| `¶` / `•` / `#` / `&lt;/&gt;` / `§` | Response shape — paragraph / bullets / numbered / code+prose / sections (see below) |
| `1.23s` | Wall-clock generation duration from the user's `send()` to the assistant message commit |
| `T` (optional, purple) | Tool calls occurred during this turn. The number after the T is the count. Pulses while the receipt is open. |
| `#0003` | Receipt number — 1-indexed, monotonic across the session |

Hover the stamp to see a tooltip with the full summary.

### 2. Receipt card (expanded on click)

Click the stamp and a cream-colored, dashed-border receipt card slides out below the bubble. Visual treatment is deliberately **POS-receipt** — monospace, dotted dividers, "📠 REPLY RECEIPT" header, "✂ tear here" footer, monospace numerals.

The receipt body lists:

```
📠 REPLY RECEIPT                #0003
overnight-llm-ux · 06:23:11Z

duration          1.23s
tok estimate      ~42
prompt            56 chars
shape             ¶ paragraph
tool calls        0

─ ─ ─ ✂ tear here ─ ─ ─

session turns      3
session duration   4.50s
session tokens     ~120
session prompt     142 chars
session tool calls 2

[ close receipt ]
```

- **duration** — `performance.now()` delta from `send()` to `done` event
- **tok estimate** — `Math.ceil(words × 1.33)` (≈0.75 words per token)
- **prompt** — character count of the user message that triggered this reply
- **shape** — heuristic classifier with 5 categories + `empty`
- **tool calls** — counter that increments for every `tool_call` event fired during the generate loop

The session footer at the bottom is **always live** — it re-renders whenever any other turn completes in the same session. So clicking open an old receipt mid-session shows the current totals, not the totals at the time the message landed.

### Five response shapes

The `classifyResponseShape` heuristic returns one of five categories:

| Shape | Trigger |
|---|---|
| `single-paragraph` | Plain prose, no headings, no lists, no code fences |
| `bulleted-list` | ≥2 lines starting with `-` or `*`, >50% of non-blank lines |
| `numbered-list` | ≥2 lines starting with `digit.`, >50% of non-blank lines |
| `code-with-prose` | Contains a triple-backtick fence |
| `multi-section` | ≥2 markdown headings (H1–H6) |
| `empty` | Whitespace-only |

Each shape gets its own glyph: `¶`, `•`, `#`, `&lt;/&gt;`, `§`, `·`. The classifier lives in `src/reply-receipt/classifier.ts` and is pure / deterministic / ~30 lines.

## Why this feature

There were three angles the project had not yet covered, all of them small but persistent:

1. **Performance transparency** — a user generating with a 1B model on a phone will see variable latency (5–30s per reply). Right now there is no UI for "where did the time go?". Reply Receipt answers it at a glance, on every reply.

2. **Token awareness** — there is a token-budget meter for session totals. There was no per-message estimate the user could verify against their intuition ("did the model really need 200 tokens for that?"). The receipt is the missing per-message lens.

3. **Tool provenance** — when a model uses a tool, the user sees the tool-call card but loses track of how many tools were called across the session. The `T N` badge + footer total give a real running count.

The receipt is the first **POS-receipt-aesthetic** UI in this project. It's also the first per-message provenance surface that exposes wall-clock timing data to the user (not to a developer).

## Implementation notes

### New module: `src/reply-receipt/`

```
src/reply-receipt/
├── classifier.ts                       — classifyResponseShape + shapeLabel + shapeGlyph
├── types.ts                            — re-exports ResponseShape, TurnRecord
├── ReplyReceiptPanel.tsx               — corner stamp + expanded receipt card
├── index.ts                            — barrel
└── __tests__/                          — (lives in /src/__tests__/)
```

### Total cost: additive across the board

- **`src/types.ts`** — no changes needed (`ResponseShape` and `TurnRecord` live in the store)
- **`src/store.ts`** — new `ResponseShape` type + `TurnRecord` interface + 5 new methods (`pushTurn`, `clearTurns`, `setTurnStart`, `clearTurnStart`, `bumpInflightToolCalls`, `resetInflightToolCalls`) + 2 new fields (`turns: TurnRecord[]`, `turnStartMs: number | null`, `inflightToolCallCount: number`). All existing methods are untouched.
- **`src/engine.ts`** — **zero changes**. Timing is captured in the hook, not the engine.
- **`src/useWebLLM.ts`** — `send()` now calls `setTurnStart(performance.now())` and `resetInflightToolCalls()`. The `tool_call` case increments the inflight counter. The `done` case builds a `TurnRecord` from the just-committed assistant message and `pushTurn()`s it. `reset()` and `unload()` clear the receipts slice.
- **`src/WebLLMChat.tsx`** — adds `messageId` prop to `Bubble`. Two extra selectors read `turns` to find the record and compute the receipt number.
- **`src/App.tsx`** — **zero changes**.
- **`tests`** — one new file `src/__tests__/reply-receipt.test.ts` with **29 test cases** covering classifier (16 shape classification cases + edge cases), labels, store slice (8 cases for turns / counters / monotonic numbering), and integration patterns.
- **`build`** — one new config `vite.config.embed.ts` with `base: "./"` for the embed build.

### Where the timing data comes from

- `send()` captures `performance.now()` into `turnStartMs`.
- Each `tool_call` event fires `bumpInflightToolCalls()`.
- On `done`, the hook queries `useChatStore.getState()` for the just-committed assistant message, computes the wall-clock delta, token estimate, response shape, and writes a `TurnRecord`.
- `turnStartMs` and `inflightToolCallCount` are reset to `null` / `0` after the record is pushed.

This is **purely additive** to the existing event flow — no existing event is mutated, no event is consumed twice, no order changes.

### Why the corner stamp is **always** visible (not just on hover)

Two reasons:

1. The receipt number (`#0003`) is part of how the session builds identity. Hiding it would make receipts feel like interruptions rather than a thread.
2. The glyph + duration combo at 9pt monospace is **smaller than the bubble's inter-paragraph line height**, so it never disrupts reading. The hover state lifts it 1px and shifts the background to a warmer cream — that subtle motion is the only affordance.

### UI motion

- Receipt card opens with a `@keyframes rr-receipt-tear` animation: starts at `translateY(-6px) rotate(-0.4deg) opacity 0`, lands at `translateY(0) rotate(0) opacity 1` over 220ms. The slight initial rotation evokes "tearing the receipt off the roll".
- Tool-call badge pulses with `rr-stamp-pulse` (1.2s ease-in-out infinite) while the receipt is open and the badge is hovered. Off when idle.

Both keyframes are injected once on first receipt render.

### Performance

- Classifier is O(L) where L = reply length (~5ms on a 1000-word reply).
- The store subscription `s.turns.find(t => t.messageId === messageId)` is O(N) but N is the conversation length — usually less than 50. Trivial.
- The session-totals computation runs inside a `useMemo` keyed on `allTurns`.

No measurable overhead.

## Anti-chain compliance

- **New module `src/reply-receipt/`** — does not exist on main prior to this cycle. The previous cycle (Style Transformer, 7-15) lives in `src/style-transformer/`. The earlier Reply Audit (7-14) lives in `src/reply-audit/`. The new folder is unique.
- **Not a prompt inspector** (unlike `prompt-xray` / `prompt-capsules` / `token-budget`) — the receipt inspects the *output and the generation meta*, not the prompt.
- **Not a streaming visualization** (unlike `token-mosaic` / `drift-trail` / `engine-telemetry`) — the receipt appears only on committed messages.
- **Not a re-generation surface** (unlike `style-transformer`) — the receipt is read-only.
- **Not a per-message classifier** in the same family as `reply-audit` — Reply Audit produces **8 chips about the text** (length, tone, ?, action density, tokens, topic, language). Reply Receipt produces **6 fields about the generation** (duration, tokens, prompt length, shape, tool calls, session totals). Different sources, different shapes, different lenses.
- **Not annotation** (unlike `sticky-board`).
- **Not code interaction** (unlike `code-studio`).
- **Not a comparison pane** (unlike `council` / `constellation` / `perspective-deck` / `lens-ab` / `reply-shape-ab`).
- **Not memory / fork / voice** (unlike the corresponding features).

The receipt is the first **per-message provenance + generation-stats** surface in this project. It's an orthogonal axis: it answers "how was this reply made?" rather than "what does the reply say?" or "how can I reuse / style / annotate the reply?".

## Try it

Interact with the embedded demo above, or <a href="/ux/reply-receipt/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Load the 1B model.
2. Send any prompt and wait for a reply.
3. Notice the corner stamp below the assistant bubble: shape glyph + duration + receipt number.
4. Click the stamp — the receipt slides out.
5. Send a second prompt — the session footer in the first receipt updates live (you don't even need to reopen it).
6. Try a prompt that triggers a tool call (e.g. ask the model to "show me a notification that says hello"). The `T 1` badge appears on the stamp, and the receipt lists the tool-call count.
7. Send a numbered list or code-snippet prompt. Watch the shape glyph flip from `¶` to `#` to `&lt;/&gt;` automatically.
8. Click **close receipt** to tear the card off. The corner stamp remains.
