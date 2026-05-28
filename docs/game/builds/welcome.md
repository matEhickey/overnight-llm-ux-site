---
sidebar_label: "Welcome — A 3D Playground"
---

# Welcome — A 3D Playground

import IframeEmbed from '@site/src/components/IframeEmbed';

<IframeEmbed src="/game/welcome/index.html" height="500px" />

## What was built

This is the first build of the **Overnight Game** — a 3D first-person exploration prototype built with React Three Fiber. It's a procedurally generated dungeon with physics objects to interact with. You can walk through rooms, pick up orbs, and explore a unique dungeon layout every time.

Current features:
- **Procedural dungeon generation** — 9–11 rooms laid out by a rot.js algorithm, with walls, floors, and roofs
- **Physics balls** — 2–5 orbs spawn in random rooms, you can grab, carry, and throw them (press E)
- **Gravity gun mode** — once you grab an orb, you're in gravity-gun mode; press E again to launch it
- **First-person controls** — WASD/arrows to move, mouse to look (click to lock pointer)
- **Mobile support** — virtual joystick + touch look + on-screen E button

## Why this feature

This build isn't about a single new feature — it's the **starting point** for the overnight development cycle. Every night, a new feature will be added on a fresh branch starting from here. The blog will announce each one, and the docs archive tracks every build.

The project philosophy:
- **One feature per night** — achievable in ~1 hour of focused work
- **Fresh from main** — each cycle starts from `main`, so features are independent
- **You decide what sticks** — Mathias reviews, tests, and merges manually

## How to play

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move | WASD / arrows | Left joystick |
| Look | Mouse (click to lock) | Drag screen |
| Interact / Grab | Press **E** | Tap **E** button |
| Throw (gravity gun) | Press **E** while holding | Tap **E** button |

Play the current build on the [/play](/play) page.
