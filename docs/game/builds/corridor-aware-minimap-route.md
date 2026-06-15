---
sidebar_label: "Corridor-Aware Minimap Route"
---

# Corridor-Aware Minimap Route

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/corridor-aware-minimap-route/index.html" height="500px" />

## What was built

The room discovery minimap now draws a dashed route from the player marker to the next visible unactivated orb. Instead of drawing a direct line across the panel, the route follows walkable cells from the generated dungeon map, so it bends with corridors and room entrances.

The route respects the current discovery model: only orbs in discovered rooms are considered as visible objectives. When the nearest visible orb has already been activated, the minimap targets the next available visible orb.

## Why this feature

Recent minimap builds made exploration state easier to read. This update makes the map more useful moment to moment by showing how to move toward a known objective without making the player guess which hallway connects two rooms.

It also creates reusable navigation metadata for later map work. Connector styling, route labels, and richer objective hints can all build on the same walkable grid instead of deriving paths from room rectangles alone.

## Implementation notes

`levelGenerator.ts` now returns a `navigationGrid` alongside blocks and rooms. The grid records the generated dungeon size, cell size, world offsets, and walkable cells from the same `rot-js` tile map used to create wall blocks.

`src/utils/minimapRoute.ts` converts world positions to grid cells, snaps endpoints to the nearest walkable cell, runs breadth-first pathfinding across cardinal neighbors, and converts the result back to world-space centers. `RoomDiscoveryMap.tsx` maps those points into SVG coordinates and renders the route as an accessible dashed polyline.

Focused tests cover route generation and the minimap route overlay. The broader QA pass also ran TypeScript, lint, the full test suite, and the production build.

## Try it

Play the embedded game above, or <a href="/game/corridor-aware-minimap-route/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
