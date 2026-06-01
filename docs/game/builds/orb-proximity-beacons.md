---
sidebar_label: "Orb Proximity Beacons"
---

# Orb Proximity Beacons

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-proximity-beacons/index.html" height="500px" />

## What was built

Dialog orbs now render a pulsing diamond beacon when the player moves within discovery range. The marker floats above the orb, faces the camera, fades in smoothly with proximity, and becomes a little stronger as the player closes the distance.

Unresolved orbs use a gold beacon. After an orb is activated through its conversation, its marker switches to cyan. The result is a lightweight navigation cue that also communicates progress without adding a minimap or extra HUD.

## Why this feature

The branching dialog system made orbs meaningful, but the static orb glow was easy to miss while exploring the generated dungeon. A proximity cue makes those interactions discoverable and turns the existing activation state into visible world feedback.

## Implementation notes

`OrbProximityBeacon.tsx` adds two lightweight ring meshes above each orb. It mutates their visibility, camera-facing quaternion, opacity, rotation, and pulse scale inside React Three Fiber's `useFrame`, following the renderer's recommended pattern for transient animation.

`orbBeacon.ts` keeps the distance-to-visibility calculation pure and tested. The beacon is full strength inside four world units, falls off linearly, and disappears beyond fourteen units. Existing `activatedOrbs` state selects the marker color, so no new state system or dependency was needed.

## Try it

Play the embedded game above, or <a href="/game/orb-proximity-beacons/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Walk through the dungeon until a gold diamond beacon fades into view.
2. Approach the orb below the marker and press **E** to open its dialog.
3. Activate the orb and confirm that the beacon changes to cyan.
