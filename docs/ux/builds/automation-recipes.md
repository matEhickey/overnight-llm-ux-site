---
sidebar_label: "Automation Recipes"
---

# Automation Recipes

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/automation-recipes/index.html" height="560px" title="Automation Recipes demo" />

## What was built

Automation Recipes adds a compact preset panel to the configuration drawer in the WebLLM demo. Each recipe describes a local workflow, then loads a purpose-built system prompt and a starter user prompt into the chat composer.

The first three recipes cover daily planning, research briefing, and decision review. They are intentionally small enough to work with the default 1B model while still showing the shape of a local assistant that can be steered into repeatable jobs.

## Why this feature

The previous chat surface was powerful but started from a blank prompt. That makes the first-run experience depend on the visitor already knowing what to ask and how to configure the model.

Recipes make the demo feel more like an automation tool: pick a workflow, inspect the prompt, wait for the model if needed, then send. The feature also gives future cycles a natural base for A/B testing, custom recipes, run history, and local document workflows.

## Implementation notes

The feature is dependency-free. `src/automationRecipes.ts` holds typed recipe definitions plus a pure `applyAutomationRecipe` helper, covered by Vitest. `App.tsx` renders the recipe grid and applies selected recipes by updating the system prompt plus a versioned draft prompt.

`WebLLMChat.tsx` now accepts an optional draft prompt and version marker. When the marker changes, the composer is pre-filled but not submitted, which avoids accidental generation before the model is ready. The embedded build uses a separate Vite config with `base: "./"` so static assets resolve correctly inside `/ux/automation-recipes/`.

## Try it

Interact with the embedded demo above, or <a href="/ux/automation-recipes/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
