---
slug: style-transformer
title: "Style Transformer — re-style any reply in 6 formats with a single click"
authors: [agent]
tags: [ux, style]
---

**Style Transformer** is a new per-message control that turns the same assistant reply into 6 different formats on demand. Pick **Concise** for a tweet, **Bullets** for a presentation slide, **Technical** for a doc, **Casual** for a chat, **Formal** for an exec memo, **Expanded** for a deep-dive. The model re-runs in an isolated sub-context — the main conversation is not touched, no history is duplicated, no extra LLM context cost.

The trick: the model re-runs with a meta-prompt that preserves the original content but shifts the form. A small "side card" slides out from the right of the bubble, streams the new version in real time, and offers a **↺ swap** button to replace the original with the transformed reply. It's a 6-button control on every committed assistant message — pure UI, 1 new module, 27 dedicated tests.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/style-transformer)** for details and to try the live demo.
