---
sidebar_label: "Speech Bubble Layer"
---

# Speech Bubble Layer

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/speech-bubble-layer/index.html" height="600px" />

## What was built

A non-modal **spatial workspace** for assistant replies. Instead of every
reply being trapped in a vertical scroll, each committed assistant
message lifts out into its own floating bubble on a 2D canvas with a
Figma-style layer panel on the left.

The chat surface itself still renders inline (so the typing + streaming
loop is unchanged), but with **🪟 Layer** toggled on, every reply also
appears as a draggable bubble in the canvas to the right of the chat.

### Each bubble carries

- **Drag the header** to move anywhere on the canvas
- **Drag the bottom-right corner** to resize (clamped 200–720 × 80–640)
- **📌 pin** to lock the position (move disabled, resize still works)
- **▾ collapse** to fold the bubble down to a single-line chip showing
  the first 80 characters of the reply
- **Double-click** anywhere on the bubble to focus (expands if collapsed
  + scrolls into view)

### Header chips (per bubble)

- Message ID (last 4 chars)
- **Model family** (Llama / Qwen / Phi / Mistral / Hermes / Gemma / SmolLM)
- **Token estimate** (`~123 tok`) — sourced from `TurnRecord.tokenEstimate`
- **Tool-call badge** (`🔧 N`) — purple, only when the reply used tools
- **Response shape** glyph + label (`¶ paragraph`, `• bulleted`, `# numbered`,
  `</> code+prose`, `§ multi-section`)
- **Duration** (e.g. `1.23s`)
- **Timestamp** (UTC `HH:MM:SSZ`)

### Layer panel (left rail)

- One row per floating bubble
- Figma-style left border:
  - **📌 yellow** if pinned
  - **cyan highlight** on hover
  - **dimmed** if collapsed
- Each row shows: index, last-4 of message id, pin/collapse badges, tool
  count, token estimate, first 60 chars of content
- Buttons per row: **pin / unpin**, **collapse / expand**, **✕ remove**
- Click anywhere on a row → focus that bubble on the canvas

### Persistence

Bubble geometry (position, size, pinned, collapsed) is saved to
`localStorage` under the key `overnight-llm-ux-sbl-{messageId}` after
every change. Reload the page and your workspace comes back exactly as
you left it.

## Why this feature

The 2026-08-01 SUMMARY explicitly recommended pivoting away from Voice
Input after five consecutive failures, suggesting Speech Bubble Layer as
a different angle on the same audio/conversational theme with a smaller
surface area. The chat surface has been single-column scroll for the
entire life of the project; this is the first feature that treats
replies as **first-class spatial objects**.

It is **genuinely new on `main`**:

- New module `src/speech-bubble-layer/` — does NOT touch `src/voice-input/`,
  `src/reply-receipt/`, `src/confidence-pulse/`, or `src/conversation-tree/`.
- Different axis from last cycle: Voice Input Hold was **input-side**
  (compose-mode, hold-to-dictate); this is **output-presentation**
  (spatial workspace for inspecting assistant replies).
- Different interaction paradigm: drag/resize/pin/collapse primitives
  didn't exist anywhere on `main`. Reply Receipt is inline + read-only;
  this is overlay + interactive.
- Not a 6th mode toggle: it's a layer toggle — flipping a single canvas
  open/closed over the chat, not adding another `<select>` mode option
  to the existing Configuration panel.
- Uses only `main` types (`ChatMessage`, `TurnRecord`) — both already on
  `main`. No code from unmerged branches was imported.

## Implementation notes

### Architecture

```
src/speech-bubble-layer/
  index.ts                  # barrel
  types.ts                  # BubbleGeometry + helpers
  useBubbleGeometry.ts      # drag/resize/pin/collapse + localStorage
  SpeechBubble.tsx          # one floating bubble
  LayerPanel.tsx            # left rail layer list
  SpeechBubbleLayer.tsx     # top-level: layer + canvas
```

### Data flow

1. `App.tsx` reads `messages` and `turns` from the Zustand chat store
   (existing state on `main` — no new store slices).
2. `buildSpeechBubbleData(messages, turns, modelId)` converts them into
   `SpeechBubbleData[]` — filtering out user / system / empty messages,
   attaching per-turn metadata when available.
3. `SpeechBubbleLayer` renders the layer panel + canvas; each bubble is
   a controlled component whose geometry is held in a `Map<id, BubbleGeometry>`
   in the layer's own state (not the global store — bubble layout is a
   workspace concern, not a chat concern).
4. Drag and resize use **pointer events** with `setPointerCapture` so
   the gesture survives the cursor leaving the bubble. Math is in
   `SpeechBubble.tsx` itself for self-containedness; bounds-clamping
   happens in the parent's `updateGeom` against the measured canvas
   size (tracked via `ResizeObserver`).

### What gets persisted vs not

| Persisted (`localStorage`) | Not persisted |
|---|---|
| Each bubble's `x / y / w / h / pinned / collapsed` | Bubble *existence* (regenerated from messages on mount) |
| Per-message, keyed by `overnight-llm-ux-sbl-{messageId}` | Canvas size (measured live) |

### Dependencies

**None added.** All built on React 19 + the existing Zustand store +
plain CSS positioning. No new runtime or dev dependencies.

### Models this feature needs at runtime

**None.** The Speech Bubble Layer is a pure UI overlay on the chat
surface. It works the same whether the model is loaded or not — empty
canvas shows a hint, then bubbles appear as replies land. Default
1B model is enough; you can use any model.

## Try it

Interact with the embedded demo above, or
<a href="/ux/speech-bubble-layer/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Suggested flow:

1. Click **🪟 Layer** in the header to enable the workspace.
2. Type a prompt and wait for the reply.
3. The reply appears inline **and** as a draggable bubble in the canvas.
4. Drag the bubble around, resize it, pin it, collapse it.
5. Reload the page — your layout comes back.
6. Send a few more prompts and use the layer panel to focus, pin,
   collapse, or remove bubbles.