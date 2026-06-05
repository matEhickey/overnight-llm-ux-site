---
sidebar_label: "Activated Orb Memory Marker"
---

# Activated Orb Memory Marker

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/activated-orb-memory-marker/index.html" height="500px" />

## What was built

Activated dialog orbs now leave a persistent cyan memory marker around their room position. Once the player awakens an orb through its dialog, the orb gains a rotating floor ring, a small upper halo, and a soft vertical signal beam.

The marker fades by camera distance so it reads as local wayfinding rather than a global objective beam. Nearby activated orbs show the full marker, while distant ones taper out before they overwhelm the dungeon view.

The original gold proximity beacon and dialog behavior remain unchanged. This build adds a post-activation affordance: unresolved orbs still invite discovery, and resolved orbs now communicate that the player has already completed something there.

## Why this feature

The prototype already tracks activated orbs, but that state was only lightly visible through the proximity beacon color. During exploration, especially while looping back through generated rooms, it was too easy to forget which orbs had already been resolved.

This is a self-contained exploration improvement from `main`. It compounds with future navigation systems because it gives the game a clearer visual distinction between discovery targets and remembered places.

## Implementation notes

`ActivatedOrbMarker.tsx` mounts under each orb group in `Balls.tsx` and reads the existing `activatedOrbs` Zustand state by dialog actor id. It renders only after activation, so inactive orbs keep the current visual language.

The component follows the same React Three Fiber pattern as the proximity beacon: refs are mutated inside `useFrame` using `clock.elapsedTime`, which Context7 confirmed as the recommended animation approach. Three lightweight transparent meshes create the effect: a floor `ringGeometry`, a smaller upper `ringGeometry`, and an open-ended `cylinderGeometry` for the signal beam. Materials use additive blending, no depth writes, and no new dependencies.

Distance falloff lives in `orbMemoryMarker.ts` as a pure helper with focused tests. The marker is full strength within 7 world units and fades out by 22 units, keeping the signal useful in a room or corridor without dominating the entire dungeon.

## Try it

Play the embedded game above, or <a href="/game/activated-orb-memory-marker/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Find a gold dialog orb and press **E**.
2. Choose **Awaken the orb** in its dialog.
3. Close the dialog and confirm the activated orb now has a cyan floor ring, halo, and vertical memory signal.
4. Walk away and backtrack through the room to confirm the marker helps identify the resolved orb.
