---
sidebar_label: "Snippet Vault"
---

# Snippet Vault

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/snippet-vault/index.html" height="500px" />

## What was built

A cross-session library of user-captured highlights from assistant replies. The gesture is universal: select any text inside an assistant bubble, click the floating 📌 Capture pill that appears at the top-right of the selection, fill in (optional) name + comma-separated tags in the tiny composer, hit Save (or ⌘↵). The snippet lands in the Vault panel as a discrete row with copy + delete actions.

The Vault panel — opened via the 📚 Vault toggle in the header — lists every saved snippet newest-first. Above the list: a search input (case-insensitive across name, tags, content) and auto-built tag filter chips (clickable to toggle, multi-select). Each row is clickable for a full-content preview modal that surfaces the entire captured text plus Copy / Delete actions. A "Clear" button in the panel header (with confirm) wipes the entire vault.

Persistence is automatic: every CRUD action writes through a versioned schema envelope in localStorage (key `overnight-llm-snippet-vault`, schema version 1). Schema validation rejects corrupt or out-of-version payloads on read, falling back to an empty vault. A 500-item hard cap protects localStorage quota. The vault survives reloads, model switches, and tool-config changes — the only way to lose snippets is to manually clear browser storage.

Responsive-first: on desktop (> 600 px viewport) the panel is a 360 px right-anchored side overlay with a subtle dim backdrop behind it; on mobile (≤ 600 px) it becomes a full-screen overlay with no backdrop. The same `matchMedia` listener pattern used by the 2026-09-02 Trail Map drives the layout flip.

Demo-friendly: appending `?demo=1` to the URL on first visit seeds three pre-populated snippets showcasing the search and tag features without requiring the user to load a model. The capture gesture remains fully functional in the iframe once a model is loaded.

## Why this feature

The project has shipped 48+ features across 12 weeks, but **none of them persist anything across reloads**. The README on main is explicit: "in state, no need to store anything." That's fine for the chat itself — most users will reload and start a fresh session — but it means there's no way to recover a useful answer from yesterday. The Snippet Vault introduces the first local persistence layer in the project, but scoped narrowly: only what the user actively chooses to capture. Not silent auto-save (privacy-sensitive), not full-conversation history (storage-bloat risk) — just deliberate highlights.

The select-to-capture gesture is borrowed from text-editor workflows (Notion's comment-on-selection, Slack's save-snippet) and adapted to the LLM context. The floating pill only appears when the selection is non-empty AND inside an assistant bubble (identified by `data-message-id` + `data-message-role="assistant"` attributes), avoiding accidental captures of system prompts or user input. Touch devices skip the pill entirely (the long-press → context menu flow is sufficient).

The detached, flat library is the key original axis. Per-bubble margin notes (the unmerged `inline-annotations` branch) keep the note attached to the source message — useful for re-reading the source context, but terrible for finding something from three sessions ago. Snippets are deliberately detached: the source bubble can be deleted, the snippet survives. This mirrors the way users actually want to interact with LLM insights — collect the good parts, lose the chat.

## Implementation notes

- **NEW module `src/snippet-vault/`** (~860 LOC including tests). Zero overlap with any prior shipped or unmerged branch. Files: `SnippetVault.tsx` (panel + responsive layout), `CapturePill.tsx` (selectionchange-driven floating pill), `CaptureComposer.tsx` (name/tags/preview modal), `SnippetListItem.tsx` (row + actions), `useSnippets.ts` (CRUD + search), `persistence.ts` (versioned schema adapter), `seed.ts` (?demo=1 loader), `types.ts`, `index.ts`, plus three test files.
- **Single source of truth**: `useSnippets()` is called once in `App.tsx`; both the panel and the composer read from the same hook instance. The vault API (`add` / `remove` / `update` / `search` / `clearAll`) is passed via the `snippets` prop on `SnippetVault` so state stays in sync across sibling components.
- **Plumbing change** in `src/WebLLMChat.tsx`: added `data-message-id` and `data-message-role` attributes to the assistant bubble div. Two-line change, no overlap with any prior feature.
- **vitest config**: the existing config uses `environment: "node"`. Snippet Vault tests need DOM + localStorage + `window.getSelection`. Used per-file `// @vitest-environment jsdom` directives on the three new test files so the existing engine / store / reply-receipt / tools tests stay on node.
- **Dependencies added**: none. Pure React + Zustand-free (the vault is self-contained under App.tsx).
- **Models this feature needs at runtime**: none. The vault is purely presentational + localStorage; it works without a model loaded. The capture gesture requires an assistant message to exist (i.e. a model load + a chat turn), but the library / search / copy / delete flow works immediately from the demo seed.
- **Test coverage**: 29 new tests across three files — 11 hook CRUD/search/persistence, 8 schema-version-mismatch/corrupt/quota, 10 panel render + filter + capture flow + Escape close. All 95 tests pass (66 pre-existing + 29 new). TypeScript clean (`npx tsc --noEmit`). Vite embed build clean (`dist/` written in ~1.7 s).
- **Anti-chain compliant**: zero file overlap with the 2026-09-02 Trail Map (`src/trail-map/`), the 2026-09-01 Command Palette (`src/command-palette/`), or any unmerged branch. The closest conceptual neighbour is the unmerged `inline-annotations` branch — fundamentally different (per-bubble margin notes vs. flat cross-session library).
- **Honor roll**: implements Mathias's result-json-first directive (`result.json` was written before any research/decision/implementation work), implements the implement-dont-just-research directive (research + decision + implementation + deploy in one cycle), honors all user_directives (ambitious + original overnight-llm-ux work; responsive-first design), honors the no-Atelier-AI avoidance.

## Try it

Interact with the embedded demo above, or <a href="/ux/snippet-vault/index.html?demo=1" target="_blank" rel="noopener noreferrer">open in a new tab with the demo seed loaded</a>.

To capture from your own conversation: load any model, send a few messages back and forth, then select text in any assistant reply. The floating 📌 Capture pill appears at the top-right of your selection — click it, name the snippet, hit Save. Open the Vault via 📚 Vault in the header to see, search, copy, or delete it.
