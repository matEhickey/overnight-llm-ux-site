---
sidebar_label: "Conversation Forking"
---

# Conversation Forking

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/conversation-forking/index.html" height="600px" />

## What was built

The chat history is no longer a flat list — it's a **tree**. Every assistant
message is a sibling of the previous user message; the user can:

- Click **↻ Regenerate** under any assistant bubble to spawn a new sibling
  (the model re-runs the same prompt and appends a fresh assistant reply).
- Use **◀ / ▶** to step between siblings. A small badge shows
  `branch 2 / 4` so you always know where you are.
- Open the **🌿 Tree** overlay from the chat header. The overlay shows the
  full tree — each user message is a row, each assistant reply is a child
  node — and lets you click any node to jump to it in the chat.

When you regenerate, the new sibling becomes the active one. Downstream
messages continue from the active sibling. Older siblings are still kept
in the store, so you can step back and compare answers side-by-side.

## 7-02 update — white-screen regression fixed

The initial deploy (cycle 2026-06-30) shipped a build that produced a blank
page on first load. Mathias reported it as a "nice idea but the built app
don't start, stay white screen." The 7-01 cycle reproduced the crash but
could not land a fix; the route was rolled back to keep the rest of the
site clean. This 7-02 cycle ships the real fix.

### Root cause

The `MessageList` component subscribed to the fork store with a selector
that **built a fresh object on every call**:

```tsx
// BEFORE — buggy. Zustand v5 uses `Object.is` for selector equality, so
// each new object reference was treated as a snapshot change, forcing a
// re-render. The re-render re-ran the selector, which returned another
// new object → infinite loop → React "max update depth exceeded" (#185)
// → blank page.
const forkActiveIds = useForkStore((s) => {
  const out: Record<string, string> = {};
  for (const [pid, g] of Object.entries(s.siblingGroups)) {
    out[pid] = g.siblings[g.activeIndex]?.id ?? "";
  }
  return out;
});
```

### Fix

Subscribe to the **stable** `siblingGroups` reference, then derive the
active-id map in a `useMemo`. The `siblingGroups` reference only changes
when the store actually updates, so the memo is invalidated at the right
time and only then.

```tsx
// AFTER — fixed.
const siblingGroups = useForkStore((s) => s.siblingGroups);
const forkActiveIds = useMemo<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  for (const [pid, g] of Object.entries(siblingGroups)) {
    out[pid] = g.siblings[g.activeIndex]?.id ?? "";
  }
  return out;
}, [siblingGroups]);
```

Also tightened the `useEffect` deps for the auto-init in `WebLLMChat.tsx`
to `[opts.model, opts.systemPrompt]` instead of `[api, opts.model, opts.systemPrompt]`
so the effect doesn't re-run on every render (where `api` is a fresh
object reference).

### Regression test

`src/__tests__/fork-regression.test.ts` pins the fix in place with 6 tests:

1. `the buggy selector returns a NEW object reference on every call` — proves
   the root cause.
2. `the fixed pattern returns the SAME memoized object across renders when
   siblingGroups is stable` — proves the fix.
3. `the fixed pattern invalidates the memo when siblingGroups actually
   changes` — proves the fix still re-renders when the store changes.
4. `the fixed pattern is bounded — does not infinite-loop on initial mount`
   — render-count assertion (`< 5`).
5. `hydrating fork state does not cause excessive re-renders` — exercise
   the hydrate path that previously triggered the loop.
6. `the fork store exposes siblingGroups as a stable reference between
   unrelated state changes` — pin the store contract.

All 60 tests pass (54 existing + 6 new).

## Why this feature

Most LLM UIs treat the chat history as a linear list — when you don't like
the last response, you either accept it or click a single "Regenerate"
button that overwrites it. That loses information: every previous attempt
is gone.

Forks treat each assistant turn as a **node in a tree**, like git branches
on a commit history. This:

1. **Preserves every alternative** — the user never has to choose "did I
   prefer the first answer or the third one?" because both still exist.
2. **Surfaces the search-space** — the user can see at a glance that there
   were 4 alternative responses to their prompt, and step through them.
3. **Plays well with multi-turn conversations** — when you fork at
   message 3, the conversation from message 4 onwards continues from the
   *new* sibling. The previous branch (4 through 7) is still there, just
   not active.

It's the version-control mental model, applied to chat history.

## Implementation notes

### New module: `src/conversation-tree/`

```
src/conversation-tree/
  types.ts               # AssistantSibling, SiblingGroup, MAX_SIBLINGS_PER_PARENT
  forkStore.ts           # Zustand slice for sibling bookkeeping
  persistence.ts         # localStorage round-trip, FNV-1a hashed key
  ForkControls.tsx       # ◀ / ▶ / Regenerate UI per assistant bubble
  TreeOverlay.tsx        # modal showing the full conversation tree
  useConversationTree.ts # wires fork store into chat lifecycle + exposes regenerate()
```

### How sibling tracking works

The flat `useChatStore.messages` array still holds every message (assistant
siblings included). The new `useForkStore` keeps a separate
`Record<parentUserId, SiblingGroup>` that maps each user message to its
list of assistant siblings and the currently-active index.

When `commitStream()` runs in the chat store, it now fires an
`onAssistantCommitted` callback with the new assistant id and its parent
user id. `useConversationTree()` subscribes to that callback and calls
`useForkStore.addSibling()` — so every fresh assistant message is
automatically registered as a sibling.

### How navigation works

`MessageList` reads the active sibling id for each assistant message from
the fork store. If a non-active sibling id appears in the message list,
it is **skipped during render** — only the active sibling renders as a
bubble. Stepping ◀ / ▶ calls `setActiveSibling()`, which triggers a
re-render and a different sibling appears.

### How regenerate works

`regenerate(parentUserId)`:

1. Locates the user message by id.
2. Truncates `messages` back to that user message (so all subsequent
   assistant replies — including the current active sibling — are
   discarded from the flat list).
3. Calls the existing `send()` flow with the same prompt. The engine
   produces a fresh assistant message; `commitStream` registers it as a
   new sibling.

The 8-sibling cap (oldest auto-evicted) keeps memory bounded.

### Persistence

A `useConversationTree()` effect listens for sibling-store changes and
writes the entire sibling map to `localStorage` under a namespaced key:

```
overnight-llm-ux-fork-{fnv1a(modelId + systemPrompt + firstUserPrompt)}
```

On mount, `loadForkState()` reads the key and calls `useForkStore.hydrate()`
to restore the tree structure. So a refresh keeps all your branches.

### Visual treatment

The **🌿 Tree** button in the chat header shows a count badge when there
are siblings (e.g. `🌿 Tree (12)`), making the feature discoverable
once you've regenerated even once. The button toggles a modal that
lays out the tree vertically — user messages on the left rail as `●`,
each assistant sibling branching off as `├` (when there are multiple
options) or `└` (when it's the only one). Clicking a node scrolls to
it in the chat and flashes a brief amber highlight.

## Try it

Interact with the embedded demo above, or
<a href="/ux/conversation-forking/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Suggested flow:

1. Type "Tell me a one-sentence fun fact about octopuses." → Send.
2. Click **↻ Regenerate** under the reply.
3. Notice the badge: `◀ 1 / 2 ▶`.
4. Click **▶** to step to the new sibling.
5. Click **🌿 Tree** in the header to see the full structure.
