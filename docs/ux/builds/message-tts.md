---
sidebar_label: "Message TTS"
---

# Message TTS — speech playback for assistant messages

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/ux/message-tts/index.html" height="600px" />

## What was built

A 🔊 button appears on every assistant message bubble. Tapping it speaks the
message aloud via `window.speechSynthesis` — the browser's built-in text-to-speech
engine. The feature works on any message in the chat, including the live
streaming bubble (as the model is generating).

### Controls

- **🔊** — tap to start speaking this bubble
- **⏸** / **▶** — pause and resume mid-utterance
- **⏹** — stop immediately
- **⚙** — open the voice settings panel

### Voice settings panel

The ⚙ panel exposes three controls:

- **Voice** — a scrollable list of all available `SpeechSynthesisVoice`
  instances, sorted with English voices first. Select any voice; the selection
  persists to localStorage.
- **Rate** — slider from 0.5× to 2.0×. Default is 1.0 (normal speed).
- **Pitch** — slider from 0.0 to 2.0. Default is 1.0.

All settings are saved automatically on every change and restored on the
next page load.

### Visual indicators

While a bubble is being spoken, a small animated waveform (three
CSS-animated bars) appears next to the 🔊 button cluster. The waveform
matches the bubble's text color (white text for user bubbles, dark for
assistant bubbles).

### Live streaming bubble

The live streaming bubble (shown while the model is generating) also
carries a 🔊 button. Clicking it starts speech for the current
accumulated text. When the stream completes and the bubble is replaced
by the final committed message, the button moves with it — tap 🔊 on the
final bubble to hear the full response.

## Why this feature

The chain has explored many dimensions of the LLM UX: mode systems,
persona management, telemetry, memory, and input modality (voice IN on
2026-06-29). This cycle takes the other half of the sensory loop:
**output modality** — letting the model speak rather than just write.

`window.speechSynthesis` is:
- Built into every modern browser (Chromium, Firefox, Safari)
- Zero dependency — no model weights, no API call, no latency
- Immediately demoable without any download

The natural pairing is Voice Input (2026-06-29) ↔ Message TTS:
one captures your words, the other reads the model's back.

## Implementation notes

### Module layout — `src/message-tts/` (new)

```
src/message-tts/
  settings.ts           — localStorage key, TTSSettings type, load/save/resolve
  ttsController.ts     — singleton controller: speak/pause/resume/stop
  useMessageTTS.ts    — React hook wiring controller ↔ store
  TTSButton.tsx       — the 🔊/⏸/▶/⏹/⚙ control cluster
  Waveform.tsx         — CSS-animated 3-bar waveform indicator
  TTSettingsPanel.tsx  — voice/rate/pitch popover
  index.ts             — public surface
```

### TTSController

A thin singleton wrapper around `window.speechSynthesis` with one
important guarantee: **only one utterance plays at a time**. Calling
`speak(id, text)` while another bubble is playing cancels the previous
utterance first.

Notable browser-quirk handling:
- Chromium fires `pause()` immediately after `speak()` as a no-op
  before the utterance has started. The controller defers pause until
  the `onstart` event fires.
- `cancel()` fires an `error` event with `error = "interrupted"` in
  some browsers. The controller translates this to a clean `onEnd(id,
  "stopped")` rather than surfacing it as a real error.

### Hook contract

```ts
interface MessageTTSReturn {
  supported: boolean;
  voices: SpeechSynthesisVoice[];
  settings: TTSSettings;
  setSettings: (patch: Partial<TTSSettings>) => void;
  speakingId: string | null;  // bubble id currently playing
  paused: boolean;
  play: (id: string, text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}
```

The hook is instantiated **once** at the `MessageList` level and passed
to each bubble's `<TTSButton>` as a prop. This prevents callback
ownership conflicts when multiple bubbles share the same controller
singleton.

### localStorage schema

Key: `overni…ings` (abbreviated in source)
```json
{ "voiceURI": "Google US English", "rate": 1.0, "pitch": 1.0 }
```

### Browser requirements

- Secure context (HTTPS or localhost) — the Web Speech API is only
  available in secure contexts. Vercel serves over HTTPS, so the demo
  works in production. Local dev uses the existing `@vitejs/plugin-basic-ssl`.
- If `speechSynthesis` is unavailable, the button renders as 🔇 with a
  tooltip explaining the limitation. No crash.

## Dependencies

No new runtime dependencies. Added dev dependencies:

- `@testing-library/react@^16` — for component and hook tests
- `jsdom@^25` — vitest environment for React component tests

## Try it

Interact with the embedded demo above, or <a href="/ux/message-tts/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

Send any message, wait for the reply, then tap 🔊 on the assistant bubble.
Adjust the voice and speed in ⚙. The settings persist across reloads.