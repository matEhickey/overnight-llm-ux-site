---
sidebar_label: "Relay Hub"
---

# Relay Hub

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/relay-hub/index.html" height="500px" />

## What was built

The biggest rework of the game's structure. Orbs are removed entirely, replaced by a goal-driven loop: a central **Hub Console** NPC tells you what to do, and 5 **Relay computers** are scattered across the dungeon for you to find and activate.

Each relay has a unique personality and a different unlock method:

| Relay | Personality | Puzzle |
|-------|-------------|--------|
| #1 — The Loud One | BZZT Why are you poking me | Interact (dialog button) |
| #2 — The Dramatic One | A visitor? After all this time | Blocked by **crates** → gravity gun to clear |
| #3 — The Literal One | Systems nominal-ish | **Jammed** → gravity gun to nudge |
| #4 — The Sleepy One | Mrrrmph five more minutes | Interact (dialog button) |
| #5 — The Conspiracy Theorist | Don't trust the console | Blocked by **crates** → gravity gun to clear |

### New systems

- **Welcome toast** — First-time overlay with objective and collapsible controls guide
- **Hub Console UI** — Top-left progress bar with segment indicators, "ALL ONLINE" pulse
- **Win Overlay** — Animated celebration card with gradient text, dismissible
- **Interactable Config System** — Per-type marker shapes (ring / square / diamond) and particle toggles via `src/interactable/config.ts`
- **Crate debris piles** — 62 crates per blocked relay room, layered in a pyramid, with high friction / low restitution so they form a realistic mound
- **Compass** — Now tracks relays instead of orbs, with proximity and direction
- **Minimap** — Shows relay positions as orange/yellow dots instead of orbs

## Architecture

### Interactable Config System

Each grabbable sub-type declares its own behavior through a centralized config:

```typescript
const INTERACTABLE_GRAB_CONFIGS = {
  crate: {
    particles: { grab: false, throw: false, collision: false },
    marker: { shape: 'square' },
  },
  jammed: {
    particles: { grab: true, throw: true, collision: true },
    marker: { shape: 'diamond' },
  },
}
```

The GravityGun reads the config to render the right hover marker (ring, square, or diamond) and the particle emitters check it before spawning effects. All markers use `depthTest={false}` so they show through walls.

### Relay data

Defined in `src/data/relays.ts` with 5 dialog seeds. Each relay is a simple box+screen 3D model (no complex modelling) sitting on a wall-colored pedestal.

### Crate physics

Crates have been tuned for realistic debris:
- Restitution: 0.08
- Friction: 0.9
- Linear damping: 0.6
- Angular damping: 0.5

Spawned in 3 staggered layers (6×5, 5×4, 4×3) at low heights so they barely fall and settle into a stable pile.

## Why this feature

The game felt like a collection of tech demos. Every system (compass, gravity gun, dialog, fanfare) existed but had no unifying purpose. The Relay Hub gives everything a reason to exist, with just enough narrative to be playful without being heavy.

## Implementation notes

The feature lives on `feature/relay-hub` branch. Built in a single session with iterative feedback.

Key files:
- `src/components/ui/HubConsole.tsx` — Progress display
- `src/components/ui/WelcomeMessage.tsx` — First-use toast
- `src/components/ui/WinOverlay.tsx` — Completion celebration
- `src/data/relays.ts` — Relay dialog seeds
- `src/interactable/config.ts` — Per-type grab config
- `src/scenes/GameScene/Relays.tsx` — 3D relay models
- `src/scenes/GameScene/RelayObstacles.tsx` — Physics obstacle spawning
- `src/dialog/dialogs.ts` — Hub NPC + relay dialog graphs

## Try it

Play the embedded game above, or <a href="/game/relay-hub/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
