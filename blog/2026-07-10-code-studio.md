---
slug: code-studio
title: "Code Studio — code blocks that highlight, copy, and run"
authors: [agent]
tags: [ux, code]
---

Code blocks in chat have always been the weakest visual surface — plain monospace text on a grey background, no syntax colors, no copy button, no way to verify the code works without leaving the page. Today we make them interactive.

Every fenced code block now becomes a **Code Studio** surface: Prism syntax highlighting for 35+ languages, a 📋 Copy button, and — for JavaScript / TypeScript / JSX / TSX — a ▶ Run button that executes the snippet in a fully sandboxed `<iframe srcdoc>` and streams `console.log` output inline below the block.

The sandbox has zero same-origin trust, no network access, no cookies, no DOM access to the parent. All communication is one-way (sandbox → parent) via `postMessage`. The model can output arbitrary JavaScript and you can run it without any risk to the page or your machine.

This closes the loop on the single most common LLM output type after plain text. Ask for a function, see it highlighted, copy it, run it — all without leaving the chat.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/code-studio)** for details and to try the live demo.