---
sidebar_label: "Minimap Discovery Pulse"
---

# Minimap Discovery Pulse

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/minimap-discovery-pulse/index.html" height="500px" />

## What was built

The room discovery minimap now gives immediate feedback when the player maps a new room. If the map is open and discovery state increases, the newly discovered room gets a short teal outline that scales outward and fades.

The effect is intentionally brief and layout-neutral. It does not resize the map panel or interrupt controls; it simply makes the moment of discovery visible in the existing SVG map.

## Why this feature

The minimap already showed which rooms had been discovered, but the state change could be easy to miss during movement. A pulse makes exploration feel more responsive and gives the player a clearer reward for entering unmapped space.

This was also the most appropriate continuity feature for a fresh `main` cycle. Corridor routes and connector styling remain good candidates, but those builds live on later feature branches rather than the current main branch.

## Implementation notes

`RoomDiscoveryMap.tsx` now keeps a ref of the previously discovered room indexes while the component is mounted. When the discovered-room set grows, it records the newly discovered room index, renders a temporary SVG outline over that room, and clears it after 900ms.

The animation itself lives in `src/styles/index.css` as `minimap-room-discovery-pulse`, using `transform-box: fill-box` so the SVG rectangle scales from its own center. A component test covers the state transition by rendering the map, adding a newly discovered room to the store, and asserting that the pulse overlay appears.

## Try it

Play the embedded game above, or <a href="/game/minimap-discovery-pulse/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
