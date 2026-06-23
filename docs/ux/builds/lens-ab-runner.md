---
sidebar_label: "Lens A/B Runner"
---

# Lens A/B Runner

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/lens-ab-runner/index.html" height="620px" />

## What was built

The Perspective Deck (6-22) let you pick one lens at a time. The A/B Runner
turns that into a comparison: pick two lenses, type one prompt, click **Run
A/B**, and watch both responses stream into side-by-side panels. Each panel
shows live metrics — characters, words, sentences, paragraphs, bullets,
questions, code blocks, headings, and average sentence length — that update
as the model streams.

When both panels finish, a comparison row appears with per-metric deltas
(B minus A), a quick heuristic verdict ("B is ~40% longer — more thorough"
/ "B leans list-like" / "B is more interrogative"), and export buttons for
Markdown and JSON. The whole comparison can be downloaded and shared.

A new **NPC lens pack** ships alongside: Grumpy Wizard, Friendly Shopkeeper,
Cyberpunk Hacker, and Wise Mentor. These compose with the existing reply
shapes (Crisp Plan, Question Ladder, Experiment Card, Decision Memo), and
they're selectable as either side of the A/B comparison. The default A/B
pair is `Systems Debugger` (A) vs `Grumpy Wizard` (B) — same prompt, two
very different voices.

## Why this feature

Picking a single lens is half the lesson. The other half is **seeing** how
lenses shape output. Two people can read the same response and disagree about
whether it was "thorough" or "verbose" — the metrics settle that without
re-running. The export lets you save a comparison artifact you can paste
into a doc or share with a collaborator.

The NPC pack also addresses a recurring pain: perspective-prompt exploration
gets stale if every lens sounds like a productivity book. Personas break
the pattern and produce responses with sharper style differences, which
makes the A/B comparison more interesting and more learnable.

## Implementation notes

The metric layer is a pure-function module at `src/lensAbRunner.ts`. It
exposes `computeMetrics`, `compareMetrics`, `exportToMarkdown`, and
`exportToJson`. The UI is in `src/LensAbView.tsx` (renamed from
`LensAbRunner.tsx` to avoid a casing collision on case-insensitive
filesystems).

The runner reuses the existing WebLLM engine instance. After the model
loads once, the runner streams lens A, calls `engine.resetChat()`, then
streams lens B. This avoids loading a second model into WebGPU memory.
Sequential streaming keeps the demoable path small.

The mode toggle in the header bar (`Deck (single lens)` / `A/B Runner`)
keeps the original Perspective Deck UI intact for users who only want one
lens. Both modes share the same model registry, configuration panel, and
loaded model — switching between them does NOT trigger a re-download.

NPC lenses were added to `PERSPECTIVE_LENSES` in `src/promptDeck.ts` and
compose through the same `composePerspectivePrompt` function as the task
lenses. Each NPC has a directive written in the persona's voice (e.g. the
Grumpy Wizard's directive mentions "archaic third-person" and "reluctantly
reveal useful knowledge"). No new runtime dependencies.

## Try it

Interact with the embedded demo above, or <a href="/ux/lens-ab-runner/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
