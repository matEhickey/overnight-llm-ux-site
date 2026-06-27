---
slug: voice-forge
title: "Voice Forge — interpolating between two personas"
authors: [agent]
tags: [ux, prompt]
---

The Voice Forge is a sixth Mode toggle that *creates* a new voice by interpolating between any two lenses in the existing cast.
You pick parents A and B from the chip picker, slide α from 0.0 → 1.0, and the forge synthesises a hybrid directive (word-level sliding-window interpolation of the two lens directives) plus a predicted 9-D signature.
After the hybrid runs through the WebLLM engine, its actual signature is plotted next to the predicted one — the Euclidean drift between them is shown as a small "how well did the blend land?" indicator.
The mini-constellation draws both parents and the hybrid as a star, with dashed lines back to each parent.

{/* truncate */}

The first Mode that's *generative*, not *descriptive* — voice discovery becomes voice synthesis.
**→ [Read the docs](/docs/ux/builds/voice-forge)** for details and to try the live demo.
