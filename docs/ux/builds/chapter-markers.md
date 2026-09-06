---
sidebar_label: "Chapter Markers"
---

# Chapter Markers

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/chapter-markers/index.html" height="600px" />

## What was built

Chapter Markers turns a long chat session into something you can navigate,
structure, and export. Three primitives:

- **A "📖 Chapters" toggle in the header.** Click it to slide in a right-side
  panel. The panel shows every chapter you've defined, with a start time, a
  message count, a Jump button (smooth-scrolls to the chapter's first
  message), and a delete button.
- **Start / End chapter controls.** When no chapter is active, the panel
  shows a name input. Type a name ("Initial exploration", "Trade-offs",
  "Final decision"), hit Enter, and the current message index becomes the
  chapter's start. From that moment every new message joins the chapter. A
  yellow "■ End current chapter" button closes the chapter at the current
  message count. Starting a new chapter auto-closes the previous one.
- **Inline dividers.** Between every pair of consecutive chapters, a thin
  gradient line renders with a pill in the middle: `📖 Chapter name · N msgs`.
  Active chapters also show a small `· active` suffix.
- **Rename by clicking the chapter name.** It opens an inline edit input.
- **Export as Markdown.** A single button produces a structured `.md` file
  with frontmatter (session date, model id, message count, chapter count)
  and one `## Chapter N — name` heading per closed chapter. Open chapters
  are skipped (they're still in progress and would be misleading in a
  document). Each message under a chapter renders as `### Role · HH:MM:SS`
  with its content. Tool calls render as a `**Tool calls:**` list.

## Why this feature

Two prior cycles on the same main branch explored *content extraction* from
messages (Reply Receipt captures per-message provenance; Source Anchors
extracts citations). Chapter Markers explores a different axis: *structure*
imposed by the user on the conversation itself.

The mental model is closer to "chapters in a book" than "tags on a tweet."
Once a session is sliced into named chapters, you can:

- Re-find a specific discussion later (jump-to from the panel)
- Hand off the conversation to someone else (export as Markdown)
- Stay oriented in long debugging sessions without scrolling

This is the first feature on main that introduces a **side panel** surface.
Other features all live inline (corners of bubbles, chip strips, etc.).
Chapter Markers opens up that side-panel vocabulary for future features.

## Implementation notes

- **Folder:** `src/chapter-markers/` (own folder — zero overlap with
  `src/reply-receipt/`).
- **Store:** separate zustand slice in `src/chapter-markers/store.ts`. The
  main `useChatStore` doesn't import it; the chat loop is untouched.
- **Persistence:** `localStorage["overnight-llm-ux:chapters:v1"]` — written
  on every mutation, hydrated on first read. Survives reloads.
- **Message indexing:** chapters reference indices into the full
  `messages[]` array (including the system message at index 0). Inline
  dividers are rendered between bubbles based on the chapter's `startIndex`.
- **Reset integration:** when `useWebLLM.reset()` empties the chat, a small
  effect in `WebLLMChat.tsx` calls `clearAll()` on the chapter store so the
  panel doesn't show stale chapters for an empty conversation.
- **Zero new dependencies.** Pure React + zustand + the existing
  ReactMarkdown pipeline.

## Tech details

- Branch: `feature/chapter-markers`
- Test counts: 20 chapter-markers tests + 66 pre-existing = 86 / 86
- Bundle delta: ~+5 KB gzipped (panel + dividers + store + export)
- TypeScript: clean
- Models this feature needs at runtime: **none** — works on any conversation
  synchronously without invoking the model.

## Try it

Interact with the embedded demo above (start a chapter, send a message or
two, end the chapter, then click Export), or
<a href="/ux/chapter-markers/index.html" target="_blank" rel="noopener noreferrer">open the demo in a new tab</a>.
