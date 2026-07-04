---
sidebar_label: "Token Budget Meter"
---

# Token Budget Meter

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/token-budget/index.html" height="640px" />

## What was built

A horizontal **token budget meter** renders between the chat header and the message list, showing
`used / context_window` with color zones:

- **Green** — below 60%
- **Amber** — 60–85%
- **Red** — 85% and above (warning banner appears at the configured threshold, default 90%)

The meter fills in real time as the model completes each round, because the engine already
requests `stream_options: { include_usage: true }` and returns `{ prompt_tokens,
completion_tokens, total_tokens }` in the final usage chunk. Until today that chunk was being
silently dropped; now it surfaces as a new `usage` engine event and feeds the meter.

A small **auto-prune toggle** sits at the right of the meter (default ON). When the context reaches
100% and auto-prune is enabled, the pruner drops the oldest non-protected messages and shows a
purple "✂️ pruned N messages" notice. The pruner guarantees two invariants: the **system message
is never dropped**, and the **most recent N messages are never dropped** (N defaults to 4 = two
user/assistant turns).

A footer line shows cumulative session stats: total rounds, total prompt tokens, total completion
tokens — useful for benchmarking how much you've spent in a long session.

## Why this feature

The chain built *output shapes* (lenses, voices, councils, constellations), *input modalities*
(voice), *observability surfaces* (telemetry), *conversation structures* (forking), and *sampling
parameters* (inference-playground). All of those changed what the model **does** or what the user
**sees**. None of them changed what happens when the conversation runs out of room.

With small models (the default 1B Llama has a context window of ~4–8K tokens), context fills
**fast** — and the failure mode is silent: the model just truncates older turns without telling
you. The Token Budget Meter makes the resource visible for the first time, and the auto-pruner
gives you a clean recovery action instead of an unannounced cut.

This is the first UX feature where the user is **managing a resource**, not shaping a prompt or
inspecting a model behavior. It's also a *resource-management* axis that's completely orthogonal
to every prior cycle.

## Implementation notes

### New module — `src/token-budget/`

```
src/token-budget/
  types.ts              — TokenUsage, CumulativeUsage, TokenBudgetSettings, PrunePlan, PruneEvent
  context.ts            — getContextWindowSize(modelId) — looks up prebuiltAppConfig.model_list
  pruner.ts             — pure: buildPrunePlan, applyPrunePlan, pickProtectedIndices, summarizePlan
  usage.ts              — pure: formatTokenCount, pct, zoneFor, zoneColor, zoneTint, addRound, …
  settings.ts           — load/save settings to localStorage with normalize + clamp
  TokenBudgetMeter.tsx  — the live UI (meter bar + numeric + warning + toggle + prune notice)
  index.ts              — barrel re-exports
src/__tests__/token-budget.test.ts — 44 unit tests (pruner, usage, settings, edge cases)
```

### New engine event — `usage`

The streaming loop in `engine.ts` already collected `usageChunk` from the `stream_options: {
include_usage: true }` request. We add:

```ts
emit({ type: "usage", usage: {
  prompt_tokens: usageChunk.usage.prompt_tokens ?? 0,
  completion_tokens: usageChunk.usage.completion_tokens ?? 0,
  total_tokens: usageChunk.usage.total_tokens ?? 0,
} });
```

This fires once per round (after a tool-call round and after the final round). The
`useWebLLM` listener wires it to `useChatStore.recordUsage(usage)` which updates `lastUsage` and
accumulates into `cumulativeUsage`.

### Pruner — pure, fully tested

```ts
buildPrunePlan(messages, {
  currentTokens: lastUsage.total_tokens,
  windowTokens: getContextWindowSize(modelId)!,
  keepLastN: settings.keepLastN,   // default 4
}): PrunePlan
```

Returns `{ dropIndices, keptCount, projectedTokens, didPrune }`. Invariants (44 tests):

1. **No prune when under threshold** (default 100% of window).
2. **Always preserve the system message.**
3. **Always preserve the last `keepLastN` messages.**
4. **Drop oldest non-protected first.**
5. **If we still don't fit after dropping everything else, leave the protected tail intact** —
   the model truncates rather than the pruner violates invariants.
6. **`didPrune: false` when there is nothing to drop.**

### Context-window lookup — no new dependencies

WebLLM's `prebuiltAppConfig.model_list[*].context_window_size` is already in the bundle.
`getContextWindowSize(modelId)` reads it directly and returns `null` for unknown models. The meter
gracefully shows "context window unknown" instead of crashing.

### Default 1B is enough

The default model is `Llama-3.2-1B-Instruct-q4f32_1-MLC` with a context window of ~4K tokens.
A couple of medium-length user/assistant turns visibly fill the meter to amber; a long monologue
pushes it past 90% and triggers the warning. Auto-prune drops the oldest turn and you see the
meter drop back to ~50% with the purple prune notice. Dramatic and demoable on the smallest model.

### No new dependency

Same React 19 + WebLLM 0.2 + the existing Zustand store + the existing engine event emitter.
The meter is a pure consumer of existing data + one new event from the engine.

## Try it

Interact with the embedded demo above, or
<a href="/ux/token-budget/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Send a few short turns and watch the meter fill up. Send a longer one and watch the warning banner
appear at 90%. Untick auto-prune, fill the context, and observe that the model silently truncates
older turns; tick it back on, fill again, and watch the purple prune notice drop the oldest
turns back to 50%.