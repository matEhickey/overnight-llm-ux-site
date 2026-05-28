---
sidebar_label: "Atmospheric Fog"
---

# Atmospheric Fog

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/atmosphere-fog/index.html" height="500px" />

## What was built

Added exponential fog to the 3D scene using Three.js's `FogExp2`. The fog is configured with a dark blue-grey color (`#1a1a2e`) that matches the canvas background — distant objects fade naturally into the horizon rather than appearing abruptly at the world boundary.

The fog density is set to `0.025`, which means:
- Objects start fading at ~20 units from the camera
- Objects are nearly invisible at ~60 units
- The 100×100 world feels significantly larger than it actually is

## Why this feature

The game had no atmospheric depth — everything rendered with equal clarity regardless of distance. This flat look is typical of early 3D prototypes. Adding fog immediately transforms the scene into something that feels like a *place* rather than a tech demo. It's the single highest-impact visual change available.

This also lays groundwork for a future day/night cycle: fog color and density can become store-driven parameters that shift based on a time-of-day system.

## Implementation notes

The fog is set in `Lighting.tsx` using `useThree` from `@react-three/fiber`:

```tsx
import { useThree } from '@react-three/fiber'
import { FogExp2 } from 'three'

const scene = useThree((s) => s.scene)
scene.fog = new FogExp2('#1a1a2e', 0.025)
```

Using `useThree` inside the `Lighting` component (which is already inside the Canvas context) is the cleanest approach — no extra components needed.

## Try it

Play the latest build on the [/play](/play) page.