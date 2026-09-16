---
sidebar_label: "Model Lab"
---

# Model Lab

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/model-lab/index.html" height="620px" />

## What was built

Model Lab is a side-by-side comparison view that runs the same prompt against two model slots and visualises the difference. You pick a model for Slot A and a different model for Slot B, type a prompt, hit **Compare**, and watch both responses stream in real time. A metric strip across the bottom compares the two runs on five axes: time-to-first-token (TTFT), total duration, throughput (tokens/sec), character length, and response shape (single paragraph, bulleted list, code+prose, etc.). Each metric shows an `A wins` / `B wins` / `tie` badge so you can see at a glance which model was faster, denser, or more structured for that prompt.

## Why this feature

WebLLM is interesting precisely because the user gets to pick which model runs locally. But picking a model is hard without comparing outputs. The main chat's model selector is a single dropdown; once you've chosen, you've committed. Model Lab is the missing "try before you commit" surface — pick two candidates, send the same prompt to both, see the metrics, then go back to the chat with the winner.

It's also useful for the meta-question: are the small 1B models actually faster enough to be worth the quality drop? Are the 8B models dramatically slower on your machine? Model Lab answers both questions empirically, on your hardware, in your browser.

## Implementation notes

**Two engines, sequential runs.** WebLLM workers are GPU-bound — running two 1–8 GB models in parallel would OOM most machines. Instead, Model Lab instantiates a single lab engine, loads model A, generates the prompt, records the TTFT (timestamp of the first non-empty chunk), records total duration + char count + response shape (reusing the reply-receipt classifier), unloads A, loads B, generates the same prompt, records the same metrics, and finally compares them. The user sees Slot A stream first, then Slot B stream, then the metric strip fills in.

**Responsive-first layout.** The split pane is a CSS Grid `1fr 1fr` at desktop width and collapses to a single stacked column at `≤640 px`. The metric strip is a 5-column grid on desktop and a 2-column grid on mobile, so the same component works on a phone and a 4K display without code changes.

**Self-contained in `src/model-lab/`.** Lives in its own folder with no imports from `cue-cards/`, `reply-receipt/`, or `prompt-refiner/`. The integration point is a single `<ModelLab />` mounted in a `[Chat | Model Lab]` tab toggle at the top of `WebLLMChat.tsx`. Switching tabs swaps the main message list + input for the lab — same WebLLMChat header, same status indicator.

**No new dependencies.** The lab reuses `classifyResponseShape` from `reply-receipt/classifier` (just the pure function — no React component reuse), the `CURATED_MODELS` list from `models.ts`, and WebLLM's `CreateWebWorkerMLCEngine`. Total new code: ~600 LOC across 7 files (types, store, labEngine, runComparison, metrics, SlotView, MetricStrip, ModelLab, styles.css) + 29 new vitest cases.

## Try it

Interact with the embedded demo above, or <a href="/ux/model-lab/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Default slot A is `Llama-3.2-1B-Instruct-q4f32_1-MLC` and slot B is `Qwen2.5-1.5B-Instruct-q4f32_1-MLC`. Both are small enough that the default 1B landing experience loads in ~30 s in the browser. Pick bigger models from the dropdowns for a sterner comparison.