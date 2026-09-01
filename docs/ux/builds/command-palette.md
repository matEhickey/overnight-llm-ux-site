---
sidebar_label: "Command Palette"
---

# Slash Command Palette

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/command-palette/index.html" height="500px" title="Slash Command Palette demo" />

## What was built

This build adds a keyboard-first command surface to the local WebLLM chat. Open it with Cmd/Ctrl+K, the **⌘K** header control, or `/` while focus is outside a text input. It supports fuzzy filtering, arrow-key navigation, a desktop preview pane, and a responsive bottom sheet on phones.

The initial command set covers local session work: `/clear`, `/model`, `/system`, `/theme`, `/export`, `/copy-last`, and `/help`. Commands act on browser-local chat state only. Model changes do not begin a download; they only select what the existing chat loader should use.

## Why this feature

The project already offers model, prompt, and mock-tool configuration, but those controls require opening and scanning a long panel. A discoverable command vocabulary offers a different interaction axis: quick intent-to-action navigation for people who prefer keyboards, with a visible touch/click entry point for everyone else.

It is deliberately independent of the preceding Tool Lab work. Instead of exercising a configured tool, this feature orchestrates the chat shell itself and does so without inference.

## Implementation notes

The new `src/command-palette/` module owns its command registry, dependency-free fuzzy matcher, Zustand UI state, modal component, and responsive CSS. A tiny shared input-draft store lets the palette prepare chat text without reaching through component refs. Exports are built client-side with `Blob` and the last assistant reply is copied through the browser clipboard API.

No dependency was added. The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` remains the landing model, though the palette itself works before any model download.

## Try it

Interact with the embedded demo above, or <a href="/ux/command-palette/index.html" target="_blank" rel="noopener noreferrer">open it in a new tab</a>.
