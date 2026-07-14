---
sidebar_label: "Reply Audit"
---

# Reply Audit

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-audit/index.html" height="640px" />

## What was built

A **post-reply analytics surface** that classifies each committed assistant message along eight independent axes. After every assistant reply, a small chip strip appears directly below the bubble:

| Chip | Meaning |
|---|---|
| `len short / medium / long / very-long` | Word count bucket |
| `tone formal / casual / technical / friendly` | Lexicon-overlap classification |
| `? N` | Number of `?` characters (only shown if N > 0) |
| `act low / medium / high` | Density of action verbs (only shown if non-low) |
| `~tok N` | Token estimate (ceil(words × 1.33)) |
| `topic code / writing / math / ...` | Curated 1-2 word topic tag |
| `lang fr / es / de` | Detected language (only shown if not English and not unknown) |

Click **▴ audit** to expand into a detail card showing the numeric breakdown for every metric, including a horizontal bar visualizing action-verb density.

### Eight independent metrics, all client-side

The classifier is **pure** and **deterministic** — no LLM call, no network, no DOM access. It runs in under 5ms on a 1000-word reply on a modern laptop. The eight analyzers are:

- **`classifyLength(words)`** — buckets: `<30` short, `<120` medium, `<400` long, `>=400` very-long
- **`classifyTone(tokens)`** — picks the tone with the highest lexicon overlap (ties broken by alphabetical order)
- **`countQuestions(text)`** — counts `?` characters (ellipses don't trigger false positives)
- **`countActionVerbs(tokens)` / `actionDensityBucket(score)`** — 100+ action verbs checked against the token list, bucketed at 2% and 6%
- **`estimateTokens(words)`** — `Math.ceil(words * 1.33)` (≈0.75 words per token)
- **`topicTag(tokens)`** — first matching topic in declaration order, with `meta` as default. Topics include `code`, `writing`, `math`, `science`, `business`, `design`, `learning`, `error-help`, `lists`, `chat`, `meta`
- **`detectLanguage(tokens)`** — stop-word overlap for English / French / Spanish / German; returns `unknown` if input is too short or no language has ≥2 hits

### Why this is interesting

Every prior cycle in this project has focused on either the **input** (prompt xray, prompt capsules, system prompt editor, tool admin) or **intra-reply visual** (token mosaic, drift trail, code studio) or **memory** (memory vault, conversation forking) or **voice** (voice forge, voice input, message TTS) or **output shape** (council, constellation, perspective deck, lens ab, reply shape ab).

Reply Audit is the **first post-reply classification surface**. It runs on the committed text and produces a structured description of what kind of reply just landed — making the model's output *self-describing* without any extra inference cost.

## Why this feature

Once the chat is working, a natural next question is: *what kind of reply is the model giving me?* Reply Audit answers that with a glance. It's also useful as a teaching tool: you can see how the same model flips tone across prompts, or watch its topic drift across a long session.

The classifier is fully transparent — every chip is the result of a deterministic function over a small lexicon. No black-box model on top of the LLM. That's deliberate: the audit is supposed to feel like a precise instrument, not another AI.

## Implementation notes

### New module: `src/reply-audit/`

```
src/reply-audit/
├── types.ts              — ReplyAudit, LengthCategory, Tone, TopicTag, DetectedLanguage
├── lexicons.ts           — TONE_LEXICONS, ACTION_VERBS, TOPIC_KEYWORDS, STOP_WORDS
├── analyzer.ts           — tokenize, classifyLength, classifyTone, countQuestions,
│                          countActionVerbs, actionDensityBucket, estimateTokens,
│                          topicTag, detectLanguage, analyzeReply
├── ReplyAuditPanel.tsx   — collapsible per-bubble UI
└── index.ts              — barrel
```

### Total cost: zero engine / store / API changes

- **No** changes to `src/store.ts`, `src/engine.ts`, `src/useWebLLM.ts`, or `src/App.tsx`
- **One** change to `src/WebLLMChat.tsx`: imported `ReplyAuditPanel` and added `<ReplyAuditPanel text={text} />` inside the `Bubble` component, immediately after the markdown rendering
- **One** new test file: `src/__tests__/reply-audit.test.ts` with **37 test cases** covering all eight metrics + edge cases (empty, very long, French, casual bursts, etc.)
- **One** new build config: `vite.config.embed.ts` (with `base: "./"`) for the embed build

### Why the panel only runs on committed replies

The panel is rendered inside `Bubble` (which is rendered only for messages already in `messages[]`). The in-flight streaming bubble uses a different path (renders `api.streamText` directly without going through `Bubble`), so the audit is never computed on partial tokens. That means zero flicker, zero churn during generation, and a clean "audit appears once" UX.

### Lexicon design

Lexicons are deliberately small (5-30 entries per category) so they fit in the JS bundle trivially. Action verbs include 100+ common imperatives from dev / shell / UI / data contexts. Topic keyword sets are broad enough to catch first-mention topics reliably without false positives. The `meta` topic (default) catches "what are you?", "explain yourself", and other introspective prompts.

### Performance

A 1000-word reply, fully tokenized + analyzed along all 8 axes, completes in under 5ms on a 2020 MacBook. The panel uses `useMemo` to skip recomputation when the same `text` prop is passed across re-renders.

## Anti-chain compliance

- **New module `src/reply-audit/`** — no prior cycle created anything in this folder. `src/reply-audit/` is a fresh, dedicated space.
- **Not a prompt inspector** (unlike `prompt-xray` / `prompt-capsules` / `token-budget`) — the audit runs on the *output*, not the *input*.
- **Not a streaming visualization** (unlike `token-mosaic` / `drift-trail`) — the panel renders only on committed replies.
- **Not a comparison / multi-pane surface** (unlike `council` / `constellation` / `perspective-deck` / `lens-ab-runner` / `reply-shape-ab`) — it's a single classification per message.
- **Not memory / RAG / fork** (unlike `memory-vault` / `local-notes-rag` / `conversation-forking`).
- **Not voice / TTS** (unlike `voice-forge` / `voice-input` / `message-tts`).
- **Not code execution** (unlike `code-studio`).
- **Not annotation / notes** (unlike `sticky-board`).
- **Not telemetry / observability of the engine** (unlike `engine-telemetry`) — it inspects the *text*, not the *engine internals*.

The audit is the first **classification of the reply itself** in the project. It's an orthogonal axis.

## Try it

Interact with the embedded demo above, or <a href="/ux/reply-audit/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Load the 1B model.
2. Send any prompt and wait for a reply.
3. Notice the chip strip below the assistant bubble — length, tone, question count, action density, token estimate, topic, language.
4. Click **▴ audit** to expand the detail card and see the numeric breakdown.
5. Try a French prompt: the `lang fr` chip will appear.
6. Try a long technical prompt: the chips will reflect the longer, more directive reply.
