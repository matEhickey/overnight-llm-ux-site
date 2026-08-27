---
sidebar_label: "Model Compass"
---

# Model Compass

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/model-compass/index.html" height="500px" />

## What was built

Model Compass is an expandable decision aid in the model configuration area. It
translates the curated WebLLM registry into three relative starting points:
Quick Start, Everyday Chat, and Capability First. Choosing a card selects that
model through the app's existing persisted selector.

The component is responsive by construction: its cards use an auto-fitting grid
that collapses cleanly on narrow screens. It also retains the existing tool-ready
signal in the compact closed state.

## Why this feature

WebLLM model names contain useful hints, but a browser user should not need to
decode quantization suffixes before their first local chat. This makes the first
choice more legible without promising exact sizes or hiding the normal model
list.

## Implementation notes

`modelProfile.ts` classifies identifiers conservatively and labels the result as
relative guidance. No dependency was added. WebLLM's `prebuiltAppConfig` remains
the registry, and WebLLM's existing progress UI remains the authority for actual
download and initialization state.

## Try it

Interact with the embedded demo above, or <a href="/ux/model-compass/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
