---
sidebar_label: "Reply-Shape A/B Runner"
---

# Reply-Shape A/B Runner

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/reply-shape-ab/index.html" height="640px" />

## What was built

The Lens A/B Runner (6-23) compared two **lenses** at one shape. The
Reply-Shape A/B Runner is the orthogonal cut: one **lens**, two **shapes**.
Pick a lens (defaults to the Friendly Shopkeeper NPC), pick shape A
(defaults to Crisp Plan) and shape B (defaults to Decision Memo), type
one prompt, click **Run Shape A/B**, and watch both responses stream into
side-by-side panels.

The metric harness is the same one the Lens A/B Runner uses
(`computeMetrics`, `compareMetrics`, `exportToMarkdown`, `exportToJson`
from `src/lensAbRunner.ts`). No fork. The shape-only difference is in
what the user picks, not how the output is measured.

When both panels finish, a comparison row appears with per-metric deltas
(B minus A), a heuristic verdict ("B is ~40% longer", "B uses more
headings", "B leans list-like"), and Markdown / JSON export buttons. The
Markdown header names both shapes plus the shared lens so the exported
artifact is self-explanatory.

The third mode toggle entry in the header bar (`Deck (single lens)` /
`A/B Runner` / `Shape A/B`) keeps all three modes one click apart.
Switching modes does NOT reload the model.

## Why this feature

When you're working on a prompt, the format question often matters more
than the persona question: "should this be essay or checklist?" The Lens
A/B Runner couldn't help with that — comparing two lenses often blurs
the format signal because persona noise dominates. Reply-Shape A/B
isolates the format axis by holding the lens constant.

It also completes a design grid:

|              | Crisp Plan    | Decision Memo |
|--------------|---------------|---------------|
| Debugger     | cell          | cell          |
| Wizard       | cell          | cell          |

Today you can reach any of those four cells by combining this build with
the Lens A/B Runner — pick the lens on one, pick the shape on the other.
A future cycle can promote the grid to first-class UI without changing
either runner.

The NPC defaults (per the agent-feed user directive: "NPCs preferred,
be creative, be ambitious") make the contrast visible. A Friendly
Shopkeeper answering in Crisp Plan reads like a friend chatting through
a morning routine; the same shopkeeper in Decision Memo reads like
someone laying three wares on the counter with a recommendation. The
metrics pick that up: the structured version produces more headings,
more paragraphs, and usually more questions; the prose version often
leads on average sentence length.

## Implementation notes

- `src/replyShapeAbRunner.ts` — pure helpers (`defaultShapeAb`,
  `buildShapeAbPrompts`, `shapeOptions`, `exportShapeAbToMarkdown`,
  `exportShapeAbToJson`). Wraps `lensAbRunner.exportTo*` with a small
  preamble that names both shapes and the shared lens (the existing
  exporter only knows one shapeId per comparison).
- `src/ReplyShapeAbView.tsx` — UI component. Same streaming-and-reset
  pattern as `LensAbView.tsx` (sequential runs through the shared
  WebLLM engine with `resetChat()` between A and B). Single shared
  lens picker at the top, two shape pickers, prompt input, side-by-side
  streaming panels with live metrics strip, comparison row.
- `src/__tests__/replyShapeAbRunner.test.ts` — 24 tests covering
  defaults, prompt composition (same shape ⇒ same prompt, different
  shapes ⇒ different prompts), shape registry, both export helpers,
  and identity-of-re-exports with the lens A/B harness.
- `src/App.tsx` — extended `AppMode` to `"deck" | "ab" | "shapeAb"`
  and added the third toggle button. Cyan accent to differentiate it
  visually from the existing purple lens A/B button.

No new dependencies. The metric layer (`computeMetrics`,
`compareMetrics`) is unchanged. The runner reuses the existing WebLLM
engine instance — switching modes does NOT trigger a model re-download.

## Try it

Interact with the embedded demo above, or <a href="/ux/reply-shape-ab/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

In the app:
- Switch to **Shape A/B** mode in the header bar.
- The shared lens defaults to **Friendly Shopkeeper**. Try other
  NPC lenses (Grumpy Wizard, Cyberpunk Hacker, Wise Mentor) or task
  lenses (Systems Debugger, Product Critic, etc.).
- Shape A defaults to **Crisp Plan**, Shape B to **Decision Memo**.
  Try Question Ladder or Experiment Card to see the metrics shift.
- Type a prompt (or pick a starter).
- Click **▶ Run Shape A/B** and watch the two panels stream.
- When both finish, the comparison row shows deltas, a verdict, and
  Markdown / JSON export buttons.