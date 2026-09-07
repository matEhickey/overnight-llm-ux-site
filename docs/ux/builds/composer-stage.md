---
sidebar_label: "Composer Stage"
---

# Composer Stage

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/composer-stage/index.html" height="600px" />

## What was built

Composer Stage enriches the **textarea itself**, the user-facing affordances
that light up while the user is still typing — not after the message is
committed. Three primitives, mounted as a small HUD below the existing
`<textarea>`:

- **Live char + token counter.** Updates on every keystroke. Format:
  `N chars · M tok · X% ctx` when a context-window size is known (the
  current WebLLM `prebuiltAppConfig` does not expose context windows, so
  for now this is `N chars · M tok` only; the third segment activates
  automatically the moment a model entry carries a `context_window` field).
  Token estimate is the OpenAI rule of thumb (`ceil(chars / 4)`).
- **Shape classifier chip.** A live `📜 prose` / `💬 question` /
  `📋 instruction` / `🧩 code` / `🎭 mixed` chip that re-evaluates the draft
  with each keystroke. Heuristic: ends-with-`?` or question-word → question,
  starts-with-verb-imperative → instruction, fenced code block or ≥3 indented
  lines or ≥3 code markers → code, length ≥ 200 → prose, ≥ 2 distinct
  signals (e.g. `!` + `please` + `first/then/next/finally`) → mixed, default
  short declarative → prose. Pure TypeScript, ~5 lines.
- **Slash-command picker.** Typing `/` at the start of a line opens a
  floating popover above the textarea listing 5 built-in prompt recipes:
  `/summary`, `/outline`, `/explain`, `/rewrite`, `/counter`. Each item
  shows its glyph + label + one-line description. Up/Down navigates,
  Enter (or Tab) selects, Escape dismisses. Selection replaces the
  `/command` in-place with the recipe's full instruction and leaves the
  caret at the end so the user can edit before sending.

Responsive-first by construction: the HUD flexbox wraps to a second row on
viewports ≤ 600 px, and the slash picker popover is anchored to the
textarea's full width.

## Why this feature

The last 7 cycles all enriched the *post-commit* surface of the chat —
 source-anchors chips, chapter-markers dividers, hover-lens overlays,
 snippet-vault side panels, trail-map navigation, command-palette invocations,
 and reply-receipt corner stamps. None of them touched the **textarea**,
 even though it is the single most frequently used surface in the entire
 app (every user turn begins there).

Composer Stage is the first cycle that enriches the *pre-send* surface.
It's a different timing (keystroke vs. message-commit), a different
verb (compose vs. read/navigate), a different granularity
(per-character vs. per-message), and a different location (below the
input vs. attached to the message list).

Three things in particular haven't been tried before:

- A counter that turns the textarea from a black box into a measurable
  surface. Even without a `context_window` field on the model entry, the
  char/token counter is the first signal users get about how big their
  prompt is becoming.
- A live classifier that gives the user a tiny mirror of how the model
  will see their message. (Heuristic only — but that's fine for a
  composer HUD; the goal is reflection, not ground truth.)
- A `/`-triggered inline picker — distinct from the system-level
  command-palette surface shipped on 2026-09-01. The system palette
  opens with `Cmd/Ctrl+K` and operates on global actions; the slash
  picker opens by literal character, lives inside the draft text, and
  replaces the trigger.

## Implementation notes

- `src/composer-stage/` — new folder with 4 modules:
    - `classifier.ts` — pure functions (`classifyComposerShape`, `estimateTokens`, `listSlashCommands`, `matchSlashCommand`).
    - `SlashPicker.tsx` — the floating listbox with keyboard navigation.
    - `ComposerHud.tsx` — the strip below the textarea (counter + shape chip + slash trigger chip).
    - `types.ts` + `index.ts` — barrel.
- `src/WebLLMChat.tsx` — replaced `InputArea` with `ComposerStage` (the
  same composer + HUD + slash picker, all wrapped in a `position:relative`
  container so the picker can float above it). The `InputArea` sub-component
  is gone; all of its state (textarea, submit) is hoisted into
  `ComposerStage`. Net diff: ~80 LOC; chat loop, engine, store, and
  `ReplyReceiptPanel` are all untouched.
- `src/__tests__/composer-stage.test.ts` — 29 new tests covering the
  classifier (code/question/instruction/prose/mixed/empty), token estimate
  (zeros, capping, missing-context), the slash command resolver (prefix
  matching), and render smoke tests for the picker and HUD.

No new npm dependencies. No model download required — the entire
feature is React state + DOM. Bundle delta: ~6 KB gzipped (HUD chip +
picker popover + classifier).

## Try it

Interact with the embedded demo above, or
<a href="/ux/composer-stage/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Things to try:

- Type any sentence — watch the shape chip change color and glyph as the
  heuristic re-classifies.
- Type `What is photosynthesis?` — chip flips to `💬 question`.
- Type `/` at the start of a line — the slash picker floats above the
  textarea. Use Up/Down then Enter to pick one.
- Resize the iframe below 600 px wide — the HUD wraps to a second line
  and the counter shortens.