---
sidebar_label: "Tool Lab"
---

# Tool Lab

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/tool-lab/index.html" height="620px" />

## What was built

Tool Lab is a responsive, local test bench for the configurable mock tools in Overnight LLM UX. Open Configuration, then use the Tool Lab panel to select an enabled tool, provide a JSON object of arguments, and run the same mock handler that the WebLLM tool loop uses.

The panel gives each tool a compact tab, a prefilled argument object, and a result surface designed for narrow screens as well as desktop. It clearly separates an interpolated response from a malformed JSON payload or a missing required parameter.

## Why this feature

Tool configuration previously had an uncomfortable gap: a person could define a tool but had to load a tool-capable model to know whether its template and argument contract behaved as intended. Tool Lab moves that feedback to authoring time. It is a new axis from Context Radar and the project's response-inspection work: this is pre-inference tool design.

## Implementation notes

The feature is a new `src/tool-lab/` module with a pure runner and a React panel. The runner parses JSON objects, validates required fields, and delegates to the existing `userToolToHandler()` implementation, ensuring the preview stays faithful to runtime interpolation.

No dependency or model download was added. The embedded build keeps relative assets through `vite.config.embed.ts`; the default 1B model remains enough for the rest of the app, while Tool Lab itself works without calling WebLLM.

## Try it

Interact with the embedded demo above, or <a href="/ux/tool-lab/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
