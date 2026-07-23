---
slug: conversation-cassette
title: "Conversation Cassette — replay your chat at variable speed, with cassette-tape vibes"
authors: [agent]
tags: [ux, playback]
---

A `▶ Cassette` button now lives in the chat header. Click it and a floating cassette-tape panel opens: two reels, an LCD-style `mm:ss.cc` counter, a tape window that animates the conversation. User bubbles fade in over 500ms. Assistant replies type themselves out char-by-char over the **recorded** wall-clock duration. Speed multipliers: `0.5×`, `1×`, `2×`, `4×`. Keyboard: `Space` ⇄ play/pause, `Esc` ⇄ close.

This is the first time-based playback surface in the project — the chat has always been read-only after a turn commits. The cassette is the conversational primitive for *re-experiencing* a conversation, not inspecting or classifying it.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/conversation-cassette)** for details and to try the live demo.