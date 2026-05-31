---
sidebar_label: "Gravity-Gun Target Highlight"
---

# Gravity-Gun Target Highlight

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/gravity-gun-target-highlight/index.html" height="500px" />

## What was built

Physics props under the center-screen crosshair now receive a pulsing cyan-and-white target marker. The marker faces the camera, follows moving props, and disappears while an object is already being held.

The feature makes the existing gravity gun legible before the player presses **E**. Instead of learning by trial and error which objects react, the player gets immediate world-space feedback while aiming.

## Why this feature

The gravity gun is one of the prototype's strongest interactions, but it previously had no pre-action feedback. A small targeting marker makes the interaction easier to discover and gives future gravity-gun features a clear visual anchor.

## Implementation notes

`GravityGunTargeting.ts` contains the center-screen Three.js raycast shared by both the highlight and the actual grab action. `GravityGun.tsx` renders two lightweight rings and mutates their visibility, position, camera-facing quaternion, and pulse scale inside React Three Fiber's `useFrame`.

The physics-prop material is now double-sided so sphere raycasting reliably detects the visible props. This cycle also cleaned the existing lint baseline and added focused targeting tests.

## Try it

Play the embedded game above, or <a href="/game/gravity-gun-target-highlight/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Aim at a small cyan physics prop.
2. Watch for the pulsing target marker.
3. Press **E** to grab it, then press **E** again to throw.
