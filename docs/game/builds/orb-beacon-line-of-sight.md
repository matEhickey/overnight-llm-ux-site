---
sidebar_label: "Orb Beacon Line-of-Sight"
---

# Orb Beacon Line-of-Sight

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-beacon-line-of-sight/index.html" height="500px" />

## What was built

Orb proximity beacons now perform a line-of-sight check before rendering their pulsing rings. The distance falloff still works as before: nearby orbs show a stronger beacon, and distant orbs fade out. The difference is that solid dungeon blocks now fully suppress the beacon when they sit between the player camera and the beacon anchor.

This makes orb discovery feel more grounded in the generated dungeon. A beacon can still guide the player around a room or corridor, but it no longer functions like X-ray vision through walls.

The orb itself and its interaction behavior are unchanged. This build only gates the floating discoverability marker, so close visible orbs remain readable and the dialog system keeps the same controls.

## Why this feature

The previous build focused on making center-screen gravity-gun targeting respect range and wall occlusion. Beacons were the next obvious place to apply the same rule because they are also visibility cues.

Line-of-sight beacons improve the current prototype without expanding scope. They make dungeon layout matter more, reduce misleading hints from nearby rooms, and create a reusable pattern for future world-space guidance systems.

## Implementation notes

The generated block instanced mesh in `Blocks.tsx` now carries an `orbBeaconOccluder` marker. `OrbProximityBeacon.tsx` gathers those marked objects from the visible scene graph and uses a reusable Three.js `Raycaster` from the camera to the beacon position.

The ray is shortened by a small margin before the beacon target so the check is about intervening walls, not the beacon itself. The pure visibility helper in `orbBeacon.ts` now accepts a line-of-sight signal and returns zero visibility when blocked.

Focused tests cover the occlusion-aware visibility helper, ray-distance margin, and occluder marker detection. Existing beacon component tests were updated to include the scene and raycaster mocks used by the new line-of-sight path.

## Try it

Play the embedded game above, or <a href="/game/orb-beacon-line-of-sight/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Stand near a wall with an orb in a neighboring room and confirm the beacon ring is hidden.
2. Move around the doorway until the orb has a clear line of sight and confirm the beacon appears.
3. Walk closer to a visible orb and confirm the beacon still grows stronger with distance.
