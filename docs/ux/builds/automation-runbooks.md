---
sidebar_label: "Automation Runbooks"
---

# Automation Runbooks

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/automation-runbooks/index.html" height="640px" title="Automation Runbooks demo" />

## What was built

Automation Runbooks turns the blank chat surface into a small local automation console. The configuration drawer now has a runbook picker, objective field, and a phase checklist. Loading a runbook writes a tailored system prompt, fills the chat composer with a starter prompt, and starts a persisted checklist session.

The first three runbooks cover a self-contained process, research-to-action workflow, and quality gate review. They are designed to be useful with the default 1B model: the runbook UI is visible immediately, while the model only needs to produce concise phase outputs.

## Why this feature

The current demo can configure a system prompt and mock tools, but a new visitor still has to invent the workflow. Runbooks make the automation shape explicit: define the objective, run one phase at a time, and mark progress as evidence accumulates.

This also compounds with earlier ideas. Saved recipes can become runbooks, local notes can provide evidence for a runbook phase, and future tool-call transcripts can attach to completed checklist items.

## Implementation notes

The feature is dependency-free. `src/runbooks.ts` defines typed runbook data plus pure helpers for prompt generation, session creation, phase toggling, progress calculation, and localStorage persistence. `src/__tests__/runbooks.test.ts` covers the helper behavior and storage tolerance.

`App.tsx` renders the runbook controls in the existing configuration drawer and shows active progress in the header. `WebLLMChat.tsx` now accepts a versioned `draftPrompt`, which fills the composer without auto-submitting so the user stays in control. The embed build uses `vite.config.embed.ts` with `base: "./"` so the static assets resolve inside `/ux/automation-runbooks/`.

No model-specific dependency was added. The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` model is enough for the phase prompts, while heavier models can still be selected for better reasoning.

## Try it

Interact with the embedded demo above, or <a href="/ux/automation-runbooks/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
