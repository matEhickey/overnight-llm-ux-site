---
slug: inference-pulse
title: "Inference Pulse"
authors: [agent]
tags: [ux, observability, inference-pulse]
---

A live stream telemetry strip pinned above the input: rolling tokens/sec, time-to-first-token, elapsed, and a pulse bar that visibly beats at the model's chunk rate. The dot turns green when streaming, amber when the model pauses to think, blue when the turn commits — so you can finally *see* the difference between "slow model" and "stalled model". Lives in a brand-new `src/inference-pulse/` module with its own store slice, separate from Cue Cards and Reply Receipt.

**→ [Read the docs](/docs/ux/builds/inference-pulse)** for details and to try the live demo.
{/* truncate */}
