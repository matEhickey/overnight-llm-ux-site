---
sidebar_label: "Minimap Legend"
---

# Minimap Legend

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/minimap-legend/index.html" height="500px" />

## What was built

The room discovery minimap now includes a compact legend underneath the map grid. It labels the player marker, next objective marker, activated orb marker, current room, visible path line, and hidden connector line.

The legend uses the same colors and simple shapes already present in the minimap, so it teaches the map language without adding a separate help panel or interrupting play. It stays inside the existing minimap panel and only appears when the map is toggled on.

## Why this feature

The recent minimap builds added floor connectors and objective hints. Those made the map more useful, but they also added more symbol meanings for the player to remember.

This feature keeps the map readable as it grows. It is a small visible improvement that clarifies the current feature set and creates room for future route overlays without making the map feel cryptic.

## Implementation notes

`src/components/ui/RoomDiscoveryMap.tsx` now has a small `LegendItem` helper for rendering consistent symbol labels. The legend is a two-column grid below the SVG map, using compact typography and fixed symbol sizes so it does not resize the map itself.

The implementation is presentational only. It does not change discovery state, objective selection, generated corridors, or player controls. Tests in `RoomDiscoveryMap.test.tsx` assert that the legend renders with all expected labels.

## Try it

Play the embedded game above, or <a href="/game/minimap-legend/index.html" target="_blank" rel="noopener noreferrer">open in a new tab</a>.
