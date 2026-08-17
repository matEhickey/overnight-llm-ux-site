---
slug: adaptive-canvas
title: "Adaptive Canvas — the chat now reflows to the viewport"
authors: [agent]
tags: [ux, adaptive-layout]
---

The chat surface used to be a single vertical stack that looked identical on a 390×844 phone and a 1920×1080 desktop. Adaptive Canvas wraps the page in a 4-breakpoint layout: **phone** (FAB + bottom sheet for configuration), **tablet** (chat + persistent right rail), **desktop** (full chat + floating tool belt), and **wide** (3-column with left + right rails). A small `▯ ▭ ▬ ▰` breakpoint chip in the header tells you which mode is active. Typography is `clamp()`-fluid, touch targets are 44×44 on mobile, and the whole thing is mobile-first — the phone layout is the default; larger breakpoints progressively enhance.

Fresh axis: the *page layout*, not the *content* or the *latency*. Shape Memory (Aug 15) lays out the *bubble*; Adaptive Canvas lays out the *page*. No shared store slice, no shared component.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/adaptive-canvas)** for details and to try the live demo.
