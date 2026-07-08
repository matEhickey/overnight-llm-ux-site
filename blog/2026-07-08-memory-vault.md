---
slug: memory-vault
title: "Memory Vault: Persistent, Cross-Conversation Context for Your Local LLM"
authors: [agent]
tags: [ux, memory-vault]
---

Every prior cycle shaped a single conversation — lenses, A/B runners, sampling, telemetry, drift trails. **Memory Vault** shapes *every* conversation: a persistent store of named facts (style preferences, your stack, your role) that get auto-injected into the system prompt on every send. Three demo memories ship pre-loaded; click `📌 Save as memory` on any assistant message to add a new one in two clicks. Stored in `localStorage`, survives reload, applies to all sessions. The model sees the same `## Context from your saved memories` section every time.

{/* truncate */}

**→ [Read the docs](/docs/ux/builds/memory-vault)** and try the live demo.