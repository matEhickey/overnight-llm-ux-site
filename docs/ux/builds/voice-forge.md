---
sidebar_label: "Voice Forge"
---

# Voice Forge

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/voice-forge/index.html" height="700px" />

## What was built

The Voice Forge is a 6th Mode toggle in the header bar (`Chat` /
`Council` / `Constellation` / `Forge`). It takes two lenses as
parents and synthesises a new voice that lives between them.

- **Two parent pickers** — click any chip to set Lens A or Lens B.
  The 9 lenses from the existing Perspective Deck are available
  (4 NPC + 5 task). The default first load is *Grumpy Wizard* ×
  *Friendly Shopkeeper* — two lenses with visibly different
  signatures, so the hybrid lands at an interesting point on the
  map.
- **α slider (0.00 → 1.00, step 0.05)** — slide to interpolate.
  At α = 0.00 the hybrid is pure B; at α = 1.00 pure A. The
  blended accent colour updates live as the slider moves
  (RGB-space mix of the two parents' accents).
- **Predicted 9-D signature** — a small bar chart under the
  slider shows the predicted signature for the current α. The
  predicted signature is built from a *characteristic* signature
  per lens (heuristic over the directive text + a small
  accent-warmth bias) and blended linearly per dimension.
- **Single-turn run** — `▶ Forge` sends the blended directive as
  the system prompt and runs the model once. The hybrid response
  streams into the right column, coloured by the blended accent.
- **Predicted vs actual** — after the run, two side-by-side bar
  charts show the predicted and actual signatures. The Euclidean
  drift between them is shown as a colour-coded indicator:
  green *on-target* (drift < 0.2), amber *drifted* (< 0.5), red
  *rounded to a parent* (≥ 0.5).
- **Mini constellation plot** — an inline SVG plot (≈ 280 × 280)
  showing the two parents as filled circles, the predicted
  hybrid position as a star, and the actual hybrid position as a
  dashed open circle behind the star. Dashed lines connect the
  hybrid to each parent. Same axis labels as the Constellation
  (`verbose ↔ structured` on X, `formal ↔ technical` on Y).
- **Save to gallery** — name the hybrid and append it to an
  in-memory gallery (no IndexedDB yet — that comes in a later
  cycle). Click any gallery card to recall its parents, α, and
  prompt back into the pickers.
- **JSON export** — download the predicted vs actual signature,
  projection, drift, and prompt/response pair as a single JSON
  artifact.

## Why this feature

The chain so far:

| Cycle | Mode | Genre |
|---|---|---|
| 6-22 | Perspective Deck | chip picker (no run loop) |
| 6-23 | Lens A/B Runner | comparison (2 panels) |
| 6-24 | Reply-Shape A/B | comparison (2 shapes × 1 lens) |
| 6-25 | Council | sequential panel transcript |
| 6-26 | Constellation | 2-D voice map (descriptive) |
| 6-27 | **Forge** | **2-D voice map (generative)** |

The chain has been moving from *transcript* → *comparison* → *panel*
→ *map*. The Constellation was the first *map*, but it was
descriptive: you plotted voices that already existed. The Voice
Forge is the *generative* counterpart: you can move freely in voice
space and create new voices that don't exist in the original cast.

It's also a small lesson about how LLMs handle blended personas.
The drift indicator shows that at extreme α (near 0.0 or 1.0), the
model usually rounds to one parent — the blended directive
"decays" into a single voice. At α around 0.5, the blend often
holds: the model takes the *gist* of both directives and produces
something genuinely hybrid.

## Implementation notes

- **`src/voiceForgeRunner.ts`** (~340 LOC) — pure helpers:
  - `interpolateText(a, b, α)` — word-level sliding-window
    interpolation. Tokenize on whitespace, take a prefix of A
    proportional to α, append the suffix of B from the matching
    position. Always coherent at the endpoints (α=0 → b,
    α=1 → a). Deterministic: same inputs → same output.
  - `blendSignatures(a, b, α)` — per-dimension linear
    interpolation, clamped to [0, 1].
  - `characteristicSignatureOf(directive, accent)` — heuristic
    signature built from directive text (length, sentence count,
    bullet/code/exclamation markers, capitalised tokens,
    type-token ratio) plus a small accent-warmth bias on
    exclamations or code-blocks. Reuses the same CAPS array as
    `signatureOf` from `constellationRunner.ts`.
  - `blendAccent(a, b, α)` — RGB-space mix of two hex colours,
    formatted as 7-char lowercase hex. Used for the blended
    chip background and the response card border.
  - `forgeVoice(a, b, α)` — bundles the full forged-voice
    description (name, blended accent, blended directive,
    predicted signature, predicted projection) in one call.
  - `signatureDrift(predicted, actual)` + `driftLabel(drift)` —
    Euclidean distance on the 9-D normalised space, classified
    into *on-target* / *drifted* / *rounded to a parent*.

- **`src/VoiceForgeView.tsx`** (~860 LOC) — UI component.
  Reuses the existing run-loop pattern from `CouncilView.tsx`
  (single-turn this time, no sequential reset). The mini-plot
  is hand-drawn inline SVG with gridlines, axis labels, parent
  circles, a star-shaped hybrid marker, dashed connector
  lines, and an open-circle behind it for the actual position.

- **`src/__tests__/voiceForgeRunner.test.ts`** — 39 tests
  covering every helper. Includes round-trip tests
  (`blendSignatures(x, x, α) === x`,
  `interpolateText(s, s, α) === s`), deterministic checks,
  clamp checks, and end-to-end `forgeVoice` tests.

- **`src/constellationRunner.ts`** — added `export const CAPS`
  so `voiceForgeRunner.ts` can reuse the same normalisation
  caps as `signatureOf`.

- **`src/councilRunner.ts`** — added `makeCouncilMember(lensId)`
  public export so the forge can build a parent from a lens id
  without going through `availableMembers()`.

- **`src/App.tsx`** — `AppMode = "chat" | "council" |
  "constellation" | "forge"`. New Mode toggle (teal `#0d9488`
  accent to differentiate from chat/council/constellation).
  Mode label: "Forge" with sub-label
  *"two voices · 1 hybrid · generative"*.

- Dependencies added: **none**.
- Models this feature needs at runtime: same default 1B model
  (`Llama-3.2-1B-Instruct-q4f32_1-MLC`) — single-turn generation,
  no clustering or comparison loop.

## Try it

Interact with the embedded demo above, or <a href="/ux/voice-forge/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Try the default first (Wizard × Shopkeeper @ 0.5) and ask
*"Should I learn Rust or Zig next?"*. Then slide α toward 0.0 to
see the response collapse toward the Shopkeeper voice, and
toward 1.0 to see it round back to the Wizard's archaic riddles.
Save a few and try mixing in a task lens (e.g. *Systems
Debugger*) for a different drift pattern.

## Next candidates

1. **Axis customization** — let the user pick X / Y axes from a
   menu (verbose/structured, formal/technical, listy/prosey,
   interrogative/declarative, code-heavy/flowing). Compounds
   naturally with the forge: once you can forge voices, axes
   become how you steer and read the map.
2. **Voice journey** — pick α=0.0 → α=1.0 in 5 steps, run the
   model at each step, animate the hybrid moving across the
   mini-plot. The drift pattern across the journey tells a
   story about *where* the blend rounds to a parent.
3. **Constellation library** — IndexedDB persistence so the
   gallery survives a refresh and across sessions. Becomes
   more compelling once there are multiple Constellations
   and multiple Forges to compare across runs.
