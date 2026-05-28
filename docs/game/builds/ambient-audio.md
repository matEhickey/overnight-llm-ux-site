---
sidebar_label: "Ambient 3D Audio"
---

# Ambient 3D Audio

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/ambient-audio/index.html" height="500px" />

## What was built

Added a spatial Web Audio API soundscape to the game — completely zero-dependency (browser-native API only). The system has three layers:

**1. Ambient Drone** — Two detuned sine oscillators at 42Hz and 44.5Hz create a beating-effect hum, low-pass filtered at 180Hz. A slow LFO (0.07Hz) modulates the gain for an organic breathing feel.

**2. Spatial Orb Audio** — Each of the 6 orbs gets its own `PannerNode` (HRTF panning model) at its world position. A subtle sine oscillator per orb creates spatial audio that shifts as the player moves. Orbs fade in/out based on distance (inverse rolloff, 20-unit max distance).

**3. Footstep Sounds** — White noise bursts through a 140Hz bandpass filter, triggered every 350ms while the player is moving. The `inputStore` drives movement detection — zero coupling to physics.

**Mute Toggle** — Press `M` to mute/unmute all audio. A top-right indicator shows current state.

## Why this feature

The game was visually atmospheric (fog, glow materials, procedural dungeon) but sonically dead. Audio is responsible for a huge portion of perceived quality in 3D experiences — a silent world feels broken even when everything else works. This was the single highest-impact improvement available in one cycle.

## Implementation notes

**AudioContext initialization** happens lazily on first user interaction (click/keypress). Browser policy mandates a user gesture before any audio can play — the `AudioEngine.init()` call is triggered from inside the `<Canvas>` via a `useEffect` that runs on first render.

**Listener position** is updated each frame from `useFrame` in the `AudioListener` R3F component, reading from `gameStore.player.position` and `inputStore.movement`.

**Orb sources** are added/removed via `useEffect` that syncs with `gameStore.balls`. Each orb gets a unique `PannerNode` so audio position is tracked individually.

**No new npm dependencies** — `AudioContext`, `OscillatorNode`, `PannerNode`, `GainNode`, `BiquadFilterNode`, and `AudioBufferSourceNode` are all browser-native.

**Files:**
- `src/systems/AudioEngine.ts` — core `AudioEngine` class (singleton)
- `src/systems/AudioListener.tsx` — R3F component that drives the engine
- `src/scenes/GameScene/Scene.tsx` — added `<AudioListener />`
- `src/app/App.tsx` — added `<AudioIndicator />` and M-key mute handler

## Try it

Play the latest build on the [/play](/play) page. Click anywhere first to initialize audio (browser policy), then walk around with WASD to hear footstep sounds and orb spatial audio.
