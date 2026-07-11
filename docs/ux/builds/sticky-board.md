---
sidebar_label: "Sticky Board"
---

# Sticky Board

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/sticky-board/index.html" height="640px" />

## What was built

A persistent per-message **annotation layer**. Every message bubble
(assistant or user) gets a hover-revealed 📍 pin button. Clicking it
opens an inline popover with:

- **Color** — one of 5 swatches (yellow, blue, green, pink, purple);
  each color drives a left-border stripe on the bubble and on the
  matching board entry.
- **Tag** — freeform text, normalized to lowercase / max 24 chars
  (e.g. `fact`, `follow-up`, `question`). Optional.
- **Note** — freeform, max 500 chars (e.g. "double-check this
  tomorrow"). Optional.

Saved annotations get a permanent 📌 marker on the bubble. Clicking
the marker re-opens the popover for editing or removal.

### Right-side panel — the board

A 280 px panel on the right side of the chat lists every annotation in
the current conversation, sorted newest-first. Each entry shows:

- A color stripe (left border)
- The tag pill (if any) and a relative timestamp ("just now", "3m
  ago", "2h ago")
- A preview of the message content (markdown stripped, truncated to
  ~140 chars)
- The note (if any) under the preview

Click any entry → the chat scrolls to that message and the bubble
flashes yellow for ~1 second.

### Filter chips

As soon as you have 2+ distinct tags, a chip row appears at the top of
the board:

```
[ all (8) ] [ fact (3) ] [ question (2) ] [ follow-up (3) ]
```

Click a chip to filter the list. Click `all` or the active chip again
to clear.

### Export

A `↓` button in the board header serializes the current board as a
Markdown file grouped by tag:

```markdown
# Sticky Board

_8 annotations across 3 tags._

## fact

- **[2026-07-11 09:14] [Assistant]** Paris is the capital of France.
  - 📝 double-check timezone for the museum

- **[2026-07-11 09:18] [Assistant]** Use CORS headers in dev.
```

The file is named `sticky-board-YYYY-MM-DD.md` and downloads via a
single-shot `Blob` URL.

### Persistence

All annotations live under the `overnight-llm-annotations` key in
`localStorage`. They survive:

- Page reloads
- Model switches (the `model` prop changes → component re-mounts, but
  the App-level `annotations` state is kept across re-mounts because
  the `App` component itself isn't keyed by model)
- The `Reset` button (which clears messages but leaves annotations
  intact — they're keyed by message ID, so annotations for cleared
  messages simply become invisible until the same content recurs)

A `✕ Clear all` button (with a `confirm()` guard) wipes the board in
one click.

## Why this feature

Every prior cycle changed **what the user types or reads** in a chat —
prompt shape, output mode, telemetry, replay, memory, code. None of
them changed how the user *curates* the conversation itself.

Sticky Board is the first *personal* annotation surface in the project.
It addresses three real frustrations:

1. **"That one thing the model said 10 messages ago"** — searching the
   visible chat is friction. The board is a curated index.
2. **"I want to come back to this conversation tomorrow"** — without
   a way to mark messages, there's no hook for the next session. Tags
   give the user a vocabulary for re-finding.
3. **"I want to share the best parts of this chat with a teammate"**
   — export-as-Markdown produces a clean, readable artifact without
   dragging along the dead-ends and partial generations.

It's also the first feature that introduces a **persistent artifact
per user**. Memory Vault (7-08) injects facts into prompts but stores
no visible trace; Sticky Board gives the user *their own* artifact of
the conversation.

## Implementation notes

### Module layout

All new code lives in `src/annotations/` (new module, no overlap with
any prior cycle):

```
src/annotations/
├── annotations.ts          — types, localStorage CRUD, Markdown exporter
├── AnnotationPopover.tsx   — pin-click editor (controlled component)
├── StickyBoard.tsx         — right-side panel
├── index.ts                — barrel
└── (tests in src/__tests__/annotations.test.ts — 25 new tests)
```

### Engine / store changes

**Zero engine changes.** `src/engine.ts` and `src/llm-worker.ts` are
untouched. The chat engine never learns about annotations — they live
in App-level state.

**Zero store changes.** `src/store.ts` is untouched. Annotations are
UI-only state, kept in `App.tsx` and threaded down to the chat
component.

### `UseWebLLMOptions` changes

Three additive, optional fields:

```ts
annotations?: Record<string, AnnotationLike>;
onPin?: (messageId, { color, tag, note }) => void;
onUnpin?: (messageId) => void;
```

`AnnotationLike` is a structural type defined in `src/types.ts` (kept
inline to avoid a circular import between `types.ts` and
`annotations/annotations.ts`). The actual `Annotation` type lives in
the annotations module and satisfies the structural shape.

### `WebLLMChat.tsx` changes

The `Bubble` component grew four props (`messageId`, `annotation`,
`onPin`, `onUnpin`) and one absolute-positioned child: the pin
button + popover. A tiny `<style>` element is injected once per mount
to make the pin button visible on hover (CSS `:hover` on a sibling
class selector — the simplest possible "reveal on hover" pattern).

A global event listener (`window.addEventListener("sticky-board:jump")`)
listens for `CustomEvent<string>` payloads dispatched from the board's
"click to jump" handler. The chat scrolls the matching bubble into
view and flashes it yellow for ~1 second.

### `App.tsx` changes

- Imports `useChatStore` to observe `messages`.
- Lifts `annotations` state to `App.tsx`, persists on every change.
- Renders `<WebLLMChat>` and `<StickyBoard>` in a flex row (chat takes
  `flex: 1`, board is fixed-width 280 px).

### Markdown export

The exporter:

1. Filters out annotations whose message ID is no longer present in
   the current conversation (e.g. after a Reset).
2. Groups by tag (`(untagged)` bucket for empty-tag annotations).
3. Sorts each group by `createdAt`.
4. Strips markdown syntax from the message preview (`**bold**`,
   `_italic_`, `` `code` ``, fenced code blocks → `[code]`, links,
   headings) and escapes backtick/asterisk for safe Markdown emission.
5. Truncates previews at 140 chars with `…`.
6. Includes a footer note about `(empty message)` for assistant
   messages whose content is `null` (e.g. tool-call-only messages).

### No new dependencies

Everything is React 19 + zustand (already in the project) +
`localStorage` + a `Blob` URL for the Markdown download.

## Anti-chain compliance

- **New module `src/annotations/`** — no overlap with any of the 20
  prior cycles' modules.
- **Not a visualization** (unlike drift-trail / token-mosaic /
  prompt-xray / telemetry / engine-telemetry).
- **Not an output shape** (unlike perspective-deck / lens-ab-runner /
  reply-shape-ab / council / constellation).
- **Not a conversation-structure primitive** (unlike conversation-tree
  / conversation-forking).
- **Not sampling** (unlike inference-playground).
- **Not memory injection** (unlike memory-vault).
- **Not a system-prompt preset** (unlike the system-prompt field
  itself, which lives in Configuration).
- **Not a code-block interaction** (unlike code-studio).

The annotation axis is genuinely new on `main` — `store.ts` has no
`annotations` field, `types.ts` has no `Annotation` shape, and no
prior cycle rendered a right-side panel alongside the chat.

## Try it

Interact with the embedded demo above, or <a href="/ux/sticky-board/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Hover any message bubble → the 📍 pin button fades in.
2. Click it → pick a color, type a tag (e.g. `fact`), write a note,
   click **Save**. The bubble now shows a 📌 and the board lists the
   entry.
3. Send another message, pin it with a different tag (`question`).
4. Click the `question` chip at the top of the board → only the
   question-tagged entry shows.
5. Click any board entry → the chat scrolls back to that message.
6. Click `↓` in the board header → a `sticky-board-2026-07-11.md` file
   downloads, ready to share.

The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` is plenty — Sticky
Board has zero runtime LLM dependency. The model never gets called by
the annotation layer.