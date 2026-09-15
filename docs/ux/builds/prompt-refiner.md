---
sidebar_label: "Prompt Refiner"
---

# Prompt Refiner

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/prompt-refiner/index.html" height="600px" />

## What was built

A new `src/prompt-refiner/` module adds a **live, in-input coaching strip**
to the chat. As you type in the textarea, a row of 0–3 hint chips appears
above the input row, labelled `✨ Refine`. Each chip is a small heuristic
match against your draft prompt; clicking a chip splices a template
phrase at the caret so you can keep typing.

The strip is automatic (no model call) and ephemeral (no persistence,
no store mutations). It's pure local pattern-matching on the draft text.

### Eight heuristic hints

| Hint | Trigger | Inserted template |
|---|---|---|
| ✂ TL;DR request | `len > 200 && ≥ 2 dots` | ` (please give me the short version)` |
| 📏 Specify length | has `?` and no `in N words/sentences/bullets` | ` (answer in 3-5 sentences)` |
| ⌨ Specify language | text mentions `function`/`const`/`class`/`def`/`import`/`=>` | ` (use TypeScript, Node 22)` |
| 🎯 Concrete subject | prompt ends with `it`/`this`/`that`/`they` and no quoted phrase | ` (specifically the one we discussed earlier)` |
| 🅰 Capitalise first word | first character is lowercase | `Please ` |
| # Quantify if you can | has vague quantifier (`a lot`, `some`, `many`…) and no digit | ` (please give a specific number)` |
| ▦ Specify output format | mentions `table`/`list`/`chart`/`json`/`csv` without `format`/`as a` | ` (return as a markdown table with columns: name, role, year)` |
| ⏱ Add a constraint | ends with `?` and no `words`/`sentences`/`bullets`/`minutes` | ` (keep it under 200 words)` |

Hints are sorted by score (higher first), then by catalogue order.
Only the top three render at any moment — the rest stay in reserve for
the next keystroke.

### Where it lives in the layout

```
┌─────────────────────────────────────┐
│ Chat header                         │
├─────────────────────────────────────┤
│ Message list (scrollable)           │
├─────────────────────────────────────┤
│ Cue Cards (user-chosen chips)       │  ← src/cue-cards/
├─────────────────────────────────────┤
│ ✨ Refine: [🎯 Concrete subject]…   │  ← src/prompt-refiner/ (NEW)
├─────────────────────────────────────┤
│ [ textarea ] [ Send ]               │
└─────────────────────────────────────┘
```

The Refiner strip sits *between* Cue Cards and the textarea. Cue Cards
fires at submit time on user-chosen chips; the Refiner fires live as the
user types with automatic heuristics. The two never compete — they
target different moments (live vs commit) and different selections
(automatic vs user-chosen).

### Insert at cursor, not at the end

Clicking a chip splices the template at the textarea's current
selection range (cursor or highlighted text). The caret is then moved
to just after the inserted text, so you can keep typing without
manually re-positioning. If the textarea isn't focused yet, the
template is appended at the end of the value.

### Responsive-first design

| Viewport | Strip |
|---|---|
| Desktop ≥ 1024 px | full label + horizontal chips, wraps to a 2nd row when crowded |
| Tablet 641–1023 px | label + chips, narrower gaps |
| Phone ≤ 640 px | label shrinks, chips become a horizontally-scrollable row (no wrap), font drops to 0.72rem |

The strip is dashed-bordered (vs Cue Cards' solid) so the two are
visually distinct: solid = user controls (Cue Cards), dashed =
suggestions (Refiner).

## Why this feature

Cue Cards offers nine user-chosen chips that get prepended at submit
time. That's great for a known set of styles (`Be concise`, `Use bullet
points`, `Step-by-step`), but it doesn't help with the *drafting*
problem — the half-second between "I have an idea" and "I've typed it
cleanly enough to send". Cue Cards forces the user to (a) realise their
draft could be better, (b) stop typing, (c) read nine options, (d) pick
one, (e) go back to the input. Five steps. The Refiner collapses that
to: *keep typing, glance at the chip if it appears, click it if it
helps.*

It also exposes a UI primitive that doesn't exist on any major 2026
chat product: **automatic prompt coaching on the draft**. Cursor and
Continue ship AI-powered inline prompt suggestions, but those require a
model call. The Refiner is local heuristic — it fires on the first
keystroke, never round-trips, and works offline.

## Implementation notes

### New module

```
src/prompt-refiner/
├── hints.ts            # heuristic catalogue (pure, no React)
├── PromptRefiner.tsx   # chip strip UI (controlled widget)
├── useRefiner.ts       # textarea ref + insert-at-cursor helper
├── styles.css          # dashed-border responsive styles
├── index.ts            # barrel
```

Plus a single test file at `src/__tests__/prompt-refiner.test.tsx` (23
tests covering the catalogue, the matcher, and the widget).

### Mainline touches (minimal)

- `src/WebLLMChat.tsx` — three small additions:
  - import `PromptRefiner`, `useRefiner`.
  - wrap the existing input row in a column-flex `<div>` so the new
  - strip can sit *above* the textarea without disturbing the input
    row's existing layout.
  - call `useRefiner({ textareaRef, text: input, onChange: setInput })`
    and pass its `insert` to `<PromptRefiner onInsert={...} />`.
- No changes to `src/store.ts`, `src/App.tsx`, `src/main.tsx`,
  `src/cue-cards/*`, or `src/reply-receipt/*`.

### Why a new folder, not a sub-folder under `cue-cards`

The two features look similar (chip strips) but they're different in
three ways:

1. **Trigger** — Cue Cards is a user-chosen toggle. Refiner is an
   automatic heuristic.
2. **Timing** — Cue Cards fires at submit time. Refiner fires live as
   the user types.
3. **State** — Cue Cards persists via Zustand (so toggling after
   typing still affects the next send). Refiner is stateless — it
   reads the textarea value directly, never writes to the store.

Sharing a folder would have forced a tangled union type. A separate
folder keeps each feature's types tight.

### Why `useRefiner` exists separately

`PromptRefiner` is a pure controlled widget (matches the
`CueCards` shape). `useRefiner` owns the textarea ref + insert-at-cursor
logic. Splitting them keeps the widget testable without DOM mocking
and keeps the hook testable in isolation if we ever need to. The hook
also exposes `hints` directly, so future consumers (e.g. a future
"Refiner Stats" overlay) can reuse the computation without re-walking
the catalogue.

## Tech details

- Branch: `feature/prompt-refiner`
- Key files added: `src/prompt-refiner/{hints,PromptRefiner,useRefiner,styles.css,index}.{ts,tsx,css}` (5 files) + `src/__tests__/prompt-refiner.test.tsx` (1 file)
- Key files changed: `src/WebLLMChat.tsx` (3 small insertions)
- Dependencies added: **none**
- Models this feature needs at runtime: **none** — works without a model download

## Test suite

- **112 / 112** vitest pass (89 pre-existing + 23 new)
- TypeScript clean (`npx tsc --noEmit` → 0 errors)
- Vite embed build clean

## Try it

Interact with the embedded demo above, or <a href="/ux/prompt-refiner/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.