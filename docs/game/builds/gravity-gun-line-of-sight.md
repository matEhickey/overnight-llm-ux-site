---
sidebar_label: "Gravity Gun Line-of-Sight"
---

# Gravity Gun Line-of-Sight

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/gravity-gun-line-of-sight/index.html" height="500px" />

## What was built

The center-screen interaction raycast now has explicit range and occlusion rules. Dialog orbs keep the familiar 10-unit interaction reach, while grabbable physics objects use a tighter 6-unit gravity-gun reach so the target marker only appears when an object is close enough to plausibly grab.

Dungeon wall blocks are now marked as interaction occluders. If a wall is the first solid thing under the crosshair, interactable objects behind it are ignored instead of being selected from later raycast hits.

This makes the gravity gun feel more physical: the player must aim at a nearby visible object, and hidden objects no longer remain active through generated room geometry.

## Why this feature

The previous gravity-gun highlight made grabbable objects easier to discover, but it also exposed a gap in the interaction rules. The raycast was good at finding registered targets, yet it did not distinguish between a clear line of sight and an object hidden behind a wall.

Range and occlusion are small rules with high leverage. They improve the current tool and give future interactions a reusable way to define reach and visibility.

## Implementation notes

The raycast filtering logic moved into `src/interactable/raycastRules.ts`. That module defines type-based default distances, an optional per-target `maxDistance`, parent-chain interactable lookup, parent-chain occluder lookup, and a pure `getBestInteractableHit` selector.

`src/interactable/store.ts` still owns the Zustand state and the per-frame camera raycast, but it now delegates hit selection to the rule helper. This keeps the store focused on active-target state and makes the interaction behavior independently testable.

`src/scenes/GameScene/Blocks.tsx` marks the instanced dungeon wall mesh with `interactionOccluder`, so the existing generated geometry becomes the blocker for line-of-sight checks. Transparent effects, rings, particles, and the ground remain non-occluding.

The new `raycastRules.test.ts` suite covers the gravity-gun distance, explicit distance overrides, parent-chain id lookup, parent-chain occluder lookup, nearest-target selection, priority tie-breaking, out-of-range grabbables, and wall occlusion.

## Try it

Play the embedded game above, or <a href="/game/gravity-gun-line-of-sight/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Aim at a cyan physics sphere from farther than 6 units and confirm the gravity-gun marker stays hidden.
2. Move closer and confirm the marker appears.
3. Put a dungeon wall between the crosshair and an object, then confirm hidden objects do not remain targetable.
