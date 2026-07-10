---
sidebar_label: "Code Studio"
---

# Code Studio — interactive code blocks

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/code-studio/index.html" height="700px" />

## What was built

Every fenced code block in an assistant message is now a **Code Studio** surface. Three things happen automatically:

1. **Syntax highlighting** — Prism-themed token colors replace the plain monospace text. Languages covered include JavaScript, TypeScript, JSX/TSX, Python, JSON, Bash, HTML/CSS, SQL, YAML, Markdown, Rust, Go, Java, C/C++/C#, PHP, Ruby, Swift, Kotlin, and 15+ more. Unknown languages fall back gracefully to plain text.

2. **Copy button** — a 📋 button in the top-right of every code block copies the snippet to the clipboard. Brief "✓ copied" feedback confirms success.

3. **Run button (JS / TS / JSX / TSX only)** — a ▶ button executes the snippet in a sandboxed `<iframe srcdoc="...">`. Console output streams into an output panel below the code block. Errors are captured and shown in red.

### Why a sandboxed iframe?

The execution environment must be **completely isolated** from the parent app:

- `sandbox="allow-scripts"` — scripts can run, but the iframe has no same-origin trust, no network access, no cookies, no storage, no DOM access to the parent.
- `srcdoc=` (not `src=`) — the entire document is inline; no external HTML file or network round-trip.
- `</script>` in user code is escaped before interpolation, preventing the code from breaking out of the bootstrap script.
- All communication goes one-way (sandbox → parent) via `postMessage`, validated by the `__codeStudioSandbox` envelope key.

This means a model can output arbitrary JavaScript and the user can run it without any risk to the page or the host machine.

### Live demo script

To see the feature without waiting for the model to load, send the assistant one of these prompts (or just paste the response text):

```
Here's a quick fibonacci function:
```js
function fib(n) {
  return n < 2 ? n : fib(n - 1) + fib(n - 2);
}
for (let i = 0; i < 8; i++) console.log(fib(i));
```

```
Try a small data transformation:
```js
const nums = [1, 2, 3, 4, 5];
console.log(nums.map(n => n * n).reduce((a, b) => a + b, 0));
```

Then tap **▶ run** to see the output inline.

## Why this feature

The previous chain had been busy adding orthogonal **input modalities** (voice IN, memory, persona, telemetry) and **visualization axes** (token tiles, drift, wire payload, sampling). Code blocks — the single most common LLM output type after plain text — were still being rendered as plain `<pre>` blocks with grey background.

That gap had three concrete consequences:

- Users had to manually select-and-copy from a visually noisy block.
- Syntax errors in the model's output were hard to spot without color cues.
- **There was no way to verify the code worked** without switching to a separate REPL or paste target.

Code Studio closes that loop. The chat surface is now genuinely interactive for code — you can ask for a function, see it highlighted, copy it, AND run it in place.

## Implementation notes

### Module layout — `src/code-studio/` (new)

```
src/code-studio/
  CodeBlock.tsx           — main component, replaces <pre><code> in markdown
  CopyButton.tsx          — clipboard button with success/failure feedback
  RunButton.tsx           — JS/TS execution trigger (state-aware label)
  CodeOutputPanel.tsx     — log display (level-coloured rows)
  SandboxRunner.ts        — pure helpers: buildSandboxSrcdoc, parseLogMessage
  useCodeExecution.ts     — hook: state machine + postMessage listener
  supportedLanguages.ts   — language table (35+ langs) + runnable predicate
  index.ts                — public surface
  __tests__/
    code-studio.test.ts   — 19 tests covering SandboxRunner + supportedLanguages
```

### Why prism-react-renderer?

- **Small bundle** — ~15KB, lazy-loads language grammars.
- **Pure render** — no runtime DOM mutation; works inside React.
- **Theme support** — built-in `vsDark` matches the existing `#1f2937` background perfectly.
- **No CSS-in-JS overhead** — themes emit inline style objects.

### Sandbox execution flow

```
1. User clicks ▶ run
2. useCodeExecution.run(code):
     - sets state = "running"
     - sets iframe.srcdoc = buildSandboxSrcdoc(code)
3. Iframe loads; inline bootstrap script:
     - wraps console.log/info/warn/error → postMessage to parent
     - wraps window.onerror + unhandledrejection → postMessage
     - runs the user code in a try/catch
     - if a value is returned, postMessage it as "result" source
     - postMessage "✓ done" system message
4. Parent's global postMessage listener:
     - validates envelope (__codeStudioSandbox key)
     - calls back into the matching useCodeExecution instance
     - appends to logs, updates state to "done" or "error"
5. CodeOutputPanel renders the captured log lines
```

### Language table

The `SUPPORTED_LANGS` table maps 35+ language identifiers to Prism grammar names and a `runnable` flag. Anything not in the table falls through to `resolveLang` returning `{label: raw, prism: raw, runnable: false}` — so Prism still tries to highlight unknown languages (and silently succeeds with plain text if no grammar exists).

### Inline code vs block code

The ReactMarkdown `code` override decides the path:

```ts
const match = /language-(\w+)/.exec(className ?? "");
const isInline = !match;   // inline runs don't have a language class
if (isInline) {
  return <code style={{ background: "#e5e7eb", ... }}>{children}</code>;
}
return <CodeBlock className={className}>{children}</CodeBlock>;
```

This preserves the existing inline-code styling (used in things like `backticks` in prose) and only enhances block-level code.

## Dependencies

- `prism-react-renderer@^2.4.1` (runtime) — syntax highlighting
- No new dev dependencies (tests run in node env like the rest of the suite)

## Try it

Interact with the embedded demo above, or <a href="/ux/code-studio/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Send any message that asks for code — "write a regex to extract emails", "give me a JS function to debounce", "show me the JSON schema for a User" — and watch the assistant's reply get highlighted, copyable, and (for JS) executable.