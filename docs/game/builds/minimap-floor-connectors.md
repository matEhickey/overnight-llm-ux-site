---
sidebar_label: "Minimap Floor Connectors"
---

# Minimap Floor Connectors

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/minimap-floor-connectors/index.html" height="500px" />

## What was built

The room-discovery minimap now includes the generated dungeon corridors. Instead of showing rooms as disconnected rectangles, the map draws floor connector segments behind the room shapes so the player can understand how explored rooms relate to one another.

The connector layer uses a two-state treatment. Corridors touching discovered rooms brighten in cyan, while undiscovered connector lines remain faint and dashed. This keeps the map useful without letting the corridor layer overpower player position, room highlights, or orb markers.

## Why this feature

The previous minimap made room discovery visible, but it did not explain how rooms connected. That made navigation feel fragmented after a few rooms had been found.

Floor connectors are a compact improvement that builds directly on the existing discovery system. They also prepare the map for later objective route modes, because future overlays can reuse the same corridor geometry.

## Implementation notes

`src/scenes/GameScene/levelGenerator.ts` now exposes rot-js corridor segments as `CorridorData`, including grid endpoints and world-space endpoints. `src/stores/gameStore.ts` stores that corridor list next to the generated room metadata.

`src/utils/roomDiscovery.ts` adds a helper that checks whether a corridor segment touches a discovered room. The map uses that to decide whether each connector should render as active or subdued.

`src/components/ui/RoomDiscoveryMap.tsx` converts corridor endpoints through the same world-to-map scaling used for rooms, then renders SVG lines behind the room rectangles. Tests cover corridor metadata, discovery-state detection, and map rendering.

## Try it

Play the embedded game above, or <a href="/game/minimap-floor-connectors/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
