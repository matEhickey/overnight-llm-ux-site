---
sidebar_label: "Local Notes RAG"
---

# Local Notes RAG

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/local-notes-rag/index.html" height="640px" title="Local Notes RAG demo" />

## What was built

Local Notes RAG adds a **Notes pane** to the configuration drawer. The user pastes a chunk of plain text (typically 200–5,000 words), clicks **Index**, and the app chunks the text on the fly and computes a small bag-of-words retrieval index. From that point on, every message typed in the chat composer triggers a live retrieval: the top three most relevant chunks are prepended to the system prompt and the Sources panel below the chat shows exactly which chunks informed the answer, with their raw term-overlap scores.

The whole pipeline runs in the browser. No server, no embedding model download, no API key. The notes are persisted to `localStorage` so a returning visitor picks up where they left off; the index itself is recomputed on Index click (cheap for ≤ 50 KB of text).

## Why this feature

The previous chat surface had two blank-screen problems:

1. **No grounding material.** The model could only respond from its pretraining, so visitors who wanted to ask "what does my notes file say about X?" had to paste the entire file into a single message.
2. **No transparency about context.** When the model gave a confident-sounding answer, there was no way for the visitor to see *why* — what chunk of input did the answer come from?

Local Notes RAG addresses both. Pasting 200 words of notes is enough to ground answers, the relevance scores are visible in the Sources panel before the model even loads, and the chunks themselves are click-to-expand so the visitor can verify the citation.

## Implementation notes

- `src/rag.ts` holds pure retrieval helpers: `tokenize`, `splitChunks`, `indexChunks`, `retrieve`, `formatContext`. Bag-of-words with a built-in English stopword list (~150 words), raw term-frequency scoring, tie-breaks by lower chunk index. Zero dependencies.
- `src/notesStore.ts` is a small Zustand store for the raw text + computed index + last retrieval. Raw text is persisted to `localStorage` (debounced 300 ms in the React effect). The index is recomputed on demand and capped at 50 KB.
- `src/useWebLLM.ts` was extended so that on each `send()` call, if notes have been indexed and tools are not enabled, the top-3 chunks are retrieved, prepended to the system prompt, and recorded for the Sources panel. If a system prompt already exists in the conversation (e.g. from a previous turn), it is replaced in place so each new query sees fresh retrieval.
- `src/WebLLMChat.tsx` gained a small `SourcesPanel` component that renders below the message list and above the input. It is hidden when there is no retrieval to show.
- `src/App.tsx` gained a Notes section in the configuration drawer: char counter, Index button, Clear button, and a status hint. Over-cap text is visually flagged.

### What was deliberately not built (next cycle)

- File picker / drag-and-drop loading
- TF-IDF upgrade (raw TF is enough for the demo, but TF-IDF would reduce noise from very common words across the corpus)
- Embedding-based retrieval (would need a small in-browser embedding model — large for one cycle)
- Multi-document tabs and chunk highlighting in the Sources panel

### Why no dependencies

The retrieval task at this scale (1–50 KB corpus, dozens of chunks, English-only stopwords) does not need an embedding model, a vector store, or a tokenizer library. ~250 lines of plain TypeScript cover the feature end-to-end and stay easy to read and audit.

## Try it

Interact with the embedded demo above, or <a href="/ux/local-notes-rag/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
