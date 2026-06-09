---
sidebar_label: "Room Discovery Minimap"
---

# Room Discovery Minimap

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/room-discovery-minimap/index.html" height="500px" />

## What was built

The prototype now has a compact discovery map in the HUD. As the player enters generated rooms, those rooms are automatically marked as explored and drawn in the minimap.

The map shows discovered room shapes, highlights the current room, plots the player's position, and reveals orb markers only for rooms that have been discovered. The panel also tracks room discovery progress so the player gets a small completion loop while exploring.

This makes the generated dungeon easier to read without turning the experience into a flat map game. The player still navigates in first person, but the game now remembers what has been visited.

## Why this feature

The previous builds improved orb awareness through compass markers and in-world cues, but the dungeon itself still lacked memory. A passive room-discovery system helps players build spatial understanding and makes exploration feel more deliberate.

It also fits the automation focus for this cycle: the player does not toggle, scan, or manually mark anything. The game watches player position, recognizes room entry, and updates persistent discovery state on its own.

## Implementation notes

Pure discovery helpers live in `src/utils/roomDiscovery.ts`. They test whether a world position is inside a generated room, find the active room index, immutably mark newly discovered rooms, and summarize progress.

`src/stores/gameStore.ts` now stores `discoveredRooms` and exposes `updateDiscoveredRooms(position)`. The existing FPS movement loop calls that action after updating player position, so discovery stays tied to normal movement and touch controls.

`src/components/ui/RoomDiscoveryMap.tsx` renders the minimap as an SVG overlay. It derives map bounds from room metadata, scales rooms into a fixed panel, highlights the current room, and filters orb markers so only discovered-room orbs appear.

## Try it

Play the embedded game above, or <a href="/game/room-discovery-minimap/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
