---
sidebar_label: "Orb Activation Particles"
---

# Orb Activation Particles

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-activation-particles/index.html" height="500px" />

## What was built

Every successful dialog-orb interaction now emits a short particle burst at the orb's position. The particles inherit the orb color, so each discovery has feedback that matches the object the player targeted.

The feature extends the particle system from gravity-gun feedback into exploration feedback. Grab, throw, slam, and orb activation now share a consistent visual language without adding another renderer.

## Why this feature

Dialog orbs previously opened a modal with no reaction in the 3D world. Reusing the pooled particle system makes interactions easier to read and gives discoveries more weight for a small implementation cost.

## Implementation notes

`Balls.tsx` stores the orb color in each interactable mesh's `userData`. When `InteractionHandler.tsx` successfully opens a dialog, it calls Three.js `getWorldPosition()` on the hit mesh and emits 55 particles through the existing Zustand particle store.

The world-position lookup matters because the interactive core mesh is nested inside a positioned group. Reading its local position would incorrectly emit every burst near the scene origin.

This cycle also added particle-store tests and cleaned the existing lint baseline so typecheck, lint, test, and build all run cleanly.

## Try it

Play the embedded game above, or <a href="/game/orb-activation-particles/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Find a glowing dialog orb in the dungeon.
2. Aim at its core and press **E**.
3. Watch the orb-colored particles burst as the dialog opens.
