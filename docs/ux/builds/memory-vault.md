---
sidebar_label: "Memory Vault"
---

# Memory Vault

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/memory-vault/index.html" height="640px" />

## What was built

A persistent, cross-conversation **memory store**. The user can save short
named facts ("I teach piano", "I prefer direct answers", "We prototype in
TypeScript"); the model sees them appended to every system prompt on every
send.

The store is `localStorage`-backed and survives page reloads. The first
load ships with three example memories pre-seeded so the demo is
immediately interactive.

### Configuration panel

A new **Memory Vault** section appears in the collapsible Configuration
drawer. It shows:

- Each memory as a card with:
  - **enable checkbox** (toggle inclusion in the system prompt)
  - **name** (inline-editable on click)
  - **content preview** (the fact itself)
  - **tags** (optional, comma-separated, e.g. `#style`)
  - **edit / delete buttons**
- A "**+ Add memory**" form at the bottom for new entries.
- A "**? help**" toggle that expands a one-paragraph explanation.
- A `N/M active` badge in the header.

The user can disable a memory without deleting it — useful when a fact is
true but irrelevant to the current conversation.

### System-prompt injection

When the chat sends a message, the active memories are concatenated to the
user's base system prompt as a `## Context from your saved memories`
section. The format is markdown so the model parses it as structured
context:

```markdown
You are a helpful assistant.

## Context from your saved memories
The following are stable facts the user wants you to remember across
conversations. Respect them whenever relevant.

- **Piano teacher** _(music)_ — I teach piano. When I ask about music
  theory, give concrete keyboard examples (chord shapes, intervals on the
  staff, etc).
- **Direct answers** _(style)_ — I prefer concise, direct answers. No
  marketing fluff. Short bullet lists are fine.
- **TypeScript stack** _(code)_ — We prototype in TypeScript with React
  + Vite + Zustand. Code samples should fit that stack.
```

The system-prompt editor shows a `+ N memor{y|ies} appended` badge so
the user can see at a glance how many memories are in effect. Hovering
the badge reveals the full composed prompt via the browser's native
tooltip.

### One-click save from chat

Every assistant message bubble has a small **📌 Save as memory** button
below it. Clicking opens an inline form pre-filled with the message text
and a default name derived from the first six words. The user adjusts
the name (and optionally adds tags), hits Save, and the memory is added
to the vault — visible immediately in the Configuration panel.

### Persistence

All CRUD operations write through `localStorage` under the key
`overnight-llm-ux-memories-v1` with a versioned schema. The first load
(no key) seeds the three demo memories. Subsequent loads respect the
user's edits and deletions.

Soft caps: each memory's name is capped at 60 chars, content at 500
chars (with a `…` truncation marker). Validation rejects empty fields.

## Why this feature

Every prior cycle shaped **a single conversation**. Perspective Deck (6-22)
made the prompt configurable *for one session*. Inference Playground (7-03)
tuned sampling *for one round*. Voice Input (6-29 / 6-30) shaped how the
user types *one message*. None of them persisted anything across
sessions.

Memory Vault addresses the gap: the user has stable facts about
themselves that should apply to *every* conversation. Re-typing "I teach
piano, give me keyboard examples" on every chat is friction the model
should already know.

The most powerful version of this is **shared preference state** —
imagine every local LLM app the user touches respecting the same "I
prefer concise answers" preference. Memory Vault ships the storage
primitive and the injection mechanism so a future cycle can layer shared
storage, import/export, or auto-extracted memories on top.

## Implementation notes

### Module layout

All new code lives in `src/memory-vault/` (new module, no overlap with
any prior cycle):

```
src/memory-vault/
├── types.ts                 — Memory, MAX_MEMORY_*, MEMORY_SCHEMA_VERSION
├── store.ts                 — localStorage CRUD (load/save/add/update/toggle/delete/getActive)
├── composePrompt.ts         — pure-fn helpers (buildMemorySection, composeSystemPrompt)
├── seed.ts                  — three demo memories
├── MemoryVaultPanel.tsx     — Configuration drawer section
├── QuickAddMemory.tsx       — per-message inline form
├── index.ts                 — barrel
└── __tests__/               — store + composePrompt tests (13 new tests)
```

### Engine changes

**Zero.** The engine doesn't know about memories. The injection happens
in `App.tsx`: it computes `composedSystemPrompt = composeSystemPrompt(base, activeMemories)`
on every render and passes that as `systemPrompt` to `WebLLMChat`. The
Hermes function-calling path still strips the user's system prompt when
tools are enabled — that's unchanged behavior, and an acceptable
trade-off (memories don't apply to tool-mode sessions on this cycle).

### WebLLMChat changes

**Minimal and additive.** A new optional `renderMessageActions` prop on
`UseWebLLMOptions` lets the consumer inject a React node below each
message bubble. The chat component is otherwise untouched. This keeps
the chat component decoupled from any specific feature module — future
cycles can use the same slot for other per-message actions (regenerate,
copy, delete, etc.).

### Edge cases handled

- **Empty memories** → `buildMemorySection` returns `""`; the system
  prompt is just the base.
- **Disabled memories** → not included in the section.
- **Long content** → clamped to 500 chars at write time (with `…`).
- **localStorage unavailable / quota exceeded** → writes fail silently;
  the UI still works in-memory for the session.
- **Schema mismatch** → reseed (current behavior; future migrations go
  here when `MEMORY_SCHEMA_VERSION` bumps).
- **QuickAddMemory with very long assistant message** → content is
  pre-truncated to fit the 500-char cap; user can edit.

### Performance

- Memory reads happen on every render of `App.tsx` (to compute the
  composed system prompt). With 50+ memories this is O(n) over an array
  filter + string concat — still under 1 ms for typical vaults.
- localStorage reads are synchronous and small (under 10 KB even with
  100 memories); not a perf concern.
- No new dependencies added.

## Anti-chain compliance

- **New module `src/memory-vault/`** — no overlap with any of the 19
  prior cycles' modules.
- **Not a visualization** (unlike drift-trail / token-mosaic /
  prompt-xray / telemetry).
- **Not an output shape** (unlike perspective-deck / lens-ab-runner /
  reply-shape-ab / council / constellation).
- **Not a conversation-structure primitive** (unlike conversation-tree
  / conversation-forking).
- **Not sampling** (unlike inference-playground).
- **Not a system-prompt preset** in the perspective-deck sense — those
  are session-local single choices; Memory Vault entries are persistent
  multi-entry user facts.

## Try it

Interact with the embedded demo above, or <a href="/ux/memory-vault/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Expand the **Configuration** panel in the header.
2. Scroll down to **Memory Vault**. You should see three pre-seeded
   memories.
3. Send a chat message like *"Recommend a piano piece for an early
   intermediate student"* and watch the model respond with concrete
   musical suggestions — it's seeing your "Piano teacher" memory.
4. Toggle the "Piano teacher" memory off and ask the same question —
   the response becomes generic.
5. Click **📌 Save as memory** on any assistant message to add a new
   one in two clicks.

The default `Llama-3.2-1B-Instruct-q4f32_1-MLC` is plenty — memory
injection is just text, and the model uses the context well at 1B.