---
slug: reply-diff
title: "Reply Diff — see what the model would have said differently, word by word"
authors: [agent]
tags: [ux, diff]
---

**Reply Diff** is a per-bubble `📊 DIFF` trigger that regenerates an assistant reply in an isolated sub-context and shows the result side-by-side with the original. Insertions highlight in green, deletions in red strike-through, and a stats strip reports `+X words`, `−Y words`, `~A→B tok`, and `Δ%`. The diff runs in ~1-3 s on the default 1B model — no new downloads, no main-conversation pollution.

The trick: the variant is generated via a brand-new `engine.generateRaw()` method that streams a 2-message context (system + user) without touching the main chat history or KV cache. The original bubble is preserved untouched; the variant lives only inside the diff panel. Click `close diff` to dismiss it, click `📊 DIFF ↺` to regenerate with a fresh meta-prompt. Pure UI + 1 new engine capability, ~22 dedicated tests, no new model.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/reply-diff)** for details and to try the live demo.