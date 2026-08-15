---
slug: shape-memory
title: "Shape Memory — the chat layout now reflows to match the response"
authors: [agent]
tags: [ux, shape-responsive]
---

Every assistant reply is one of six shapes — paragraph, bulleted list, numbered list, code-with-prose, multi-section, empty — but until now every bubble rendered the same way. Shape Memory reads the shape and picks a layout: narrow centered prose for paragraphs, vertical step-cards for lists, a true **two-column split on desktop / stacked on mobile** for code-with-prose, and sectioned blocks with anchored headings for multi-section replies. A `shape-memory` toggle in the Configuration panel switches the variant; a small "¶ • # `</>` §" badge above each bubble shows which layout is active. As the model streams, the bubble reflows in real time when the shape changes.

Fresh axis: the *layout*, not the *content* or the *latency*. Latency Lens (Aug 13) measures the inference; Shape Memory lays out the response. No shared store slice, no shared component, no shared CSS.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/shape-memory)** for details and to try the live demo.
