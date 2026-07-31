---
sidebar_label: "Inline Annotations"
---

# Inline Annotations

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/inline-annotations/index.html" height="500px" />

## What was built

A margin-note system on top of the existing assistant bubble. After the model commits a reply, every committed assistant message can be annotated fragment-by-fragment:

- **Select any text** inside an assistant bubble. A small dark "📝 annotate" pill appears just above your selection.
- **Click the pill** to open an editor popover with a textarea. Type a note. Save (or ⌘/Ctrl+Enter). The fragment gets a yellow underline and a small 📝 pin.
- **Click an annotated fragment** to toggle the note's tooltip (a sticky yellow card showing your note).
- **Click an annotated fragment again** to re-open the editor with the existing note loaded — overwrite or Delete.
- **Reload the page** — annotations survive. They live in `localStorage` under the key `overnight-llm-ux.annotations.v1`, keyed by `messageId` (the same id the Zustand store assigns to each assistant bubble).

The whole feature is rendered client-side. The model is not involved at all — selection detection, DOM walking, fragment wrapping, and storage are all in a self-contained `src/annotations/` module. The default 1B model is enough to see it work; you don't need to wait for a heavier download.

## Why this feature

Existing features on `main` are mostly system-generated, post-inference observability surfaces — Reply Receipt, Reply Audit, Style Transformer, Reply Diff, Reply Suggestions, Token Mosaic. None of them lets the **user** capture anything. Memory Vault captures long-term facts, but it's a flat key→fact store, not a per-fragment journal attached to specific output.

Inline Annotation introduces a **new axis**: human-authored, fragment-scoped, ephemeral-to-session metadata. It also exercises a part of the browser that the rest of the app never touches — `window.getSelection()`, `Range.getBoundingClientRect()`, and DOM TreeWalker text-node walking to wrap arbitrary substrings.

It is intentionally orthogonal to the last 7 cycles:

| Recent cycle | Module | Inline Annotation differs because… |
|---|---|---|
| Reply Receipt (7-16) | `src/reply-receipt/` | system metadata vs user-authored notes |
| Style Transformer (7-15) | `src/style-transformer/` | reply re-shaping vs reply journaling |
| Reply Audit (7-14) | `src/reply-audit/` | post-reply classification vs user notes |
| Prompt Capsules (7-13) | `src/prompt-capsules/` | reusable prompts vs per-reply notes |
| Code Studio (7-10) | `src/code-studio/` | code execution vs note capture |
| Message TTS (7-09) | `src/message-tts/` | audio output vs text annotation |
| Memory Vault (7-08) | `src/memory-vault/` | global fact store vs per-fragment local notes |

No new module extends any existing one. `src/annotations/` is brand new. The only touch on existing code is a single swap inside `WebLLMChat.tsx` where the assistant bubble's `<ReactMarkdown>` becomes `<AnnotationLayer markdown={text} messageId={messageId} />`.

## Implementation notes

- **Storage layer** (`src/annotations/storage.ts`) — pure logic, no React, fully unit-tested. Public surface: `loadAll`, `loadForMessage`, `saveForMessage`, `upsertAnnotation`, `deleteAnnotation`, `clearAll`, `makeRangeId`, `findQuoteRange`. The store schema is `{ [messageId]: AnnotationRange[] }` where each `AnnotationRange` carries `{ id, start, end, quote, note, createdAt }`. Resilient to corrupt JSON — returns `{}` instead of throwing.
- **DOM wrapping** (`src/annotations/AnnotationLayer.tsx`) — after ReactMarkdown renders, the layer walks text nodes via `TreeWalker`, locates the substring that matches `quote`, and splits the affected text nodes to insert a `<span class="ia-fragment" data-range-id="...">` wrapper. Re-runs whenever `markdown` or `annotations` change (via `useLayoutEffect` so highlights paint before the user sees the bubble).
- **Selection capture** — `onMouseUp` reads `window.getSelection()`, computes the offset in the rendered text via `indexOf(quote)`, and positions a floating 📝 button using `getBoundingClientRect()`. The button's `onMouseDown` calls `preventDefault()` so the selection stays alive until the user clicks it.
- **Editor popover** — yellow-on-cream card, textarea with autofocus + ⌘/Ctrl+Enter to save, Esc to cancel. Delete button only appears when editing an existing annotation.
- **Tooltip on click** — clicking an annotated fragment sets `openTooltipId` and renders a sticky yellow tooltip adjacent to the fragment.
- **No new dependencies** — pure React + DOM APIs.
- **Tests** — 22 new Vitest cases for the storage layer (load, save, upsert by id, delete, clear, defensive copies, malformed-entry filtering, corrupt-JSON resilience, unique id generation, quote-finding with offset). All 88 tests pass (66 existing + 22 new).

## Try it

Interact with the embedded demo above, or <a href="/ux/inline-annotations/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Suggested workflow:

1. Wait for the model to load (the default 1B model, ~30s on first visit).
2. Ask any question that produces a paragraph or two of prose — e.g. `Explain photosynthesis in two short paragraphs`.
3. Drag-select a phrase in the response. The 📝 pill appears.
4. Click the pill, type a note, Save.
5. Click the underlined fragment — the note appears.
6. Reload the page. The annotation is still there.
7. Click the fragment again, hit Delete — gone.
8. Open DevTools → Application → Local Storage → `overnight-llm-ux.annotations.v1` to inspect the raw JSON.