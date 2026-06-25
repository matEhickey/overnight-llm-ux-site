---
sidebar_label: "The Council"
---

# The Council

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/council/index.html" height="700px" />

## What was built

The Council is a fourth Mode toggle in the header bar (`Chat` /
`Council`). It puts the NPC pack from 6-23 on stage as a panel of
speakers rather than as a chip in a picker.

- **Cast picker** — checkboxes for all 9 lenses (4 NPC pack + 5 task).
  Min 2, max 4. Defaults to all 4 NPC lenses. Each member is shown with
  their emoji (🧙 wizard, 🛒 shopkeeper, 💻 hacker, 🦉 mentor) and lens
  accent colour. A "Default cast" button resets to the NPC quartet.
- **Cast preview row** — pill chips with the chosen members, each
  filled with their accent colour, so you can see the council at a
  glance.
- **One prompt, sequential runs** — click `▶ Convene the Council` and
  each member runs in sequence through the same WebLLM engine, with
  `resetChat()` between members (same pattern as the A/B runners). The
  `crisp_plan` shape is held constant across all members so the
  *persona* signal (not the format signal) is what the transcript
  foregrounds.
- **Streaming transcript** — a vertical timeline of turns, each labeled
  with the member's emoji + accent + lens title. The active member's
  panel streams live; completed members are pinned with their final
  response. Each turn shows its own metrics strip (chars, words,
  sentences, paragraphs, bullets, headings, questions, code blocks,
  duration).
- **Consensus / divergence card** — after all members finish, a
  heuristic surfaces the *shape* of the disagreement: length spread,
  heading vs. flowing prose, who probes vs. who prescribes, sentence-
  length variation, code-block presence, NPC vs. task mix. No second
  model call — pure functions over the per-turn metrics.
- **Pairwise metric table** — N×(N-1)/2 pairs (2 members = 1 pair,
  4 members = 6 pairs). Each row shows the two members side by side,
  the chars-on-each-side, deltas in chars / words / headings /
  questions, and the char ratio (B.chars / A.chars). The metric harness
  is identical to the Lens A/B Runner's — `compareMetrics` from
  `lensAbRunner.ts` is called inside the new `compareAll` helper.
- **Markdown / JSON export** — the full transcript (with per-turn
  metrics) + pairwise metric table + consensus / divergence card +
  per-pair verdicts. Self-contained — a reader can replay the council
  from the markdown alone.

The fourth Mode toggle is pink (`#db2777`) to differentiate it visually
from the existing blue (`Deck`), purple (Lens A/B), and cyan
(Shape A/B) toggles. Switching to Council mode does NOT reload the
model — it reuses the same WebLLM engine.

## Why this feature

The 6-22 Perspective Deck shipped 4 NPC lenses in 6-23. The 6-23 Lens
A/B Runner and the 6-24 Reply-Shape A/B Runner put them in comparison-
shaped UIs — pick two, see which wins. That comparison framing is
useful, but it also buries the NPC pack's most distinctive property:
**these are characters, not configurations**.

A Grumpy Wizard and a Friendly Shopkeeper don't compete with each
other the way two debugger configurations do. They disagree in
*character* — one is cryptic, the other is warm. The disagreement is
the point, not the comparison.

The Council changes the genre from "single assistant" to "multi-
perspective panel". It treats the NPC pack as a cast of speakers,
not as a chip in a picker. The transcript — not the comparison table
— is the headline artifact.

It also satisfies the agent-feed user directive for this cycle:
*"PREFERRED focus: something more original, creative stuff in the
rest of the app. Style: be creative, be ambitious, be original,
more original."* The Council is more original than a 2×2 matrix or a
divergence badge would have been. It uses the NPC pack the directive
said to prefer. It pushes the chat UX forward by adding a new
conversational primitive (panel, not turn).

## Implementation notes

