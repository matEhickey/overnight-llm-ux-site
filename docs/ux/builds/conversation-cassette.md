---
sidebar_label: "Conversation Cassette"
---

# Conversation Cassette

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/conversation-cassette/index.html" height="640px" />

## What was built

A `▶ Cassette` button in the chat header opens a floating cassette-tape-styled panel that **animates a replay of the finished conversation** at variable speed. Pure UI — the model isn't touched.

### The panel

- **Two reels** — A and B, side by side, with a CSS-spinning hub while playback is running. Labels underneath.
- **LCD-style counter** — `mm:ss.cc` (minutes, seconds, centiseconds), tabular-nums, glowing amber on dark, like a vintage tape-deck readout. Shows current playback position and total timeline length (`00:42.13 · 12 ev · 00:48.20`).
- **Tape window** — the animated conversation appears here. Each user message fades in over 500ms with a blue bubble. Each assistant reply types itself out **char-by-char over the recorded `durationMs`** from the Reply Receipt slice, with a blinking caret while typing. A side-tag (`A` for user, `B` for assistant) sits in each bubble.
- **Controls** — `↺` reset (rewinds to t=0), `▶ / ⏸` play-pause (or `■` when at end), `0.5× / 1× / 2× / 4×` speed selector, `×` close.
- **Footer** — `SIDE A — user · SIDE B — assistant` legend, plus a hint `space ⇄ play/pause · esc ⇄ close`.
- **Keyboard** — `Space` toggles play/pause (ignored while focus is in an input). `Esc` closes the panel. The chat header itself is unaffected; the cassette panel is an overlay.

### How playback works

The store captures a chronological event log during normal chat operation:

```ts
interface CassetteEvent {
  kind: "user" | "assistant";
  messageId: string;     // → messages[].id
  at: number;            // ms since cassette origin (relative)
  durationMs?: number;   // assistant only — recorded generation time
}
```

A single playback cursor (ms) advances in real time × speed multiplier. Each event is rendered by a small `Frame` helper:

- **User event** at `at`: bubble opacity ramps from 0 → 1 over 500ms (`opacity = (cursor - at) / 500`).
- **Assistant event** at `at`: text is sliced to `charsShown = floor((cursor - at) / durationMs * text.length)` and rendered with a blinking `▍` caret while `playing && charsShown < text.length`.

The cursor advances via `requestAnimationFrame` while `playing` is true. At `cursor >= totalMs` playback stops automatically and the play button switches to a `■` end-state.

### Cassette origin

The cassette origin (`cassetteStartMs`) is set on the first `send()` — there is exactly one origin per session. All events use `performance.now() - origin` for `at`, so the timeline is stable across re-renders and unaffected by wall-clock drift. `reset()` and `unload()` clear the origin.

## Why this feature

The chat on `main` has accumulated many **inspection** surfaces — Reply Receipt (provenance), Reply Audit (text classification), Reply Diff (regenerate-and-compare), Token Budget (session totals). What it has not had is a **re-experience** surface: a way to re-watch the conversation unfold as if it were happening again, at variable speed, with the actual recorded timing.

Conversation Cassette is the first time-based playback primitive. It treats the transcript as a **time-indexed artifact**, not a static document. Three concrete wins:

1. **Slow it down** — when a 1B model streams 200 chars in 800ms, the eye misses structure. At `0.5×` you can watch sentence boundaries emerge and catch drift you didn't notice live.
2. **Speed it up** — `4×` lets you skim long sessions as if fast-forwarding.
3. **Re-feel the pacing** — inter-turn gaps are preserved exactly. A 4-second pause between your prompt and the reply still takes 4 seconds (× speed). The cassette is honest about the conversation's actual rhythm.

It's also a deliberately **playful** aesthetic — the second analog-metaphor UI in the project after Reply Receipt (POS receipt) on 7-16. Cassette tapes belong to the same era of physical media.

## Implementation notes

### New module: `src/cassette/`

```
src/cassette/
├── Cassette.tsx       — fixed-position overlay panel + Cassette + Frame + Reel helpers
├── index.ts           — barrel
└── (tests live in /src/__tests__/cassette.test.ts)
```

### Total cost: additive across the board

