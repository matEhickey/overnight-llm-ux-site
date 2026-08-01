---
sidebar_label: "Voice Input (Hold)"
---

# Voice Input — Hold Space, Speak, Edit, Send

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/voice-input-hold/index.html" height="600px" />

## What was built

A three-axis upgrade over the previous voice-input attempts. The chat
input area now offers **three** independent ways to author a message:

1. **Type** — the existing textarea, untouched.
2. **Tap the 🎤 button** — toggles a `SpeechRecognition` session on/off.
3. **Hold the spacebar** — anywhere on the page, hold Space for ≥200ms
   to start dictating, release to stop. While you're typing in the
   textarea, the hold binding is suppressed (so space still types).

While you're speaking, four things happen in parallel:

- **Live interim transcript** — recognized-so-far text appears as
  italic gray ghost text *over* the textarea, updated as you talk.
- **Live waveform** — a 12-bar visualizer to the left of the textarea
  reflects the actual RMS of your microphone input via Web Audio's
  `AnalyserNode` + `getByteFrequencyData`.
- **Pulsing red mic button** — animates with a `box-shadow` pulse so
  you can see at a glance that the session is live.
- **Edit-on-stop** — when you stop dictation (release space, click ⏹,
  or the browser ends the session), the recognized text is spliced into
  the textarea with a leading space when needed. You can then edit
  freely before hitting Send.

The **language selector** (en-US / fr-FR / es-ES / de-DE) sits in the
input row. Choice persists to `localStorage` (key
`overnight-llm-voice-lang`) across reloads. Switching mid-session is
disabled while listening (avoids race with an in-flight recognition).

## Why this feature

Voice is the most-requested input axis across the previous cycles
(`voice-input`, `voice-input-v2`). Mathias's 2026-07-26 agent-feed note
("Let's try it again on the same subject") made the retry explicit.

This attempt is **genuinely new** on `main` and does not depend on
code from `feature/voice-input` or `feature/voice-input-v2`:

- New module `src/voice-input/` (mirrors `src/reply-receipt/` and
  `src/confidence-pulse/`).
- New hook (`useVoiceRecognition`) with its own state machine —
  differs from the v2 hook by using `continuous: true` (long-form
  dictation works without re-prompting) and a separate `finalTranscript`
  buffer that gets committed on stop.
- New component (`VoiceInputBar`) with **three independent inputs** —
  keyboard (hold space), mouse (click mic), and text (textarea) — where
  previous builds had only one.
- Web Audio waveform: actual live audio analysis, not a fake spinner.
- Last cycle was **Inline Annotations** (a read-mode affordance on the
  assistant bubble). This is a **compose-mode** affordance on the user
  input area — different surface, different state, different module.

## Implementation notes

### Browser support

Web Speech API (`window.SpeechRecognition` / `webkitSpeechRecognition`)
is available in Chrome, Edge, and Safari. Firefox does not ship it.
The mic button is rendered disabled in that case with a tooltip
("Voice input not supported in this browser — try Chrome or Edge").
The textarea + keyboard continue to work normally.

### The hook

`useVoiceRecognition()` returns:

```ts
{
  supported: boolean,         // false on Firefox
  isListening: boolean,
  interimTranscript: string,  // italic ghost text
  finalTranscript: string,    // committed so far this session
  error: VoiceError | null,
  lang: VoiceLang,
  setLang: (l: VoiceLang) => void,
  start: () => void,
  stop:  () => void,
  reset: () => void,
}
```

Internally it owns a `recognitionRef` (one `SpeechRecognition` instance
per session). On `start()` it constructs a fresh instance, sets
`continuous: true`, `interimResults: true`, and binds `onresult`,
`onerror`, `onend`, `onstart`. On unmount it aborts the session and
nulls all handlers (no leak).

The `onend` handler is the safety net: it commits any pending interim
text into `finalTranscript` so users never lose what they said even if
the browser ends the session unexpectedly (timeout, network blip).

### The component

`<VoiceInputBar value onChange onSubmit disabled />` is a drop-in
replacement for the textarea+Send row in `WebLLMChat.tsx`'s
`<InputArea>`. It does NOT mutate `value` during dictation (so the
user's typed text is safe) — only when the session ends does it splice
the recognized text in.

### Hold-to-dictate

A `keydown` listener on `window` checks for `e.code === "Space"`,
records the timestamp, and (after 200ms) calls `voice.start()` if the
key is still down. `keyup` calls `voice.stop()`. The binding is
suppressed when the user is typing in an `<input>` / `<textarea>` /
contenteditable element so space still types. Modifier-key combos
(Ctrl/Cmd/Alt + Space) are also skipped.

### Waveform

When `isListening` flips on, the component requests
`getUserMedia({audio: true})`, builds an `AudioContext` and
`AnalyserNode`, and runs a `requestAnimationFrame` loop that bins the
frequency data into 12 buckets. Bar heights are proportional to bucket
RMS, smoothed with a 60ms CSS transition. When listening stops, the
stream tracks are stopped and the audio context closed.

### Tests

24 new tests in `src/__tests__/voice-input.test.ts` covering:
environment detection (with/without `SpeechRecognition`), start/stop
lifecycle (idempotency, unmount cleanup), transcript handling
(interim vs final, multi-event accumulation, `resultIndex` walking,
`onend` commit), error code mapping (7 variants), and language
persistence (save, rehydrate, garbage fallback). Tests use a
`MockSpeechRecognition` constructor installed on `window` and a
`act()`-wrapped render harness via `react-dom/client` in a jsdom
environment. Total suite: **90 passing** (was 66 — net +24).

### Dependencies

- `jsdom` added as explicit `devDependency` for the test environment.
  Was already present transitively via vitest's resolution.
- No runtime dependencies added — Web Speech API and Web Audio API
  are browser-native.

## Try it

Interact with the embedded demo above, or
<a href="/ux/voice-input-hold/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

**Note on model load:** the voice input works **without** a model
loaded — the Web Speech API runs entirely in the browser. The Send
button is still gated on the model being ready (existing behavior), so
you'll see your dictated text appear live in the input box, but you'll
need to wait for the model download (or pick a small one like
`Llama-3.2-1B-Instruct-q4f32_1-MLC`) before you can hit Send.

For best demo experience, click the model selector, choose the 1B
model, wait for download (~30s on first load), then click 🎤 or
hold Space and speak.
