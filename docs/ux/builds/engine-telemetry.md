---
sidebar_label: "Engine Telemetry"
---

# Engine Telemetry

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/engine-telemetry/index.html" height="600px" />

## What was built

A collapsible right-side drawer — `▶ Telemetry` in the header — that turns
the black box of WebLLM into a legible narrative. While you chat, the panel
streams five live views, all sourced from events the engine already emits
and the logger's existing 500-entry ring buffer.

- **Engine health** — model id, status dot, message count, tool call
  count, init count, "live for" duration.
- **Status timeline** — the last 5 status transitions with timestamps
  (`HH:MM:SS`), colored by kind: gray `uninitialized`, amber `loading`,
  green `ready`, blue `generating`, purple `executing_tools`, red
  `error`. Payloads render inline (`loading 67%`, `executing_tools
  [show_notification]`).
- **Token rate** — a rolling chars/sec meter computed from chunk events
  over a 1-second sliding window. Shows an ASCII bar (`▁▂▃▄▅▆▇█`) that
  scales with rate, capped at 200 chars/sec for visualization.
- **Tool call history** — the last 8 invocations with timestamp, name,
  args, and result. Empty state points to the Configuration panel.
- **Log stream** — the last 100 logger entries (newest first), with
  filter chips for `debug / info / warn / error`. Each line shows
  `HH:MM:SS.ms LEVEL scope msg`.

## Why this feature

The chain has been building *output shapes* — lenses, voices, councils,
constellations, voice forges. Every feature was about *what the model
says*. None of them addressed *what the engine is doing*.

Meanwhile, the runtime has had rich observability infrastructure on
`main` from day one: the `logger.ts` ring buffer (500 entries,
structured, exposed on `window.__logs`) and the engine's event stream
(`status / progress / chunk / tool_call / done / error`). The chat UI
shows one tiny status tag — `● ready`. Everything else was invisible
to the user.

This is the surface that exposes it. It's also directly multiplicative
for the agent-testing recipe in the README — the panel is the
instrumented view an agent needs to debug WebLLM behaviour without
resorting to devtools console scraping.

## Implementation notes

- **New module: `src/telemetry/`** — `useEngineTelemetry.ts` (hook),
  `TelemetryPanel.tsx` (drawer UI with 5 sub-components). Lives outside
  `src/App.tsx`'s existing structure. `App.tsx` got a new `showTelemetry`
  state and a `▶ Telemetry` button, but **does not extend the existing
  layout** — the panel is a flex sibling to the chat, not a mode
  toggle.
- **Engine singleton re-use** — the panel reads the same engine the
  chat uses. The telemetry hook has its own module-level singleton
  pointing at `createEngine()`, and `engine.on()` exposes the same
  events `useWebLLM` already wires. We do not duplicate engine state.
- **Throttled re-renders** — `chunk` events fire many times per second
  during streaming. The hook pushes sample deltas into a `useRef`
  buffer and a 4Hz `setInterval` reads them to update the visible rate
  + log buffer. This keeps the panel smooth even at peak token throughput.
- **Pure-logic helpers exported for testing** — `dedupeStatusTransitions`,
  `computeTokenRate`, `filterLogEntries` are all pure functions
  exported from the hook module and covered by 13 tests in
  `src/__tests__/telemetry.test.ts`. No engine boot required.
- **No new dependency** — the panel uses only React 19 + the existing
  `logger.ts` + the existing `engine.ts` events.
- **Default 1B is enough** — the panel renders before any model loads
  (status `uninitialized` shows in the timeline). Once you pick a
  model, the `loading` status with progress fills the timeline in
  real time.

## Try it

Interact with the embedded demo above, or
<a href="/ux/engine-telemetry/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Send a message — watch the token-rate meter light up, the status
timeline tick through `ready → generating → ready`, and the log
stream fill with `engine` / `useWebLLM` entries.
