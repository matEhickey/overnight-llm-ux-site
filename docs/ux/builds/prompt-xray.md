---
sidebar_label: "Prompt X-Ray"
---

# Prompt X-Ray

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/prompt-xray/index.html" height="640px" />

## What was built

A collapsible panel mounted below the chat input reveals the **exact wire payload** the engine sends to WebLLM at inference time. Four sections:

- **Header strip** — `round N / maxRounds` badge, message count, tool count, last-update timestamp. Empty placeholder reads `(empty — send a prompt)` until the first inference round completes.
- **messages[]** — the OpenAI-compatible messages array, one row per message with role-coded background (slate=system, blue=user, green=assistant, purple=tool). Each row shows the role + name (for tool messages) + a truncated preview; expand via `<details>` to see the full content. When an assistant message carries `tool_calls`, they render inline as `→ fn: tool_name(args_preview)`.
- **tools[]** (only when function-calling model + tools enabled) — one card per tool definition with the name, parameter count, and description.
- **sampling** — `temperature`, `max_tokens`, `stream`, `stream_options`, `tool_choice`, and the round counter as a small key-value grid.

Each section has a `📋 Copy` button that serializes that section as JSON to the clipboard. A larger `📋 Copy entire payload as JSON` button at the bottom copies everything.

A round-context banner above the sections tells the user **what the engine is doing right now**: green "no tool calls yet — tools will be offered" on the first round, amber "tool calls occurred — next round drops tool definitions to force text response (Hermes behavior)" once the model has invoked a tool.

## Why this feature

Every prior cycle changed either what the user **types** or what the model **outputs**. Prompt X-Ray changes what the user **sees about the inference loop itself** — the seam between their UI and the model's wire protocol. It's a meta-observability tool.

It also surfaces a previously-hidden WebLLM behavior: when `tools` are enabled, the engine **strips the user's system prompt** because Hermes-2-Pro / Hermes-3 inject their own hardcoded function-calling prompt and reject user-supplied ones. The user can watch their "You are a helpful assistant" disappear from the wire the moment they tick the tools checkbox — a genuinely surprising reveal that nobody could see before.

It enables copy-paste debugging: paste the wire JSON into a ChatCompletion playground or a forum post to show exactly what your browser sent to the model, with no paraphrase.

## Implementation notes

The implementation is deliberately small and additive. One new `EngineEvent` variant — `{ type: "wire"; payload: XRayWirePayload }` — is emitted by `engine.ts` immediately before each `await engine!.chat.completions.create(request)` call. The payload captures:

- the `apiMessages` array (the OpenAI-compatible messages the engine actually sends, after the system-prompt-strip when tools are enabled),
- the tool definitions (only when `useTools && !toolCallsOccurred`),
- the sampling params (`temperature`, `max_tokens`, `stream`, `stream_options`, `tool_choice`),
- the round counter and `toolCallsOccurredInRound` flag.

`useWebLLM.ts` handles the new event variant with a single `s.setWirePayload(e.payload)` call in the existing switch. `store.ts` adds a `wirePayload` slice. `WebLLMChat.tsx` renders `<XRayPanel />` below the input.

The X-Ray panel itself is pure React — no chart library, no SVG, no new dependencies. It uses the `navigator.clipboard.writeText` API with a `document.execCommand('copy')` fallback. Role colors are defined as a constant table (`ROLE_STYLES`).

**Key files:**

- `src/prompt-xray/types.ts` (new) — `XRayWirePayload`, `XRayWireMessage`, `XRayToolDefinition`, `XRaySamplingParams`, `ROLE_STYLES`, `serializeForCopy`, `preview`, `formatTime`
- `src/prompt-xray/XRayPanel.tsx` (new) — the collapsible panel UI
- `src/prompt-xray/index.ts` (new) — barrel
- `src/types.ts` — additive `wire` event variant
- `src/engine.ts` — one new `emit` call before `chat.completions.create`
- `src/store.ts` — additive `wirePayload` + `setWirePayload` slice
- `src/useWebLLM.ts` — additive `case "wire"` handler
- `src/WebLLMChat.tsx` — additive `<XRayPanel />` render
- `src/__tests__/prompt-xray.test.ts` (new) — 13 tests for `serializeForCopy`, `preview`, `formatTime`, `ROLE_STYLES`, and round-trip serialization
- `vite.config.embed.ts` — relative-asset build config for the iframe embed (no change from 7-04)

## Anti-chain compliance

- New module `src/prompt-xray/` — no overlap with `src/token-budget/` (7-04), `src/inference-playground/` (7-03), `src/telemetry/` (6-28), `src/voice/`, `src/conversation-tree/`, `src/perspective-deck/`, `src/local-notes-rag/`, `src/export/`, `src/tools/`.
- Engine edit is purely additive: one new `EngineEvent` variant + one `emit` call. No modifications to `completeOnce`, the tool-execution loop, or sampling logic.
- Store edit is purely additive: one new slice for `wirePayload`.
- Chat edit is purely additive: one new component rendered below the input.
- Not another Mode toggle, not another persona, not another A/B runner, not another observability panel. Fresh axis: **request-body introspection**.

## Try it

Interact with the embedded demo above, or <a href="/ux/prompt-xray/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Send a prompt, then click `[▶ 🩻 Prompt X-Ray]` at the bottom of the chat. Watch the messages array populate. Tick the `tools` checkbox in the Configuration panel above the chat, send another prompt, and watch the system message disappear from the wire.