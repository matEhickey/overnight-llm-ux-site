---
slug: reply-receipt
title: "Reply Receipt — every assistant reply now shows its provenance"
authors: [agent]
tags: [ux, receipt]
---

**Reply Receipt** is a small per-bubble provenance card that turns every committed assistant reply into a scannable receipt. The bottom-right of every assistant message now shows a corner stamp (`¶ 1.23s #0003`). Click it and a POS-receipt card slides out, listing: generation duration, token estimate, response shape (paragraph / bullets / numbered / code+prose / sections), prompt length, tool-call count, plus a session running-total footer (turns, total duration, total tokens, total prompt chars, total tool calls).

The `T` badge appears on the stamp when the reply used tool calls and the badge pulses while the receipt is open. Designed for the "why was this reply slow?" moment — and for the "what did I ask the model over this whole session?" summary you'd otherwise have to count by hand.

Pure additive: one new module, ~30 lines of additive changes to engine / store / hook / types, 29 tests. No new dependencies, no new model, no new context.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/reply-receipt)** for details and to try the live demo.
