---
sidebar_label: "Focus Lanes"
---

# Focus Lanes

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/focus-lanes/index.html" height="520px" title="Focus Lanes demo" />

## What was built

Focus Lanes is a presentation layer that splits every committed assistant reply into a stack of discrete vertical lanes. Each lane has its own color, a small label chip (Intro, Question, Answer, Code, List, Closing), and an optional expand/collapse. A sticky mini-toc to the right (or above / below on smaller viewports) lists every lane in the most recent reply with a one-line preview; clicking an entry scrolls the chat to that lane and flashes it briefly.

Three presets shape the visible lane set:

- **Read all** — every detected lane is rendered.
- **Skip to answer** — Intro and Closing lanes are hidden, so the eye jumps straight to the substantive content.
- **Code only** — only Code lanes remain; useful for transcript-style scanning.

The per-kind manual collapse checkboxes add finer control: any lane kind can be hidden on top of the preset. Both the preset and the per-kind list persist in localStorage (`overnight-llm-lane-prefs-v1`), so the next visit reopens in the same shape.

## Why this feature

A typical assistant reply is a small document — an opener sentence, a question re-stated, the actual answer, sometimes a code block, a closing pleasantry. The previous builds in this project gave us per-turn metadata (Receipt), per-bubble audits (Reply Audit, Confidence Pulse), shape-aware layouts (Shape Memory, Adaptive Canvas), and reading-comfort knobs. None of them restructured the body of the message itself.

The strongest style hint this cycle was *responsive-first design*. Focus Lanes answers that directly: every part of the module (lane stack, lane chips, lane legend, preferences panel, even the print stylesheet) is shaped by a CSS container query, so the layout reflows at every viewport — phone, tablet, desktop, wide — without the developer writing four sets of media queries.

It is also deliberately orthogonal to the response-shape work in `src/reply-receipt/` (which classifies the *whole* reply) and to `src/adaptive-canvas/` / `src/shape-memory/` (which shape the chat *around* the reply). Focus Lanes only segments *inside* one bubble and does not touch the surrounding shell.

## Implementation notes

The module lives in `src/focus-lanes/` with eight files:

- `types.ts` — `LaneKind`, `Lane`, `LanePreset`, `LanePrefs`, plus palette + label + glyph maps.
- `laneDetector.ts` — pure heuristic segmenter. Splits a markdown body into lanes by walking lines and looking for fenced code blocks, headings, list runs, blank-line boundaries, question-mark terminators, and opener / closer phrases.
- `useLanePrefs.ts` — zustand slice + localStorage persistence.
- `LaneBubble.tsx` — renders one committed assistant reply as a stack of lanes.
- `LaneLegend.tsx` — sticky mini-toc with jump-to-anchor + flash highlight.
- `LanePreferencesPanel.tsx` — modal with preset radios + per-kind collapse checkboxes.
- `focusLanes.css` — global stylesheet with container queries for both the lane stack and the legend; a `@media print` block collapses everything to plain prose.
- `index.ts` — barrel that also injects the CSS.

Plumbing edits are minimal: `src/WebLLMChat.tsx` gains two imports, one `<LaneLegend />` line in the root layout, and one swap from `<ReactMarkdown>` to `<LaneBubble text messageId />` inside `Bubble`. No other module is touched.

The detector runs on the streamed and committed message text at render time (`useMemo`), so no extra model call is needed and the default 1B model remains sufficient. Eighteen new tests cover the segmenter heuristics, anchor-id stability, the preset-helpers, and the prefs-store state transitions. The full suite is 84/84 green (66 existing + 18 new).

No new dependencies. The build artifacts bundle at the same size as the prior builds; container-query support is universal in evergreen browsers and degrades gracefully to the wide-layout default where it is not present.

## Try it

Interact with the embedded demo above, or <a href="/ux/focus-lanes/index.html" target="_blank" rel="noopener noreferrer">open it in a new tab</a>. Send a message that triggers a multi-section reply (a heading + a code block + a closing line) to see the full lane spectrum, then switch presets in the ⚙ panel to watch the lanes collapse. Reload the page to confirm your preset persists.
