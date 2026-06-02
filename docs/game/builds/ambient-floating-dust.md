---
sidebar_label: "Ambient Floating Dust"
---

# Ambient Floating Dust

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/ambient-floating-dust/index.html" height="500px" />

## What was built

The dungeon now contains a subtle field of warm floating dust motes. They drift gently upward and side to side throughout the generated space, adding motion to otherwise quiet rooms and corridors.

The effect is deliberately restrained. It supports the existing grid, walls, orbs, and interaction particles without competing with them, while making camera movement and room depth easier to read.

## Why this feature

The prototype already has interactive moments, but the environment between those moments remains visually static. Ambient dust adds a continuous atmospheric layer without changing game state or interaction behavior.

This was also a good fit for an isolated cycle: it can be evaluated independently and later combined with fog, audio, or lighting experiments.

## Implementation notes

`AmbientDust.tsx` renders 260 motes as a single React Three Fiber point cloud. Deterministic seeded generation gives each mote an origin, warm tint, drift phase, and upward speed. A `useFrame` update mutates the typed position buffer, wraps motes that reach the top of the dust volume, and marks the position attribute for upload.

The implementation uses one `BufferGeometry` and one transparent additive `PointsMaterial`, keeping the effect to a single draw call. It does not add dependencies or global state.

## Try it

Play the embedded game above, or <a href="/game/ambient-floating-dust/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Walk away from the starting position into a room or corridor.
2. Look across a darker wall or turn slowly while moving.
3. Confirm the warm motes drift upward and sideways without affecting interaction.
