---
sidebar_label: "Conversation Library"
---

# Conversation Library

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/conversation-library/index.html" height="640px" />

## What was built

A **persistent, searchable archive** of every conversation the user has had with the model. Until now the chat surface was stateless — `messages[]` lived in a Zustand store, refresh wiped everything. The Library introduces a parallel `useLibraryStore` that captures every turn at commit time, persists it to localStorage, and surfaces it through a slide-out overlay with full-text search, facet filters, hit highlighting, jump-to-message navigation, and export.

### Library lifecycle

- **`beginSession(model)`** — fires on the first user `send()`. Creates a new `Session` with the active model id, an empty transcript, and `startedAt` timestamp.
- **`captureTurn(role, content)`** — fires on every committed user message and every committed assistant message. Updates summary (from first user message), topics (auto-extracted from first user message), and message count.
- **`endSession()`** — fires on `reset()`. Sets `endedAt` timestamp and clears `activeSessionId`. The session stays in the archive.

### Auto-extracted metadata

- **Summary** — first 80 characters of the first user message, word-boundary truncated with `…` if longer.
- **Topics** — 1–3 keywords extracted from the first user message via length-weighted token scoring, with a `TAG_BOOST` boost for known technical terms (TypeScript, React, SQL, …, plus music terms like polyrhythm, modal, harmony).
- **Model** — the WebLLM model id active when the session began.
- **Message count, startedAt, endedAt, favorite flag** — bookkeeping.

### Search

- **Full-text** — case-insensitive token search; query is split on whitespace, tokens shorter than 2 chars are dropped.
- **Hit density** — each hit is sorted by `positions.length / content.length × 1000`, so a single match in a short message beats ten matches in a long one.
- **Snippets** — every hit shows a 100-char window centered on the first match, prefixed/suffixed with `…` when truncated.
- **Hit highlighting** — every match is wrapped in `<mark>` with a yellow background. Multi-token queries highlight longest tokens first.

### Filters

- **Date range** — inclusive `from` / `to` against `endedAt`.
- **Topic chips** — every unique topic across the library, click to toggle. Counts shown in the hover title.
- **Model chips** — every unique model id, truncated to 24 chars in the chip with the full id in the tooltip.
- **Clear filters** button appears whenever any filter is active.

### Jump-to-message

Clicking a search hit:
1. Sets `selectedHitMessageId` in the store.
2. Loads the source session into the live chat if it isn't already loaded.
3. Calls `scrollIntoView({ behavior: "smooth", block: "center" })` on the bubble after a 60 ms tick (lets React render first).
4. The targeted bubble gets a pulsing yellow outline (`data-message-id-highlight="true"`) that auto-clears after 3 seconds.

### Session cards

In the "All Sessions" tab, each card shows:
- Summary (clickable to load the session into the live chat)
- Model id (monospace chip)
- Topic tags (green chips)
- Message count + ended-at date
- **Density strip** — a tiny bar chart where each message is one segment, height = content length. Lets you see conversation shape at a glance.
- **Favorite toggle** (☆ / ★)
- **Delete button** (with confirm)

### Export

Click the **⬇ export** button in the panel header → choose JSON or Markdown. Both contain the filtered hit set plus full session metadata. Downloads use a Blob URL + temporary `<a download>` click.

### Persistence

Single localStorage key: `overnight-llm-ux-cl-v1` → `{ version: 1, sessions: Session[] }`. The schema is versioned so future migrations can branch on `version`. On first load, the library seeds itself with six demo sessions so the panel has content immediately.

## Why this feature

Every previous cycle — Reply-Receipt, Reply-Suggestions, Speech-Bubble-Layer, Sticky-Board, Code-Studio — operated on the **live** `messages[]` array. None of their work survived a page reload. The chat session is the *unit of value* but it was disposable.

The Library turns the ephemeral stream into a **persistent archive**. It also makes every other UX surface more valuable: Reply-Receipt's provenance, Speech-Bubble-Layer's spatial bubbles, Sticky-Board's scratch notes — they all become *retrievable artifacts* once they live in the Library.

This is genuinely new on `main`:

- **No persistence layer exists** anywhere in the codebase. The closest precedent is single-session `feature/conversation-export` / `feature/conversation-cassette` (both unmerged feature branches).
- **No search, filters, or jump-to-message** has been built before. Reply-Receipt's search is per-receipt within the live session only.
- **No auto-extracted metadata** (topics, summaries) has been generated anywhere.
- **New module** at `src/conversation-library/` — fully orthogonal to speech-bubble-layer (last cycle's module).

## Implementation notes

- **New store**: `useLibraryStore` — separate Zustand store, one-way coupling from `useWebLLM` (chat → library) so the library can't accidentally re-render the chat.
- **No new dependencies**. All search runs over `messages[]` arrays directly. Topic extraction is a small heuristic in `extract.ts`.
- **Highlight algorithm**: `SearchHitRow` walks the snippet character by character, trying the longest query token first at each cursor. This handles overlapping tokens and unequal-length matches correctly without pre-computing match lengths in the search phase.
- **Capture is idempotent**: `captureTurn` appends a new `ChatMessage` to the session each time it's called. The user and assistant calls happen in distinct event handlers (`send()` for user, `case "done"` for assistant) so the same message isn't captured twice.
- **Empty-state UX**: when the library is empty, six seed sessions ship pre-baked. Each has at least 4 messages on a different topic so the search box has something interesting to find on first open.
- **Local-only**: no backend, no IndexedDB (localStorage is fine for the 5–10 MB ceiling and the synchronous read keeps the first-render cheap).
- **Demo path**: open the embedded iframe, click 📚 in the header, type `polyrhythm` or `typescript` in the search box. Hits render with `<mark>` highlights; click any hit to jump.

## Try it

Interact with the embedded demo above, or <a href="/ux/conversation-library/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
