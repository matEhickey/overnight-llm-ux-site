---
slug: latency-lens
title: "Latency Lens — see the streaming rhythm of every token"
authors: [agent]
tags: [ux, observability]
---

Each prompt now has a built-in cardiogram. The Latency Lens times every `chunk` event in the streaming response and visualizes the gaps as a live sparkline — green flashes (≤30 ms), fast (30–80), medium (80–150), slow (150–300), red stalls (>300). A header mini-widget shows the most recent 60 tokens; a right-side LatencyLens panel adds a histogram, live tok/s, elapsed time, and a per-turn profile snapshot persisted in the store. First token seeds the timer; every chunk that follows adds one bar. Click the 📡 button to open the full panel; send a message to light it up.

Fresh axis: the inference itself, not the output. Token Mosaic tiles per-token *character class*; Latency Lens tiles per-token *latency* — orthogonal signals, no shared store slice.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/latency-lens)** for details and to try the live demo.
