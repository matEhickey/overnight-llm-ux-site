---
sidebar_label: "Inference Playground"
---

# Inference Playground

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/inference-playground/index.html" height="640px" />

## What was built

A header toggle next to **Configuration** opens the Inference Playground — a panel that surfaces the five sampling parameters WebLLM accepts on `chat.completions.create()` but the engine has been silently hardcoding (`temperature: 0.7`, `max_tokens: 4096`) since day one.

The panel has three sections:

- **Sliders** for `temperature` (0–2.0), `top_p` (0–1.0), `repetition_penalty` (0.5–2.0), `frequency_penalty` (-2.0–2.0), and `max_tokens` (64–2048). Values are persisted to `localStorage` (key `overnight-llm-ux-sampling`) so the next session picks up where you left off.
- **Sweep axis picker** + a **test prompt textarea**. Pick `temperature` and click ▶ Run sweep, and the engine runs four completions in parallel with `temperature ∈ {0.2, 0.7, 1.0, 1.4}` — keeping all your other slider values constant.
- **2×2 result grid**. Each cell shows the axis label + the value used, the response text (rendered as Markdown, same renderer the chat uses), and stats — `chars · words · chars/sec · ms`. Cells fill in as each completion finishes; a "⚠ likely truncated at max_tokens" hint surfaces when `finish_reason === "length"` is detected.

The panel is gated on `status.kind === "ready"` (model loaded), with the four completions running in parallel via `Promise.all`. No streaming is used at the playground level — non-streaming completions are simpler to coordinate and the 4 cells can finish in roughly the same time as one streaming run.

## Why this feature

The chain has built *output shapes* (lenses, voices, councils, constellations), *input modalities* (voice), *observability surfaces* (telemetry), and *conversation structures* (forking). None of them changed *what the user could control* about the model's behavior — they all kept the engine's silent `temperature: 0.7` and `max_tokens: 4096` defaults.

WebLLM, like most OpenAI-compatible runtimes, supports a rich sampling-parameter set:

```
temperature       (0.0–2.0)   higher = more random
top_p             (0.0–1.0)   nucleus sampling
repetition_penalty (0.5–2.0)  discourages repeats
frequency_penalty (-2.0–2.0)  penalizes already-frequent tokens
max_tokens        (64–2048)   cap on completion length
```

These are documented, supported, and accepted by `engine.chat.completions.create({ ... })`. But until today, none of them were visible in the UI. The Inference Playground is the surface that exposes them — and adds a *compare* loop (the 2×2 sweep) so the user can see, side-by-side, what each knob actually does to a fixed prompt.

This is also directly multiplicative for prompt-engineering workflows: the user can copy a system prompt + user prompt from chat, paste them into the playground's textarea, and iterate on parameters without burning conversation turns or losing context. Once they find a parameter set they like, they can copy the response back into chat with confidence.

## Implementation notes

### New module — `src/inference-playground/`

```
src/inference-playground/
  SamplingParams.ts            — type, defaults, ranges, LS persistence, clamp/validate
  playground.ts                — pure helpers (buildSweep, summarizeResult, formatValue)
  PlaygroundPanel.tsx          — UI: sliders + prompt + sweep button + 2×2 grid
  index.ts                     — public re-exports
src/__tests__/inference-playground.test.ts — 12 unit tests (pure helpers, persistence)
```

### New engine method — `completeOnce`

```ts
interface CompleteOnceOptions {
  prompt: string;
  sampling: { temperature, top_p, repetition_penalty, frequency_penalty, max_tokens };
  systemPrompt?: string;
}

interface CompleteOnceResult {
  text: string;
  durationMs: number;
  charCount: number;
  finishReason: string;
}

interface ChatEngine {
  // ...existing methods
  completeOnce(opts: CompleteOnceOptions): Promise<CompleteOnceResult>;
}
```

Backed by `engine.chat.completions.create({ messages, ...sampling, stream: false })` — non-streaming, stateless, returns the final text + the time taken + WebLLM's `finish_reason`. The playground awaits all 4 in parallel via `Promise.all` and the engine serializes them through its single underlying worker.

Exposed on the `useWebLLM` hook as `llm.completeOnce` so any future panel (e.g., a prompt-CMS, an A/B test runner) can reuse it without touching `engine.ts` again.

### `App.tsx` integration

- Added `showPlayground` state and a `▶ Playground` toggle in the header (right next to `▶ Configuration`).
- The panel renders *below* the Configuration drawer (so they can be open together), not as a Mode toggle.
- The `useWebLLM` hook is now also called from `App.tsx` so it can pass `llm.completeOnce`, `status.kind === "ready"`, and the current `systemPrompt` to the playground.

### Pure helpers + tests

The sweep logic is pure (`buildSweep(axis, base)` returns 4 `SamplingParams` identical except on `axis`), so it's tested without an engine boot. 12 tests cover: sweep shape, immutability of `base`, `summarizeResult` for empty/normal/truncated inputs, `formatValue` for integer vs float axes, `clampSampling` boundary cases, `validateParam`, and the `localStorage` round-trip (gracefully skipped when localStorage is unavailable, e.g. in vitest's node env).

### No new dependency

Same React 19 + WebLLM 0.2 + the existing `engine.ts` + the existing `react-markdown` / `remark-gfm` (already used for chat message rendering). The playground reuses the chat's Markdown renderer so responses render the same way in cells as in chat.

### Default 1B is enough

The playground inherits whichever model the user picked in Configuration. The default is `Llama-3.2-1B-Instruct-q4f32_1-MLC` and is plenty for parameter exploration — the playground's default `max_tokens=256` keeps each completion under a few seconds on the 1B model. Heavier models work too; cells just take longer.

## Try it

Interact with the embedded demo above, or
<a href="/ux/inference-playground/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Pick `temperature` as the sweep axis, leave the sliders at their defaults, and click ▶ Run sweep. Watch the four cells fill in: the same prompt answered four times, with the *only* difference being `temperature ∈ {0.2, 0.7, 1.0, 1.4}`. The 0.2 cell will be conservative and repetitive; the 1.4 cell will wander and surprise you. That's the playground's whole point — see the knobs move.