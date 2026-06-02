---
sidebar_label: "Ambient Floating Dust"
---

# Ambient Floating Dust

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/ambient-floating-dust/index.html" height="500px" />

## What was built

The dungeon now contains a subtle field of warm floating dust motes. They drift gently upward and side to side, concentrated inside the dungeon rooms rather than bleeding through walls. The effect adds motion and depth without competing with interaction.

If you open the **DEBUG** panel (top-right button), the `Dust Debug` folder contains two toggles:
- **showRoomBounds** — reveals green wireframe rectangles showing each room's interior floor area, useful for verifying dust placement during development.
- **showFlyButton** — reveals a 🦅 Fly Up / Land button on the right side of the screen that lifts the camera to Y=40 for a top-down view.

## Why this feature

The prototype already has interactive moments, but the environment between those moments remains visually static. Ambient dust adds a continuous atmospheric layer without changing game state or interaction behavior.

The room-aware placement ensures dust lives where the player walks, not inside walls or outside the dungeon boundary.

## Implementation notes

`AmbientDust.tsx` renders 80 warm motes as a single React Three Fiber point cloud. A deterministic seeded random generator (extracted to `src/utils/math.ts` for reuse) produces stable positions from a date-stamped seed (26062026). Each mote gets an origin, warm tint, drift phase, and upward speed.

Motes are distributed across the interior floor of each room. A pure generation function (`generateDustParticles` in `src/utils/dustParticles.ts`) separates the placement logic from Three.js rendering, making it independently testable.

A `useFrame` callback mutates the typed position buffer every frame: each mote sways sinusoidally (±0.55 units at 0.23/0.19 Hz), rises slowly (0.07–0.18 units/second), and wraps back to floor level when it exceeds the dust column height. The bounding sphere is recomputed after each update to prevent frustum culling from hiding motes that have drifted from their initial positions.

The implementation uses one `BufferGeometry` and one transparent additive `PointsMaterial`, keeping the effect to a single draw call. Point size is scaled by the device pixel ratio for consistent appearance across Retina and standard displays. The animation loop is throttled when `delta` is zero (frozen or backgrounded tab).

Leva debug controls (`showRoomBounds`, `showFlyButton`) are available via the DEBUG button's panel, both disabled by default.

## Test coverage

14 tests across two suites:
- `dustParticles.test.ts` — 9 tests covering particle count, room-bounds containment, Y-range validity, deterministic seeding, seed/layout sensitivity, empty rooms, single room, and full-level distribution validation.
- `AmbientDust.test.tsx` — 5 tests for component mounting, `useFrame` registration, animation execution, frozen-state skip, and empty-room handling.

## Try it

Play the embedded game above, or <a href="/game/ambient-floating-dust/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Walk away from the starting position into a room or corridor.
2. Look across a darker wall or turn slowly while moving.
3. Confirm the warm motes drift upward and sideways without affecting interaction.
4. Click the **DEBUG** button, then enable `Dust Debug → showRoomBounds` to see the exact room boundaries.
5. Enable `Dust Debug → showFlyButton` and click **Fly Up** to inspect the dungeon layout from above.