- `src/councilRunner.ts` — pure-function module. `defaultCouncil()`
  returns the 4 NPC lenses with their emoji + accent. `availableMembers()`
  returns all 9 lenses, NPC first. `buildCouncilPrompts(base, members, shape)`
  composes one system prompt per member via `composePerspectivePrompt`.
  `compareAll(turns)` produces N×(N-1)/2 pairs by calling
  `compareMetrics` from `lensAbRunner.ts` for each pair (no fork).
  `shapeOfDisagreement(turns)` is a pure-function heuristic over the
  per-turn metrics that surfaces length spread, heading spread, bullet
  spread, question spread, sentence-length spread, NPC-vs-task mix,
  and code-block presence. `exportCouncilToMarkdown` and
  `exportCouncilToJson` write the full transcript + metric table +
  consensus / divergence card.
- `src/CouncilView.tsx` — UI component. Cast picker (checkboxes, min
  2, max 4, defaults to all 4 NPCs). Cast preview row with accent-
  coloured pills. Prompt textarea + Run/Stop/Reset buttons. Streaming
  transcript where the active member's panel streams live. After all
  members finish, the consensus / divergence card + pairwise metric
  table appear. Markdown / JSON export buttons.
- `src/__tests__/councilRunner.test.ts` — 34 tests covering
  `defaultCouncil`, `availableMembers`, `clampCouncilSize`,
  `buildCouncilPrompts`, `compareAll`, `shapeOfDisagreement`
  (length spread, heading spread, bullet spread, question spread,
  sentence-length spread, code-block presence, failure observation),
  `exportCouncilToMarkdown`, and `exportCouncilToJson`.
- `src/App.tsx` — extended `AppMode` from `"chat"` to
  `"chat" | "council"`. Added a Mode toggle row with two buttons:
  `Chat` (blue, default) and `Council` (pink). When the Council
  mode is active, renders `<CouncilView />` instead of
  `<WebLLMChat />`. The Council view is initialised with the
  current `systemPrompt` from the config panel as its `basePrompt`.
- `src/promptDeck.ts` — copied from `feature/reply-shape-ab` because
  the NPC lens pack lives there and the cycle resets to `main` each
  time. (See "Why the main reset" in the cycle's analysis.md.)
- `src/lensAbRunner.ts` — same: copied from `feature/reply-shape-ab`
  because the metric harness lives there.
- `vite.config.embed.ts` — created (the embed config doesn't exist
  on `main`, only on the feature branches).

No new dependencies. The metric layer (`computeMetrics`,
`compareMetrics`) is unchanged. The runner reuses the existing
WebLLM engine instance — switching modes does NOT trigger a model
re-download.

## Try it

Interact with the embedded demo above, or <a href="/ux/council/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

In the app:

- Switch to **Council** mode in the header bar (pink button, rightmost).
- The cast defaults to all 4 NPC lenses. Toggle any on or off
  (min 2, max 4 — the picker enforces this). Add task lenses if you
  want a mixed cast. Click "↺ Default cast" to reset.
- Type a prompt (or pick a starter — wait, starters aren't surfaced
  here; type freely).
- Click **▶ Convene the Council** and watch the four members respond
  in sequence. Each turn streams live with its own metrics strip.
- When all members finish, the **Consensus / divergence** card
  appears with shape observations about how the voices differ.
- The **Pairwise metrics** table below shows N×(N-1)/2 rows — one per
  pair of members — with chars-on-each-side, deltas, and char ratios.
- Click **↓ Markdown** or **↓ JSON** to export the full transcript
  + metrics + disagreement card.

For best results, use a prompt that invites *opinions* — the
characters disagree most visibly on subjective questions. Try
*"Should I learn Rust or Zig next?"* or *"What's the worst advice
you've ever heard?"* — the divergence card will surface structural
differences (some probe, some prescribe, some flow, some structure).

## A note on the cycle's main reset

This cycle started fresh from `main`, per the process template's
Phase 1 (`git checkout main` + clean working tree). The Perspective
Deck (6-22), Lens A/B Runner (6-23), and Reply-Shape A/B Runner
(6-24) all live on their own feature branches and are not merged
into `main`. To run this Council build standalone, the necessary
supporting files (`promptDeck.ts` for the NPC lens pack,
`lensAbRunner.ts` for the metric harness) are copied from
`feature/reply-shape-ab`. The Council runner imports both. The other
feature branches (deck / lens-ab / shape-ab) still ship independently
at `/ux/perspective-deck/`, `/ux/lens-ab-runner/`,
`/ux/reply-shape-ab/`.