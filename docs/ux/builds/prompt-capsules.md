---
sidebar_label: "Prompt Capsules"
---

# Prompt Capsules

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/prompt-capsules/index.html" height="640px" />

## What was built

A **saved preset library** for the WebLLM chat. A capsule bundles:

- **Model** — any model from the registry (Llama-3.2-1B, Hermes-2-Pro, Qwen, etc.)
- **System prompt** — the full instruction text
- **Tools** — user-defined function-calling tool configs (name, description, parameters, mock response)
- **Starter message** — an optional first message pre-filled in the input area when the capsule is applied
- **Tags** — freeform labels for filtering (e.g. `code`, `writing`, `education`)

### Built-in capsules

Five capsules ship out of the box:

| Capsule | What it does |
|---|---|
| **Code Assistant** | Explains code, finds bugs, suggests improvements. |
| **Creative Writer** | Brainstorm stories, characters, plot twists. |
| **Math Tutor** | Step-by-step explanations, from arithmetic to calculus. |
| **TL;DR Summariser** | Paste any text → 3 bullet point summary. |
| **Shell Companion** | Writes sh scripts, explains flags, warns on dangerous ops. |

### Save your own

Open the **Configuration** panel, set up your model, system prompt, and tools. Then click **+ Save Current** in the Capsules panel. Give it a name, description, and tags. It persists in `localStorage` and survives page reloads.

### Import / Export

- **Export** — click **↓** on any capsule card to download it as a `.json` file.
- **Import from file** — click **Import from file…** to load a capsule from disk.
- **Import from URL** — paste a JSON URL and click **Import URL**.

The JSON format is a plain capsule object (or wrapped in `{ version: 1, capsule: {...} }`). Share capsules as gists, in Notion, or via any URL.

### Apply

Click **Apply** on any capsule card. The app switches model, updates the system prompt, reloads the tool config, and pre-fills the input area with the capsule's starter message (if any). Everything is wired in one click.

## Why this feature

The configuration panel (model + system prompt + tools) works, but every session starts from scratch. If you spend 10 minutes crafting a perfect "pair programming" setup, you have to redo it next time.

Prompt Capsules solves that. It's the first **reusable configuration** concept in the project — orthogonal to every prior cycle (annotations, visualizations, telemetry, code blocks, memory, voice). It is pure state: no LLM call, no download, no latency. A capsule is just JSON.

It also makes the demo more explorable. Instead of a blank slate, the landing experience offers curated starting points that actually work on the 1B model.

## Implementation notes

### New module: `src/prompt-capsules/`

```
src/prompt-capsules/
├── types.ts            — PromptCapsule, CapsuleExport, ApplyCapsuleResult
├── capsule-store.ts    — built-in presets, localStorage CRUD, import/export helpers
├── CapsuleGallery.tsx  — full gallery UI (overlay panel)
└── index.ts            — barrel export
```

### Capsule schema

```ts
interface PromptCapsule {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  tools: UserToolConfig[];
  starterMessage?: string;
  tags: string[];
  createdAt: string;
  isBuiltIn: boolean;
}
```

### Engine / store changes

**Zero engine changes.** `src/engine.ts` and `src/store.ts` are untouched.

**`types.ts`**: two new optional fields added to `UseWebLLMOptions` — `starterMessage?: string` and `onStarterMessageConsumed?: () => void`.

**`WebLLMChat.tsx`**: the component now tracks a `starterMessage` ref and pre-fills the `InputArea` textarea when the model transitions to `ready`. The `InputArea` component grew two new props (`initialValue`, `onConsumed`).

**`App.tsx`**: new `showCapsules` state, `starterMessage` state, `handleApplyCapsule` function, `CapsuleGallery` import and render, `⎈ Capsules` button in the header, `WebLLMChat` now receives `starterMessage` and `onStarterMessageConsumed` props.

### Import pipeline

Capsule import accepts two JSON shapes:
1. Bare: `{ name, model, systemPrompt, ... }` — direct
2. Wrapped: `{ version: 1, capsule: { name, model, systemPrompt, ... } }` — export format

Imported capsules are always cloned with a new ID and marked `isBuiltIn: false` so they can be deleted.

### No new dependencies

React 19 + zustand (already in the project) + `localStorage` + `Blob` URL for download.

## Anti-chain compliance

- **New module `src/prompt-capsules/`** — genuinely new, no overlap with any of the 20+ prior cycles' modules.
- **Not a visualization** (unlike drift-trail / token-mosaic / prompt-xray / telemetry).
- **Not an output shape** (unlike perspective-deck / lens-ab-runner / council / constellation).
- **Not a conversation structure primitive** (unlike conversation-forking / conversation-tree).
- **Not memory injection** (unlike memory-vault).
- **Not a system-prompt preset editor** — it saves/restores bundles, not individual fields.
- **Not a tool CRUD UI** — that's the tool admin in the Configuration panel.
- **Not a code interaction** (unlike code-studio).

The capsule axis is genuinely new on `main` — `store.ts` has no capsule concept, `types.ts` had no capsule type, and no prior cycle introduced a saved-preset or bundle-import concept.

## Try it

Interact with the embedded demo above, or <a href="/ux/prompt-capsules/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Click the purple **⎈ Capsules** button in the header.
2. Browse the 5 built-in capsules — Code Assistant, Creative Writer, Math Tutor, TL;DR Summariser, Shell Companion.
3. Click **Apply** on any capsule — the model switches and the input area pre-fills with the starter message.
4. Click **+ Save Current** to save your current configuration (model + prompt + tools) as a new capsule.
5. Click **↓** on a capsule to download it as JSON. Click **Import from file…** to load it back.
6. Paste a URL pointing to a capsule JSON and click **Import URL**.
