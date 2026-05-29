---
sidebar_label: "Particle System"
---

# Particle System

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/particle-system/index.html" height="500px" />

## What was built

A GPU-friendly particle system that adds visual feedback to every gravity gun interaction:

- **Grab burst (blue):** Cyan sparks spray when you pick up an object with E
- **Throw burst (orange):** An expanding spray of orange particles fires from the camera position when you throw
- **Slam burst (yellow):** When a thrown object lands hard (velocity > 8 → < 2), yellow sparks explode at the impact point

Particles are pooled (max 600 active) with additive blending for a glowing effect. Each burst is color-coded by event type so the feedback is immediately readable.

## Why this feature

The gravity gun was functional but felt thin — grab, throw, done. The particle system transforms every interaction into a satisfying moment. A slam burst on a hard landing gives weight to throws; the blue grab burst makes picking up objects feel electric.

Adding visual feedback compounds on itself: every action now has a payoff, which encourages more interaction, which makes the dungeon feel alive.

## Implementation notes

**Particle pool** — `src/stores/particleStore.ts` manages up to 600 particles as plain objects (no Three.js objects to avoid GC pressure). Each particle stores position, velocity, life, and RGB color.

**Rendering** — `src/systems/ParticleSystem.tsx` renders all active particles as a single `THREE.Points` mesh with vertex colors and additive blending. Typed arrays are mutated every frame in `useFrame` (intentional pattern, suppressed via eslint disable).

**Key rendering fixes encountered:**
- Three.js r183 defaults `BufferAttribute` to `StaticDrawUsage` — this tells the GPU the buffer never changes, causing particle updates to silently fail when the draw range transitions from 0 to >0. Fixed by setting `.setUsage(THREE.DynamicDrawUsage)` on both position and color attributes.
- The geometry's bounding sphere is computed only once (lazily) by Three.js for frustum culling, so `geo.computeBoundingSphere()` is called each frame after position updates to keep culling accurate.

**Slam detection** — In `PhysicsObjects.tsx`, each body tracks `prevSpeed` via `useRef`. When `prev > 8 && current < 2`, a hard landing is detected and the slam burst fires.

**Trigger sources:**
- `GravityGun.tryGrab()` → blue burst at object position
- `GravityGun.throwInternal()` → orange burst at camera position
- `PhysicsObjects.useFrame` → yellow burst at landing position

## Try it

Play the embedded game above, or <a href="/game/particle-system/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Walk up to a cyan orb (physics ball)
2. Press **E** to grab — blue sparks
3. Press **E** again to throw — orange burst fires from you
4. Watch the ball slam into the ground — yellow sparks on impact