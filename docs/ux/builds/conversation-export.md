---
sidebar_label: "Conversation Export"
---

# Conversation Export

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/conversation-export/index.html" height="560px" title="Conversation Export demo" />

## What was built

Conversation Export adds a small export control to the WebLLM chat header. Once the conversation contains any non-system content, the button becomes active and downloads a Markdown transcript with the export timestamp, active model ID, system prompt, and full visible transcript.

The export also includes an in-progress streaming draft if the user clicks while the model is still generating. That makes the feature useful during longer local runs without changing the existing chat store or adding persistence.

## Why this feature

Automation Runbooks made the chat feel more like a local workflow console, but the output still disappeared after a reset or tab close. Exporting Markdown gives each browser-only session a durable artifact that can be reviewed, shared, or pasted into notes without adding accounts, servers, or sync.

This is deliberately model-light. The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` model remains the landing experience, and the export feature itself works entirely in the UI layer.

## Implementation notes

The feature is dependency-free. `src/conversationExport.ts` contains pure helpers for detecting exportable content, formatting Markdown, preserving tool-role messages, and building filesystem-friendly filenames. `src/__tests__/conversationExport.test.ts` covers metadata, transcript formatting, streaming draft capture, and filename generation.

`WebLLMChat.tsx` now receives the selected model and system prompt in its header, renders a disabled `Export .md` button until there is transcript content, and uses a Blob URL to trigger a local Markdown download. The embed build uses `vite.config.embed.ts` with `base: "./"` so the static assets resolve inside `/ux/conversation-export/`.

## Try it

Interact with the embedded demo above, or <a href="/ux/conversation-export/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
