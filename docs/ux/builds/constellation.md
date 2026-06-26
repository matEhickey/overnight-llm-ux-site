---
sidebar_label: "The Constellation"
---

# The Constellation

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/constellation/index.html" height="800px" />

## What was built

The Constellation is a fifth Mode toggle in the header bar (`Chat` /
`Council` / `Constellation`). It runs a Council under the hood, then
maps each voice to a point in a 2-D voice space so the user can
*navigate* voices instead of just *listening* to them.

- **Cast picker** — same as the Council: 2–4 members, defaults to all
  four NPC lenses (Wizard, Shopkeeper, Hacker, Mentor).
- **One prompt, sequential runs** — `▶ Plot the Constellation` runs
  each member through the same WebLLM engine with `resetChat()` between
  members (Council's run loop, unchanged).
- **Inline SVG constellation plot** — a 460×460 viewport with dashed
  grid lines at 0.25 / 0.5 / 0.75 on both axes, axis labels at the
  edges (`verbose ↔ structured` on X, `formal ↔ technical` on Y), and
  one circle per voice at its 2-D position. Cluster halos (purple
  dashed circles) appear around multi-member clusters.
- **Hover tooltip** — shows the member's emoji + title, length, and the
  raw 9-D signature vector.
- **Click-to-open side panel** — clicking any circle opens a card with
  the full markdown transcript, the per-member metrics strip, and the
  signature vector in monospace.
- **Pairwise distance matrix** — N×N grid below the plot, colour-coded
  green→yellow→red by distance. Diagonal cells are blank (distance 0).
- **Named clusters** — single-link clustering at a fixed threshold;
  each cluster is named from its dominant axis. Examples: "Verbose NPC
  family", "Terse & flowing voices", "Probing question-askers",
  "Code-heavy technicians".
- **Markdown + JSON export** — full transcript + signatures +
  distances + clusters in a self-contained file.

## Why this feature

The chain so far:

| Cycle | Mode | Genre |
|---|---|---|
| 6-22 | Perspective Deck | chip picker (no run loop) |
| 6-23 | Lens A/B Runner | comparison (2 panels) |
| 6-24 | Reply-Shape A/B | comparison (2 shapes × 1 lens) |
| 6-25 | The Council | **transcript** (N panels) |
| **6-26** | **Constellation** | **map** (N panels → 2-D space) |

The Council was a transcript. The Constellation is a *map*. The map is
a different conversational primitive: instead of asking "what does each
voice say?", the user asks "where do the voices live?" This enables
interactions the transcript can't support:

- *Hover* a circle to see a member's voice summary.
- *Click* to open the full transcript in a side panel.
- *Compare* distances in the matrix to find which voices are
  surprisingly close or surprisingly far.
- *Read* the cluster names to learn the cast's natural groupings.

The projection is intentionally **hand-tuned**, not learned. Two
principle directions with human-readable meanings (verbosity /
structure on X, formality / technicality on Y) keep the constellation
*legible*. A learned projection (t-SNE, UMAP) would be more accurate
but less interpretable — and would require a library. The hand-tuned
version is five lines of code and zero dependencies.

## How it was implemented

### Signature vector

For each `CouncilTurn`, derive a 9-D signature from `computeMetrics`:

```
[
  log-scaled chars (capped at 2000),
  avg sentence length (capped at 30 words),
  bullets (capped at 10),
  questions (capped at 5),
  exclamations (capped at 5),
  code blocks (capped at 3),
  headings (capped at 5),
  named-entity density (capped at 0.2),
  type-token ratio (capped at 1),
]
```

Each dim is normalised to [0, 1] using fixed caps tuned for short-model
outputs (≤ 2000 chars). Empty / whitespace-only turns return a zero
signature.

### 2-D projection

Hand-tuned linear combinations:

- **X = 0.45 · chars + 0.55 · bullets** — `verbose ↔ structured`.
- **Y = 0.55 · avgSentenceLen + 0.40 · codeBlocks + 0.05 · namedEntityDensity** — `formal ↔ technical`.

Centred on the cast centroid so the cluster sits around (0, 0).

### Pairwise distances

Euclidean distance on the normalised 9-D signatures. Symmetric matrix
with zero diagonal.

### Clustering

Single-link clustering with a fixed threshold (`0.95`). Union-find
implementation; for the default NPC cast this typically produces 2–3
named clusters.

### Cluster naming

Inspect the cluster centroid's signature and pick the axis with the
largest absolute z-score. Map the dominant axis to a friendly name from
a small bank:

| Dominant axis              | Cluster name                            |
|----------------------------|-----------------------------------------|
| verbose + structured       | "Verbose NPC family"                    |
| terse + flowing            | "Terse & flowing voices"                |
| list-y + structured        | "List-loving systems thinkers"          |
| flowing conversational     | "Flowing conversationalists"            |
| formal long-sentence       | "Formal long-sentence voices"           |
| casual short-sentence      | "Casual short-sentence voices"          |
| interrogative probing      | "Probing question-askers"               |
| declarative prescribing    | "Declarative minimalists"               |
| code-heavy technicians     | "Code-heavy technicians"                |
| exclamatory enthusiasts    | "Exclamatory enthusiasts"               |

Duplicate names get a numeric suffix (`(2)`, `(3)`, …).

## Files added

- `src/constellationRunner.ts` (~430 LOC) — pure helpers
  (`signatureOf`, `centroidOf`, `project2D`, `centroidProjection`,
  `distance`, `pairwiseDistances`, `clusterBy`, `nameCluster`,
  `buildConstellation`, `exportConstellationToMarkdown`,
  `exportConstellationToJson`).
- `src/ConstellationView.tsx` (~880 LOC) — UI component. Reuses
  CouncilView's run loop (sequential reset, streaming); adds the inline
  SVG plot, hover/click side panel, distance matrix, and cluster cards.
- `src/__tests__/constellationRunner.test.ts` — 28 tests covering all
  helpers, plus a `buildConstellation` integration test and a JSON
  round-trip test.
- `src/councilRunner.ts` — added `shortLabel` to `CouncilMember` (also
  exported in JSON for downstream consumers).
- `src/App.tsx` — added `AppMode = "chat" | "council" | "constellation"`
  with a third Mode toggle (purple accent) and wiring for
  `<ConstellationView />`.

## Tech details

- Dependencies added: none.
- Models this feature needs at runtime: same default 1B model
  (`Llama-3.2-1B-Instruct-q4f32_1-MLC`) is enough; all 28 new tests
  verify pure functions over text without any model.
- Build: `npm run build` passes (298 modules, 6.4 MB JS chunk).
- Tests: `npm test` runs 99/99 green (was 71 before this cycle; +28).
- Embed build: `npx vite build --config vite.config.embed.ts` → `dist/`.
- Copied to: `~/.openclaw/overnight/overnight-llm-ux-site/static/ux/constellation/`.

## Try it

Interact with the embedded demo above, or
<a href="/ux/constellation/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Suggested prompts:

- *"Should I learn Rust or Zig next?"* — the four NPCs each give a
  distinct voice; the constellation spreads them out across the
  formality axis.
- *"What's the worst advice you've ever heard?"* — interrogative
  voices (mentor, wizard) cluster on the upper half; declarative voices
  (shopkeeper) cluster on the lower half.
- *"Pick a coffee for me."* — short responses compress the signatures
  near the centroid; distance matrix shows everything is close.