- **`src/types.ts`** — no changes.
- **`src/store.ts`** — new `CassetteEvent` interface + 3 new fields (`cassetteEvents`, `cassetteStartMs`, with the type on `CassetteEvent` already re-exported) + 4 new methods (`pushCassetteEvent`, `clearCassetteEvents`, `setCassetteStart`, `clearCassetteStart`). All existing methods are untouched.
- **`src/useWebLLM.ts`** — `send()` captures `performance.now()` and pushes a user cassette event with relative timestamp; on the first send, the origin is anchored. In the `done` case, the new code locates the most recent user cassette event and pushes an assistant event with `at = userEvt.at + record.durationMs` (the recorded generation duration from the Receipt slice). `reset()` and `unload()` clear the cassette slice.
- **`src/engine.ts`** — **zero changes**.
- **`src/App.tsx`** — **zero changes**.
- **`src/WebLLMChat.tsx`** — `▶ Cassette` button added to the header (between status tag and reset); `<Cassette open={…} onClose={…} />` rendered at the bottom of the root. Two new state lines and a few extra JSX nodes — nothing more.
- **`src/__tests__/`** — one new file `cassette.test.ts` with **18 test cases** covering the store slice (push / clear / start-clear round-trip / hook-anchor simulation / 100-event burst), relative-offset invariants, total timeline computation, speed-multiplier math, Frame rendering formulas, and the `mm:ss.cc` formatCursor contract.
- **`tests`** — `store.test.ts` and `reply-receipt.test.ts` updated to include the new fields in their `setState` reset blocks (additive, doesn't break any existing case).

### Why relative timestamps, not wall-clock

`cassetteStartMs` is captured via `performance.now()` at the first `send()`. All events use `(now - origin)` as `at`. This decouples the timeline from page-mount time, model-load time, and any other pre-roll events. The cassette always starts at `00:00.00` regardless of when the page loaded or how long the model took to download.

### Why a separate origin from `turnStartMs`

`turnStartMs` is per-generation — it gets set at the start of each `send()` and cleared on `done`. The cassette origin is per-session — it's set once on the first send and persists until `reset()`. Different lifecycle, different purpose. Keeping them separate avoids fragile cross-coupling between the Receipt and Cassette slices.

### Animation performance

- One `requestAnimationFrame` loop running while `playing` is true. Cursor advances at `realDelta × speed`, clamped to `totalMs` at the end.
- Per-frame work: walk `events[]` (length = conversation length, usually &lt; 50 events), compute a small math expression per event. Trivial.
- `Frame` renders conditionally — user events hide when phase < -100, assistant events hide when phase < 0. So as the cursor advances, late events unmount cleanly without re-rendering the earlier ones (React handles that automatically via the `key={…}` map).

### UI motion

- Reel hubs spin via a single `@keyframes cas-spin` (`0deg → 360deg` over 1.4s, linear, infinite). Keyframes injected once on first render of the cassette panel.
- Assistant caret blinks via inline `animation: cas-blink 1s steps(2, end) infinite` on the `▍` glyph. Same keyframe is reused (added to the same `<style id="cassette-keyframes" />` block).

No new dependencies. No CSS frameworks.

## Anti-chain compliance

- **New module `src/cassette/`** — does not exist on main prior to this cycle. Reply Receipt stays in `src/reply-receipt/` (7-16), Reply Diff in `src/reply-diff/` (7-21), and the empty `src/confidence-pulse/` from the timed-out 7-22 cycle stays empty (off-limits per directive).
- **Not a per-turn provenance surface** (unlike `reply-receipt`) — the cassette plays back the actual conversation, it doesn't read out generation stats.
- **Not a regeneration surface** (unlike `reply-diff` / `style-transformer`) — the cassette never touches the engine.
- **Not a comparison pane** (unlike `council` / `constellation` / `perspective-deck` / `lens-ab-runner` / `reply-shape-ab`).
- **Not a per-message classifier** (unlike `reply-audit`) — the cassette animates, it doesn't classify.
- **Not annotation / memory / fork** (unlike `sticky-board` / `memory-vault` / `conversation-forking`).
- **Not a prompt or token inspector** (unlike `prompt-xray` / `prompt-capsules` / `token-budget` / `token-mosaic`).
- **Not voice** (unlike `message-tts` / `voice-input` / `voice-forge`).

The cassette is the first **time-based playback** primitive in this project. It's an orthogonal axis: it answers *"how did this conversation unfold?"* rather than *"what does it say?"*, *"how was it made?"*, *"what does it mean?"*, *"how can I reuse it?"*.

## Try it

Interact with the embedded demo above, or <a href="/ux/conversation-cassette/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Load the 1B model (`Llama-3.2-1B-Instruct-q4f32_1-MLC`).
2. Send two prompts and wait for both replies — you'll see the orange `▶ Cassette` button in the header.
3. Click `▶ Cassette` — the panel opens.
4. Press `▶` (or `Space`) — the cassette plays back: user bubbles fade in, assistant bubbles type themselves out at the recorded speed.
5. Click `4×` — playback accelerates. Click `0.5×` — playback slows. Click `↺` to rewind.
6. Press `Esc` to close. Press the header button again to reopen.
7. **Send a third prompt** mid-conversation (cassette closed), then reopen — the new turn is included at the end of the timeline.