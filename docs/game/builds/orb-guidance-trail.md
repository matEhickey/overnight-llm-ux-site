---
sidebar_label: "Orb Guidance Trail"
---

# Orb Guidance Trail

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-guidance-trail/index.html" height="500px" />

## What was built

The prototype now renders a pulsing guidance trail on the dungeon floor, pointing from the player toward the nearest unactivated orb. It pairs a thin dashed Drei line with animated gold pips and a cyan target ring around the selected orb.

The trail updates as the player moves and automatically retargets when an orb is awakened. It hides when the nearest orb is already close enough, and disappears completely once every orb has been activated.

This keeps the latest HUD compass useful while giving players a stronger world-space cue to follow through rooms and corridors.

## Why this feature

The previous build added global orb orientation in the HUD, but the generated dungeon still asked players to translate a top-screen direction into movement moment by moment. A floor trail makes the next objective readable inside the 3D scene itself.

It is also a compact foundation for future objective routing: the same target-selection and trail-point math can support quest paths, room exits, timed objectives, or different guidance modes.

## Implementation notes

The pure trail math lives in `src/utils/orbGuidanceTrail.ts`. It selects the nearest unactivated orb, suppresses short-distance trails, clamps the number of guide points, and interpolates stable floor positions between the player and the target.

`src/scenes/GameScene/OrbGuidanceTrail.tsx` consumes the existing Zustand game store, uses Drei's `Line` component for the dashed route, and uses React Three Fiber `useFrame` refs to pulse material opacity and scale without adding state churn. No dependencies were added.

The scene mounts the trail after the orb meshes so it is part of the same world pass. The build was copied only to `/game/orb-guidance-trail/`; `/game/main/` was not updated.

## Try it

Play the embedded game above, or <a href="/game/orb-guidance-trail/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
