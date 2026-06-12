---
sidebar_label: "Minimap Objective Hints"
---

# Minimap Objective Hints

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/minimap-objective-hints/index.html" height="500px" />

## What was built

The room discovery minimap now highlights the next unactivated orb in discovered space. When a reachable objective is visible on the map, the panel shows a compact `Next orb` hint, draws a dashed objective line from the player marker, and pulses a ring around the target orb.

The hint respects discovery. It only considers orbs in rooms the player has already found, so the overlay guides moment-to-moment navigation without revealing hidden rooms.

## Why this feature

The previous floor connector build made the dungeon layout easier to read, but the minimap still stopped at orientation. This update gives the map a lightweight objective layer, helping players decide where to move next after a room is discovered.

It also sets up later route modes. The current version uses nearest visible objective logic, while a future build can replace the direct dashed line with a corridor-aware route once the generated dungeon graph is exposed.

## Implementation notes

`src/components/ui/RoomDiscoveryMap.tsx` now derives visible orb markers once, selects the nearest unactivated marker from the discovered set, and reuses that derived state for the label, objective line, and SVG target ring.

The minimap still leaves undiscovered rooms subdued and still renders corridor connectors behind the room layer. The new objective overlay is intentionally thin so it reads as guidance rather than a hard navigation rail.

Tests in `RoomDiscoveryMap.test.tsx` verify that the objective hint appears for an unactivated discovered orb and disappears after that visible orb is activated.

## Try it

Play the embedded game above, or <a href="/game/minimap-objective-hints/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
