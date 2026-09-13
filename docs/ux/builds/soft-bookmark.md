---
sidebar_label: "Soft Bookmark"
---

# Soft Bookmark

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/soft-bookmark/index.html" height="600px" />

## What was built

A new `src/soft-bookmark/` module adds three primitives to the chat:

1. **🔖 Per-bubble ribbon** — every committed assistant reply gets a small `📑 Save` / `🔖 Saved` toggle pinned below the markdown body. Click it once to bookmark the reply; click again to un-bookmark. The ribbon never appears on user messages or the live streaming bubble.
2. **`🔖 Bookmarks (n)` header chip** — a count-aware chip in the chat header, just to the left of `Reset`. Clicking it toggles the slide-out panel open/closed.
3. **Slide-out `Soft Bookmark` panel** — a 360-px right-side drawer (full-width bottom sheet on viewports ≤ 640 px) with a header count, four filter chips (`All` / `Llama-3.2-1B` / `Hermes` / `Other`), a scrollable list of bookmarks (most-recent first), and a footer with `Clear all` + a `n/200` storage hint.

### Per-row affordances

- **Relative timestamp** — `just now` / `5m ago` / `2h ago` / `3d ago` / absolute date after a week.
- **Model badge** — short monospace tag derived from the full model id (e.g. `Llama-3.2-1B`, `Hermes-2-Pro-Llama-3-8B`).
- **Snippet** — first 160 characters of the original reply, clamped to 3 lines via `-webkit-line-clamp`.
- **↗ Jump button** — only visible when the original message is still live in the chat store. Clicking it `scrollIntoView({behavior: "smooth", block: "center"})` the bubble and flashes an amber ring around it for 1.2 s.
- **· original conversation cleared ·** — replaces the Jump button when the conversation has been reset since the bookmark was captured. The snippet + model + timestamp still read correctly.
- **✕ Remove** — drops the bookmark from the store and persists the change immediately.

### Persistence + capacity

- **Storage key:** `overnight-llm-soft-bookmarks-v1` (localStorage).
- **Capacity:** 200 entries; FIFO drop on overflow (oldest removed when adding the 201st).
- **Schema validation:** on hydration the store filters out malformed entries; a corrupt or missing localStorage falls back to three seeded demo bookmarks (curated snippets about polyrhythms, modal mixture, and WebLLM).
- **No external services.** No network. No telemetry. The store lives entirely in the browser.

### Responsive-first design

| Viewport | Ribbon | Panel |
|---|---|---|
| Desktop ≥ 1024 px | full chip with `Save` / `Saved` label | 360-px right drawer |
| Tablet 641–1023 px | full chip | 360-px right drawer |
| Phone ≤ 640 px | icon-only (28 × 28 touch target) | full-width bottom sheet with rounded top corners |

The flash-on-jump keyframe is also desktop-tuned — on mobile it still runs but at 70 % of the desktop ring width to avoid overwhelming a small viewport.

## Why this feature

The chat surface is great at *producing* replies but offers no way to *keep* a good one beyond the conversation lifetime. `Reset` wipes `messages[]`; `Clear` in the model picker wipes everything. Five recent cycles built rich surfaces around the chat lifecycle (pre-send, in-flight, post-receive, post-commit playback, post-commit provenance) but none of them addressed the simple "I want to come back to this later" question. The closest neighbours are:

- `Memory Vault` — saves **facts** the model should know on every turn (system-prompt fragments).
- `Conversation Library` — saves **whole conversations** (multi-turn archives).
- `Snippet Vault` — saves **user-highlighted text fragments** from a reply.
- `Chapter Markers` — saves **named sections** of a conversation.

None of these operate on a single committed assistant reply as the unit of archival. Soft Bookmark does, and it survives across resets, model swaps, and reloads.

## Implementation notes

### New module

- `src/soft-bookmark/types.ts` — pure types + storage key constant + curated seed.
- `src/soft-bookmark/store.ts` — dedicated Zustand store, **does not extend** `src/store.ts`. Hydration, FIFO cap, persistence, toggle, filter state.
- `src/soft-bookmark/SoftBookmarkButton.tsx` — per-bubble ribbon. Reads `useSoftBookmarkStore(s => s.has(messageId))` and toggles.
- `src/soft-bookmark/SoftBookmarkHeaderButton.tsx` — chat-header chip.
- `src/soft-bookmark/SoftBookmarkPanel.tsx` — slide-out panel + filter chips + list + footer.
- `src/soft-bookmark/styles.css` — scoped hand-written CSS, ~290 LOC, no external deps. Includes the flash keyframe + responsive breakpoints.
- `src/soft-bookmark/index.ts` — barrel.

### Mainline touches (minimal)

- `src/main.tsx` — one-line `import "./soft-bookmark/styles.css"`.
- `src/WebLLMChat.tsx` — three small additions:
  - mount `<SoftBookmarkPanel />` once at the root.
  - add `<SoftBookmarkHeaderButton />` to the header (next to `Reset`).
  - render `<SoftBookmarkButton messageId content modelId />` below the body of each assistant bubble.
  - add `data-message-id={messageId}` to the bubble root so the jump handler can find the right element via `document.querySelector`.

The chat store, the cue-cards slice, and the reply-receipt slice are completely untouched. There is no cross-import between `src/soft-bookmark/` and `src/cue-cards/` or `src/reply-receipt/`.

### What gets stored on the bookmark

```ts
interface SoftBookmark {
  id: string;             // synthetic `bm_<timestamp>_<counter>`
  messageId: string;      // the assistant ChatMessage.id
  snippet: string;        // clipped to 160 chars
  modelId: string;        // WebLLM model id at capture time
  capturedAt: number;     // Date.now()
  turnIndex: number;      // index in `messages[]` at capture time
}
```

The store deliberately does NOT persist the full reply content — only the snippet and a pointer. This keeps localStorage small and means a user clearing their chat still has a useful archive.

### Why no model introspection

Bookmarking is a *user* action. The model never sees it. The model never gets a "this was bookmarked" signal. The store reads only from localStorage + the in-memory chat store. Zero new dependencies.

## Tech details

- Branch: `feature/soft-bookmark`
- Key files added: `src/soft-bookmark/{types,store,SoftBookmarkButton,SoftBookmarkHeaderButton,SoftBookmarkPanel,styles.css,index}.{ts,tsx}` (8 files)
- Key files changed: `src/main.tsx` (1 import), `src/WebLLMChat.tsx` (3 small insertions)
- Dependencies added: **none**
- Models this feature needs at runtime: **none** — works without a model download

## Test suite

- **123 / 123** vitest pass (89 pre-existing + 34 new)
  - 18 data-layer tests in `src/__tests__/soft-bookmark.test.ts`
  - 13 jsdom rendering tests in `src/__tests__/soft-bookmark.component.test.tsx`
  - 3 jsdom jump-to-message tests in `src/__tests__/soft-bookmark.jump.test.tsx`
- TypeScript clean (`npx tsc --noEmit` → 0 errors)
- Vite embed build clean

## Try it

Interact with the embedded demo above, or <a href="/ux/soft-bookmark/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.