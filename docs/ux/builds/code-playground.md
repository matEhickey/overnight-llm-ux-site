---
sidebar_label: "Code Playground"
---

# Code Playground

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/code-playground/index.html" height="520px" />

## What was built

Every fenced code block (` ```js `, ` ```ts `, ` ```javascript `, ` ```typescript `) emitted by the assistant is now wrapped by a `<CodePlayground>` component instead of the static dark `<pre>` it used to render as. The component has three modes:

- **read** (default) — the same dark block you've always seen
- **edit** — an editable textarea where you can tweak the code
- **running** — a brief spinner while the sandbox evaluates

A small toolbar below the block offers `▶ Run`, `✎ Edit`, and `↺ Reset`. Click **Run** and the code executes in a fresh Web Worker; `console.log` calls, the last expression's value, and any thrown errors render in an output pane underneath. State persists in `localStorage` keyed by a hash of the block's content, so your edits and the last output survive page reloads.

## Why this feature

LLM responses that contain code have always been static. You could read them, copy them, paste them somewhere else — but they never *did* anything inside the chat. The Code Playground turns each block into a tiny executable artifact: edit → run → observe, all without leaving the conversation. It's the smallest unit of "chat → artifact" we could ship without bolting on an entire dev-server.

## Implementation notes

The sandbox is split into three pieces:

- `sandboxCore.ts` — the pure evaluation logic. Indirect `eval` inside a `new Function` wrapper, with try/catch for clean error propagation. Has no `Worker` or DOM dependency, so it's fully testable in `node` without jsdom or polyfills.
- `sandbox.worker.ts` — a thin message-passing shell around `sandboxCore`. Hardens the worker scope by deleting `fetch`, `XMLHttpRequest`, `eval`, and `Function`. The host terminates the worker after 600 ms.
- `sandboxClient.ts` — main-thread wrapper that spins up a fresh worker per `runCode()` call, awaits the result, and terminates the worker.

The `stripTs` pass is intentionally tiny (5 regexes) — it handles the common cases (`interface Foo {}`, `type X = ...`, `as Foo`, param annotations, return annotations). Anything fancier should be done by a real TS toolchain, which we deliberately did not pull in.

The component itself is ~240 LOC. Three states (`read` / `edit` / `running`) drive the toolbar, the body, and the output pane. `inflight.current` is a `Symbol` that protects against stale responses if the user clicks Run twice in quick succession.

Zero new dependencies. The Web Worker URL is bundled by Vite via `new Worker(new URL('./sandbox.worker.ts', import.meta.url), { type: 'module' })`, which lands as a 1.57 KB chunk in `dist/assets/`.

## Try it

Interact with the embedded demo above, or <a href="/ux/code-playground/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
