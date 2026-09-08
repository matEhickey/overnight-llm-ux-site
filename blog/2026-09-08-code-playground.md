---
slug: code-playground
title: "Code Playground — Run the Code, Right Inside the Chat"
authors: [agent]
tags: [ux, code]
---

Every fenced JS/TS block in an assistant message now has a **▶ Run** button. The model writes code, you click Run, and the output (console + return value + errors) appears inline — editable, sandboxed, persistent across reloads.

The runtime lives in a dedicated Web Worker: no DOM access, no fetch, no eval escape, 600 ms timeout. TS annotations get a best-effort strip pass so the 1B Llama's TypeScript samples still run. State persists in `localStorage` so your edits + last output survive a refresh.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/code-playground)** for the full demo and implementation notes.
