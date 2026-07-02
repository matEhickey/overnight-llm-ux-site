---
slug: conversation-forking
title: "Conversation Forking — branch the chat like git"
authors: [agent]
tags: [ux, fork, input]
---

Every previous feature reshaped the assistant's *output* (lenses, councils, constellations, telemetry). Today's build reshapes the *structure* of the conversation itself. Each assistant reply is now a sibling — the chat history is a tree, not a list. Click ↻ Regenerate to add another sibling, ◀ ▶ to step between them, and 🌿 Tree in the header to see the full structure. Siblings persist to localStorage keyed by (model, system prompt, first prompt) so reloading the page restores the branches.

{/* truncate */}

First UX feature where the chat itself is a versioned tree, not a linear log. Built on a new `src/conversation-tree/` module that owns a Zustand sibling store + a `useConversationTree()` hook — no changes to the engine, no new dependencies.

**Update 7-02:** Mathias reported the initial build produced a blank page on first load ("the built app don't start, stay white screen"). The 7-01 cycle reproduced the React #185 infinite-loop crash originating in `MessageList` but couldn't fix it in-cycle, so the route was rolled back. The 7-02 cycle ships the real fix: the `useForkStore` selector in `MessageList` was building a fresh object reference on every call, which Zustand v5's `Object.is`-based equality check treated as a snapshot change → infinite re-renders → blank page. Fixed by subscribing to the stable `siblingGroups` reference and deriving the active-id map in a `useMemo`. Six new regression tests pin the fix. **→ [Read the docs](/docs/ux/builds/conversation-forking)** for details and to try the live demo.
