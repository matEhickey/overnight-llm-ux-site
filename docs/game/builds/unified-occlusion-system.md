---
sidebar_label: "Unified Occlusion System"
---

# Unified Occlusion System

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/main/index.html" height="500px" />

## What was built

A shared `src/occlusion/` module that replaces two separate occlusion systems with one. The gravity-gun line-of-sight (prevents grabbing objects through walls) and orb beacon line-of-sight (hides proximity beacons behind walls) now use the same occluder marker, the same line-of-sight check, and the same cached occluder list.

### Before

```
Blocks.tsx              OrbProximityBeacon.tsx       raycastRules.ts (interactable)
  ├── interactionOccluder: true    ├── isOrbBeaconOccluder()    ├── isInteractionOccluder()
  └── orbBeaconOccluder: true      └── scene.traverseVisible()  └── separate flag
                                       per frame, per beacon
```

### After

```
Blocks.tsx              OrbProximityBeacon.tsx       store.ts (interactable)
  └── __occluder_v1       ├── useOccluderCache()     └── isOccluder() from occlusion/types
                           └── hasLineOfSight() from occlusion/lineOfSight
```

## Why this matters

The two overnight features were architecturally correct individually, but implementing them in separate cycles meant duplicating the occlusion concept. This consolidation:

1. **Removes per-frame scene traversal** — occluders are collected once at mount time via `useOccluderCache()`, then reused across all 6 orb beacons and the interaction raycast
2. **Single source of truth** — adding a new occluder (e.g. pillar, door, wall segment) means setting one flag
3. **Extensible** — future features (enemy sight lines, dynamic lighting, puzzle lasers) can use the same `hasLineOfSight()` utility
4. **Tested** — 34 new tests covering occlusion tagging, parent-chain detection, line-of-sight math, raycaster integration, and the React cache hook

## Implementation notes

The module has three layers:

- **`types.ts`** — `OCCLUDER_FLAG` (string key `__occluder_v1`), `tagAsOccluder()`, `isOccluder()` (parent-chain walk), `collectOccluders()` (scene traversal)
- **`lineOfSight.ts`** — `hasLineOfSight(from, to, occluders[], margin?)` using a shared per-frame `Raycaster`
- **`cache.ts`** — `useOccluderCache(scene)` React hook using `useMemo` for stable reference

The `getBestInteractableHit()` function in `raycastRules.ts` now takes an `isOccluderFn` callback, so it's decoupled from any specific occlusion implementation. The store injects `isOccluder` from the occlusion module.

## Try it

Play the embedded game above, or <a href="/game/main/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>. The occlusion behavior is unchanged from before — grab a physics object and try to aim through a wall, or watch orb beacons disappear behind dungeon blocks.
