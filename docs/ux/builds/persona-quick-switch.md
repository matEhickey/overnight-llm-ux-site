---
sidebar_label: "Persona Quick-Switch"
---

# Persona Quick-Switch

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/persona-quick-switch/index.html" height="500px" />

## What was built

A horizontal **Persona** toolbar sits in the top bar of the chat, to the right of the title. Five pill buttons each carry an emoji avatar and a name:

- 🦉 **Concise Tutor** — 1–3 sentence explanations, plain English, no filler.
- 📖 **Creative Storyteller** — vivid, sensory prose; scene-setting before action.
- 🧪 **Code Reviewer** — terse and technical; leads with the most important issue, suggests a concrete diff.
- 😈 **Devil's Advocate** — challenges the weakest assumption; cites one concrete counter-reason.
- 🏛️ **Socratic Coach** — never answers directly; asks one or two pointed questions.

Clicking a persona instantly replaces the system prompt with that persona's instruction. The active persona is highlighted with its tone color (sky, pink, green, orange, purple) and a soft outer ring. The label on the configuration panel's "System Prompt" header also flips to show the persona emoji + name + tone.

The selection persists across reloads via `localStorage` (`overnight-llm-persona`).

### Custom mode

The moment the user edits the system prompt textarea directly, the persona switches to **Custom** (a dashed-border chip with a pencil glyph), and the chip disappears from the active state. Picking any persona again resets the prompt to that persona's instruction. The system prompt border also adopts the persona's tone color when not custom.

This makes the persona bar feel like a *preset selector* rather than a *hard override* — users can leave the curated world and back into it freely.

## Why this feature

Every model UX starts with the same "type a system prompt" textarea. That's flexible but it pushes the cost of personality-switching onto the user. A **persona** is a small, opinionated bundle — name, voice, instruction, tone — that you can flip between like radio channels. Five distinct, deliberately written personas turn the chat into a small cast of characters you can swap mid-conversation.

The top-bar location matters: it puts the *persona of the assistant* at the same level as the *model* (also top-bar). Two orthogonal axes of "who is talking to me".

## Implementation notes

- New module: `src/persona/` — three files: `personas.ts` (data + types), `usePersona.ts` (state hook + localStorage), `PersonaBar.tsx` (the chip toolbar). Total < 250 LOC of feature code.
- `App.tsx` gains a `useEffect` that mirrors the persona's `systemPrompt` into local state. When the user types into the textarea, `markCustom()` flips the persona id to a `__custom__` sentinel.
- No new dependencies. Tone colors are hard-coded per persona — no theme system needed.
- `getPersona(id)` is the only lookup helper; it returns `null` for the custom sentinel and unknown ids, so callers never need to special-case missing data.
- Seven new unit tests (`persona.test.ts`) cover the library, default id, tone color map, custom marker stability, and prompt uniqueness. Full test suite still passes (73/73).

## Try it

Interact with the embedded demo above, or <a href="/ux/persona-quick-switch/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
