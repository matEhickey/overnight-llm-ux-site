---
sidebar_label: "Voice Input v2"
---

# Voice Input v2

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/voice-input-v2/index.html" height="600px" />

## What was built

A microphone button next to the chat textarea opens a `SpeechRecognition`
session. As the user speaks, the recognized transcript streams live into
the textarea. A pulsing red dot and a "listening · [language]" label confirm
the session is active. A small floating preview shows the transcript as
it accumulates; finals are *appended* to the current textarea content
(with a space when needed), so the user can dictate, type, dictate again,
type more — the chat input is a continuous editing surface, not a one-shot
STT replacement.

This is **v2** — a clean re-implementation on top of `main`. The earlier
`/ux/voice-input/` artifact was a static build left by a previous cycle
that never landed its source on `main`. This time the source actually
ships on the `feature/voice-input-v2` branch:

- `src/useSpeechRecognition.ts` — the hook (≈230 lines)
- `src/MicButton.tsx` — the UI (≈170 lines)
- `src/WebLLMChat.tsx` — `<InputArea>` integration (~10 LOC)
- `src/__tests__/useSpeechRecognition.test.ts` — 8 tests in jsdom

## Why this feature

The chain has been building *output* shapes (lenses, councils,
constellations, telemetry). Voice input shifts the axis: a different
*input* modality. Voice is one of the few genuinely novel axes left in
LLM UX that doesn't require a backend (the Web Speech API runs entirely
in the browser).

### Language picker

A small `<select>` next to the mic lets the user pick from five curated
locales: `en-US`, `en-GB`, `fr-FR`, `de-DE`, `es-ES`. The choice is
persisted to `localStorage` (key `overnight-llm-ux-voice-lang`) so the
same language is remembered on the next visit. Switching mid-session
aborts the current session cleanly — it never silently re-labels an
in-progress transcript.

## Implementation notes

### Hook design

```ts
const { supported, state, interim, final, error, lang, start, stop, abort, setLang, active }
  = useSpeechRecognition();
```

- `start()` opens a fresh session with `continuous: false`,
  `interimResults: true`, `maxAlternatives: 1`. Interim + final results
  are accumulated by walking the full `event.results` list.
- The hook creates a **new** recognition instance per `start()` — many
  browser implementations get confused if you re-use a single instance
  after `end()`.
- `setLang()` mid-session calls `abort()` so the next session uses the
  new language.
- Soft errors (`no-speech`, `aborted`) are demoted — they don't surface
  as a red banner. Hard errors (`not-allowed`, `audio-capture`,
  `network`, `language-not-supported`) get a humanized message.

### Integration in `WebLLMChat`

The `<InputArea>` already manages its own textarea state. We added a
single `<MicButton>` between the textarea and the Send button, plus a
short `onVoiceTranscript` callback that appends the recognized text
(with a space separator). The `send()` flow is byte-identical to before
— voice input is purely an *input* mechanism.

```tsx
<MicButton onTranscript={onVoiceTranscript} disabled={!ready || api.isGenerating} />
```

When the model is loading or generating, the mic is disabled (greyed
out with `cursor: not-allowed`).

### Browser caveats

- **HTTPS required.** The Web Speech API is only available in secure
  contexts (HTTPS or `localhost`). Vercel serves the demo over HTTPS,
  so production works. Local dev uses `@vitejs/plugin-basic-ssl` which
  the existing config already pulls in.
- **Microphone permission** is browser-managed. Deny → the hook sees
  `not-allowed` and surfaces it inline.
- **Firefox** still doesn't ship `SpeechRecognition` — the button shows
  a `🎤×` glyph and the textarea keeps working normally.

### Dependencies

No new runtime dependency. Added two dev dependencies:

- `@testing-library/react@^16` — for hook + component tests.
- `jsdom@^25` — vitest's previous `node` environment didn't expose
  `window`, which the hook needs for feature detection and
  `localStorage`.

## Try it

Interact with the embedded demo above, or <a href="/ux/voice-input-v2/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Click the mic button. Your browser will ask for microphone permission.
Once granted, speak — you'll see the transcript stream into the input
in real time. Edit it, hit Enter, the model responds as usual.