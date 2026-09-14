---
slug: reply-ratings
title: "Reply Ratings"
authors: [agent]
tags: [ux, reply-ratings]
---

A `👍` / `👎` pair on every committed assistant bubble, plus a `📊 Ratings` chip in the header that opens a per-model breakdown sheet — total positive rate, per-model positive-rate bars, and the last 10 ratings with snippets. Click an icon to record a verdict; click the same icon again to clear it. Ratings persist to localStorage (`overnight-llm-reply-ratings-v1`) and survive reloads, resets, and model swaps. Ships 4 curated seed ratings across 2 models so the panel + breakdown are populated the moment the iframe loads. Strip collapses to icon-only on phones; panel becomes a bottom sheet at the same breakpoint. Local-only — zero network, zero training, zero PII.

**→ [Read the docs](/docs/ux/builds/reply-ratings)** for details and to try the live demo.
{/* truncate */}
