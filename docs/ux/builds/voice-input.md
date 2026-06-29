---
sidebar_label: "Voice Input"
---

# Voice Input

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/voice-input/index.html" height="600px" />

## What was built

A microphone button next to the chat textarea opens a `SpeechRecognition`
session. As the user speaks, the recognized transcript streams live into
the textarea. A pulsing red dot and a "listening · [language]" label confirm
the session is active. A small floating preview shows the transcript as
it accumulates; clicking "Use ↑" lifts it into the textarea. The user can
also stop with "Stop" or click the mic again to end the session — both
finalize the current transcript and fill the input.

The transcript is *appended* to the current textarea content (with a
space when needed), so the user can dictate, type, dictate again, type
more — the chat input is a continuous editing surface, not a one-shot
STT replacement.

### Language picker

A small `<select>` next to the mic lets the user pick the recognition
language: `en-US`, `en-GB`, or `fr-FR`. The choice is persisted to
`localStorage` (key `overnight-llm-ux-voice-lang`) so the same language
is preselected on the next page load. Switching language mid-session
aborts the active recognition and starts fresh on the next mic click.

### Browser support & fallback

The hook feature-detects `window.SpeechRecognition` (and the
`webkitSpeechRecognition` fallback used by older Safari). When neither
is present — Firefox today — the mic button renders with a "✕" overlay
and a tooltip "voice input not supported in this browser". Clicking it
flips a small inline notice explaining the limitation. The textarea
still works exactly as before.

### Error handling

When the browser *does* support SpeechRecognition but the user denies
microphone permission, the engine fires `error: "not-allowed"`. The
hook surfaces a friendly "Microphone access was denied." message that
auto-dismisses after 3 seconds. Other error codes (`no-speech`,
`audio-capture`, `network`) get similarly translated to short messages.
The `aborted` code is silently swallowed — that's a user-initiated stop.

## Why this feature

The chain has been building *output* shapes — lenses, councils,
constellations, voice forges, telemetry drawers. Every feature so far
has been about what the model says, how it's shaped, or what's happening
inside the runtime. None of them changed *how the user gets their prompt
into the box*.

Voice Input is the first feature on a fresh axis: **input modality**.
The Web Speech API is browser-native, requires zero new dependency, and
ships with a useful feature-detection surface — all the building blocks
are already in the browser; we just hadn't wired them up.

It also makes the chat genuinely more accessible. Hands-free prompting
matters for users with RSI, for accessibility scenarios, and for the
common "I want to think out loud while I type" workflow where you dictate
a paragraph and then edit around it.

## Implementation notes

### Module layout — `src/voice/` (new)

```
src/voice/
  languages.ts                       — language constants, LS key, resolve helper
  useSpeechRecognition.ts            — React hook (start/stop/transcript/error/lang)
  useSpeechRecognition.test.ts       — 18 tests with a mocked SpeechRecognition ctor
  MicButton.tsx                      — mic + language picker + preview + error toast
  languages.test.ts                  — 7 tests for the languages module
  index.ts                           — public surface re-exports
```

### Hook contract

```ts
interface SpeechRecognitionState {
  supported: boolean;       // browser has SpeechRecognition
  listening: boolean;       // session active
  transcript: string;       // accumulated (interim + final) for this session
  error: string | null;     // last error message, or null
  lang: string;             // BCP-47 code, persisted to localStorage
  start: () => void;
  stop: () => void;
  reset: () => void;        // clear transcript
  setLang: (l: string) => void;
}
```

- `start()` opens a fresh session with `continuous: false`,
  `interimResults: true`, `maxAlternatives: 1`. Interim + final results
  are accumulated by walking the full `event.results` list (finals win
  over their interim prefix naturally).
- The hook creates a *new* recognition instance per `start()` — many
  browser implementations get confused if you re-use a single instance
  after `end`.
- `setLang()` mid-session calls `abort()` so the next session uses the
  new language; switching never silently re-labels an in-progress
  transcript.
- All transient state is cleaned up on unmount.

### Integration in `WebLLMChat`

The `<InputArea>` already manages its own textarea state. We added a
single `<MicButton>` between the textarea and the Send button, plus a
short `onVoiceTranscript` callback that appends the recognized text
to the textarea (with a space separator). The `send()` flow is
byte-identical to before — voice input is purely an *input* mechanism.

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
- **Accuracy varies.** Web Speech API is roughly 95% accurate in quiet
  conditions. The whole design assumption is that the user edits
  before submitting, which is why the transcript goes into the
  textarea rather than straight to `send()`.

### Dependencies

No new runtime dependency. Added two dev dependencies:

- `@testing-library/react@^16` — for hook + component tests.
- `jsdom@^25` — vitest's previous `node` environment didn't expose
  `window`, which the hook needs for feature detection and
  `localStorage`.

## Try it

Interact with the embedded demo above, or <a href="/ux/voice-input/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Click the mic button. Your browser will ask for microphone permission.
Once granted, speak — you'll see the transcript stream into the input
in real time. Edit it, hit Enter, the model responds as usual.