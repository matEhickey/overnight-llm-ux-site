---
sidebar_label: "Reply Ratings"
---

# Reply Ratings

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-ratings/index.html" height="600px" />

## What was built

A new `src/reply-ratings/` module adds three primitives to the chat:

1. **👍/👎 per-bubble strip** — every committed assistant reply gets a small `👍 Helpful` / `👎 Not helpful` strip pinned below the markdown body. Click `👍` to record a positive verdict; click `👎` for a negative one; click the same icon again to clear. The strip never appears on user messages or the live streaming bubble.
2. **`📊 👍 n · 👎 m` header chip** — a count-aware chip in the chat header, just to the left of `Reset`. Clicking it opens the slide-out stats panel.
3. **Slide-out `Reply Ratings` panel** — a 360-px right-side drawer (full-width bottom sheet on viewports ≤ 640 px) with three sections: overall totals (👍 / 👎 / net / positive rate), per-model breakdown (positive-rate bar + counts), and the last 10 ratings (snippet + model + relative timestamp). A footer holds a `Reset all ratings` button + a `Local only · no network · no training` note.

### Per-rating feedback

- **👍 Helpful** — green outline + green-tinted background when active; subtle scale + background flash keyframe on click.
- **👎 Not helpful** — red outline + red-tinted background when active; same flash behavior.
- **Toggle behavior** — clicking the same active icon removes the rating (records "no verdict" again).
- **Cross-icon behavior** — clicking the other icon replaces the rating (one rating per bubble, latest wins).
- **Stop propagation** — clicks on the strip do not bubble to the bubble body, so a rating click won't accidentally select text or trigger other bubble-level handlers.

### Per-model breakdown

- **Sort order** — by total ratings descending (most-rated model first).
- **Per-model row** — truncated model id, `👍 n · 👎 m` counts, positive-rate progress bar, `X% positive · N rated` meta.
- **Empty state** — if no ratings exist, the section shows `No model data yet.`
- **Seeded demo data** — 4 curated ratings across 2 models (`Llama-3.2-1B-Instruct-q4f32_1-MLC` and `Hermes-3-Llama-3.2-3B-q4f32_1-MLC`) load on first visit so the breakdown is populated immediately.

### Recent ratings list

- **Last 10** — most-recent first by timestamp.
- **Per-row content** — icon (👍/👎) + snippet (first 80 chars, ellipsised) + truncated model id (desktop only) + relative timestamp (`5m ago`, `2h ago`, `3d ago`, `2w ago`, `3mo ago`).
- **Empty state** — `No ratings recorded.` when no ratings exist (after `Reset`).

### Persistence + privacy

- **Storage key:** `overnight-llm-reply-ratings-v1` (localStorage).
- **Capacity:** unlimited — localStorage is the only constraint (typically 5–10 MB).
- **Schema:** `RatingRecord = { messageId, modelId, rating: "up"|"down", snippet, timestamp }`.
- **No external services.** No network. No telemetry. The store lives entirely in the browser.
- **Reset:** the footer's `Reset all ratings` button clears everything + removes the localStorage key. Confirmation prompt before wiping.

### Responsive-first design

| Viewport | Strip | Panel |
|---|---|---|
| Desktop ≥ 1024 px | full `👍 Helpful` / `👎 Not helpful` labels | 360-px right drawer |
| Tablet 641–1023 px | full labels | 360-px right drawer |
| Phone ≤ 640 px | icon-only (no label text) | full-width bottom sheet, max-height 80vh |

### Keyboard + a11y

- **`aria-pressed`** on each button reflects active state.
- **`aria-label`** switches between `Thumbs up` (inactive) and `Remove thumbs up` (active) so screen readers announce state correctly.
- **Title attributes** mirror the aria-label for hover tooltips.
- **`Escape`** closes the open panel from anywhere in the document.

## Why this feature

Every modern chat UI has 👍/👎 feedback. This chat surface had no way to express "this reply was great" or "this reply was useless" in a structured, queryable way. The other "capture what the user thinks" surfaces all operate on a different unit — Reply Receipt captures *model provenance*, Soft Bookmark captures *user-favorited replies*, Memory Vault captures *facts the model should know*. Reply Ratings is the only one that captures a *user verdict per reply* — and it's local-only, so there's no privacy or training concern.

## Implementation notes

- **Dedicated store, not extending `src/store.ts`** — `src/reply-ratings/store.ts` is a standalone Zustand store (per-module stores are the established pattern; cf. `src/reply-receipt/`, `src/cue-cards/`).
- **Synthetic seed ids** — the 4 curated seeds use `seed:1`–`seed:4` ids, which never collide with real bubble ids (which start with `m_`). On first hydrate, seeds are merged into the in-memory store without overwriting any existing user ratings.
- **`modelId` threading** — the current model is read from `api.status.kind === "ready" ? api.status.modelId : localStorage["overnight-llm-model"] ?? "unknown"`. This means ratings still work before the model finishes loading (for testing/demo) and for seeded bubbles.
- **Stop propagation** — the strip has `onClick` and `onMouseDown` `stopPropagation` handlers so a click on a rating button doesn't bubble to bubble-level event handlers.
- **`Escape` to close** — the panel registers a `keydown` listener while open and closes on Escape; cleans up on close.
- **0 new dependencies** — plain CSS + React + Zustand, exactly like the existing module surface.

## Try it

Interact with the embedded demo above (or <a href="/ux/reply-ratings/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>). The seeded demo ratings are pre-populated, so the panel shows a populated breakdown the moment it opens. Click any seeded `👍`/`👎` to see the counts update live, or rate the empty-state chat (model download required for new replies).
