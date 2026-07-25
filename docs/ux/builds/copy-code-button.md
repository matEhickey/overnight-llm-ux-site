---
sidebar_label: "Copy Code Button"
---

# Copy Code Button

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/copy-code-button/index.html" height="640px" />

## What was built

Every fenced code block (i.e. anything wrapped in triple backticks — python, js, bash, json, …) now ships with a **one-click Copy affordance** rendered in its top-right corner. The pill is unobtrusive when idle, raises opacity on hover, and flips to **"✓ Copied"** in green for 1.5 seconds after a successful copy. If the copy fails, the pill flips to **"✕ Failed"** in red.

The pill is implemented as a real `<button>` with `aria-label` and `title` attributes — keyboard-focusable, screen-reader-friendly, and works with the standard "press Enter to activate" pattern.

## Why this feature

When a model writes a useful snippet (a shell command, a regex, a one-liner), the next thing a user does is select the block and copy it. Today that means:

1. Hover near the top of the block to avoid hitting the scrollbar
2. Click-and-drag from the first character to the last
3. Right-click → Copy (or Cmd-C)

Three steps, all error-prone (the scrollbar hijacks the click, the drag selection misses a character, the snippet has a trailing newline). The Copy Code Button collapses the entire flow to a single click.

## Implementation notes

### Module layout

```
src/copy-code/
├── CopyableCode.tsx     # component: <pre> + copy pill
├── copy.ts              # clipboard helper with execCommand fallback
└── index.ts             # barrel
```

### The copy helper

`copyText(text)` first tries the modern `navigator.clipboard.writeText` API. If that path throws (permission denied, insecure context, etc.) it falls back to the classic **hidden-textarea + `document.execCommand("copy")`** recipe:

```ts
const ta = document.createElement("textarea");
ta.value = text;
// … set styles so it's invisible + unfocusable …
document.body.appendChild(ta);
ta.focus();
ta.select();
const ok = document.execCommand("copy");
document.body.removeChild(ta);
```

The fallback matters because the demo iframe on `overnight-llm-ux.vercel.app` may be served from a path where `window.isSecureContext` is false — without it, every Copy click would silently fail.

### Integration point

The integration into `WebLLMChat.tsx` is a six-line edit in the `Bubble` component's `ReactMarkdown` `components.code` prop. Today that prop returns the inline `<pre><code>` JSX; it now returns:

```tsx
const raw = String(
  Array.isArray(children) ? children.join("") : children,
).replace(/\n$/, "");
return (
  <CopyableCode className={className} text={raw}>
    {children}
  </CopyableCode>
);
```

The `String(children).replace(/\n$/, "")` is the standard recipe for stripping the trailing newline that react-markdown always appends to fenced blocks.

### What's *not* touched

- `store.ts` — no Zustand state added (the component is self-contained).
- `engine.ts`, `useWebLLM.ts` — no changes.
- `reply-receipt/`, `tools.ts` — no interaction.
- `App.tsx` — no new header buttons.

## Try it

Interact with the embedded demo above, or <a href="/ux/copy-code-button/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. Pick the 1B model for the fastest load, then ask the assistant for any snippet (e.g. *"write a python function that debounces an event handler"*) and look for the Copy pill in the corner of the code block.
