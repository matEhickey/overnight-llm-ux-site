---
sidebar_label: "Orb Activation Fanfare"
---

# Orb Activation Fanfare

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-activation-fanfare/index.html" height="500px" />

## What was built

The prototype now celebrates orb activation with a short, automatic fanfare. When the player chooses to awaken an orb in dialog, the game emits a cyan-gold particle burst from that orb and shows a high-priority HUD banner above the dialog.

The banner names the awakened orb and reports progress, including the all-orbs-awake state when the last orb is activated. Because it is driven by the same `orb.activated` event as the rest of the world state, it works for every generated orb without a separate interaction mode.

## Why this feature

Orb activation already changes the game state, but the moment was easy to miss. The compass and in-world beacon colors update after activation, yet the action itself needed a more legible beat.

This was a good automation-focused feature because it listens to an existing event and responds immediately. The player does not toggle an effect or open a separate screen; the game recognizes a milestone and presents feedback on its own.

## Implementation notes

`src/components/ui/OrbActivationFanfare.tsx` subscribes to `gameEvents` in a React effect and cleans up both the event listener and timeout. On `orb.activated`, it looks up the orb position from `useGameStore`, emits two particle bursts through `useParticleStore`, and shows a temporary DOM overlay.

Small formatting helpers in `src/utils/orbFanfare.ts` keep actor labels and activation progress testable. The new unit test covers generated orb labels, unknown actor ids, partial progress, completion, and empty orb lists.

The implementation reuses the existing particle system rather than adding a new renderer, so the feature stays compact and leaves future route/objective work untouched.

## Try it

Play the embedded game above, or <a href="/game/orb-activation-fanfare/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
