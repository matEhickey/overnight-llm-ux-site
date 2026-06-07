---
sidebar_label: "Orb Compass"
---

# Orb Compass

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/orb-compass/index.html" height="500px" />

## What was built

The prototype now has an orb compass at the top of the screen. It shows each dialog orb as a small marker along a horizontal heading bar, with gold markers for sleeping orbs and cyan markers for activated orbs.

The lower row summarizes progress as `Orbs activated/total` and points toward the nearest unactivated orb with a compact left, forward, or right cue plus distance. When every orb has been activated, the compass switches to an `All awake` completion state.

The compass hides while dialog is open, matching the existing crosshair and controls. It is intentionally small so the game still feels like first-person exploration rather than a map screen.

## Why this feature

Recent builds made individual orbs more readable through beacons, occlusion, and activation memory markers. The missing layer was global orientation: after walking through several generated rooms, the player could still lose track of how many orbs were left and which direction was worth trying next.

This adds a visible, testable navigation loop without changing level generation or dialog behavior. It also creates a natural foundation for future objectives, room discovery, quest states, and optional difficulty modes.

## Implementation notes

`OrbCompass.tsx` is a DOM HUD component mounted from `App.tsx` alongside the existing crosshair, touch controls, and HUD. It uses Zustand selectors for `balls`, `activatedOrbs`, and `player`, following the store-consumption pattern confirmed through Context7.

The compass math lives in `src/utils/orbCompass.ts` with focused Vitest coverage. The helper calculates planar distance, bearing relative to the player's yaw, lateral marker placement, progress counts, and the nearest unactivated orb. React `useMemo` keeps the derived compass state local to the component and recalculates when the selected state changes.

No new dependencies were added. The feature build was copied only to `/game/orb-compass/`; `/game/main/` was not updated.

## Try it

Play the embedded game above, or <a href="/game/orb-compass/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.

1. Watch the compass at the top of the screen while rotating.
2. Follow the nearest-orb cue toward a gold dialog orb.
3. Activate an orb through its dialog and confirm its marker turns cyan and the progress count increases.
4. Activate all available orbs to see the `All awake` completion state.
